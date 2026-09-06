from __future__ import annotations

from dataclasses import dataclass
from html import escape

import httpx
import structlog

from app.config import settings
from app.models.consultation import ConsultationEnquiryIn

logger = structlog.get_logger()
RESEND_EMAILS_URL = "https://api.resend.com/emails"

LEVEL_LABELS = {
    "P4": "Primary 4",
    "P5": "Primary 5",
    "P6": "Primary 6",
    "Sec1": "Secondary 1",
    "Sec2": "Secondary 2",
    "Sec3": "Secondary 3",
    "Sec4": "Secondary 4",
    "JC1": "Junior College 1",
    "JC2": "Junior College 2",
    "Poly": "Polytechnic",
    "NS": "National Service",
}
PROGRAMME_LABELS = {
    "dsa": "DSA Consultation, Primary 4 to 6",
    "basecamp": "Base Camp, Secondary to JC",
    "both": "Both — not sure yet",
}


class ResendConfigurationError(RuntimeError):
    """Resend delivery is missing required server-side configuration."""


class ResendDeliveryError(RuntimeError):
    """Resend did not accept the email request."""


@dataclass(frozen=True)
class ResendDelivery:
    email_id: str


def _configured_delivery() -> tuple[str, str, list[str]]:
    api_key = settings.resend_api_key.strip()
    from_email = settings.resend_from_email.strip()
    recipients = [
        address.strip()
        for address in settings.consultation_enquiry_to_email.split(",")
        if address.strip()
    ]

    if not api_key or not from_email or not recipients:
        raise ResendConfigurationError("Resend enquiry delivery is not configured")
    if any("\r" in value or "\n" in value for value in [from_email, *recipients]):
        raise ResendConfigurationError("Resend email addresses are invalid")

    return api_key, from_email, recipients


def _email_content(
    enquiry: ConsultationEnquiryIn,
    *,
    source_url: str | None,
) -> tuple[str, str]:
    values = [
        ("Parent name", enquiry.parent_name),
        ("Contact number", enquiry.contact_number),
        ("Child's current school", enquiry.child_school),
        ("Child's current level", LEVEL_LABELS[enquiry.child_level]),
        ("Area of interest", PROGRAMME_LABELS[enquiry.programme]),
        ("Additional notes", enquiry.notes or "Not provided"),
        ("Submitted from", source_url or "Not provided"),
    ]

    text = "New Education Consulting Enquiry\n\n" + "\n".join(
        f"{label}: {value}" for label, value in values
    )
    rows = "".join(
        "<tr>"
        f'<th style="padding:10px 14px;text-align:left;vertical-align:top;'
        f'border-bottom:1px solid #e5e7eb;color:#1b1f4b;">{escape(label)}</th>'
        f'<td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;'
        f'color:#374151;">{escape(value).replace(chr(10), "<br>")}</td>'
        "</tr>"
        for label, value in values
    )
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;">'
        '<h1 style="color:#1b1f4b;font-size:24px;">New Education Consulting enquiry</h1>'
        '<table style="width:100%;border-collapse:collapse;">'
        f"{rows}"
        "</table>"
        "</div>"
    )
    return text, html


async def _send(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    from_email: str,
    recipients: list[str],
    enquiry: ConsultationEnquiryIn,
    source_url: str | None,
    idempotency_key: str,
) -> ResendDelivery:
    text, html = _email_content(enquiry, source_url=source_url)

    try:
        response = await client.post(
            RESEND_EMAILS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
            },
            json={
                "from": from_email,
                "to": recipients,
                "subject": "New Education Consulting enquiry",
                "text": text,
                "html": html,
            },
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Resend rejected consultation enquiry",
            status_code=exc.response.status_code,
            request_id=exc.response.headers.get("x-request-id"),
        )
        raise ResendDeliveryError("Resend rejected the email") from exc
    except httpx.HTTPError as exc:
        logger.exception("Resend consultation enquiry request failed")
        raise ResendDeliveryError("Resend request failed") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise ResendDeliveryError("Resend response was not JSON") from exc

    email_id = data.get("id") if isinstance(data, dict) else None
    if not isinstance(email_id, str) or not email_id:
        raise ResendDeliveryError("Resend response did not include an email ID")

    logger.info("Consultation enquiry accepted by Resend", email_id=email_id)
    return ResendDelivery(email_id=email_id)


async def send_consultation_enquiry(
    enquiry: ConsultationEnquiryIn,
    *,
    source_url: str | None,
    idempotency_key: str,
    client: httpx.AsyncClient | None = None,
) -> ResendDelivery:
    api_key, from_email, recipients = _configured_delivery()
    request_args = {
        "api_key": api_key,
        "from_email": from_email,
        "recipients": recipients,
        "enquiry": enquiry,
        "source_url": source_url,
        "idempotency_key": idempotency_key,
    }

    if client is not None:
        return await _send(client, **request_args)

    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as resend_client:
        return await _send(resend_client, **request_args)
