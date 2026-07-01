from __future__ import annotations

import hashlib
from types import SimpleNamespace

from app.scripts import create_access_code


class FakeInsert:
    def __init__(self):
        self.payload = None

    def insert(self, payload):
        self.payload = payload
        return self

    def execute(self):
        return SimpleNamespace(data=[self.payload])


class FakeClient:
    def __init__(self):
        self.query = FakeInsert()

    def table(self, name: str) -> FakeInsert:
        assert name == "access_codes"
        return self.query


def test_generate_code_uses_human_readable_high_entropy_format() -> None:
    code = create_access_code.generate_code()

    groups = code.split("-")
    assert groups[0] == "TTA"
    assert len(groups) == create_access_code.CODE_GROUP_COUNT + 1
    assert all(len(group) == create_access_code.CODE_GROUP_LENGTH for group in groups[1:])


def test_create_code_stores_hash_but_not_plaintext(monkeypatch) -> None:
    plaintext = "TTA-2345-6789-ABCD-EFGH-JKLM-NPQR"
    client = FakeClient()
    monkeypatch.setattr(create_access_code, "generate_code", lambda: plaintext)
    monkeypatch.setattr(create_access_code, "get_client", lambda: client)

    result = create_access_code.create_code(
        course_id="course-2",
        order_id="ORDER-123",
        expires_at=None,
    )

    assert result == plaintext
    assert client.query.payload["code_hash"] == hashlib.sha256(
        b"TTA23456789ABCDEFGHJKLMNPQR"
    ).hexdigest()
    assert plaintext not in client.query.payload.values()
