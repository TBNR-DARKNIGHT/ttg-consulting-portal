from __future__ import annotations

import asyncio
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from statistics import median
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from zoneinfo import ZoneInfo

import structlog
from supabase import Client

from app.config import settings
from app.models.analytics import (
    AnalyticsCampaignMetricOut,
    AnalyticsClickMetricOut,
    AnalyticsCourseEngagementOut,
    AnalyticsCourseOptionOut,
    AnalyticsEventMetricOut,
    AnalyticsFunnelStepOut,
    AnalyticsIgnoredUserCreateIn,
    AnalyticsIgnoredUserOut,
    AnalyticsKpiOut,
    AnalyticsPageMetricOut,
    AnalyticsPeriodType,
    AnalyticsReferrerMetricOut,
    AnalyticsResourceMetricOut,
    AnalyticsSummaryOut,
    AnalyticsTrendPointOut,
    AnalyticsUserMetricOut,
)
from app.services.supabase import get_client

logger = structlog.get_logger()


class AdminAnalyticsError(RuntimeError):
    pass


@dataclass
class UserAggregate:
    user_id: str
    label: str
    email: str | None
    sessions: set[str] = field(default_factory=set)
    events: int = 0
    resource_views: int = 0
    clicks: int = 0
    session_durations: dict[str, int] = field(default_factory=dict)
    last_seen_at: datetime | None = None


@dataclass
class CourseUserAggregate:
    resources: set[str] = field(default_factory=set)
    starter_resources: set[str] = field(default_factory=set)
    completed_resources: set[str] = field(default_factory=set)
    downloaded_resources: set[str] = field(default_factory=set)
    active_dates: set[date] = field(default_factory=set)
    content_engagement_ms: int = 0
    max_progress: int = 0


@dataclass(frozen=True)
class ReportingPeriod:
    period_type: AnalyticsPeriodType
    selected_start: date
    start: datetime
    end: datetime
    trend_day_count: int
    label: str


ANALYTICS_TIMEZONE = ZoneInfo("Asia/Singapore")
MEANINGFUL_CONTENT_TIME_MS = 180_000
MAX_ENGAGEMENT_DELTA_MS = 120_000


def _parse_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _actor_id(row: dict[str, Any]) -> str:
    return str(row.get("user_id") or row.get("anonymous_id") or "unknown")


def _display_user(row: dict[str, Any]) -> str:
    name = " ".join(
        str(row.get(part) or "").strip()
        for part in ("first_name", "last_name")
        if str(row.get(part) or "").strip()
    )
    return name or str(row.get("email") or row.get("clerk_user_id") or row.get("id") or "Unknown")


def _format_duration(milliseconds: int) -> str:
    seconds = max(0, round(milliseconds / 1000))
    minutes, second = divmod(seconds, 60)
    hours, minute = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minute}m"
    if minute:
        return f"{minute}m {second}s"
    return f"{second}s"


def _percent(value: float) -> str:
    return f"{value:.1f}%"


def _course_label(course_id: str | None) -> str:
    if not course_id:
        return "All courses"
    return course_id.replace("-", " ").title()


def _course_id_from_path(raw_path: str) -> str | None:
    path = urlparse(raw_path).path
    prefix = "/dashboard/course/"
    if not path.startswith(prefix):
        return None
    course_id = path[len(prefix) :].split("/", 1)[0].strip()
    return course_id or None


MONTH_LABELS = (
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
)


def _period_label(period_type: AnalyticsPeriodType, period_start: date) -> str:
    if period_type == "month":
        return f"{MONTH_LABELS[period_start.month - 1]} {period_start.year}"
    if period_type == "quarter":
        return f"Q{((period_start.month - 1) // 3) + 1} {period_start.year}"

    label_day = period_start + timedelta(days=3)
    month_start = label_day.replace(day=1)
    first_week_start = month_start - timedelta(days=month_start.weekday())
    week_number = ((period_start - first_week_start).days // 7) + 1
    return f"W{week_number} {MONTH_LABELS[label_day.month - 1]} {label_day.year}"


def _period_bounds(
    *,
    period_type: AnalyticsPeriodType,
    period_start: date | None,
    now: datetime,
) -> ReportingPeriod:
    local_now = now.astimezone(ANALYTICS_TIMEZONE)
    selected_start = period_start
    if selected_start is None:
        today = local_now.date()
        if period_type == "week":
            selected_start = today - timedelta(days=today.weekday())
        elif period_type == "month":
            selected_start = today.replace(day=1)
        else:
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            selected_start = today.replace(month=quarter_month, day=1)

    if period_type == "week" and selected_start.weekday() != 0:
        raise AdminAnalyticsError("Weekly periods must start on Monday")
    if period_type == "month" and selected_start.day != 1:
        raise AdminAnalyticsError("Monthly periods must start on the first day of the month")
    if period_type == "quarter" and (
        selected_start.day != 1 or selected_start.month not in {1, 4, 7, 10}
    ):
        raise AdminAnalyticsError("Quarterly periods must start on 1 Jan, Apr, Jul, or Oct")

    local_start = datetime(
        selected_start.year,
        selected_start.month,
        selected_start.day,
        tzinfo=ANALYTICS_TIMEZONE,
    )
    if period_type == "week":
        local_period_end = local_start + timedelta(days=7)
    elif period_type == "month":
        local_period_end = (
            local_start.replace(year=local_start.year + 1, month=1)
            if local_start.month == 12
            else local_start.replace(month=local_start.month + 1)
        )
    else:
        local_period_end = (
            local_start.replace(year=local_start.year + 1, month=1)
            if local_start.month == 10
            else local_start.replace(month=local_start.month + 3)
        )

    data_end = max(local_start, min(local_period_end, local_now))
    day_count = max(
        1,
        (data_end.date() - local_start.date()).days + (0 if data_end == local_period_end else 1),
    )
    return ReportingPeriod(
        period_type=period_type,
        selected_start=selected_start,
        start=local_start.astimezone(UTC),
        end=data_end.astimezone(UTC),
        trend_day_count=day_count,
        label=_period_label(period_type, selected_start),
    )


def _merge_course_signal(target: CourseUserAggregate, source: CourseUserAggregate) -> None:
    target.resources.update(source.resources)
    target.starter_resources.update(source.starter_resources)
    target.completed_resources.update(source.completed_resources)
    target.downloaded_resources.update(source.downloaded_resources)
    target.active_dates.update(source.active_dates)
    target.content_engagement_ms += source.content_engagement_ms
    target.max_progress = max(target.max_progress, source.max_progress)


def _is_meaningfully_engaged(signal: CourseUserAggregate) -> bool:
    return (
        len(signal.resources) >= 2
        or signal.content_engagement_ms >= MEANINGFUL_CONTENT_TIME_MS
        or signal.max_progress >= 25
        or bool(signal.completed_resources)
        or bool(signal.downloaded_resources)
    )


def _campaign_attribution(
    raw_path: str,
    referrer: str,
) -> tuple[str, str | None, str | None]:
    query = dict(parse_qsl(urlparse(raw_path).query, keep_blank_values=True))
    source = query.get("utm_source", "").strip()
    medium = query.get("utm_medium", "").strip() or None
    campaign = query.get("utm_campaign", "").strip() or None
    if source:
        return source, medium, campaign

    if referrer and not _is_same_site_referrer(referrer):
        host = (urlparse(referrer).hostname or referrer).lower()
        if host.startswith("www."):
            host = host[4:]
        return host, "referral", None
    return "Direct", None, None


TRACKING_QUERY_PREFIXES = ("utm_",)
TRACKING_QUERY_KEYS = {"fbclid", "gclid", "msclkid", "igshid", "mc_cid", "mc_eid"}

PAGE_LABELS = {
    "/": "Home",
    "/portal": "Portal",
    "/group-programme": "Group Programme",
    "/young-explorers": "Young Explorers",
    "/consult": "Consult",
    "/about": "About",
    "/auth/login": "Login",
    "/auth/sign-up": "Sign Up",
    "/auth/complete": "Auth Complete",
    "/dashboard": "Dashboard",
    "/dashboard/settings": "Dashboard Settings",
    "/dashboard/resources": "Dashboard Resources",
}


def _site_hosts() -> set[str]:
    hosts = {"beyondgrades.sg", "www.beyondgrades.sg"}
    for value in (settings.frontend_url,):
        parsed = urlparse(value)
        if parsed.hostname:
            hosts.add(parsed.hostname.lower())
    return hosts


def _is_same_site_referrer(referrer: str) -> bool:
    parsed = urlparse(referrer)
    return bool(parsed.hostname and parsed.hostname.lower() in _site_hosts())


def _canonical_referrer_source(referrer: str) -> str:
    parsed = urlparse(referrer)
    if not parsed.hostname:
        return referrer.strip()

    host = parsed.hostname.lower()
    if host.startswith("www."):
        host = host[4:]

    port = ""
    if parsed.port and not (
        (parsed.scheme == "http" and parsed.port == 80)
        or (parsed.scheme == "https" and parsed.port == 443)
    ):
        port = f":{parsed.port}"

    return urlunparse(("https", f"{host}{port}", parsed.path or "", "", parsed.query, ""))


def _clean_page_path(raw_path: str) -> str:
    parsed = urlparse(raw_path)
    path = parsed.path or "/"
    filtered_query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in TRACKING_QUERY_KEYS
        and not any(key.startswith(prefix) for prefix in TRACKING_QUERY_PREFIXES)
    ]
    return urlunparse(("", "", path, "", urlencode(filtered_query), ""))


def _page_label(clean_path: str) -> str:
    parsed = urlparse(clean_path)
    path = parsed.path or "/"
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if path == "/dashboard/settings" and query.get("tool"):
        tool = query["tool"].replace("-", " ").title()
        return f"Dashboard Settings: {tool}"
    if path.startswith("/dashboard/resources/"):
        return "Resource Detail"
    if path.startswith("/dashboard/course/"):
        suffix = path.split("/dashboard/course/", 1)[1]
        course_id = suffix.split("/", 1)[0]
        if path.endswith("/videos"):
            return f"{course_id}: Videos"
        if path.endswith("/resources"):
            return f"{course_id}: Resources"
        return f"{course_id}: Course Overview"
    return PAGE_LABELS.get(path, path.strip("/").replace("-", " ").title() or "Home")


def _ignored_keys(rows: list[dict[str, Any]]) -> tuple[set[str], set[str], set[str]]:
    user_ids = {str(row["user_id"]) for row in rows if row.get("user_id")}
    clerk_ids = {
        str(row["clerk_user_id"]).strip().lower()
        for row in rows
        if row.get("clerk_user_id") and str(row["clerk_user_id"]).strip()
    }
    emails = {
        str(row["email"]).strip().lower()
        for row in rows
        if row.get("email") and str(row["email"]).strip()
    }
    return user_ids, clerk_ids, emails


def _is_ignored_user(
    row: dict[str, Any],
    *,
    ignored_user_ids: set[str],
    ignored_clerk_ids: set[str],
    ignored_emails: set[str],
) -> bool:
    user_id = str(row.get("id") or row.get("user_id") or "")
    clerk_id = str(row.get("clerk_user_id") or "").strip().lower()
    email = str(row.get("email") or "").strip().lower()
    return (
        bool(user_id and user_id in ignored_user_ids)
        or bool(clerk_id and clerk_id in ignored_clerk_ids)
        or bool(email and email in ignored_emails)
    )


def _is_ignored_event(
    row: dict[str, Any],
    *,
    users_by_id: dict[str, dict[str, Any]],
    ignored_user_ids: set[str],
    ignored_clerk_ids: set[str],
    ignored_emails: set[str],
) -> bool:
    user_id = str(row.get("user_id") or "")
    clerk_id = str(row.get("clerk_user_id") or "").strip().lower()
    user = users_by_id.get(user_id)
    email = str(user.get("email") or "").strip().lower() if user else ""
    return (
        bool(user_id and user_id in ignored_user_ids)
        or bool(clerk_id and clerk_id in ignored_clerk_ids)
        or bool(email and email in ignored_emails)
    )


async def _select(
    client: Client,
    table: str,
    columns: str,
    *,
    limit: int | None = None,
    order: str | None = None,
    desc: bool = False,
    since: datetime | None = None,
    until: datetime | None = None,
) -> list[dict[str, Any]]:
    page_size = min(limit or 1000, 1000)
    rows: list[dict[str, Any]] = []

    def run_page(start: int, end: int):
        query = client.table(table).select(columns)
        if since is not None:
            query = query.gte("occurred_at", since.isoformat())
        if until is not None:
            query = query.lt("occurred_at", until.isoformat())
        if order is not None:
            query = query.order(order, desc=desc)
        query = query.range(start, end)
        return query.execute()

    while limit is None or len(rows) < limit:
        start = len(rows)
        remaining = limit - start if limit is not None else page_size
        current_page_size = min(page_size, remaining)
        response = await asyncio.to_thread(
            lambda start=start, current_page_size=current_page_size: run_page(
                start,
                start + current_page_size - 1,
            )
        )
        page = list(response.data or [])
        rows.extend(page)
        if len(page) < current_page_size:
            break

    return rows


async def get_admin_analytics_summary(
    *,
    period_type: AnalyticsPeriodType = "month",
    period_start: date | None = None,
    course_id: str | None = None,
    client: Client | None = None,
) -> AnalyticsSummaryOut:
    db = client or get_client()
    now = datetime.now(UTC)
    reporting_period = _period_bounds(
        period_type=period_type,
        period_start=period_start,
        now=now,
    )
    since = reporting_period.start
    until = reporting_period.end
    trend_day_count = reporting_period.trend_day_count
    selected_course_id = course_id.strip() if course_id and course_id.strip() else None

    try:
        (
            events,
            progress_events,
            users,
            entitlements,
            resources,
            ignored_users,
            earliest_events,
            earliest_progress_events,
        ) = await asyncio.gather(
            _select(
                db,
                "analytics_events",
                (
                    "event_id,event_type,session_id,anonymous_id,user_id,clerk_user_id,"
                    "occurred_at,page_path,page_title,resource_id,duration_ms,metadata,referrer"
                ),
                order="occurred_at",
                desc=True,
                since=since,
                until=until,
            ),
            _select(
                db,
                "resource_progress_events",
                (
                    "user_id,resource_id,event_type,occurred_at,status,progress_percent,"
                    "pages_viewed_count,page_count,last_position_seconds,duration_seconds,"
                    "completion_source"
                ),
                order="occurred_at",
                desc=True,
                since=since,
                until=until,
            ),
            _select(
                db,
                "users",
                "id,clerk_user_id,email,first_name,last_name,role,status",
            ),
            _select(
                db,
                "course_entitlements",
                "user_id,course_id,granted_at,revoked_at",
            ),
            _select(db, "resources", "id,title,course_id,type,topic"),
            _select(
                db,
                "analytics_ignored_users",
                "id,user_id,clerk_user_id,email,reason,created_at",
            ),
            _select(
                db,
                "analytics_events",
                "occurred_at",
                limit=1,
                order="occurred_at",
            ),
            _select(
                db,
                "resource_progress_events",
                "occurred_at",
                limit=1,
                order="occurred_at",
            ),
        )
    except Exception as exc:
        logger.exception("Failed to load admin analytics summary")
        raise AdminAnalyticsError("Unable to load analytics") from exc

    events = list(reversed(events))
    progress_events = list(reversed(progress_events))
    ignored_user_ids, ignored_clerk_ids, ignored_emails = _ignored_keys(ignored_users)
    all_users_by_id = {str(row["id"]): row for row in users if row.get("id")}
    users_by_id = {
        user_id: row
        for user_id, row in all_users_by_id.items()
        if not _is_ignored_user(
            row,
            ignored_user_ids=ignored_user_ids,
            ignored_clerk_ids=ignored_clerk_ids,
            ignored_emails=ignored_emails,
        )
    }
    resources_by_id = {str(row["id"]): row for row in resources if row.get("id")}
    events = [
        row
        for row in events
        if not _is_ignored_event(
            row,
            users_by_id=all_users_by_id,
            ignored_user_ids=ignored_user_ids,
            ignored_clerk_ids=ignored_clerk_ids,
            ignored_emails=ignored_emails,
        )
    ]
    progress_events = [
        row for row in progress_events if str(row.get("user_id") or "") in users_by_id
    ]

    available_course_ids = sorted(
        {str(row["course_id"]) for row in resources if row.get("course_id")}
    )
    course_options = [
        AnalyticsCourseOptionOut(course_id=value, label=_course_label(value))
        for value in available_course_ids
    ]
    available_datetimes = [
        parsed
        for row in [*earliest_events, *earliest_progress_events]
        if (parsed := _parse_datetime(row.get("occurred_at"))) is not None
    ]
    data_available_from = (
        min(available_datetimes).astimezone(ANALYTICS_TIMEZONE).date().isoformat()
        if available_datetimes
        else None
    )

    paid_courses_by_user: dict[str, list[str]] = defaultdict(list)
    for row in entitlements:
        user_id = str(row.get("user_id") or "")
        course_id = str(row.get("course_id") or "")
        granted_at = _parse_datetime(row.get("granted_at"))
        revoked_at = _parse_datetime(row.get("revoked_at"))
        if (
            user_id in users_by_id
            and course_id
            and course_id != "course-1"
            and (granted_at is None or granted_at < until)
            and (revoked_at is None or revoked_at >= since)
        ):
            paid_courses_by_user[user_id].append(course_id)

    active_actors = {_actor_id(row) for row in events}
    active_known_users = {str(row["user_id"]) for row in events if row.get("user_id") is not None}
    active_known_users.update(
        str(row["user_id"])
        for row in progress_events
        if row.get("user_id") is not None and row.get("event_type") != "reset"
    )
    paid_user_count = len(paid_courses_by_user)

    resource_views: Counter[str | None] = Counter()
    resource_users: dict[str | None, set[str]] = defaultdict(set)
    page_views: Counter[str] = Counter()
    page_users: dict[str, set[str]] = defaultdict(set)
    click_counts: Counter[tuple[str, str | None]] = Counter()
    referrers: Counter[str] = Counter()
    campaign_by_session: dict[str, tuple[str, str | None, str | None]] = {}
    actors_by_session: dict[str, set[str]] = defaultdict(set)
    signed_in_users_by_session: dict[str, set[str]] = defaultdict(set)
    course_users_by_session: dict[str, set[tuple[str, str]]] = defaultdict(set)
    course_signals: dict[tuple[str, str], CourseUserAggregate] = defaultdict(CourseUserAggregate)
    daily_course_signals: dict[tuple[date, str, str], CourseUserAggregate] = defaultdict(
        CourseUserAggregate
    )
    resource_starter_users: dict[str, set[str]] = defaultdict(set)
    resource_completed_users: dict[str, set[str]] = defaultdict(set)
    resource_progress_by_user: dict[tuple[str, str], int] = defaultdict(int)
    resource_view_counts_by_user: Counter[tuple[str, str]] = Counter()
    trend_days: dict[date, dict[str, Any]] = defaultdict(
        lambda: {
            "active_users": set(),
            "signed_in_active_users": set(),
            "sessions": set(),
            "page_views": 0,
            "resource_views": Counter(),
            "clicks": 0,
            "completions": Counter(),
        }
    )
    user_aggregates: dict[str, UserAggregate] = {}

    for row in events:
        event_type = str(row.get("event_type") or "")
        actor = _actor_id(row)
        session = str(row.get("session_id") or "")
        occurred = _parse_datetime(row.get("occurred_at"))
        page_path = _clean_page_path(str(row.get("page_path") or "/"))
        raw_page_path = str(row.get("page_path") or "/")
        user_id = str(row.get("user_id") or actor)
        known_user = users_by_id.get(user_id)
        label = _display_user(known_user) if known_user else f"Visitor {actor[:8]}"

        aggregate = user_aggregates.setdefault(
            user_id,
            UserAggregate(
                user_id=user_id,
                label=label,
                email=(
                    str(known_user.get("email")) if known_user and known_user.get("email") else None
                ),
            ),
        )
        aggregate.events += 1
        if session:
            aggregate.sessions.add(session)
            actors_by_session[session].add(actor)
            if known_user:
                signed_in_users_by_session[session].add(user_id)
        if occurred is not None:
            local_day = occurred.astimezone(ANALYTICS_TIMEZONE).date()
            aggregate.last_seen_at = max(aggregate.last_seen_at or occurred, occurred)
            bucket = trend_days[local_day]
            bucket["active_users"].add(actor)
            if known_user:
                bucket["signed_in_active_users"].add(user_id)
            if session:
                bucket["sessions"].add(session)
            if event_type == "page_view":
                bucket["page_views"] += 1
            elif event_type == "click":
                bucket["clicks"] += 1

            if event_type == "page_view" and session and session not in campaign_by_session:
                campaign_by_session[session] = _campaign_attribution(
                    raw_page_path,
                    str(row.get("referrer") or "").strip(),
                )

        resource_id = str(row.get("resource_id") or "")
        resource = resources_by_id.get(resource_id)
        resource_course_id = (
            str(resource.get("course_id")) if resource and resource.get("course_id") else None
        )
        path_course_id = _course_id_from_path(raw_page_path)
        event_course_id = resource_course_id or path_course_id
        if known_user and event_course_id and occurred is not None:
            signal = course_signals[(event_course_id, user_id)]
            daily_signal = daily_course_signals[(local_day, event_course_id, user_id)]
            signal.active_dates.add(local_day)
            daily_signal.active_dates.add(local_day)
            if session:
                course_users_by_session[session].add((event_course_id, user_id))

        duration = row.get("duration_ms")
        if isinstance(duration, int) and duration >= 0 and session:
            aggregate.session_durations[session] = max(
                aggregate.session_durations.get(session, 0),
                duration,
            )

        if event_type == "resource_view":
            resource_key = resource_id or None
            resource_views[resource_key] += 1
            resource_users[resource_key].add(actor)
            aggregate.resource_views += 1
            if resource_course_id and occurred is not None:
                trend_days[local_day]["resource_views"][resource_course_id] += 1
            if known_user and resource_id and resource_course_id and occurred is not None:
                signal.resources.add(resource_id)
                daily_signal.resources.add(resource_id)
                resource_view_counts_by_user[(resource_id, user_id)] += 1
        elif event_type == "page_view":
            page_views[page_path] += 1
            page_users[page_path].add(actor)
            referrer = str(row.get("referrer") or "").strip()
            if referrer and not _is_same_site_referrer(referrer):
                referrers[_canonical_referrer_source(referrer)] += 1
        elif event_type == "click":
            aggregate.clicks += 1
            metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
            click_label = str(
                metadata.get("analyticsId")
                or metadata.get("ariaLabel")
                or metadata.get("text")
                or metadata.get("href")
                or "Unlabelled click"
            )
            click_counts[(click_label[:120], page_path)] += 1
            if (
                known_user
                and resource_id
                and resource_course_id
                and occurred is not None
                and metadata.get("analyticsId") == "resource-download"
            ):
                signal.downloaded_resources.add(resource_id)
                daily_signal.downloaded_resources.add(resource_id)
        elif (
            event_type in {"heartbeat", "session_end"}
            and known_user
            and resource_id
            and occurred is not None
        ):
            metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
            raw_delta = metadata.get("engagementDeltaMs")
            if isinstance(raw_delta, int) and not isinstance(raw_delta, bool) and raw_delta > 0:
                engagement_delta = min(raw_delta, MAX_ENGAGEMENT_DELTA_MS)
                if resource_course_id and occurred is not None:
                    signal.content_engagement_ms += engagement_delta
                    daily_signal.content_engagement_ms += engagement_delta

    for row in progress_events:
        if row.get("event_type") == "reset":
            continue
        user_id = str(row.get("user_id") or "")
        resource_id = str(row.get("resource_id") or "")
        resource = resources_by_id.get(resource_id)
        course_id_value = (
            str(resource.get("course_id")) if resource and resource.get("course_id") else ""
        )
        occurred = _parse_datetime(row.get("occurred_at"))
        if not user_id or user_id not in users_by_id or not course_id_value or occurred is None:
            continue

        local_day = occurred.astimezone(ANALYTICS_TIMEZONE).date()
        signal = course_signals[(course_id_value, user_id)]
        daily_signal = daily_course_signals[(local_day, course_id_value, user_id)]
        signal.active_dates.add(local_day)
        daily_signal.active_dates.add(local_day)
        progress_percent = row.get("progress_percent")
        progress_value = (
            max(0, min(100, progress_percent))
            if isinstance(progress_percent, int) and not isinstance(progress_percent, bool)
            else 0
        )
        signal.max_progress = max(signal.max_progress, progress_value)
        daily_signal.max_progress = max(daily_signal.max_progress, progress_value)
        resource_progress_by_user[(resource_id, user_id)] = max(
            resource_progress_by_user[(resource_id, user_id)],
            progress_value,
        )
        if progress_value > 0 or row.get("status") in {"in_progress", "completed"}:
            signal.starter_resources.add(resource_id)
            daily_signal.starter_resources.add(resource_id)
            resource_starter_users[resource_id].add(user_id)
        if row.get("event_type") == "completed":
            signal.completed_resources.add(resource_id)
            daily_signal.completed_resources.add(resource_id)
            resource_completed_users[resource_id].add(user_id)
            trend_days[local_day]["completions"][course_id_value] += 1

        aggregate = user_aggregates.setdefault(
            user_id,
            UserAggregate(
                user_id=user_id,
                label=_display_user(users_by_id[user_id]),
                email=(
                    str(users_by_id[user_id].get("email"))
                    if users_by_id[user_id].get("email")
                    else None
                ),
            ),
        )
        aggregate.last_seen_at = max(aggregate.last_seen_at or occurred, occurred)

    selected_signals: dict[str, CourseUserAggregate] = defaultdict(CourseUserAggregate)
    all_course_active_users = {user_id for _course_id, user_id in course_signals}
    for (signal_course_id, user_id), signal in course_signals.items():
        if selected_course_id and signal_course_id != selected_course_id:
            continue
        _merge_course_signal(selected_signals[user_id], signal)

    course_active_users = set(selected_signals)
    meaningful_users = {
        user_id for user_id, signal in selected_signals.items() if _is_meaningfully_engaged(signal)
    }
    repeat_users = {
        user_id for user_id, signal in selected_signals.items() if len(signal.active_dates) >= 2
    }
    starter_pairs = {
        (user_id, resource_id)
        for user_id, signal in selected_signals.items()
        for resource_id in signal.starter_resources
    }
    completion_pairs = {
        (user_id, resource_id)
        for user_id, signal in selected_signals.items()
        for resource_id in signal.completed_resources
    }
    unique_completers = {
        user_id for user_id, signal in selected_signals.items() if signal.completed_resources
    }
    selected_progress_values = [
        value
        for (resource_id, _user_id), value in resource_progress_by_user.items()
        if value > 0
        and (
            not selected_course_id
            or str(resources_by_id.get(resource_id, {}).get("course_id") or "")
            == selected_course_id
        )
    ]

    paid_eligible_users = {
        user_id
        for user_id, course_ids in paid_courses_by_user.items()
        if not selected_course_id
        or (selected_course_id != "course-1" and selected_course_id in course_ids)
    }
    if selected_course_id:
        paid_activated_users = paid_eligible_users.intersection(course_active_users)
    else:
        paid_activated_users = {
            user_id
            for user_id in paid_eligible_users
            if any(
                (paid_course_id, user_id) in course_signals
                for paid_course_id in paid_courses_by_user[user_id]
            )
        }

    course_engagement = AnalyticsCourseEngagementOut(
        course_id=selected_course_id,
        label=_course_label(selected_course_id),
        course_active_users=len(course_active_users),
        meaningfully_engaged_users=len(meaningful_users),
        meaningful_engagement_rate=(
            round(len(meaningful_users) / len(course_active_users) * 100, 1)
            if course_active_users
            else 0
        ),
        resource_starters=len(starter_pairs),
        resource_completions=len(completion_pairs),
        unique_completers=len(unique_completers),
        average_progress=(
            round(sum(selected_progress_values) / len(selected_progress_values), 1)
            if selected_progress_values
            else 0
        ),
        median_progress=round(float(median(selected_progress_values)), 1)
        if selected_progress_values
        else 0,
        repeat_users=len(repeat_users),
        repeat_engagement_rate=(
            round(len(repeat_users) / len(course_active_users) * 100, 1)
            if course_active_users
            else 0
        ),
        content_engagement_time_ms=sum(
            signal.content_engagement_ms for signal in selected_signals.values()
        ),
        paid_eligible_users=len(paid_eligible_users),
        paid_activated_users=len(paid_activated_users),
        paid_adoption_rate=(
            round(len(paid_activated_users) / len(paid_eligible_users) * 100, 1)
            if paid_eligible_users
            else 0
        ),
    )

    top_resources = []
    resource_metric_ids = {value for value in resource_views if value is not None}.union(
        resource_starter_users
    ).union(resource_completed_users)
    for metric_resource_id in resource_metric_ids:
        resource = resources_by_id.get(metric_resource_id)
        if selected_course_id and (
            not resource or str(resource.get("course_id") or "") != selected_course_id
        ):
            continue
        views = resource_views[metric_resource_id]
        unique = len(resource_users[metric_resource_id])
        starters = len(resource_starter_users[metric_resource_id])
        completers = len(resource_completed_users[metric_resource_id])
        progress_values = [
            value
            for (resource_id, _user_id), value in resource_progress_by_user.items()
            if resource_id == metric_resource_id and value > 0
        ]
        repeat_viewers = sum(
            1
            for (resource_id, _user_id), count in resource_view_counts_by_user.items()
            if resource_id == metric_resource_id and count >= 2
        )
        top_resources.append(
            AnalyticsResourceMetricOut(
                resource_id=metric_resource_id,
                title=str(
                    resource.get("title") if resource else metric_resource_id or "Unknown resource"
                ),
                course_id=(
                    str(resource.get("course_id"))
                    if resource and resource.get("course_id")
                    else None
                ),
                type=str(resource.get("type")) if resource and resource.get("type") else None,
                views=views,
                unique_users=unique,
                views_per_user=round(views / unique, 2) if unique else 0,
                starter_users=starters,
                completed_users=completers,
                completion_rate=round(completers / starters * 100, 1) if starters else 0,
                average_progress=(
                    round(sum(progress_values) / len(progress_values), 1) if progress_values else 0
                ),
                median_progress=round(float(median(progress_values)), 1) if progress_values else 0,
                repeat_viewers=repeat_viewers,
            )
        )
    top_resources.sort(
        key=lambda item: (item.unique_users, item.starter_users, item.views, item.completed_users),
        reverse=True,
    )
    top_resources = top_resources[:20]

    def to_user_metric(
        aggregate: UserAggregate,
        signal: CourseUserAggregate | None = None,
    ) -> AnalyticsUserMetricOut:
        durations = [value for value in aggregate.session_durations.values() if value > 0]
        signal = signal or CourseUserAggregate()
        return AnalyticsUserMetricOut(
            user_id=aggregate.user_id,
            label=aggregate.label,
            email=aggregate.email,
            sessions=len(aggregate.sessions),
            events=aggregate.events,
            resource_views=aggregate.resource_views,
            clicks=aggregate.clicks,
            avg_session_time_ms=round(sum(durations) / len(durations)) if durations else 0,
            last_seen_at=aggregate.last_seen_at.isoformat() if aggregate.last_seen_at else None,
            paid_courses=paid_courses_by_user.get(aggregate.user_id, []),
            distinct_resources=len(signal.resources),
            max_progress=signal.max_progress,
            completed_resources=len(signal.completed_resources),
            content_engagement_ms=signal.content_engagement_ms,
        )

    top_users = sorted(
        (
            to_user_metric(
                user_aggregates.get(user_id)
                or UserAggregate(
                    user_id=user_id,
                    label=_display_user(users_by_id[user_id]),
                    email=str(users_by_id[user_id].get("email") or "") or None,
                ),
                signal,
            )
            for user_id, signal in selected_signals.items()
        ),
        key=lambda item: (
            item.completed_resources,
            item.distinct_resources,
            item.max_progress,
            item.content_engagement_ms,
        ),
        reverse=True,
    )[:10]

    low_engagement_users = [
        AnalyticsUserMetricOut(
            user_id=user_id,
            label=_display_user(row),
            email=str(row.get("email")) if row.get("email") else None,
            sessions=0,
            events=0,
            resource_views=0,
            clicks=0,
            avg_session_time_ms=0,
            last_seen_at=None,
            paid_courses=paid_courses_by_user.get(user_id, []),
        )
        for user_id, row in users_by_id.items()
        if user_id not in active_known_users and str(row.get("role") or "") != "ADMIN"
    ][:10]
    if len(low_engagement_users) < 10:
        active_low = sorted(
            (
                to_user_metric(item)
                for item in user_aggregates.values()
                if item.user_id in users_by_id and item.user_id not in all_course_active_users
            ),
            key=lambda item: (item.resource_views, item.sessions, item.events),
        )
        seen = {item.user_id for item in low_engagement_users}
        low_engagement_users.extend(item for item in active_low if item.user_id not in seen)
        low_engagement_users = low_engagement_users[:10]

    paid_inactive_users = [
        to_user_metric(
            user_aggregates.get(user_id)
            or UserAggregate(
                user_id=user_id,
                label=_display_user(users_by_id[user_id]),
                email=str(users_by_id[user_id].get("email") or "") or None,
            )
        )
        for user_id in sorted(paid_eligible_users.difference(paid_activated_users))
        if user_id in users_by_id and str(users_by_id[user_id].get("role") or "") != "ADMIN"
    ][:20]

    trend = []
    first_trend_day = since.astimezone(ANALYTICS_TIMEZONE).date()
    for offset in range(trend_day_count):
        day = first_trend_day + timedelta(days=offset)
        bucket = trend_days[day]
        day_signals: dict[str, CourseUserAggregate] = defaultdict(CourseUserAggregate)
        for (signal_day, signal_course_id, user_id), signal in daily_course_signals.items():
            if signal_day != day:
                continue
            if selected_course_id and signal_course_id != selected_course_id:
                continue
            _merge_course_signal(day_signals[user_id], signal)
        day_course_active = set(day_signals)
        day_meaningful = {
            user_id for user_id, signal in day_signals.items() if _is_meaningfully_engaged(signal)
        }
        selected_resource_views = (
            bucket["resource_views"].get(selected_course_id, 0)
            if selected_course_id
            else sum(bucket["resource_views"].values())
        )
        selected_completions = (
            bucket["completions"].get(selected_course_id, 0)
            if selected_course_id
            else sum(bucket["completions"].values())
        )
        trend.append(
            AnalyticsTrendPointOut(
                date=day.isoformat(),
                active_users=len(bucket["active_users"]),
                signed_in_active_users=len(bucket["signed_in_active_users"]),
                course_active_users=len(day_course_active),
                meaningfully_engaged_users=len(day_meaningful),
                sessions=len(bucket["sessions"]),
                page_views=int(bucket["page_views"]),
                resource_views=int(selected_resource_views),
                clicks=int(bucket["clicks"]),
                completions=int(selected_completions),
            )
        )

    recent_events = []
    for row in reversed(events[-25:]):
        resource = resources_by_id.get(str(row.get("resource_id") or ""))
        actor = str(row.get("user_id") or row.get("anonymous_id") or "")
        user = users_by_id.get(actor)
        recent_events.append(
            AnalyticsEventMetricOut(
                event_type=str(row.get("event_type") or ""),
                occurred_at=str(row.get("occurred_at") or ""),
                user_label=_display_user(user) if user else f"Visitor {actor[:8]}",
                page_path=str(row.get("page_path") or "/"),
                resource_title=str(resource.get("title")) if resource else None,
            )
        )

    top_campaigns = []
    campaign_sessions: dict[tuple[str, str | None, str | None], set[str]] = defaultdict(set)
    for session, attribution in campaign_by_session.items():
        campaign_sessions[attribution].add(session)
    for (source, medium, campaign), sessions in campaign_sessions.items():
        visitors = set().union(*(actors_by_session[value] for value in sessions))
        signed_in_users = set().union(*(signed_in_users_by_session[value] for value in sessions))
        attributed_course_pairs = set().union(
            *(course_users_by_session[value] for value in sessions)
        )
        attributed_course_users = {
            user_id
            for attributed_course_id, user_id in attributed_course_pairs
            if not selected_course_id or attributed_course_id == selected_course_id
        }
        top_campaigns.append(
            AnalyticsCampaignMetricOut(
                source=source,
                medium=medium,
                campaign=campaign,
                sessions=len(sessions),
                visitors=len(visitors),
                signed_in_users=len(signed_in_users),
                course_active_users=len(attributed_course_users.intersection(course_active_users)),
            )
        )
    top_campaigns.sort(key=lambda item: (item.course_active_users, item.sessions), reverse=True)

    funnel_counts = [
        ("Signed-in active", len(active_known_users)),
        ("Course active", len(course_active_users)),
        ("Meaningfully engaged", len(meaningful_users)),
        ("Completed a resource", len(unique_completers)),
    ]
    funnel_base = funnel_counts[0][1]
    funnel = [
        AnalyticsFunnelStepOut(
            label=label,
            users=count,
            conversion_rate=round(count / funnel_base * 100, 1) if funnel_base else 0,
        )
        for label, count in funnel_counts
    ]

    kpis = [
        AnalyticsKpiOut(
            label="Meaningfully engaged",
            value=str(len(meaningful_users)),
            detail=(f"{course_engagement.meaningful_engagement_rate:.1f}% of course-active users"),
            tone="positive" if meaningful_users else "neutral",
        ),
        AnalyticsKpiOut(
            label="Course active users",
            value=str(len(course_active_users)),
            detail=f"{len(active_known_users)} signed-in active users",
            tone="positive" if course_active_users else "neutral",
        ),
        AnalyticsKpiOut(
            label="Resource completions",
            value=str(len(completion_pairs)),
            detail=f"{len(unique_completers)} unique completers",
        ),
        AnalyticsKpiOut(
            label="Repeat engagement",
            value=_percent(course_engagement.repeat_engagement_rate),
            detail=f"{len(repeat_users)} users active on 2+ days",
        ),
        AnalyticsKpiOut(
            label="Paid adoption",
            value=_percent(course_engagement.paid_adoption_rate),
            detail=(
                f"{len(paid_activated_users)} of {len(paid_eligible_users)} eligible users"
                if paid_eligible_users
                else "No paid-course users in this selection"
            ),
        ),
        AnalyticsKpiOut(
            label="Average progress",
            value=_percent(course_engagement.average_progress),
            detail=f"Across {len(selected_progress_values)} started user-resources",
        ),
    ]

    return AnalyticsSummaryOut(
        period_type=reporting_period.period_type,
        selected_period_start=reporting_period.selected_start.isoformat(),
        period_label=reporting_period.label,
        data_available_from=data_available_from,
        selected_course_id=selected_course_id,
        period_start=since.isoformat(),
        period_end=until.isoformat(),
        generated_at=now.isoformat(),
        event_count=len(events),
        user_count=len(users_by_id),
        paid_user_count=paid_user_count,
        active_user_count=len(active_actors),
        signed_in_active_user_count=len(active_known_users),
        course_options=course_options,
        course_engagement=course_engagement,
        funnel=funnel,
        kpis=kpis,
        trend=trend,
        top_resources=top_resources,
        top_users=top_users,
        low_engagement_users=low_engagement_users,
        paid_inactive_users=paid_inactive_users,
        top_pages=[
            AnalyticsPageMetricOut(
                label=_page_label(path),
                path=path,
                views=views,
                unique_users=len(page_users[path]),
            )
            for path, views in page_views.most_common(10)
        ],
        top_clicks=[
            AnalyticsClickMetricOut(label=label, path=path, clicks=clicks)
            for (label, path), clicks in click_counts.most_common(10)
        ],
        top_referrers=[
            AnalyticsReferrerMetricOut(source=source, visits=visits)
            for source, visits in referrers.most_common(10)
        ],
        top_campaigns=top_campaigns[:10],
        recent_events=recent_events,
    )


async def list_ignored_analytics_users(
    *,
    client: Client | None = None,
) -> list[AnalyticsIgnoredUserOut]:
    db = client or get_client()
    try:
        rows = await _select(
            db,
            "analytics_ignored_users",
            "id,user_id,clerk_user_id,email,reason,created_at",
            order="created_at",
            desc=True,
            limit=500,
        )
    except Exception as exc:
        logger.exception("Failed to load analytics ignored users")
        raise AdminAnalyticsError("Unable to load ignored users") from exc

    return [
        AnalyticsIgnoredUserOut(
            id=str(row["id"]),
            user_id=str(row["user_id"]) if row.get("user_id") else None,
            clerk_user_id=str(row["clerk_user_id"]) if row.get("clerk_user_id") else None,
            email=str(row["email"]).strip().lower() if row.get("email") else None,
            reason=str(row.get("reason") or ""),
            created_at=str(row.get("created_at") or ""),
        )
        for row in rows
    ]


async def add_ignored_analytics_user(
    body: AnalyticsIgnoredUserCreateIn,
    *,
    actor_user_id: str | None = None,
    client: Client | None = None,
) -> AnalyticsIgnoredUserOut:
    db = client or get_client()
    payload = {
        "user_id": body.user_id.strip() if body.user_id else None,
        "clerk_user_id": body.clerk_user_id.strip() if body.clerk_user_id else None,
        "email": body.email.strip().lower() if body.email else None,
        "reason": body.reason.strip(),
        "created_by_user_id": actor_user_id,
    }
    payload = {key: value for key, value in payload.items() if value not in {None, ""}}
    if not any(key in payload for key in ("user_id", "clerk_user_id", "email")):
        raise AdminAnalyticsError("Provide a user id, Clerk id, or email")

    try:
        response = await asyncio.to_thread(
            lambda: db.table("analytics_ignored_users").insert(payload).execute()
        )
    except Exception as exc:
        logger.exception("Failed to add ignored analytics user")
        raise AdminAnalyticsError("Unable to add ignored user") from exc

    row = (response.data or [{}])[0]
    return AnalyticsIgnoredUserOut(
        id=str(row["id"]),
        user_id=str(row["user_id"]) if row.get("user_id") else None,
        clerk_user_id=str(row["clerk_user_id"]) if row.get("clerk_user_id") else None,
        email=str(row["email"]).strip().lower() if row.get("email") else None,
        reason=str(row.get("reason") or ""),
        created_at=str(row.get("created_at") or ""),
    )


async def delete_ignored_analytics_user(
    ignored_user_id: str,
    *,
    client: Client | None = None,
) -> None:
    db = client or get_client()
    try:
        await asyncio.to_thread(
            lambda: db.table("analytics_ignored_users").delete().eq("id", ignored_user_id).execute()
        )
    except Exception as exc:
        logger.exception("Failed to delete ignored analytics user")
        raise AdminAnalyticsError("Unable to delete ignored user") from exc
