from __future__ import annotations

import re
from io import BytesIO
from pathlib import Path
from typing import Any
from uuid import UUID

from app.models.admin import ResourceUploadMetadata
from app.services.external_files import download_pdf, validate_public_https_url
from app.services.mux_client import MuxClient, MuxClientError, resolve_playback
from app.services.supabase import get_client

COURSE_RULES = {
    "course-1": {
        "bucket": "resources-public",
        "prefix": "course-1/pdf/",
        "access": "public",
    },
    "course-2": {
        "bucket": "resources-paid",
        "prefix": "course-2/pdf/",
        "access": "paid",
    },
}
DEFAULT_TOPICS = {
    "course-1": {"dsa-pathways", "timelines-deadlines"},
    "course-2": {"interview-preparation"},
}
PDF_TYPES = {"application/pdf", "application/x-pdf"}
MODULE_TITLE_PATTERN = re.compile(r"^Module\s+([1-9][0-9]*)\s*:", re.IGNORECASE)


class ResourceUploadError(Exception):
    pass


def _rule(metadata: ResourceUploadMetadata) -> dict[str, Any]:
    rule = COURSE_RULES.get(metadata.course_id)
    if not rule:
        slug = _slug(metadata.course_id)
        rule = {
            "bucket": "resources-paid",
            "prefix": f"{slug}/pdf/",
            "access": "paid",
        }
    if metadata.module_id and metadata.course_id != "course-2":
        raise ResourceUploadError("Modules are only available for Course 2")
    return rule


def _resource_row(metadata: ResourceUploadMetadata, resource_type: str) -> dict[str, Any]:
    rule = _rule(metadata)
    _ensure_module(metadata)
    row: dict[str, Any] = {
        "title": metadata.title.strip(),
        "description": metadata.description.strip(),
        "course_id": metadata.course_id,
        "module_id": metadata.module_id or None,
        "type": resource_type,
        "topic": metadata.topic,
        "duration": "",
        "is_paid": rule["access"] == "paid",
    }
    return row


def _ensure_module(metadata: ResourceUploadMetadata) -> None:
    if not metadata.module_title:
        return
    if not metadata.module_id:
        raise ResourceUploadError("Module name cannot be blank")
    match = MODULE_TITLE_PATTERN.match(metadata.module_title.strip())
    get_client().table("course_modules").upsert(
        {
            "course_id": metadata.course_id,
            "id": metadata.module_id,
            "title": metadata.module_title.strip(),
            "sort_order": int(match.group(1)) if match else 9999,
        },
        on_conflict="course_id,id",
    ).execute()


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "resource"


def _safe_pdf_name(filename: str) -> str:
    stem = _slug(Path(filename).stem)
    return f"{stem}.pdf"


def pdf_thumbnail_path(file_path: str) -> str:
    path = Path(file_path)
    return str(path.with_name(f"{path.stem}_thumbnail.jpg")).replace("\\", "/")


def _generate_pdf_thumbnail(content: bytes) -> bytes:
    """Render the first PDF page to a compact dashboard JPEG."""
    try:
        import pypdfium2 as pdfium

        document = pdfium.PdfDocument(content)
        if len(document) == 0:
            raise ResourceUploadError("The PDF has no pages")
        page = document[0]
        image = page.render(scale=1.5).to_pil().convert("RGB")
        image.thumbnail((960, 960))
        output = BytesIO()
        image.save(output, format="JPEG", quality=82, optimize=True)
        return output.getvalue()
    except ResourceUploadError:
        raise
    except ModuleNotFoundError as exc:
        raise ResourceUploadError(
            "PDF thumbnail support is unavailable; reinstall the backend dependencies and restart"
        ) from exc
    except Exception as exc:
        raise ResourceUploadError("The PDF thumbnail could not be generated") from exc


def list_upload_options() -> tuple[
    list[str], dict[str, list[str]], dict[str, list[dict[str, str]]]
]:
    courses = set(COURSE_RULES)
    topics = {course: set(values) for course, values in DEFAULT_TOPICS.items()}
    result = get_client().table("resources").select("course_id,topic").execute()
    for row in result.data or []:
        course_id = str(row.get("course_id") or "").strip()
        topic = str(row.get("topic") or "").strip()
        if not course_id:
            continue
        courses.add(course_id)
        if topic:
            topics.setdefault(course_id, set()).add(topic)
    module_result = (
        get_client()
        .table("course_modules")
        .select("course_id,id,title")
        .order("sort_order")
        .execute()
    )
    modules: dict[str, list[dict[str, str]]] = {}
    for row in module_result.data or []:
        course_id = str(row.get("course_id") or "")
        module_id = str(row.get("id") or "")
        title = str(row.get("title") or "")
        if course_id and module_id and title:
            modules.setdefault(course_id, []).append({"id": module_id, "title": title})
    return (
        sorted(courses),
        {course: sorted(topics.get(course, set())) for course in sorted(courses)},
        modules,
    )


def update_resource_metadata(
    resource_id: str, *, title: str, topic: str, description: str
) -> None:
    client = get_client()
    existing = (
        client.table("resources")
        .select("title,type,mux_asset_id")
        .eq("id", resource_id)
        .execute()
    )
    if not existing.data:
        raise ResourceUploadError("Resource not found")
    row = existing.data[0]
    if (
        row.get("type") == "video"
        and row.get("mux_asset_id")
        and str(row.get("title") or "") != title.strip()
    ):
        MuxClient().update_asset_title(str(row["mux_asset_id"]), title.strip())

    result = (
        client
        .table("resources")
        .update(
            {
                "title": title.strip(),
                "topic": topic.strip(),
                "description": description.strip(),
            }
        )
        .eq("id", resource_id)
        .execute()
    )
    if not result.data:
        raise ResourceUploadError("Resource not found")


def delete_resource(resource_id: str) -> None:
    client = get_client()
    existing = (
        client.table("resources")
        .select("type,bucket,file_path,mux_asset_id")
        .eq("id", resource_id)
        .execute()
    )
    if not existing.data:
        raise ResourceUploadError("Resource not found")

    row = existing.data[0]
    resource_type = str(row.get("type") or "")
    mux_asset_id = str(row.get("mux_asset_id") or "").strip()
    bucket = str(row.get("bucket") or "").strip()
    file_path = str(row.get("file_path") or "").strip()

    if resource_type == "video":
        mux = MuxClient()
        asset_ids = [mux_asset_id] if mux_asset_id else [
            asset.id for asset in mux.list_all_assets() if asset.passthrough == resource_id
        ]
        for asset_id in asset_ids:
            mux.delete_asset(asset_id)
    elif bucket and file_path:
        paths = [file_path]
        if resource_type == "pdf":
            paths.append(pdf_thumbnail_path(file_path))
        client.storage.from_(bucket).remove(paths)

    result = client.table("resources").delete().eq("id", resource_id).execute()
    if not result.data:
        raise ResourceUploadError("Resource record could not be deleted")


def upload_pdf(
    *, filename: str, content_type: str | None, content: bytes, metadata: ResourceUploadMetadata
) -> UUID:
    if Path(filename).suffix.lower() != ".pdf" or content_type not in PDF_TYPES:
        raise ResourceUploadError("Only PDF documents are supported")
    if not content:
        raise ResourceUploadError("The uploaded file is empty")

    rule = _rule(metadata)
    file_path = f"{rule['prefix']}{_safe_pdf_name(filename)}"
    thumbnail_path = pdf_thumbnail_path(file_path)
    thumbnail = _generate_pdf_thumbnail(content)
    row = {**_resource_row(metadata, "pdf"), "bucket": rule["bucket"], "file_path": file_path}
    client = get_client()
    client.storage.from_(rule["bucket"]).upload(
        path=file_path,
        file=content,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    client.storage.from_(rule["bucket"]).upload(
        path=thumbnail_path,
        file=thumbnail,
        file_options={"content-type": "image/jpeg", "upsert": "true"},
    )
    existing = (
        client.table("resources")
        .select("id")
        .eq("bucket", rule["bucket"])
        .eq("file_path", file_path)
        .execute()
    )
    if existing.data:
        resource_id = str(existing.data[0]["id"])
        result = client.table("resources").update(row).eq("id", resource_id).execute()
    else:
        result = client.table("resources").insert(row).execute()
    if not result.data:
        raise ResourceUploadError("The resource record could not be created")
    return UUID(str(result.data[0]["id"]))


def begin_video_upload(metadata: ResourceUploadMetadata) -> tuple[UUID, str, str]:
    rule = _rule(metadata)
    client = get_client()
    result = client.table("resources").insert(_resource_row(metadata, "video")).execute()
    if not result.data:
        raise ResourceUploadError("The resource record could not be created")
    resource_id = UUID(str(result.data[0]["id"]))
    try:
        upload = MuxClient().create_direct_upload(
            passthrough=str(resource_id),
            title=metadata.title.strip(),
            signed=rule["access"] == "paid",
        )
    except Exception:
        client.table("resources").delete().eq("id", str(resource_id)).execute()
        raise
    if not upload.id or not upload.url:
        raise ResourceUploadError("Mux did not return an upload URL")
    return resource_id, upload.id, upload.url


def ingest_link(
    *, url: str, resource_type: str, metadata: ResourceUploadMetadata
) -> tuple[UUID, str]:
    if resource_type == "pdf":
        downloaded = download_pdf(url)
        return (
            upload_pdf(
                filename=downloaded.filename,
                content_type="application/pdf",
                content=downloaded.content,
                metadata=metadata,
            ),
            "ready",
        )
    if resource_type != "video":
        raise ResourceUploadError("Unsupported linked resource type")

    source_url = validate_public_https_url(url)
    rule = _rule(metadata)
    client = get_client()
    result = client.table("resources").insert(_resource_row(metadata, "video")).execute()
    if not result.data:
        raise ResourceUploadError("The resource record could not be created")
    resource_id = UUID(str(result.data[0]["id"]))
    try:
        asset = MuxClient().create_asset_from_url(
            url=source_url,
            passthrough=str(resource_id),
            title=metadata.title.strip(),
            signed=rule["access"] == "paid",
        )
        update: dict[str, Any] = {"mux_asset_id": asset.id}
        try:
            playback_id, signed = resolve_playback(asset, rule["access"])
            update.update(
                {
                    "mux_playback_id": playback_id,
                    "mux_playback_signed": signed,
                }
            )
        except MuxClientError:
            pass
        client.table("resources").update(update).eq("id", str(resource_id)).execute()
    except Exception:
        client.table("resources").delete().eq("id", str(resource_id)).execute()
        raise
    return resource_id, "ready" if asset.status == "ready" else "processing"


def complete_video_upload(resource_id: UUID, upload_id: str) -> str:
    mux = MuxClient()
    upload = mux.get_direct_upload(upload_id)
    if not upload.asset_id:
        return upload.status or "waiting"

    asset = mux.get_asset(upload.asset_id)
    if asset.passthrough != str(resource_id):
        raise ResourceUploadError("Upload does not belong to this resource")
    row = (
        get_client().table("resources").select("is_paid").eq("id", str(resource_id)).execute()
    )
    if not row.data:
        raise ResourceUploadError("Resource not found")
    access = "paid" if row.data[0].get("is_paid") else "public"
    try:
        playback_id, signed = resolve_playback(asset, access)
    except MuxClientError:
        return asset.status or "preparing"
    get_client().table("resources").update(
        {
            "mux_asset_id": asset.id,
            "mux_playback_id": playback_id,
            "mux_playback_signed": signed,
        }
    ).eq("id", str(resource_id)).execute()
    return "ready" if asset.status == "ready" else "processing"
