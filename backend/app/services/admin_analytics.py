from __future__ import annotations

import asyncio
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import structlog
from supabase import Client

from app.config import settings
from app.models.analytics import (
    AnalyticsClickMetricOut,
    AnalyticsEventMetricOut,
    AnalyticsIgnoredUserCreateIn,
    AnalyticsIgnoredUserOut,
    AnalyticsKpiOut,
    AnalyticsPageMetricOut,
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
    clerk_ids = {str(row["clerk_user_id"]) for row in rows if row.get("clerk_user_id")}
    emails = {
        str(row["email"]).strip().lower()
        for row in rows
        if row.get("email") and str(row["email"]).strip()
    }
    return user_ids, clerk_ids, emails


def _is_ignored_event(
    row: dict[str, Any],
    *,
    users_by_id: dict[str, dict[str, Any]],
    ignored_user_ids: set[str],
    ignored_clerk_ids: set[str],
    ignored_emails: set[str],
) -> bool:
    user_id = str(row.get("user_id") or "")
    clerk_id = str(row.get("clerk_user_id") or "")
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
) -> list[dict[str, Any]]:
    def run():
        query = client.table(table).select(columns)
        if since is not None:
            query = query.gte("occurred_at", since.isoformat())
        if order is not None:
            query = query.order(order, desc=desc)
        if limit is not None:
            query = query.limit(limit)
        return query.execute()

    response = await asyncio.to_thread(run)
    return list(response.data or [])


async def get_admin_analytics_summary(
    *,
    range_days: int = 30,
    client: Client | None = None,
) -> AnalyticsSummaryOut:
    db = client or get_client()
    range_days = max(1, min(range_days, 180))
    now = datetime.now(UTC)
    since = now - timedelta(days=range_days)

    try:
        events, users, entitlements, resources, ignored_users = await asyncio.gather(
            _select(
                db,
                "analytics_events",
                (
                    "event_id,event_type,session_id,anonymous_id,user_id,clerk_user_id,"
                    "occurred_at,page_path,page_title,resource_id,duration_ms,metadata,referrer"
                ),
                limit=10_000,
                order="occurred_at",
                desc=True,
                since=since,
            ),
            _select(
                db,
                "users",
                "id,clerk_user_id,email,first_name,last_name,role,status",
                limit=5_000,
            ),
            _select(
                db,
                "course_entitlements",
                "user_id,course_id,granted_at,revoked_at",
                limit=10_000,
            ),
            _select(db, "resources", "id,title,course_id,type,topic", limit=5_000),
            _select(
                db,
                "analytics_ignored_users",
                "id,user_id,clerk_user_id,email,reason,created_at",
                limit=5_000,
            ),
        )
    except Exception as exc:
        logger.exception("Failed to load admin analytics summary")
        raise AdminAnalyticsError("Unable to load analytics") from exc

    events = list(reversed(events))
    users_by_id = {str(row["id"]): row for row in users if row.get("id")}
    resources_by_id = {str(row["id"]): row for row in resources if row.get("id")}
    ignored_user_ids, ignored_clerk_ids, ignored_emails = _ignored_keys(ignored_users)
    events = [
        row
        for row in events
        if not _is_ignored_event(
            row,
            users_by_id=users_by_id,
            ignored_user_ids=ignored_user_ids,
            ignored_clerk_ids=ignored_clerk_ids,
            ignored_emails=ignored_emails,
        )
    ]

    paid_courses_by_user: dict[str, list[str]] = defaultdict(list)
    for row in entitlements:
        user_id = str(row.get("user_id") or "")
        course_id = str(row.get("course_id") or "")
        if user_id and course_id and course_id != "course-1" and row.get("revoked_at") is None:
            paid_courses_by_user[user_id].append(course_id)

    event_types = Counter(str(row.get("event_type") or "") for row in events)
    active_actors = {_actor_id(row) for row in events}
    active_known_users = {
        str(row["user_id"])
        for row in events
        if row.get("user_id") is not None
    }
    paid_user_count = len(paid_courses_by_user)
    paid_percentage = (paid_user_count / len(users_by_id) * 100) if users_by_id else 0

    sessions_by_actor: dict[str, set[str]] = defaultdict(set)
    session_durations: dict[str, int] = defaultdict(int)
    session_times: dict[str, list[datetime]] = defaultdict(list)
    resource_views: Counter[str | None] = Counter()
    resource_users: dict[str | None, set[str]] = defaultdict(set)
    page_views: Counter[str] = Counter()
    page_users: dict[str, set[str]] = defaultdict(set)
    click_counts: Counter[tuple[str, str | None]] = Counter()
    referrers: Counter[str] = Counter()
    trend_days: dict[date, dict[str, Any]] = defaultdict(
        lambda: {
            "active_users": set(),
            "sessions": set(),
            "page_views": 0,
            "resource_views": 0,
            "clicks": 0,
        }
    )
    user_aggregates: dict[str, UserAggregate] = {}

    for row in events:
        event_type = str(row.get("event_type") or "")
        actor = _actor_id(row)
        session = str(row.get("session_id") or "")
        occurred = _parse_datetime(row.get("occurred_at"))
        page_path = _clean_page_path(str(row.get("page_path") or "/"))
        user_id = str(row.get("user_id") or actor)
        known_user = users_by_id.get(user_id)
        label = _display_user(known_user) if known_user else f"Visitor {actor[:8]}"

        aggregate = user_aggregates.setdefault(
            user_id,
            UserAggregate(
                user_id=user_id,
                label=label,
                email=(
                    str(known_user.get("email"))
                    if known_user and known_user.get("email")
                    else None
                ),
            ),
        )
        aggregate.events += 1
        if session:
            aggregate.sessions.add(session)
            sessions_by_actor[actor].add(session)
        if occurred is not None:
            aggregate.last_seen_at = max(aggregate.last_seen_at or occurred, occurred)
            if session:
                session_times[session].append(occurred)
            bucket = trend_days[occurred.date()]
            bucket["active_users"].add(actor)
            if session:
                bucket["sessions"].add(session)
            if event_type == "page_view":
                bucket["page_views"] += 1
            elif event_type == "resource_view":
                bucket["resource_views"] += 1
            elif event_type == "click":
                bucket["clicks"] += 1

        duration = row.get("duration_ms")
        if isinstance(duration, int) and duration >= 0 and session:
            session_durations[session] = max(session_durations[session], duration)
            aggregate.session_durations[session] = max(
                aggregate.session_durations.get(session, 0),
                duration,
            )

        if event_type == "resource_view":
            resource_id = str(row.get("resource_id")) if row.get("resource_id") else None
            resource_views[resource_id] += 1
            resource_users[resource_id].add(actor)
            aggregate.resource_views += 1
        elif event_type == "page_view":
            page_views[page_path] += 1
            page_users[page_path].add(actor)
            referrer = str(row.get("referrer") or "").strip()
            if referrer and not _is_same_site_referrer(referrer):
                referrers[referrer] += 1
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

    for session, times in session_times.items():
        if session not in session_durations and len(times) >= 2:
            session_durations[session] = round((max(times) - min(times)).total_seconds() * 1000)

    session_duration_values = [value for value in session_durations.values() if value > 0]
    avg_session_time = (
        round(sum(session_duration_values) / len(session_duration_values))
        if session_duration_values
        else 0
    )
    avg_sessions_per_user = (
        sum(len(sessions) for sessions in sessions_by_actor.values()) / len(active_actors)
        if active_actors
        else 0
    )

    top_resources = []
    for resource_id, views in resource_views.most_common(10):
        resource = resources_by_id.get(resource_id or "")
        unique = len(resource_users[resource_id])
        top_resources.append(
            AnalyticsResourceMetricOut(
                resource_id=resource_id,
                title=str(resource.get("title") if resource else resource_id or "Unknown resource"),
                course_id=(
                    str(resource.get("course_id"))
                    if resource and resource.get("course_id")
                    else None
                ),
                type=str(resource.get("type")) if resource and resource.get("type") else None,
                views=views,
                unique_users=unique,
                views_per_user=round(views / unique, 2) if unique else 0,
            )
        )

    def to_user_metric(aggregate: UserAggregate) -> AnalyticsUserMetricOut:
        durations = [value for value in aggregate.session_durations.values() if value > 0]
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
        )

    top_users = sorted(
        (to_user_metric(item) for item in user_aggregates.values()),
        key=lambda item: (item.resource_views, item.sessions, item.events),
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
                if item.user_id in users_by_id
            ),
            key=lambda item: (item.resource_views, item.sessions, item.events),
        )
        seen = {item.user_id for item in low_engagement_users}
        low_engagement_users.extend(
            item for item in active_low if item.user_id not in seen
        )
        low_engagement_users = low_engagement_users[:10]

    trend = []
    for offset in range(range_days - 1, -1, -1):
        day = (now - timedelta(days=offset)).date()
        bucket = trend_days[day]
        trend.append(
            AnalyticsTrendPointOut(
                date=day.isoformat(),
                active_users=len(bucket["active_users"]),
                sessions=len(bucket["sessions"]),
                page_views=int(bucket["page_views"]),
                resource_views=int(bucket["resource_views"]),
                clicks=int(bucket["clicks"]),
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

    kpis = [
        AnalyticsKpiOut(
            label="Active users",
            value=str(len(active_actors)),
            detail=f"{len(active_known_users)} signed-in users in the last {range_days} days",
            tone="positive" if active_actors else "neutral",
        ),
        AnalyticsKpiOut(
            label="Paid-course users",
            value=_percent(paid_percentage),
            detail=f"{paid_user_count} of {len(users_by_id)} registered users",
            tone="positive" if paid_percentage >= 20 else "neutral",
        ),
        AnalyticsKpiOut(
            label="Avg session time",
            value=_format_duration(avg_session_time),
            detail=f"Across {len(session_duration_values)} timed sessions",
        ),
        AnalyticsKpiOut(
            label="Sessions per active user",
            value=f"{avg_sessions_per_user:.1f}",
            detail=f"{event_types.get('session_start', 0)} session starts captured",
        ),
        AnalyticsKpiOut(
            label="Resource views",
            value=str(event_types.get("resource_view", 0)),
            detail=f"{len(resource_views)} resources viewed",
        ),
        AnalyticsKpiOut(
            label="Click-through actions",
            value=str(event_types.get("click", 0)),
            detail=f"{len(click_counts)} unique click targets",
        ),
    ]

    return AnalyticsSummaryOut(
        range_days=range_days,
        generated_at=now.isoformat(),
        event_count=len(events),
        user_count=len(users_by_id),
        paid_user_count=paid_user_count,
        active_user_count=len(active_actors),
        kpis=kpis,
        trend=trend,
        top_resources=top_resources,
        top_users=top_users,
        low_engagement_users=low_engagement_users,
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
            lambda: db.table("analytics_ignored_users")
            .delete()
            .eq("id", ignored_user_id)
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to delete ignored analytics user")
        raise AdminAnalyticsError("Unable to delete ignored user") from exc
