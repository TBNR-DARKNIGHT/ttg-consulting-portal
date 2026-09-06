from __future__ import annotations

import json

import httpx
import pytest

from app.config import settings
from app.models.consultation import ConsultationEnquiryIn
from app.routers import consultation
from app.services.resend import (
    RESEND_EMAILS_URL,
    ResendConfigurationError,
    ResendDelivery,
    ResendDeliveryError,
    send_consultation_enquiry,
)


def _payload(**overrides: str) -> dict[str, str]:
    payload = {
        "parentName": "Parent Example",
        "contactNumber": "+65 9123 4567",
        "childSchool": "Example Primary School",
        "childLevel": "P5",
        "programme": "dsa",
        "notes": "Interested in portfolio planning.",
        "website": "",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_endpoint_sends_valid_enquiry(client, monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_send(body, **kwargs):
        captured["body"] = body
        captured.update(kwargs)
        return ResendDelivery(email_id="email-123")

    monkeypatch.setattr(consultation, "send_consultation_enquiry", fake_send)

    response = await client.post(
        "/api/v1/consultation/enquiries",
        json=_payload(),
        headers={"Referer": "https://www.beyondgrades.sg/consult"},
    )

    assert response.status_code == 202
    assert response.json() == {"data": {"status": "sent"}, "error": None}
    assert captured["body"].parent_name == "Parent Example"  # type: ignore[union-attr]
    assert captured["source_url"] == "https://www.beyondgrades.sg/consult"
    assert str(captured["idempotency_key"]).startswith("consultation-enquiry/")


@pytest.mark.asyncio
async def test_endpoint_silently_discards_honeypot_submission(client, monkeypatch) -> None:
    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("Resend must not be called for honeypot submissions")

    monkeypatch.setattr(consultation, "send_consultation_enquiry", fail_if_called)

    response = await client.post(
        "/api/v1/consultation/enquiries",
        json=_payload(website="https://spam.example"),
    )

    assert response.status_code == 202
    assert response.json()["data"] == {"status": "sent"}


@pytest.mark.asyncio
async def test_endpoint_reports_unconfigured_resend(client, monkeypatch) -> None:
    async def fake_send(*_args, **_kwargs):
        raise ResendConfigurationError("missing settings")

    monkeypatch.setattr(consultation, "send_consultation_enquiry", fake_send)

    response = await client.post("/api/v1/consultation/enquiries", json=_payload())

    assert response.status_code == 503
    assert response.json()["detail"] == "Email delivery is not configured"


@pytest.mark.asyncio
async def test_endpoint_reports_resend_delivery_failure(client, monkeypatch) -> None:
    async def fake_send(*_args, **_kwargs):
        raise ResendDeliveryError("rejected")

    monkeypatch.setattr(consultation, "send_consultation_enquiry", fake_send)

    response = await client.post("/api/v1/consultation/enquiries", json=_payload())

    assert response.status_code == 502
    assert response.json()["detail"] == "Unable to deliver enquiry email"


@pytest.mark.asyncio
async def test_endpoint_validates_contact_number(client) -> None:
    response = await client.post(
        "/api/v1/consultation/enquiries",
        json=_payload(contactNumber="not a phone number"),
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_resend_service_sends_escaped_email(monkeypatch) -> None:
    monkeypatch.setattr(settings, "resend_api_key", "re_test_key")
    monkeypatch.setattr(
        settings,
        "resend_from_email",
        "Beyond Grades <enquiries@send.thinkteachacademy.com>",
    )
    monkeypatch.setattr(
        settings,
        "consultation_enquiry_to_email",
        "yapshen@thinkteachacademy.com, team@thinkteachacademy.com",
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == RESEND_EMAILS_URL
        assert request.headers["Authorization"] == "Bearer re_test_key"
        assert request.headers["Idempotency-Key"] == "consultation-enquiry/test-123"
        payload = json.loads(request.content.decode("utf-8"))
        assert payload["from"] == "Beyond Grades <enquiries@send.thinkteachacademy.com>"
        assert payload["to"] == [
            "yapshen@thinkteachacademy.com",
            "team@thinkteachacademy.com",
        ]
        assert "&lt;script&gt;" in payload["html"]
        assert "<script>" not in payload["html"]
        assert "Primary 5" in payload["text"]
        return httpx.Response(200, json={"id": "email-123"})

    transport = httpx.MockTransport(handler)
    enquiry = ConsultationEnquiryIn.model_validate(_payload(parentName="<script>alert(1)</script>"))

    async with httpx.AsyncClient(transport=transport) as resend_client:
        delivery = await send_consultation_enquiry(
            enquiry,
            source_url="https://www.beyondgrades.sg/consult",
            idempotency_key="consultation-enquiry/test-123",
            client=resend_client,
        )

    assert delivery.email_id == "email-123"


@pytest.mark.asyncio
async def test_resend_service_rejects_failed_api_response(monkeypatch) -> None:
    monkeypatch.setattr(settings, "resend_api_key", "re_test_key")
    monkeypatch.setattr(settings, "resend_from_email", "Beyond Grades <hello@example.com>")
    monkeypatch.setattr(settings, "consultation_enquiry_to_email", "team@example.com")

    transport = httpx.MockTransport(
        lambda _request: httpx.Response(403, json={"message": "domain not verified"})
    )
    enquiry = ConsultationEnquiryIn.model_validate(_payload())

    async with httpx.AsyncClient(transport=transport) as resend_client:
        with pytest.raises(ResendDeliveryError):
            await send_consultation_enquiry(
                enquiry,
                source_url=None,
                idempotency_key="consultation-enquiry/test-403",
                client=resend_client,
            )
