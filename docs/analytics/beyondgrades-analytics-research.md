# BeyondGrades Active User and Learning Analytics

Prepared for: BeyondGrades / Think Teach Group Consulting Portal  
Prepared by: Yap Shen  
Reviewed and revised: 16 August 2026

## Executive Summary

A view is an event; an active user is a deduplicated person or account that performed a defined behavior during a defined period. One account can generate many views, while a registered account can generate no learning activity.

BeyondGrades therefore uses a layered model:

| Layer | Definition |
| --- | --- |
| Site visitor | Browser identity or signed-in account with any tracked event. |
| Signed-in active user | Signed-in account with any tracked event or learning-progress activity. |
| Course active user | Signed-in account with course-page, resource, visible-time, download, or progress activity. |
| Meaningfully engaged course user | Course-active account meeting at least one stronger behavioral threshold. |
| Resource completer | Signed-in account completing at least one resource. |

The recommended stakeholder KPI is **Monthly Meaningfully Engaged Course Users**: unique signed-in accounts that, within one Singapore calendar month and the selected course, do at least one of the following:

- view two distinct course resources;
- accumulate three minutes of visible course-resource time;
- reach 25% progress on a resource;
- complete a resource; or
- download a course resource.

The two-resource, three-minute, and 25% thresholds are transparent product hypotheses, not universal research findings. They are intended to include useful skimming and downloads while excluding most accidental previews. Their relationship with repeat use, completion, consultation, and qualitative feedback should be reviewed after several complete periods; any change must be versioned.

The dashboard implements week, month, quarter, and course filters; layered active-user counts; progress history; visible engagement time; resource performance; paid-course adoption; repeat-use indicators; period reach; acquisition attribution; and follow-up queues. These measure observed engagement and progress, not learning outcomes. Educational impact requires evidence such as assessments, portfolio quality, interview readiness, or structured learner feedback.

## 1. Measurement Model

### 1.1 Measure Product Value, Not Account Existence

Product analytics platforms distinguish passive technical events from actions representing user value. For BeyondGrades, account creation and dashboard loading are weak signals. The relevant path is that a parent or learner discovers, uses, returns to, and progresses through educational content, then takes an appropriate next step.

The measurement layers answer different questions and should not be collapsed into one number:

| Layer | Question |
| --- | --- |
| Acquisition | Did a visitor arrive, and from where? |
| Activation | Did a signed-in user open a course or first resource? |
| Engagement | Did the user do more than briefly preview content? |
| Retention | Did the user return on a later day, week, or month? |
| Progress and completion | Did the user move through or finish resources? |
| Business conversion | Did the user redeem access, purchase, or request consultation? |
| Learning outcome | Did readiness, skill, confidence, or performance improve? |

For resources, total opens show demand intensity, unique viewers show reach, views per user and repeat viewers show reuse, and progress or completion shows deeper interaction. Counts, rates, medians, and distributions should be read together because one average can hide substantial differences.

### 1.2 Accuracy Boundaries

The analytics design follows these rules:

- **Engagement is not learning.** Clicks, time, views, and completion are behavioral traces, not proof of knowledge gain or educational effectiveness.
- **Thresholds are product choices.** No reviewed source makes two resources, three minutes, or 25% progress universally valid.
- **Historical progress requires an event history.** The current `resource_progress` snapshot cannot show when a learner crossed a threshold in an earlier period, so period analysis uses append-only `resource_progress_events`.
- **Time is a supporting signal.** Visible increments are better than elapsed tab-open time, but a visible tab does not guarantee attention and useful downloads can be quick. Each increment is capped and time is only one of several OR conditions.
- **Conversions are separate.** Consultation and purchase actions show intent or business outcomes; they do not automatically establish meaningful course engagement.
- **Period reach is not an ordered funnel.** The dashboard shows users reaching progressively stricter states during a period. Sequence-based conversion requires authoritative signup, entitlement, submission, and purchase events.
- **Periods are Singapore calendar periods.** They are not rolling seven-, 30-, or 90-day windows.
- **Anonymous traffic is approximate.** One person can use several browsers, and several people can share one browser. Signed-in course metrics are more reliable than broad visitor counts.

## 2. Data Available

### 2.1 Raw Behavior Events

`analytics_events` is an append-only log containing:

- client-generated `event_id` for idempotent retry handling;
- event type and occurrence time;
- page path, page title, referrer, and metadata;
- browser session and anonymous browser identifiers;
- signed-in internal and Clerk user identifiers when available;
- resource identifier for resource-detail activity; and
- cumulative session duration and visible engagement-time increments on lifecycle events.

The frontend captures session starts, page views, resource views, clicks, periodic heartbeats, visibility and route changes, and session endings. PDF downloads use the stable `resource-download` analytics identifier. Signed-in unload batches use an authenticated keepalive request so account identity is retained; anonymous unload batches can fall back to the browser beacon API.

This data supports traffic, session, page, resource-open, click, referrer, UTM, and content-time analysis. It remains append-only so revised definitions can be recalculated from the original observations.

### 2.2 Current and Historical Progress

`resource_progress` stores each signed-in learner's current state by user and resource: status, progress percentage, completion, video position and duration, PDF pages viewed, page count, and completion source.

`resource_progress_events` stores meaningful state changes:

- progress started;
- progress moved by at least five percentage points;
- the 25% threshold was crossed;
- another PDF page was viewed;
- video position advanced by another minute;
- a resource was completed;
- a completed resource was reopened; or
- course progress was reset.

The migration created one backfill event from each current progress row. It preserves the state available at migration time but cannot reconstruct earlier transitions, so progress-based historical reports before deployment are partial.

### 2.3 Identity and Exclusions

Internal and test accounts can materially distort percentages in a small user base. The ignored-user table excludes them by internal user ID, Clerk ID, or email.

Site visitors use the signed-in user ID when present and otherwise the anonymous browser ID on the event. Pre-login and post-login events are not retrospectively stitched, so broad visitor counts can overstate people. The main course KPI avoids this ambiguity by requiring an internal signed-in user ID.

## 3. Research Basis

| Source | Relevant practice | Application to BeyondGrades |
| --- | --- | --- |
| Google HEART and GA4 | Connect goals to user-centered signals and separate users, sessions, events, engagement, and key events. GA4 combines alternative signals when defining an engaged session. | Use several engagement signals, but do not copy GA4's exact thresholds. |
| Amplitude | Marks events active or inactive and analyzes value moments, onboarding, feature engagement, and retention. | Keep passive technical events separate from learner actions and define activity around course value. |
| Mixpanel | Separates total events, unique users, frequency, funnels, and retention. Retention asks whether the same user returns for a later behavior. Its documented MAU is rolling 30 days. | Report opens, unique viewers, repeat frequency, and return behavior separately. Use explicitly labelled Singapore calendar months rather than silently adopting rolling MAU. |
| PostHog | Uses events, persons, and properties for trends, funnels, paths, stickiness, lifecycle, and retention; emphasizes identity resolution. | Prefer signed-in IDs for course analytics and treat anonymous counts cautiously. |
| Netflix and Airbnb | Separate quality and behavior metrics, define target metrics and guardrails, and use experiments to estimate causal impact and trade-offs. | Record hypotheses and release dates; avoid causal claims from observational changes or small samples. Future tests should guard against reduced completion, return use, or support quality. |
| Duolingo | Defines MAU, DAU, and paid subscribers separately and discloses its internal methodology and comparability limits. | Publish each metric's definition, period, and limitations. Duolingo's 2025 Form 10-K defines MAU as unique users engaging with its app or learning website section in a calendar month. |
| Learning analytics research | Uses digital traces such as access, navigation, time on task, videos watched, page turning, and completion, while warning that interpretation is difficult and associations with achievement are mixed. | Describe the dashboard as observed course engagement and progress, not educational impact. |

BeyondGrades does not need large-company experimentation infrastructure at its current scale. It does need disciplined definitions, hypotheses, release dates, adequate samples, and clear limits on interpretation.

## 4. Metric Dictionary

All metrics remove configured ignored users. Unless stated otherwise, users are deduplicated by internal signed-in user ID, resources by resource ID, sessions by session ID, and dates by Singapore calendar date. The selected course filter is applied before course metrics are calculated.

### 4.1 Reporting Periods

**Week:** Monday 00:00 through the following Monday 00:00 in `Asia/Singapore`. The label uses the month containing Thursday. `W1` is the week containing the first day of that month, so the week beginning 10 August 2026 is `W3 Aug 2026`.

**Month:** First day at 00:00 through the first day of the next month at 00:00 in Singapore, labelled `Aug 2026`.

**Quarter:** Three calendar months beginning 1 January, April, July, or October, labelled `Q1 2026`.

Dropdown options run chronologically from the earliest available analytics period to the current one. The header combines the label and exact date range, for example `W3 Aug 2026 | 10 Aug 2026 to 16 Aug 2026`.

The current period is incomplete and ends when the report is generated. Completed periods use the half-open interval `occurred_at >= period_start` and `occurred_at < period_end`.

### 4.2 Data and Account Totals

**Events:** Count of non-ignored `analytics_events` rows in the selected period. One person can generate many events.

**Registered users:** Current non-ignored user records available to the analytics service. This is account inventory, not period activity.

**Paid users:** Unique non-ignored users whose non-free course entitlement overlaps the period: granted before period end and not revoked before period start.

**Site visitors / active users:** Unique event actors in the period, using internal user ID when signed in and otherwise anonymous browser ID. Progress without a raw event does not add a site visitor. The count can duplicate a person across browsers or pre-login and post-login activity.

**Signed-in active users:** Unique signed-in user IDs with at least one raw event or non-reset progress-history event in the period. This is the denominator for the period-reach funnel.

### 4.3 Course Active Users

Count distinct signed-in users with at least one selected-course signal during the period:

- event tied to a resource in the course;
- event on `/dashboard/course/{course_id}`;
- visible-time activity on a course resource;
- tracked resource download; or
- non-reset resource-progress event.

The funnel's course-active rate is `course_active_users / signed_in_active_users * 100`. It is not a separate headline KPI. A single shallow preview qualifies, so this measures reach rather than depth.

### 4.4 Meaningfully Engaged Course Users

Count distinct course-active signed-in users meeting at least one condition within the selected course and period:

- two distinct course resources opened;
- at least 180,000 ms of visible resource time accumulated;
- at least 25% progress on any course resource;
- any course resource completed; or
- any course resource downloaded.

Visible time comes from resource heartbeat and session-end events. Each `engagementDeltaMs` increment is capped at 120,000 ms before summing to reduce inflation from suspended tabs or delayed timers.

**Meaningful engagement rate:** `meaningfully_engaged_users / course_active_users * 100`, or `0%` when there are no course-active users.

This is the principal engagement KPI for the selected week, month, or quarter; the monthly version is the recommended regular stakeholder headline. It is a versioned behavioral classification, not proof of learning, and its thresholds are initial BeyondGrades hypotheses.

### 4.5 Starts, Progress, and Completions

**Resource starter:** Unique signed-in user-resource pair with positive progress or an `in_progress` or `completed` state during the period.

**Resource completion:** Unique signed-in user-resource pair with a `completed` progress event during the period. Repeated completion events for the pair count once in the period KPI.

**Unique completers:** Distinct signed-in users completing at least one resource in the period.

**Starter completion rate:** `unique completed users for resource / unique starter users for resource * 100`, or `0%` with no starters.

**Maximum progress per user-resource:** Highest `progress_percent` recorded for that user and resource during the period.

**Average progress:** Mean of maximum progress values greater than zero across started user-resource pairs: `sum(max_progress) / started_user_resource_pairs`.

**Median progress:** Middle maximum-progress value across the same pairs, or the mean of the two middle values for an even count. It is less sensitive to unusually high or low values than the average.

**Daily completions:** Completion-transition events on a Singapore date. The period KPI deduplicates user-resource pairs; the daily trend intentionally shows each completion event on its occurrence date.

### 4.6 Repeat Engagement and Visible Time

**Repeat user:** Course-active signed-in user with course activity on at least two distinct Singapore dates in the period.

**Repeat engagement rate:** `repeat_users / course_active_users * 100`, or `0%` with no course-active users.

**Content engagement time:** Sum of capped `engagementDeltaMs` values from heartbeat and session-end events tied to selected-course resources.

Repeat engagement measures within-period frequency, not cohort retention. Cohort retention anchors users to first use and measures return in later periods.

### 4.7 Paid Adoption and Follow-Up

**Paid eligible users:** Distinct users whose selected paid-course entitlement overlaps the period. With All Courses selected, this is the union eligible for any non-free course.

**Paid activated users:** Eligible users who were active in an eligible paid course during the period.

**Paid adoption rate:** `paid_activated_users / paid_eligible_users * 100`, or `0%` with no eligible users.

**Paid but inactive:** Eligible users outside the paid-activated set. With All Courses selected, activity only in the free course does not remove a user from this queue.

**Low activity:** Registered non-admin users with no raw event or non-reset progress event fill the list first. Remaining spaces use signed-in site users with no course activity, ordered from least raw activity upward.

**Ignored users:** Accounts excluded by internal user ID, Clerk ID, or email. Their user records, events, progress, and follow-up entries are removed from rollups.

### 4.8 Resource Performance

**Opens:** `resource_view` events; repeat opens count repeatedly.

**Unique viewers:** Distinct event actors opening the resource, using signed-in ID when present and anonymous browser ID otherwise.

**Views per user:** `opens / unique_viewers`, or zero with no viewers.

**Repeat viewers:** Signed-in users with at least two resource-view events for the resource in the period.

Starters, completed users, completion rate, average progress, and median progress follow section 4.5, scoped to one resource. Resources are sorted by unique viewers, then starters, opens, and completed users; the dashboard returns the first 20.

### 4.9 Most Engaged Users

Each signed-in user row reports distinct opened resources, maximum progress, distinct completed resources, visible resource time, raw sessions, raw events, resource opens, clicks, average session time, latest activity, and eligible paid courses.

**Average session time:** Take the largest cumulative `duration_ms` in each session, then calculate the mean across sessions with positive duration.

Rows are ranked lexicographically by completed resources, distinct resources, maximum progress, and visible time. This prioritizes review; it is not a learner score.

### 4.10 Period-Reach Funnel

The levels are signed-in active, course active, meaningfully engaged, and completed at least one resource. Each percentage is `users_at_level / signed_in_active_users * 100`, not step-to-step conversion. The display measures reach within the selected period and does not prove an ordered sequence.

### 4.11 Daily Trend

For each Singapore date, the service independently recalculates course-active users, meaningfully engaged users, and completion events from that day's signals. A user can qualify across a full month or quarter without qualifying on each day.

### 4.12 Acquisition

The first page view in a browser session determines attribution. UTM source, medium, and campaign take priority; otherwise the external referrer host is used; otherwise the source is Direct.

**Sessions:** Distinct attributed session IDs. **Visitors:** Distinct actors in those sessions. **Signed-in users:** Distinct signed-in user IDs in those sessions. **Course-active users:** Attributed signed-in users producing selected-course activity in the same session.

This is first-touch session attribution, not revenue attribution or proof that a source caused later engagement.

### 4.13 Diagnostic Activity

**Top pages:** Page views grouped by normalized path after removing UTM and click-ID query parameters; reports opens and distinct actors.

**Top clicks:** Clicks grouped by analytics identifier, accessible label, visible text, destination, or `Unlabelled click`, together with normalized page path.

**Referrers:** External page-view referrers normalized to HTTPS and grouped by source URL; same-site referrers are excluded.

**Recent activity:** Latest 25 non-ignored raw events in the selected period, labelled with user and resource information where available.

## 5. Dashboard Map

| Area | What it provides |
| --- | --- |
| Period and course controls | Singapore week (`W3 Aug 2026`), month (`Aug 2026`), quarter (`Q1 2026`), and All Courses or individual course filters. |
| Executive KPIs | Meaningfully engaged users, course-active users, resource completions, unique completers, repeat engagement, paid adoption, and average observed progress. Median progress remains available in resource/API detail. Site visitors provide traffic context. |
| Daily trend | Course-active users, meaningfully engaged users, and completion events by Singapore date, recalculated independently for each day. |
| Resource performance | Opens, unique and repeat viewers, starters, completers, starter completion rate, average progress, and median progress. This separates discovery, reach, reuse, progress, and completion. |
| User segments | Most engaged, paid but inactive, no/low activity, and ignored users. User-level lists are admin-only and support follow-up, not automated high-stakes decisions. |
| Period-reach funnel | Signed-in active through resource completer reach, with signed-in active as the common denominator; not an ordered conversion funnel. |
| Acquisition | First-touch session UTM, external referrer, or Direct attribution with sessions, visitors, signed-in users, and course-active users. Attribution is directional, not financial. |
| Diagnostics | Top pages, clicks, external referrers, and recent events for investigating traffic and tracking quality. |

Purchase revenue and completed consultation outcomes require explicit backend outcome events or joins to their source systems.

## 6. Aggregation Logic

The main KPI can be expressed by the following illustrative PostgreSQL. Production code also applies ignored-user filtering, Singapore boundaries, course-page activity, entitlement rules, and event-delta caps.

```sql
with event_signals as (
  select
    e.user_id,
    r.course_id,
    count(distinct e.resource_id)
      filter (where e.event_type = 'resource_view') as distinct_resources_viewed,
    sum(
      case
        when e.event_type in ('heartbeat', 'session_end') then
          least(
            greatest(coalesce((e.metadata ->> 'engagementDeltaMs')::integer, 0), 0),
            120000
          )
        else 0
      end
    ) as visible_content_ms,
    bool_or(
      e.event_type = 'click'
      and e.metadata ->> 'analyticsId' = 'resource-download'
    ) as downloaded_resource
  from analytics_events e
  join resources r on r.id = e.resource_id
  where e.user_id is not null
    and e.occurred_at >= :period_start
    and e.occurred_at < :period_end
  group by e.user_id, r.course_id
),
progress_signals as (
  select
    p.user_id,
    r.course_id,
    max(p.progress_percent) as max_progress,
    bool_or(p.event_type = 'completed') as completed_resource
  from resource_progress_events p
  join resources r on r.id = p.resource_id
  where p.event_type <> 'reset'
    and p.occurred_at >= :period_start
    and p.occurred_at < :period_end
  group by p.user_id, r.course_id
),
combined as (
  select
    coalesce(e.user_id, p.user_id) as user_id,
    coalesce(e.course_id, p.course_id) as course_id,
    coalesce(e.distinct_resources_viewed, 0) as distinct_resources_viewed,
    coalesce(e.visible_content_ms, 0) as visible_content_ms,
    coalesce(e.downloaded_resource, false) as downloaded_resource,
    coalesce(p.max_progress, 0) as max_progress,
    coalesce(p.completed_resource, false) as completed_resource
  from event_signals e
  full join progress_signals p
    on p.user_id = e.user_id
   and p.course_id = e.course_id
)
select
  course_id,
  count(distinct user_id) as meaningfully_engaged_users
from combined
where distinct_resources_viewed >= 2
   or visible_content_ms >= 180000
   or max_progress >= 25
   or completed_resource
   or downloaded_resource
group by course_id;
```

The current server reads the complete selected period rather than silently truncating at a row cap. Monitor query latency and event volume before moving reviewed logic into database views/functions or materialized daily aggregates.

## 7. Interpretation and Data Quality

- **Name counts accurately:** use "opens" or "views" for events and "unique viewers" for deduplicated actors. Use "course active" and "meaningfully engaged" only with their documented definitions.
- **Show counts with rates:** always present numerator, denominator, and percentage. A 100% completion rate from one starter is not equivalent to 70% from fifty.
- **Label incomplete periods:** the current week, month, or quarter is partial. Compare complete equivalent periods or the same elapsed portion with that method stated explicitly.
- **Do not infer causation from trends:** campaigns, seasonality, school schedules, and user mix can coincide with product changes. Causal claims require an experiment or stronger research design.
- **Version metric definitions:** record the threshold version and effective date. Recalculate history consistently where possible or visibly mark a definition break.

Audit the following data-quality conditions:

- resource-page events without resource IDs;
- progress activity without a corresponding resource;
- unusually large engagement deltas;
- duplicate event IDs ignored through the unique `event_id` conflict rule;
- sudden drops in heartbeat or progress-event volume;
- unknown course IDs; and
- periods before progress-history deployment.

## 8. Privacy and Governance

BeyondGrades operates in Singapore and may process parent and learner data. The Personal Data Protection Commission identifies notification, consent or applicable exceptions, purpose limitation, accuracy, protection, retention limitation, and access/correction obligations. Its analytics guidance encourages anonymized data where possible; its education and children's-data guidance is also relevant.

Practical controls:

- describe product and learning analytics purposes in the privacy notice;
- collect only fields required for those purposes;
- never put sensitive free text, assessment answers, or consultation messages in event metadata;
- keep raw user-level feeds and follow-up queues admin-only;
- default stakeholder reporting to aggregates;
- document retention for raw events and progress history;
- protect service-role credentials and review admin access;
- use ignored-user, bot, and data-quality controls; and
- obtain Singapore legal/privacy review before automated profiling or decisions affecting a learner.

This document provides product and technical guidance, not legal advice.

## 9. Recommended Next Phases

### Phase 1: Validate the Definition

Run the metric for several complete months. Sample users near each threshold, compare classification with team feedback, and check whether meaningful users return or complete more often than single-preview users.

### Phase 2: Add Cohort Retention

Anchor each account to its first meaningful course-engagement week or month and measure meaningful return in later complete periods. Keep repeat days within a period as a separate metric.

### Phase 3: Instrument Ordered Outcomes

Add authoritative events or joins for account creation, access-code redemption, paid entitlement, consultation submission and completion, purchase completion, and course/module completion. These enable ordered activation and paid-adoption funnels.

### Phase 4: Measure Learning Outcomes

With appropriate privacy review, collect low-burden evidence such as pre/post self-assessment, rubric-scored portfolio readiness, interview-practice outcomes, or structured feedback. Analyze associations with engagement and completion without assuming causation.

### Phase 5: Run Controlled Experiments

When volume supports it, test changes such as onboarding, module order, recommendations, or reminder timing. Predefine the target metric, guardrails, minimum sample, and decision rule.

## 10. Conclusion

BeyondGrades should answer monthly activity questions with a deduplicated, signed-in, course-specific measure rather than resource views or registrations. **Monthly Meaningfully Engaged Course Users** is the recommended primary KPI because its multi-signal definition handles repeat views, excludes inactive signups, includes useful skimming and downloads, and can be recalculated from event and progress history.

The surrounding layers remain necessary: site traffic, signed-in activity, course reach, resource progress, completion, repeat use, paid adoption, acquisition, and follow-up. Together they provide practical learning and growth analytics without overstating what behavioral data can prove.
 
## Research and Official Sources

- Google Analytics Help, "Engagement overview report": https://support.google.com/analytics/answer/13391283
- Google Analytics Help, "Session / Engaged session": https://support.google.com/analytics/answer/12798876
- Google Research, Rodden, Hutchinson, and Fu, "Measuring the User Experience on a Large Scale": https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
- Amplitude Docs, "Helpful definitions": https://amplitude.com/docs/get-started/helpful-definitions
- Amplitude Docs, "Set an event's activity status": https://amplitude.com/docs/data/change-event-activity-status
- Amplitude Docs, "Out-of-the-box Product Analytics": https://amplitude.com/docs/analytics/product-analytics
- Mixpanel Docs, "Insights": https://docs.mixpanel.com/docs/reports/insights
- Mixpanel Docs, "Retention": https://docs.mixpanel.com/docs/reports/retention
- PostHog Docs, "Product analytics": https://posthog.com/docs/product-analytics
- PostHog Docs, "Funnels": https://posthog.com/docs/product-analytics/funnels
- PostHog Docs, "Retention": https://posthog.com/docs/product-analytics/retention
- Netflix Technology Blog, "A/B Testing and Beyond": https://netflixtechblog.com/a-b-testing-and-beyond-improving-the-netflix-streaming-experience-with-experimentation-and-data-5b0ae9295bdf
- Netflix Technology Blog, "It's All A/Bout Testing": https://netflixtechblog.com/its-all-a-bout-testing-the-netflix-experimentation-platform-4e1ca458c15
- Airbnb Engineering & Data Science, "Experiments at Airbnb": https://medium.com/airbnb-engineering/experiments-at-airbnb-e2db3abf39e7
- Duolingo 2025 Form 10-K filed with the US SEC: https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm
- Society for Learning Analytics Research, "What is Learning Analytics?": https://www.solaresearch.org/about/what-is-learning-analytics/
- Caspari-Sadeghi, "Applying Learning Analytics in Online Environments," Frontiers in Education (2022): https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2022.840947/full
- Singapore PDPC, "Data Protection Obligations": https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act/data-protection-obligations
- Singapore PDPC, "Advisory Guidelines on the PDPA for Selected Topics" (Analytics and Research): https://www.pdpc.gov.sg/guidelines-and-consultation/2020/02/advisory-guidelines-on-the-personal-data-protection-act-for-selected-topics
- Singapore PDPC, "Advisory Guidelines for the Education Sector": https://www.pdpc.gov.sg/guidelines-and-consultation/2018/09/advisory-guidelines-for-the-education-sector
- Singapore PDPC, "Advisory Guidelines on the PDPA for Children's Personal Data in the Digital Environment": https://www.pdpc.gov.sg/guidelines-and-consultation/2024/03/advisory-guidelines-on-the-pdpa-for-childrens-personal-data-in-the-digital-environment
