from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

MUX_API_BASE = "https://api.mux.com"


@dataclass(frozen=True)
class MuxPlaybackId:
    id: str
    policy: str


@dataclass(frozen=True)
class MuxAsset:
    id: str
    status: str
    passthrough: str
    duration: float | None
    playback_ids: list[MuxPlaybackId]


@dataclass(frozen=True)
class MuxDirectUpload:
    id: str
    url: str
    status: str
    asset_id: str | None


class MuxClientError(Exception):
    pass


def _parse_asset(raw: dict[str, Any]) -> MuxAsset:
    playback_ids: list[MuxPlaybackId] = []
    for item in raw.get("playback_ids") or []:
        if not isinstance(item, dict):
            continue
        pid = str(item.get("id") or "").strip()
        policy = str(item.get("policy") or "").strip().lower()
        if pid and policy:
            playback_ids.append(MuxPlaybackId(id=pid, policy=policy))

    duration_raw = raw.get("duration")
    duration = float(duration_raw) if duration_raw is not None else None

    return MuxAsset(
        id=str(raw.get("id") or "").strip(),
        status=str(raw.get("status") or "").strip().lower(),
        passthrough=str(raw.get("passthrough") or "").strip(),
        duration=duration,
        playback_ids=playback_ids,
    )


def format_duration_label(seconds: float | None) -> str | None:
    if seconds is None or seconds <= 0:
        return None
    minutes = max(1, int(round(seconds / 60)))
    return f"{minutes} min"


def resolve_playback(asset: MuxAsset, access: str) -> tuple[str, bool]:
    """
    Pick playback ID from asset policies based on catalog access tier.

    public access → public policy; paid access → signed policy.
    """
    want_policy = "public" if access == "public" else "signed"
    for playback in asset.playback_ids:
        if playback.policy == want_policy:
            return playback.id, want_policy == "signed"

    policies = ", ".join(p.policy for p in asset.playback_ids) or "(none)"
    raise MuxClientError(
        f"Asset {asset.id} has no {want_policy!r} playback policy (found: {policies})"
    )


class MuxClient:
    def __init__(
        self,
        *,
        token_id: str | None = None,
        token_secret: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self._token_id = (token_id if token_id is not None else settings.mux_token_id).strip()
        self._token_secret = (
            token_secret if token_secret is not None else settings.mux_token_secret
        ).strip()
        self._timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self._token_id and self._token_secret)

    def _auth(self) -> tuple[str, str]:
        if not self.is_configured:
            raise MuxClientError("MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set")
        return self._token_id, self._token_secret

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{MUX_API_BASE}{path}"
        with httpx.Client(timeout=self._timeout) as client:
            response = client.request(
                method,
                url,
                params=params,
                json=json,
                auth=self._auth(),
            )
        if response.status_code >= 400:
            raise MuxClientError(
                f"Mux API {method} {path} failed ({response.status_code}): {response.text}"
            )
        if response.status_code == 204 or not response.content:
            return {}
        return response.json()

    def get_asset(self, asset_id: str) -> MuxAsset:
        payload = self._request("GET", f"/video/v1/assets/{asset_id}")
        data = payload.get("data")
        if not isinstance(data, dict):
            raise MuxClientError(f"Unexpected Mux asset response for {asset_id}")
        return _parse_asset(data)

    def list_assets_page(self, *, page: int = 1, limit: int = 100) -> list[MuxAsset]:
        payload = self._request(
            "GET",
            "/video/v1/assets",
            params={"page": page, "limit": limit},
        )
        data = payload.get("data")
        if not isinstance(data, list):
            raise MuxClientError("Unexpected Mux list assets response")
        return [_parse_asset(item) for item in data if isinstance(item, dict)]

    def list_all_assets(self, *, limit: int = 100) -> list[MuxAsset]:
        assets: list[MuxAsset] = []
        page = 1
        while True:
            batch = self.list_assets_page(page=page, limit=limit)
            if not batch:
                break
            assets.extend(batch)
            if len(batch) < limit:
                break
            page += 1
        return assets

    def create_direct_upload(
        self, *, passthrough: str, title: str, signed: bool
    ) -> MuxDirectUpload:
        payload = self._request(
            "POST",
            "/video/v1/uploads",
            json={
                "cors_origin": settings.frontend_url,
                "new_asset_settings": {
                    "passthrough": passthrough,
                    "meta": {"title": title},
                    "playback_policies": ["signed" if signed else "public"],
                },
            },
        )
        return self._parse_direct_upload(payload)

    def create_asset_from_url(
        self, *, url: str, passthrough: str, title: str, signed: bool
    ) -> MuxAsset:
        payload = self._request(
            "POST",
            "/video/v1/assets",
            json={
                "inputs": [{"url": url}],
                "passthrough": passthrough,
                "meta": {"title": title},
                "playback_policies": ["signed" if signed else "public"],
            },
        )
        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            raise MuxClientError("Unexpected Mux asset response")
        return _parse_asset(data)

    def get_direct_upload(self, upload_id: str) -> MuxDirectUpload:
        payload = self._request("GET", f"/video/v1/uploads/{upload_id}")
        return self._parse_direct_upload(payload)

    def update_asset_title(self, asset_id: str, title: str) -> None:
        self._request(
            "PATCH",
            f"/video/v1/assets/{asset_id}",
            json={"meta": {"title": title}},
        )

    def delete_asset(self, asset_id: str) -> None:
        self._request("DELETE", f"/video/v1/assets/{asset_id}")

    @staticmethod
    def _parse_direct_upload(payload: Any) -> MuxDirectUpload:
        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            raise MuxClientError("Unexpected Mux direct upload response")
        return MuxDirectUpload(
            id=str(data.get("id") or ""),
            url=str(data.get("url") or ""),
            status=str(data.get("status") or "").lower(),
            asset_id=str(data["asset_id"]) if data.get("asset_id") else None,
        )
