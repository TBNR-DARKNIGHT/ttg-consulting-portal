from __future__ import annotations

import socket

import httpx
import pytest

from app.services.external_files import (
    ExternalFileError,
    download_pdf,
    normalize_google_drive_url,
    validate_public_https_url,
)


def test_normalize_google_drive_share_link() -> None:
    result = normalize_google_drive_url(
        "https://drive.google.com/file/d/file_123/view?usp=sharing"
    )

    assert result.startswith("https://drive.usercontent.google.com/download?")
    assert "id=file_123" in result


def test_validate_public_url_rejects_private_address(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443))
        ],
    )

    with pytest.raises(ExternalFileError, match="Private or local"):
        validate_public_https_url("https://example.test/file.pdf")


def _public_dns(
    _host: str, _port: int, *_args: object, **_kwargs: object
) -> list[tuple[object, object, object, str, tuple[str, int]]]:
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]


def test_validate_public_url_rejects_http() -> None:
    with pytest.raises(ExternalFileError, match="public HTTPS"):
        validate_public_https_url("http://example.com/file.pdf")


def test_download_pdf_accepts_pdf_and_filename(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(socket, "getaddrinfo", _public_dns)
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(
            200,
            headers={"content-disposition": 'attachment; filename="guide.pdf"'},
            content=b"%PDF-1.7 test",
        )
    )
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    result = download_pdf("https://example.com/download")

    assert result.filename == "guide.pdf"
    assert result.content == b"%PDF-1.7 test"


def test_download_pdf_rejects_html_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(socket, "getaddrinfo", _public_dns)
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(200, content=b"<html>Sign in</html>")
    )
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    with pytest.raises(ExternalFileError, match="did not return a PDF"):
        download_pdf("https://example.com/drive-login")


def test_download_pdf_revalidates_redirect_target(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def dns(host: str, *_args: object, **_kwargs: object) -> list[tuple]:
        address = "127.0.0.1" if host == "internal.test" else "93.184.216.34"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))]

    monkeypatch.setattr(socket, "getaddrinfo", dns)
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(
            302, headers={"location": "https://internal.test/secret.pdf"}
        )
    )
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    with pytest.raises(ExternalFileError, match="Private or local"):
        download_pdf("https://example.com/redirect")
