from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.config import settings
from app.routers import integrations
from app.services.entitlements import hash_redemption_code
from app.services.woocommerce_access_codes import (
    OrderCodeConflictError,
    generate_order_code,
    issue_woocommerce_access_code,
)

WEBHOOK_SECRET = "test-webhook-secret-with-sufficient-entropy"


class FakeQuery:
    def __init__(self, rows: list[dict[str, object]]):
        self.rows = rows
        self.payload: dict[str, object] | None = None
        self.mode = "select"

    def select(self, _columns: str):
        self.mode = "select"
        return self

    def eq(self, _column: str, _value: str):
        return self

    def is_(self, _column: str, _value: str):
        return self

    def limit(self, _count: int):
        return self

    def insert(self, payload: dict[str, object]):
        self.mode = "insert"
        self.payload = payload
        return self

    def execute(self):
        if self.mode == "insert":
            assert self.payload is not None
            row = {"id": str(uuid4()), **self.payload}
            self.rows.append(row)
            return SimpleNamespace(data=[row])
        return SimpleNamespace(data=self.rows[:1])


class FakeClient:
    def __init__(self, rows: list[dict[str, object]] | None = None):
        self.query = FakeQuery(rows or [])

    def table(self, name: str) -> FakeQuery:
        assert name == "access_codes"
        return self.query


def _payload(order_id: str = "ORDER-123") -> dict[str, str]:
    return {
        "orderId": order_id,
        "courseId": "course-2",
    }


def test_order_code_is_stable_and_human_readable() -> None:
    first = generate_order_code(
        secret=WEBHOOK_SECRET,
        order_id="ORDER-123",
        course_id="course-2",
    )
    second = generate_order_code(
        secret=WEBHOOK_SECRET,
        order_id="ORDER-123",
        course_id="course-2",
    )

    assert first == second
    assert first.startswith("TTA-")
    assert len(first.split("-")) == 7
    assert all(len(group) == 4 for group in first.split("-")[1:])


@pytest.mark.asyncio
async def test_service_inserts_only_hash() -> None:
    client = FakeClient()

    code_id, plaintext = await issue_woocommerce_access_code(
        secret=WEBHOOK_SECRET,
        order_id=" ORDER-123 ",
        course_id="course-2",
        client=client,  # type: ignore[arg-type]
    )

    assert isinstance(code_id, UUID)
    assert client.query.payload == {
        "code_hash": hash_redemption_code(plaintext),
        "course_id": "course-2",
        "order_id": "ORDER-123",
    }
    assert plaintext not in client.query.payload.values()


@pytest.mark.asyncio
async def test_service_returns_same_code_for_retry() -> None:
    plaintext = generate_order_code(
        secret=WEBHOOK_SECRET,
        order_id="ORDER-123",
        course_id="course-2",
    )
    existing_id = uuid4()
    client = FakeClient(
        [
            {
                "id": str(existing_id),
                "code_hash": hash_redemption_code(plaintext),
            }
        ]
    )

    code_id, retried_plaintext = await issue_woocommerce_access_code(
        secret=WEBHOOK_SECRET,
        order_id="ORDER-123",
        course_id="course-2",
        client=client,  # type: ignore[arg-type]
    )

    assert code_id == existing_id
    assert retried_plaintext == plaintext
    assert client.query.payload is None


@pytest.mark.asyncio
async def test_service_rejects_order_created_with_different_secret() -> None:
    client = FakeClient([{"id": str(uuid4()), "code_hash": "0" * 64}])

    with pytest.raises(OrderCodeConflictError):
        await issue_woocommerce_access_code(
            secret=WEBHOOK_SECRET,
            order_id="ORDER-123",
            course_id="course-2",
            client=client,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_endpoint_rejects_missing_secret(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "zapier_webhook_secret", WEBHOOK_SECRET)

    response = await client.post(
        "/api/v1/integrations/woocommerce/access-code",
        json=_payload(),
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_endpoint_reports_unconfigured_integration(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "zapier_webhook_secret", "")

    response = await client.post(
        "/api/v1/integrations/woocommerce/access-code",
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
        json=_payload(),
    )

    assert response.status_code == 503


@pytest.mark.asyncio
async def test_endpoint_returns_generated_code(client, monkeypatch) -> None:
    code_id = uuid4()
    monkeypatch.setattr(settings, "zapier_webhook_secret", WEBHOOK_SECRET)

    async def fake_issue(**_kwargs):
        return code_id, "TTA-2345-6789-ABCD-EFGH-JKLM-NPQR"

    monkeypatch.setattr(integrations, "issue_woocommerce_access_code", fake_issue)

    response = await client.post(
        "/api/v1/integrations/woocommerce/access-code",
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
        json=_payload(),
    )

    assert response.status_code == 201
    assert response.json() == {
        "data": {
            "id": str(code_id),
            "code": "TTA-2345-6789-ABCD-EFGH-JKLM-NPQR",
            "orderId": "ORDER-123",
        },
        "error": None,
    }


@pytest.mark.asyncio
async def test_endpoint_rejects_blank_order_id(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "zapier_webhook_secret", WEBHOOK_SECRET)
    payload = _payload()
    payload["orderId"] = " "

    response = await client.post(
        "/api/v1/integrations/woocommerce/access-code",
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
        json=payload,
    )

    assert response.status_code == 422
