from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.dependencies import get_optional_current_user, get_supabase_public
from app.main import app
from app.models.enums import UserRole
from app.models.resource import ResourceItem
from app.models.schemas import ClerkUser
from app.routers import storage
from app.services import course_access_policy


def paid_pdf() -> ResourceItem:
    now = datetime.now(UTC)
    return ResourceItem(
        id="paid-pdf",
        title="Paid PDF",
        course_id="course-3",
        type="pdf",
        topic="interview-preparation",
        description="",
        duration="",
        access="paid",
        bucket="resources-paid",
        file_path="course-3/pdf/paid.pdf",
        created_at=now,
        updated_at=now,
    )


class FakeBucket:
    def download(self, path: str) -> bytes:
        assert path == "course-3/pdf/paid.pdf"
        return b"%PDF-test"

    def create_signed_url(self, path: str, expires_in: int):
        assert path == "course-3/pdf/paid.pdf"
        assert expires_in == 300
        return {"signedURL": "https://storage.example.test/signed-paid-pdf"}


class FakeStorage:
    def from_(self, bucket: str) -> FakeBucket:
        assert bucket == "resources-paid"
        return FakeBucket()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path",
    ["/api/v1/storage/paid-url", "/api/v1/storage/paid-download"],
)
async def test_paid_endpoints_deny_user_without_entitlement(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    path: str,
) -> None:
    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_free", internal_user_id=uuid4())

    async def denied(_user_id, _course_id):
        return False

    app.dependency_overrides[get_optional_current_user] = user
    monkeypatch.setattr(storage, "find_resource", lambda _resource_id: paid_pdf())
    monkeypatch.setattr(course_access_policy, "has_course_access", denied)
    try:
        response = await client.get(
            path,
            params={"resource_id": "paid-pdf"},
        )
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_redeemed_user_receives_paid_content(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_paid", internal_user_id=uuid4())

    async def allowed(_user_id, _course_id):
        return True

    app.dependency_overrides[get_optional_current_user] = user
    app.dependency_overrides[get_supabase_public] = lambda: SimpleNamespace(storage=FakeStorage())
    monkeypatch.setattr(storage, "find_resource", lambda _resource_id: paid_pdf())
    monkeypatch.setattr(course_access_policy, "has_course_access", allowed)
    try:
        response = await client.get(
            "/api/v1/storage/paid-download",
            params={"resource_id": "paid-pdf"},
        )
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)
        app.dependency_overrides.pop(get_supabase_public, None)

    assert response.status_code == 200
    assert response.content == b"%PDF-test"


@pytest.mark.asyncio
async def test_admin_receives_paid_content_without_entitlement(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def admin_user() -> ClerkUser:
        return ClerkUser(clerk_id="admin_test", role=UserRole.ADMIN)

    async def should_not_check_entitlement(_user_id, _course_id):
        pytest.fail("Admin access should bypass course entitlement checks")

    app.dependency_overrides[get_optional_current_user] = admin_user
    app.dependency_overrides[get_supabase_public] = lambda: SimpleNamespace(storage=FakeStorage())
    monkeypatch.setattr(storage, "find_resource", lambda _resource_id: paid_pdf())
    monkeypatch.setattr(course_access_policy, "has_course_access", should_not_check_entitlement)
    try:
        response = await client.get(
            "/api/v1/storage/paid-download",
            params={"resource_id": "paid-pdf"},
        )
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)
        app.dependency_overrides.pop(get_supabase_public, None)

    assert response.status_code == 200
    assert response.content == b"%PDF-test"


@pytest.mark.parametrize(
    "path",
    ["/api/v1/storage/public-url", "/api/v1/storage/public-download"],
)
@pytest.mark.asyncio
async def test_public_endpoints_cannot_retrieve_paid_files(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    path: str,
) -> None:
    app.dependency_overrides[get_supabase_public] = lambda: SimpleNamespace(storage=FakeStorage())
    monkeypatch.setattr(storage, "find_resource", lambda _resource_id: paid_pdf())
    try:
        response = await client.get(path, params={"resource_id": "paid-pdf"})
    finally:
        app.dependency_overrides.pop(get_supabase_public, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "Resource is not a public PDF"
