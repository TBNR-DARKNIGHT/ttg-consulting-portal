from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.models.schemas import ClerkUser
from app.services import user_sync
from app.services.user_sync import ClerkProfile, UserSyncError, sync_authenticated_user


class FakeQuery:
    def __init__(self, client: "FakeClient", operation: str, payload=None):
        self.client = client
        self.operation = operation
        self.payload = payload
        self.filters: dict[str, object] = {}
        self.ignore_duplicates = False

    def select(self, _columns: str) -> "FakeQuery":
        self.operation = "select"
        return self

    def update(self, payload: dict[str, object]) -> "FakeQuery":
        self.operation = "update"
        self.payload = payload
        return self

    def upsert(
        self,
        payload: dict[str, object],
        *,
        on_conflict: str,
        ignore_duplicates: bool,
    ) -> "FakeQuery":
        assert on_conflict == "clerk_user_id"
        self.operation = "upsert"
        self.payload = payload
        self.ignore_duplicates = ignore_duplicates
        return self

    def eq(self, field: str, value: object) -> "FakeQuery":
        self.filters[field] = value
        return self

    def limit(self, _value: int) -> "FakeQuery":
        return self

    def execute(self):
        if self.operation == "select":
            rows = [
                row
                for row in self.client.rows
                if all(row.get(field) == value for field, value in self.filters.items())
            ]
            return SimpleNamespace(data=[dict(row) for row in rows])

        if self.operation == "update":
            rows = [
                row
                for row in self.client.rows
                if all(row.get(field) == value for field, value in self.filters.items())
            ]
            for row in rows:
                row.update(self.payload)
            return SimpleNamespace(data=[dict(row) for row in rows])

        if self.operation == "upsert":
            existing = next(
                (
                    row
                    for row in self.client.rows
                    if row["clerk_user_id"] == self.payload["clerk_user_id"]
                ),
                None,
            )
            if existing is not None and self.ignore_duplicates:
                return SimpleNamespace(data=[])
            row = {"id": str(uuid4()), **self.payload}
            self.client.rows.append(row)
            return SimpleNamespace(data=[dict(row)])

        raise AssertionError(f"Unsupported operation: {self.operation}")


class FakeClient:
    def __init__(self, rows: list[dict[str, object]] | None = None):
        self.rows = rows or []

    def table(self, name: str) -> FakeQuery:
        assert name == "users"
        return FakeQuery(self, "table")


@pytest.mark.asyncio
async def test_existing_user_is_resolved_without_overwriting_role_or_status() -> None:
    internal_id = uuid4()
    client = FakeClient(
        [
            {
                "id": str(internal_id),
                "clerk_user_id": "user_existing",
                "email": "old@example.com",
                "first_name": "Old",
                "last_name": "Name",
                "role": "ADMIN",
                "status": "SUSPENDED",
            }
        ]
    )

    result = await sync_authenticated_user(
        ClerkUser(
            clerk_id="user_existing",
            email="NEW@EXAMPLE.COM",
            first_name="New",
            last_name="Person",
        ),
        client=client,  # type: ignore[arg-type]
    )

    assert result.internal_user_id == internal_id
    assert result.email == "new@example.com"
    assert client.rows[0]["role"] == "ADMIN"
    assert client.rows[0]["status"] == "SUSPENDED"
    assert client.rows[0]["first_name"] == "New"


@pytest.mark.asyncio
async def test_first_login_creates_client_user_from_jwt_claims(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def unexpected_fetch(_clerk_user_id: str) -> ClerkProfile:
        raise AssertionError("Clerk Backend API should not be called when email is in the JWT")

    monkeypatch.setattr(user_sync, "fetch_clerk_profile", unexpected_fetch)
    client = FakeClient()

    result = await sync_authenticated_user(
        ClerkUser(
            clerk_id="user_new",
            email="Parent@Example.com",
            first_name="Pat",
            last_name="Lee",
        ),
        client=client,  # type: ignore[arg-type]
    )

    assert isinstance(result.internal_user_id, UUID)
    assert result.email == "parent@example.com"
    assert client.rows[0]["role"] == "CLIENT"
    assert client.rows[0]["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_first_login_fetches_clerk_profile_when_email_claim_is_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def profile(_clerk_user_id: str) -> ClerkProfile:
        return ClerkProfile(
            email="profile@example.com",
            first_name="Profile",
            last_name="User",
        )

    monkeypatch.setattr(user_sync, "fetch_clerk_profile", profile)
    client = FakeClient()

    result = await sync_authenticated_user(
        ClerkUser(clerk_id="user_profile"),
        client=client,  # type: ignore[arg-type]
    )

    assert result.email == "profile@example.com"
    assert result.first_name == "Profile"
    assert client.rows[0]["last_name"] == "User"


@pytest.mark.asyncio
async def test_missing_email_and_unavailable_clerk_backend_fails_closed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def unavailable(_clerk_user_id: str) -> ClerkProfile:
        raise UserSyncError("profile unavailable")

    monkeypatch.setattr(user_sync, "fetch_clerk_profile", unavailable)

    with pytest.raises(UserSyncError, match="profile unavailable"):
        await sync_authenticated_user(
            ClerkUser(clerk_id="user_no_profile"),
            client=FakeClient(),  # type: ignore[arg-type]
        )
