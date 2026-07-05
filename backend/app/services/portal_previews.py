from __future__ import annotations

from app.config import settings
from app.models.portal import PortalCoursePreviewOut

_PREVIEWS = (
    ("portal-preview-1", "DSA Preview 1", "portal_preview_1_mux_playback_id"),
    ("portal-preview-2", "DSA Preview 2", "portal_preview_2_mux_playback_id"),
    ("portal-preview-3", "DSA Preview 3", "portal_preview_3_mux_playback_id"),
)


def list_portal_course_previews() -> list[PortalCoursePreviewOut]:
    """Return the three public Mux marketing clips configured on the backend."""
    previews: list[PortalCoursePreviewOut] = []
    for preview_id, title, setting_name in _PREVIEWS:
        playback_id = str(getattr(settings, setting_name)).strip()
        if not playback_id:
            continue
        previews.append(
            PortalCoursePreviewOut(
                id=preview_id,
                title=title,
                mux_playback_id=playback_id,
            )
        )
    return previews
