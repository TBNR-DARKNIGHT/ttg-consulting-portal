from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.config import settings
from app.models.schemas import ClerkUser
from app.routers import webhooks


class FakeWebhook:
    def __init__(self, _secret: str):
        pass

    def verify(self, _payload: bytes, _headers: dict[str, str]):
        return {
            "type": "user.created",
            "data": {
                "id": "user_clerk_123",
                "first_name": "Ada",
                "last_name": "Lovelace",
                "created_at": 1_751_323_200_000,
                "primary_email_address_id": "email_primary",
                "email_addresses": [
                    {
                        "id": "email_primary",
                        "email_address": "ADA@EXAMPLE.COM",
                    }
                ],
            },
        }


class FakeDeletedWebhook:
    def __init__(self, _secret: str):
        pass

    def verify(self, _payload: bytes, _headers: dict[str, str]):
        return {
            "type": "user.deleted",
            "data": {
                "id": "user_clerk_123",
                "deleted": True,
            },
        }


@pytest.mark.asyncio
async def test_clerk_user_created_upserts_user_sheet(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    internal_user_id = uuid4()
    written_rows = []

    async def sync_user(user: ClerkUser) -> ClerkUser:
        return user.model_copy(update={"internal_user_id": internal_user_id})

    async def entitlements(user_id):
        assert user_id == internal_user_id
        return ["course-1", "course-2"]

    async def write_row(row):
        written_rows.append(row)

    monkeypatch.setattr(settings, "clerk_webhook_signing_secret", "whsec_test")
    monkeypatch.setattr(webhooks, "is_user_sheet_configured", lambda: True)
    monkeypatch.setattr(webhooks, "Webhook", FakeWebhook)
    monkeypatch.setattr(webhooks, "sync_authenticated_user", sync_user)
    monkeypatch.setattr(webhooks, "list_entitlements", entitlements)
    monkeypatch.setattr(webhooks, "upsert_user_row", write_row)

    response = await client.post("/api/v1/webhooks/clerk", content=b"{}")

    assert response.status_code == 204
    assert len(written_rows) == 1
    assert written_rows[0].clerk_user_id == "user_clerk_123"
    assert written_rows[0].email == "ada@example.com"
    assert written_rows[0].has_course_2_access is True


@pytest.mark.asyncio
async def test_clerk_user_deleted_marks_sheet_row_deleted(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    deleted_user_ids = []

    async def mark_deleted(clerk_user_id: str):
        deleted_user_ids.append(clerk_user_id)

    monkeypatch.setattr(settings, "clerk_webhook_signing_secret", "whsec_test")
    monkeypatch.setattr(webhooks, "is_user_sheet_configured", lambda: True)
    monkeypatch.setattr(webhooks, "Webhook", FakeDeletedWebhook)
    monkeypatch.setattr(webhooks, "mark_user_deleted", mark_deleted)

    response = await client.post("/api/v1/webhooks/clerk", content=b"{}")

    assert response.status_code == 204
    assert deleted_user_ids == ["user_clerk_123"]


@pytest.mark.asyncio
async def test_clerk_webhook_requires_configuration(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "clerk_webhook_signing_secret", "")

    response = await client.post("/api/v1/webhooks/clerk", content=b"{}")

    assert response.status_code == 503
