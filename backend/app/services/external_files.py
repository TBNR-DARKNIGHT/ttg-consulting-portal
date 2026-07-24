from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse

import httpx

MAX_DOCUMENT_BYTES = 50 * 1024 * 1024
MAX_REDIRECTS = 5


class ExternalFileError(Exception):
    pass


@dataclass(frozen=True)
class DownloadedFile:
    content: bytes
    filename: str


def normalize_google_drive_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.hostname not in {"drive.google.com", "docs.google.com"}:
        return url

    parts = [part for part in parsed.path.split("/") if part]
    file_id: str | None = None
    if "d" in parts:
        index = parts.index("d")
        if index + 1 < len(parts):
            file_id = parts[index + 1]
    if not file_id:
        file_id = (parse_qs(parsed.query).get("id") or [None])[0]
    if not file_id:
        return url
    return urlunparse(
        (
            "https",
            "drive.usercontent.google.com",
            "/download",
            "",
            urlencode({"id": file_id, "export": "download", "confirm": "t"}),
            "",
        )
    )


def validate_public_https_url(url: str) -> str:
    normalized = normalize_google_drive_url(url)
    parsed = urlparse(normalized)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ExternalFileError("The file link must be a public HTTPS URL")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443)}
    except socket.gaierror as exc:
        raise ExternalFileError("The file link host could not be resolved") from exc
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if not ip.is_global:
            raise ExternalFileError("Private or local file links are not allowed")
    return normalized


def _filename(response: httpx.Response, url: str) -> str:
    disposition = response.headers.get("content-disposition", "")
    for part in disposition.split(";"):
        key, separator, value = part.strip().partition("=")
        if separator and key.lower() == "filename":
            return Path(value.strip(" \"'")).name
    return Path(urlparse(url).path).name or "linked-resource.pdf"


def download_pdf(url: str) -> DownloadedFile:
    current = validate_public_https_url(url)
    with httpx.Client(timeout=httpx.Timeout(30, read=120), follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            with client.stream("GET", current) as response:
                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location:
                        raise ExternalFileError("The file link returned an invalid redirect")
                    current = validate_public_https_url(urljoin(current, location))
                    continue
                if response.status_code >= 400:
                    raise ExternalFileError(
                        f"The file provider returned HTTP {response.status_code}"
                    )
                declared = int(response.headers.get("content-length") or 0)
                if declared > MAX_DOCUMENT_BYTES:
                    raise ExternalFileError("Linked PDFs must be 50 MB or smaller")
                chunks: list[bytes] = []
                size = 0
                for chunk in response.iter_bytes():
                    size += len(chunk)
                    if size > MAX_DOCUMENT_BYTES:
                        raise ExternalFileError("Linked PDFs must be 50 MB or smaller")
                    chunks.append(chunk)
                content = b"".join(chunks)
                if not content.startswith(b"%PDF-"):
                    raise ExternalFileError(
                        "The link did not return a PDF. "
                        "Ensure sharing is set to anyone with the link."
                    )
                filename = _filename(response, current)
                if not filename.lower().endswith(".pdf"):
                    filename = f"{Path(filename).stem or 'linked-resource'}.pdf"
                return DownloadedFile(content=content, filename=filename)
    raise ExternalFileError("The file link redirected too many times")
