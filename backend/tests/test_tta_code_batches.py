from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services import admin_access_codes


@pytest.mark.asyncio
async def test_create_tta_code_batch_creates_codes_and_exports_same_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    actor_id = uuid4()
    exported: list[tuple[str, str]] = []

    class FakeClient:
        def __init__(self):
            self.params = None

        def rpc(self, name, params):
            assert name == "admin_create_access_code_batch"
            self.params = params
            return self

        def execute(self):
            return SimpleNamespace(
                data=[
                    {
                        "code_index": index,
                        "code_id": str(uuid4()),
                        "order_id": f"TTA-STUDENT-{index:04d}",
                    }
                    for index in range(1, 4)
                ]
            )

    async def export_codes(codes):
        exported.extend(codes)

    generated = iter(["TTA-TEST-1", "TTA-TEST-2", "TTA-TEST-3"])
    monkeypatch.setattr(admin_access_codes, "generate_code", lambda: next(generated))
    monkeypatch.setattr(admin_access_codes, "append_tta_code_rows", export_codes)
    client = FakeClient()

    quantity = await admin_access_codes.create_tta_code_batch(
        actor_user_id=actor_id,
        quantity=3,
        client=client,  # type: ignore[arg-type]
    )

    assert quantity == 3
    assert [code for _, code in exported] == [
        "TTA-TEST-1",
        "TTA-TEST-2",
        "TTA-TEST-3",
    ]
    assert len(client.params["p_code_hashes"]) == 3


@pytest.mark.asyncio
async def test_revoke_all_active_access_codes_returns_revoked_count(
) -> None:
    class FakeClient:
        def rpc(self, name, params):
            assert name == "admin_revoke_all_active_access_codes"
            assert params["p_reason"] == "Batch retired"
            return self

        def execute(self):
            return SimpleNamespace(data=[str(uuid4()), str(uuid4())])

    count = await admin_access_codes.revoke_all_active_access_codes(
        actor_user_id=uuid4(),
        reason="Batch retired",
        client=FakeClient(),  # type: ignore[arg-type]
    )

    assert count == 2


@pytest.mark.asyncio
async def test_delete_revoked_access_codes_returns_deleted_count() -> None:
    class FakeClient:
        def rpc(self, name, params):
            assert name == "admin_delete_revoked_access_codes"
            assert params["p_reason"] == "Database cleanup"
            return self

        def execute(self):
            return SimpleNamespace(data=[str(uuid4()), str(uuid4()), str(uuid4())])

    count = await admin_access_codes.delete_revoked_access_codes(
        actor_user_id=uuid4(),
        reason="Database cleanup",
        client=FakeClient(),  # type: ignore[arg-type]
    )

    assert count == 3


@pytest.mark.parametrize("quantity", [0, 501])
@pytest.mark.asyncio
async def test_create_tta_code_batch_rejects_invalid_quantity(quantity: int) -> None:
    with pytest.raises(admin_access_codes.AdminAccessCodeError):
        await admin_access_codes.create_tta_code_batch(
            actor_user_id=uuid4(),
            quantity=quantity,
        )
