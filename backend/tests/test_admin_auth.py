from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.dependencies import require_admin
from app.models.enums import UserRole
from app.models.schemas import ClerkUser


@pytest.mark.asyncio
async def test_require_admin_returns_admin_user() -> None:
    user = ClerkUser(
        clerk_id="admin_1",
        internal_user_id=uuid4(),
        role=UserRole.ADMIN,
    )

    assert await require_admin(user) is user


@pytest.mark.asyncio
async def test_require_admin_rejects_client() -> None:
    user = ClerkUser(
        clerk_id="client_1",
        internal_user_id=uuid4(),
        role=UserRole.CLIENT,
    )

    with pytest.raises(HTTPException) as exc_info:
        await require_admin(user)

    assert exc_info.value.status_code == 403
