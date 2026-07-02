from __future__ import annotations

import pytest

from app.services.mux_client import (
    MuxAsset,
    MuxClient,
    MuxClientError,
    MuxPlaybackId,
    format_duration_label,
    resolve_playback,
)


def test_format_duration_label_rounds_to_minutes() -> None:
    assert format_duration_label(125.0) == "2 min"
    assert format_duration_label(None) is None


def test_resolve_playback_public_access() -> None:
    asset = MuxAsset(
        id="asset-1",
        status="ready",
        passthrough="res-001",
        duration=600.0,
        playback_ids=[
            MuxPlaybackId(id="pub-id", policy="public"),
            MuxPlaybackId(id="signed-id", policy="signed"),
        ],
    )
    playback_id, signed = resolve_playback(asset, "public")
    assert playback_id == "pub-id"
    assert signed is False


def test_resolve_playback_paid_access() -> None:
    asset = MuxAsset(
        id="asset-2",
        status="ready",
        passthrough="res-009",
        duration=2520.0,
        playback_ids=[MuxPlaybackId(id="signed-id", policy="signed")],
    )
    playback_id, signed = resolve_playback(asset, "paid")
    assert playback_id == "signed-id"
    assert signed is True


def test_resolve_playback_missing_policy_raises() -> None:
    asset = MuxAsset(
        id="asset-3",
        status="ready",
        passthrough="res-001",
        duration=60.0,
        playback_ids=[MuxPlaybackId(id="signed-id", policy="signed")],
    )
    with pytest.raises(MuxClientError, match="public"):
        resolve_playback(asset, "public")


def test_create_asset_from_url_requests_signed_playback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = MuxClient(token_id="id", token_secret="secret")
    captured: dict[str, object] = {}

    def request(method: str, path: str, **kwargs: object) -> dict:
        captured.update({"method": method, "path": path, **kwargs})
        return {
            "data": {
                "id": "asset-1",
                "status": "preparing",
                "passthrough": "resource-1",
                "playback_ids": [{"id": "signed-1", "policy": "signed"}],
            }
        }

    monkeypatch.setattr(client, "_request", request)

    asset = client.create_asset_from_url(
        url="https://example.com/video.mp4",
        passthrough="resource-1",
        title="Interview Practice",
        signed=True,
    )

    assert asset.id == "asset-1"
    assert captured["method"] == "POST"
    assert captured["path"] == "/video/v1/assets"
    assert captured["json"] == {
        "inputs": [{"url": "https://example.com/video.mp4"}],
        "passthrough": "resource-1",
        "meta": {"title": "Interview Practice"},
        "playback_policies": ["signed"],
    }


def test_create_direct_upload_includes_asset_title(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = MuxClient(token_id="id", token_secret="secret")
    captured: dict[str, object] = {}

    def request(method: str, path: str, **kwargs: object) -> dict:
        captured.update({"method": method, "path": path, **kwargs})
        return {
            "data": {
                "id": "upload-1",
                "url": "https://storage.example/upload",
                "status": "waiting",
            }
        }

    monkeypatch.setattr(client, "_request", request)

    upload = client.create_direct_upload(
        passthrough="resource-1",
        title="Interview Practice",
        signed=False,
    )

    assert upload.id == "upload-1"
    assert captured["json"] == {
        "cors_origin": "http://localhost:5173",
        "new_asset_settings": {
            "passthrough": "resource-1",
            "meta": {"title": "Interview Practice"},
            "playback_policies": ["public"],
        },
    }


def test_update_and_delete_asset_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MuxClient(token_id="id", token_secret="secret")
    requests: list[tuple[str, str, dict[str, object]]] = []

    def request(method: str, path: str, **kwargs: object) -> dict:
        requests.append((method, path, kwargs))
        return {}

    monkeypatch.setattr(client, "_request", request)

    client.update_asset_title("asset-1", "Updated Title")
    client.delete_asset("asset-1")

    assert requests == [
        (
            "PATCH",
            "/video/v1/assets/asset-1",
            {"json": {"meta": {"title": "Updated Title"}}},
        ),
        ("DELETE", "/video/v1/assets/asset-1", {}),
    ]
