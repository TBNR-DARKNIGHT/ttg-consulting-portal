from __future__ import annotations

import hashlib
from types import SimpleNamespace
from uuid import uuid4

import pytest
from httpx import AsyncClient
from postgrest.exceptions import APIError

from app.dependencies import get_current_user
from app.main import app
from app.models.enums import UserRole
from app.models.schemas import ClerkUser
from app.routers import entitlements as entitlement_router
from app.services.entitlements import (
    CodeAlreadyRedeemedError,
    CodeExpiredError,
    InvalidCodeError,
    hash_redemption_code,
    list_entitlements,
    redeem_code,
)


class FakeEntitlementQuery:
    def __init__(self, rows: list[dict[str, object]]):
        self.rows = rows

    def select(self, _columns: str) -> "FakeEntitlementQuery":
        return self

    def eq(self, _field: str, _value: object) -> "FakeEntitlementQuery":
        return self

    def is_(self, _field: str, _value: object) -> "FakeEntitlementQuery":
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class FakeEntitlementClient:
    def __init__(
        self,
        *,
        rows: list[dict[str, object]] | None = None,
        rpc_data: str | None = None,
        rpc_error: APIError | None = None,
    ):
        self.rows = rows or []
        self.rpc_data = rpc_data
        self.rpc_error = rpc_error
        self.rpc_name: str | None = None
        self.rpc_params: dict[str, str] | None = None

    def table(self, name: str) -> FakeEntitlementQuery:
        assert name == "course_entitlements"
        return FakeEntitlementQuery(self.rows)

    def rpc(self, name: str, params: dict[str, str]) -> "FakeEntitlementClient":
        self.rpc_name = name
        self.rpc_params = params
        return self

    def execute(self):
        if self.rpc_error is not None:
            raise self.rpc_error
        return SimpleNamespace(data=self.rpc_data)


def test_hash_redemption_code_ignores_case_spaces_and_hyphens() -> None:
    expected = hashlib.sha256(b"TTAABCD1234EFGH").hexdigest()

    assert hash_redemption_code("tta-abcd 1234-efgh") == expected


@pytest.mark.asyncio
async def test_list_entitlements_always_includes_free_course() -> None:
    courses = await list_entitlements(
        uuid4(),
        client=FakeEntitlementClient(  # type: ignore[arg-type]
            rows=[{"course_id": "course-2"}]
        ),
    )

    assert courses == ["course-1", "course-2"]


@pytest.mark.asyncio
async def test_redeem_code_calls_atomic_rpc_with_hash() -> None:
    user_id = uuid4()
    client = FakeEntitlementClient(rpc_data="course-2")

    course_id = await redeem_code(
        user_id,
        "TTA-ABCD-1234-EFGH",
        client=client,  # type: ignore[arg-type]
    )

    assert course_id == "course-2"
    assert client.rpc_name == "redeem_course_code"
    assert client.rpc_params == {
        "p_code_hash": hashlib.sha256(b"TTAABCD1234EFGH").hexdigest(),
        "p_user_id": str(user_id),
    }


@pytest.mark.asyncio
async def test_redeem_code_maps_known_rpc_error() -> None:
    error = APIError(
        {
            "message": "CODE_ALREADY_REDEEMED",
            "code": "P0001",
            "hint": None,
            "details": None,
        }
    )

    with pytest.raises(CodeAlreadyRedeemedError):
        await redeem_code(
            uuid4(),
            "TTA-ABCD-1234-EFGH",
            client=FakeEntitlementClient(rpc_error=error),  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_entitlements_endpoint_returns_courses(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    internal_id = uuid4()

    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", internal_user_id=internal_id)

    async def courses(_user_id):
        return ["course-1", "course-2"]

    app.dependency_overrides[get_current_user] = user
    monkeypatch.setattr(entitlement_router, "list_entitlements", courses)
    try:
        response = await client.get("/api/v1/me/entitlements")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["data"]["courses"] == ["course-1", "course-2"]


@pytest.mark.asyncio
async def test_admin_entitlements_include_every_course_without_database_rows(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def admin_user() -> ClerkUser:
        return ClerkUser(clerk_id="admin_test", role=UserRole.ADMIN)

    async def should_not_load_entitlements(_user_id):
        pytest.fail("Admin access should not depend on course entitlement rows")

    app.dependency_overrides[get_current_user] = admin_user
    monkeypatch.setattr(entitlement_router, "list_entitlements", should_not_load_entitlements)
    try:
        response = await client.get("/api/v1/me/entitlements")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["data"]["courses"] == ["course-1", "course-2"]


@pytest.mark.asyncio
async def test_redeem_endpoint_returns_granted_course(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    internal_id = uuid4()

    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", internal_user_id=internal_id)

    async def redeem(_user_id, _code):
        return "course-2"

    app.dependency_overrides[get_current_user] = user
    monkeypatch.setattr(entitlement_router, "redeem_code", redeem)
    try:
        response = await client.post(
            "/api/v1/entitlements/redeem",
            json={"code": "TTA-ABCD-1234-EFGH"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["data"] == {"courseId": "course-2", "status": "granted"}


@pytest.mark.parametrize(
    ("error_type", "expected_status", "expected_detail"),
    [
        (InvalidCodeError, 400, "Invalid redemption code"),
        (CodeAlreadyRedeemedError, 409, "Code has already been redeemed"),
        (CodeExpiredError, 410, "Code has expired"),
    ],
)
@pytest.mark.asyncio
async def test_reused_invalid_and_expired_codes_fail(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    error_type: type[Exception],
    expected_status: int,
    expected_detail: str,
) -> None:
    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", internal_user_id=uuid4())

    async def reject(_user_id, _code):
        raise error_type()

    app.dependency_overrides[get_current_user] = user
    monkeypatch.setattr(entitlement_router, "redeem_code", reject)
    try:
        response = await client.post(
            "/api/v1/entitlements/redeem",
            json={"code": "TTA-ABCD-1234-EFGH"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == expected_status
    assert response.json()["detail"] == expected_detail


@pytest.mark.asyncio
async def test_entitlement_endpoint_requires_synced_user_id(client: AsyncClient) -> None:
    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_unsynced")

    app.dependency_overrides[get_current_user] = user
    try:
        response = await client.get("/api/v1/me/entitlements")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 503
