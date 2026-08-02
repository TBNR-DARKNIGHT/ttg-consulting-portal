# Course Progress Tracking

**Status:** Implemented MVP  
**Last updated:** 2026-08-02

## Overview

Course progress is saved only for authenticated portal users. Guest users can still browse open
course content, but the dashboard does not fetch, display, or write progress for them.

The MVP uses one current-state row per learner/resource in `public.resource_progress`. This is
separate from `analytics_events`: analytics remains an append-only activity stream, while
`resource_progress` is the fast dashboard state used to answer "what has this learner completed?"

## Research Summary

Patterns reviewed across mainstream course platforms:

- Coursera emphasizes dashboard/course progress bars plus a recommended next step.
- Thinkific separates viewed progress from completed progress; completion is completed lessons /
  total lessons.
- Udemy auto-completes video lectures after watching them and allows manual mark/unmark on the
  learner course player.
- Teachable supports manual "Complete and continue" progress, plus optional video watching
  enforcement at 90%.
- Moodle and Canvas support instructor-configurable item requirements such as manual completion,
  required view, submissions, grades, or passing grades.
- LearnDash supports linear or free-form progression and commonly relies on "Mark Complete" for
  course steps, with optional timers/video progression.

Sources:

- Coursera: https://blog.coursera.org/new-progress-tracking-features-on-coursera/
- Thinkific: https://support.thinkific.com/hc/en-us/articles/360033331514-Understanding-Viewed-and-Completed-Percentages
- Thinkific Developers: https://support.thinkific.dev/hc/en-us/articles/4422658311703-Webhooks-Documentation
- Udemy: https://support.udemy.com/hc/en-us/articles/229607188-How-to-Mark-or-Unmark-Lectures-as-Complete-on-a-Browser
- Teachable: https://support.teachable.com/en/articles/11682463-course-compliance
- Moodle: https://docs.moodle.org/402/en/Activity_completion_settings
- Canvas: https://community.instructure.com/en/kb/articles/661314-how-do-i-mark-a-module-item-as-done-for-a-module-requirement
- LearnDash: https://learndash.com/support/kb/add-ons/courses/course-progression/

## Options Considered

Manual completion for every resource is the simplest and has the lowest false-positive rate,
especially for PDFs and downloads, but learners may forget to mark work complete.

Automatic video completion is low-friction and expected by many learners, but it needs throttling,
resume state, and a threshold that handles endings, credits, and short skips.

View/open-based completion is easy to implement for PDFs and pages, but it is a weak learning
signal because opening a file does not mean the learner used it.

Event-sourced progress from analytics would preserve richer history, but it is unnecessary
complexity for an MVP dashboard read path. The current-state row can coexist with analytics events
later if cohort reports need a full activity timeline.

## Data Model

`resource_progress` stores:

- `user_id` and `resource_id` as the primary key.
- `status`: `not_started`, `in_progress`, or `completed`.
- `progress_percent`: lightweight engagement percent for the resource.
- `completed_at` and `completion_source`.
- Video resume fields: `last_position_seconds`, `duration_seconds`.
- PDF reader fields: `pages_viewed`, `page_count`.
- `last_accessed_at`, `created_at`, and `updated_at`.

## Completion Rules

Course progress is calculated as:

```
completed resources / total resources in the course
```

For the MVP, each resource has equal weight. This matches the mainstream pattern used by course
platforms where course progress is based on completed curriculum items rather than raw time spent.

Videos are updated from Mux player events:

- `timeupdate` saves progress at most every 10 seconds.
- `pause` forces a save.
- `ended` marks the resource complete with `completion_source = video_ended`.
- Reaching 90% marks complete with `completion_source = video_threshold`.
- `last_position_seconds` is used as Mux `startTime` so learners resume where they left off.

PDFs track pages viewed inside the React PDF viewer, but completion is manual. Learners must choose
`Mark complete`. This avoids counting a PDF as complete just because it was opened or downloaded.

## API Surface

- `GET /api/v1/resources/progress`
- `PATCH /api/v1/resources/{resource_id}/progress`
- `POST /api/v1/resources/{resource_id}/complete`
- `DELETE /api/v1/resources/{resource_id}/complete`
- `DELETE /api/v1/courses/{course_id}/progress`

All endpoints require `get_current_user`. Resource-level writes check resource access before saving.
Course reset deletes only the current learner's rows for resources in the selected course.

## Design Decisions

- **Signed-in only over guest local progress:** The product requirement was explicit, and it avoids
  confusing local-only progress that disappears or must later be merged.
- **Current-state table over event replay:** Dashboard UI needs fast reads. Event replay is better
  suited to analytics, which already exists separately.
- **Manual PDF completion over automatic open/download completion:** Opening a PDF is a weak signal.
  Page tracking is saved for context, but completion stays under learner control.
- **90% video threshold plus `ended`:** This gives learners credit when they effectively finish a
  video even if the final seconds are credits or silence, while `ended` remains the cleanest signal.
- **Equal item weighting for the MVP:** It is simple and transparent. A future `is_required` or
  `progress_weight` field can refine this if courses need different weighting.
- **Course reset over individual resource reset:** Reset deletes the current learner's saved
  progress rows for every resource in a course. This gives learners an escape hatch for accidental
  video playback without cluttering each resource page with destructive controls.

## UI Surfaces

- Dashboard home shows saved course progress only when signed in.
- Course pages show course progress in the header only when signed in.
- Resource cards show completion or in-progress percent only when signed in.
- Resource detail pages expose manual complete/incomplete controls for PDFs only when signed in.
- Video detail pages do not duplicate the player's own progress bar; they save/resume progress
  automatically and expose reset progress only when saved progress exists.
- Course pages expose reset progress only when the signed-in learner already has saved progress for
  that course. The reset action opens a confirmation dialog before deleting progress.
