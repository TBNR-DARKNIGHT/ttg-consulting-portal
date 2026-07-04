from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import structlog
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings

logger = structlog.get_logger()

SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
USER_HEADERS = [
    "Clerk User ID",
    "Email",
    "First Name",
    "Last Name",
    "Signup Date",
    "Account Status",
    "Course 2 Access",
]
TTA_CODE_HEADERS = [
    "Issue Status",
    "Issue Date",
    "Issued User",
    "Access Code",
    "Redemption Status",
    "Redemption Date",
    "Redemption User ID",
    "Notes",
]


class GoogleSheetsError(RuntimeError):
    """The reporting spreadsheet could not be updated."""


@dataclass(frozen=True)
class UserSheetRow:
    clerk_user_id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    signup_date: datetime | None = None
    account_status: str = "ACTIVE"
    has_course_2_access: bool = False


def is_user_sheet_configured() -> bool:
    return bool(
        settings.google_sheets_spreadsheet_id.strip()
        and settings.google_service_account_json.strip()
    )


def _quoted_tab_name() -> str:
    return "'" + settings.google_sheets_users_tab.replace("'", "''") + "'"


def _quoted_tta_codes_tab_name() -> str:
    return "'" + settings.google_sheets_tta_codes_tab.replace("'", "''") + "'"


def _service() -> Any:
    try:
        service_account_info = json.loads(settings.google_service_account_json)
        credentials = Credentials.from_service_account_info(
            service_account_info,
            scopes=[SHEETS_SCOPE],
        )
        return build("sheets", "v4", credentials=credentials, cache_discovery=False)
    except (TypeError, ValueError, KeyError) as exc:
        raise GoogleSheetsError("Google Sheets credentials are invalid") from exc


def _read_rows(service: Any) -> list[list[Any]]:
    _ensure_tab(service, settings.google_sheets_users_tab)
    result = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{_quoted_tab_name()}!A:G",
        )
        .execute()
    )
    values = result.get("values", [])
    return values if isinstance(values, list) else []


def _ensure_tab(service: Any, tab_name: str) -> None:
    spreadsheet = (
        service.spreadsheets()
        .get(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            fields="sheets.properties.title",
        )
        .execute()
    )
    titles = {
        sheet.get("properties", {}).get("title")
        for sheet in spreadsheet.get("sheets", [])
    }
    if tab_name not in titles:
        service.spreadsheets().batchUpdate(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            body={"requests": [{"addSheet": {"properties": {"title": tab_name}}}]},
        ).execute()


def _append_tta_code_rows(codes: list[tuple[str, str]]) -> None:
    service = _service()
    _ensure_tab(service, settings.google_sheets_tta_codes_tab)
    tab = _quoted_tta_codes_tab_name()
    existing = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A:J",
        )
        .execute()
        .get("values", [])
    )
    if not existing:
        service.spreadsheets().values().update(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A1:H1",
            valueInputOption="RAW",
            body={"values": [TTA_CODE_HEADERS]},
        ).execute()
    elif existing[0] != TTA_CODE_HEADERS:
        previous_headers = existing[0]
        if previous_headers[:7] == [
            "Status",
            "Issue Status",
            "Access Code",
            "Redemption Status",
            "Redemption Date",
            "Access Code ID",
            "Notes",
        ]:
            migrated_rows = [
                [
                    row[1] if len(row) > 1 else "",
                    "",
                    "",
                    row[2] if len(row) > 2 else "",
                    row[3] if len(row) > 3 else "",
                    row[4] if len(row) > 4 else "",
                    "",
                    row[6] if len(row) > 6 else "",
                ]
                for row in existing[1:]
            ]
        elif previous_headers[:7] == [
            "Issue Status",
            "Issue Date",
            "Access Code",
            "Redemption Status",
            "Redemption Date",
            "Access Code ID",
            "Notes",
        ]:
            migrated_rows = [
                [
                    row[0] if row else "",
                    row[1] if len(row) > 1 else "",
                    "",
                    row[2] if len(row) > 2 else "",
                    row[3] if len(row) > 3 else "",
                    row[4] if len(row) > 4 else "",
                    "",
                    row[6] if len(row) > 6 else "",
                ]
                for row in existing[1:]
            ]
        elif previous_headers[:10] == [
            "Access Code",
            "Batch Label",
            "CS Status",
            "Issued To",
            "Issued By",
            "Issued At",
            "Portal Status",
            "Redeemed At",
            "Notes",
            "Access Code ID",
        ]:
            migrated_rows = [
                [
                    row[2] if len(row) > 2 else "",
                    row[5] if len(row) > 5 else "",
                    row[3] if len(row) > 3 else "",
                    row[0] if row else "",
                    row[6] if len(row) > 6 else "",
                    row[7] if len(row) > 7 else "",
                    "",
                    row[8] if len(row) > 8 else "",
                ]
                for row in existing[1:]
            ]
        else:
            raise GoogleSheetsError(
                "TTA Codes headers do not match a supported layout"
            )
        service.spreadsheets().values().update(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A1:H{len(migrated_rows) + 1}",
            valueInputOption="RAW",
            body={"values": [TTA_CODE_HEADERS, *migrated_rows]},
        ).execute()
        if len(previous_headers) > 8:
            service.spreadsheets().values().clear(
                spreadsheetId=settings.google_sheets_spreadsheet_id,
                range=f"{tab}!I:J",
                body={},
            ).execute()
    values = [
        ["AVAILABLE", "", "", plaintext, "UNREDEEMED", "", "", ""]
        for _, plaintext in codes
    ]
    if not values:
        return
    service.spreadsheets().values().append(
        spreadsheetId=settings.google_sheets_spreadsheet_id,
        range=f"{tab}!A:H",
        valueInputOption="RAW",
        insertDataOption="OVERWRITE",
        body={"values": values},
    ).execute()


def _mark_tta_code_redeemed(code: str, clerk_user_id: str) -> None:
    service = _service()
    _ensure_tab(service, settings.google_sheets_tta_codes_tab)
    tab = _quoted_tta_codes_tab_name()
    rows = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A:H",
        )
        .execute()
        .get("values", [])
    )
    if not rows or rows[0] != TTA_CODE_HEADERS:
        raise GoogleSheetsError("TTA Codes headers do not match the expected layout")

    normalized_code = "".join(code.upper().replace("-", "").split())
    row_number = next(
        (
            index
            for index, row in enumerate(rows[1:], start=2)
            if len(row) > 3
            and "".join(str(row[3]).upper().replace("-", "").split()) == normalized_code
        ),
        None,
    )
    if row_number is None:
        raise GoogleSheetsError("Redeemed TTA code was not found in Google Sheets")

    service.spreadsheets().values().update(
        spreadsheetId=settings.google_sheets_spreadsheet_id,
        range=f"{tab}!E{row_number}:G{row_number}",
        valueInputOption="RAW",
        body={
            "values": [[
                "REDEEMED",
                datetime.now().astimezone().isoformat(),
                clerk_user_id,
            ]]
        },
    ).execute()


def _write_user_row(row: UserSheetRow) -> None:
    service = _service()
    _ensure_tab(service, settings.google_sheets_users_tab)
    rows = _read_rows(service)
    tab = _quoted_tab_name()

    if not rows:
        service.spreadsheets().values().update(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A1:G1",
            valueInputOption="RAW",
            body={"values": [USER_HEADERS]},
        ).execute()
        rows = [USER_HEADERS]

    existing_row_number = next(
        (
            index
            for index, values in enumerate(rows[1:], start=2)
            if values and str(values[0]) == row.clerk_user_id
        ),
        None,
    )
    existing = rows[existing_row_number - 1] if existing_row_number is not None else []
    existing_signup_date = existing[4] if len(existing) > 4 else ""
    signup_date = (
        row.signup_date.isoformat()
        if row.signup_date is not None
        else existing_signup_date
    )
    values = [[
        row.clerk_user_id,
        row.email,
        row.first_name or "",
        row.last_name or "",
        signup_date,
        row.account_status,
        "ACTIVE" if row.has_course_2_access else "NOT ACTIVE",
    ]]

    if existing_row_number is None:
        service.spreadsheets().values().append(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A:G",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": values},
        ).execute()
    else:
        service.spreadsheets().values().update(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A{existing_row_number}:G{existing_row_number}",
            valueInputOption="RAW",
            body={"values": values},
        ).execute()


def _mark_user_deleted(clerk_user_id: str) -> None:
    service = _service()
    _ensure_tab(service, settings.google_sheets_users_tab)
    rows = _read_rows(service)
    tab = _quoted_tab_name()

    if not rows:
        service.spreadsheets().values().update(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A1:G1",
            valueInputOption="RAW",
            body={"values": [USER_HEADERS]},
        ).execute()
        rows = [USER_HEADERS]

    existing_row_number = next(
        (
            index
            for index, values in enumerate(rows[1:], start=2)
            if values and str(values[0]) == clerk_user_id
        ),
        None,
    )
    if existing_row_number is None:
        service.spreadsheets().values().append(
            spreadsheetId=settings.google_sheets_spreadsheet_id,
            range=f"{tab}!A:G",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={
                "values": [[
                    clerk_user_id,
                    "",
                    "",
                    "",
                    "",
                    "DELETED",
                    "NOT ACTIVE",
                ]]
            },
        ).execute()
        return

    # Update only Account Status so the historical profile and course-access
    # values remain visible in the reporting sheet.
    service.spreadsheets().values().update(
        spreadsheetId=settings.google_sheets_spreadsheet_id,
        range=f"{tab}!F{existing_row_number}",
        valueInputOption="RAW",
        body={"values": [["DELETED"]]},
    ).execute()


async def upsert_user_row(row: UserSheetRow) -> None:
    if not is_user_sheet_configured():
        logger.info("Google Sheets user sync skipped because it is not configured")
        return
    try:
        await asyncio.to_thread(_write_user_row, row)
    except GoogleSheetsError:
        raise
    except HttpError as exc:
        logger.exception("Google Sheets API rejected user sync", clerk_user_id=row.clerk_user_id)
        raise GoogleSheetsError("Google Sheets rejected the user update") from exc
    except Exception as exc:
        logger.exception("Google Sheets user sync failed", clerk_user_id=row.clerk_user_id)
        raise GoogleSheetsError("Unable to update the user spreadsheet") from exc


async def mark_user_deleted(clerk_user_id: str) -> None:
    if not is_user_sheet_configured():
        logger.info("Google Sheets user sync skipped because it is not configured")
        return
    try:
        await asyncio.to_thread(_mark_user_deleted, clerk_user_id)
    except GoogleSheetsError:
        raise
    except HttpError as exc:
        logger.exception(
            "Google Sheets API rejected user deletion sync",
            clerk_user_id=clerk_user_id,
        )
        raise GoogleSheetsError("Google Sheets rejected the user deletion update") from exc
    except Exception as exc:
        logger.exception("Google Sheets user deletion sync failed", clerk_user_id=clerk_user_id)
        raise GoogleSheetsError("Unable to update the user spreadsheet") from exc


async def append_tta_code_rows(
    codes: list[tuple[str, str]],
) -> None:
    if not is_user_sheet_configured():
        raise GoogleSheetsError("Google Sheets is not configured")
    try:
        await asyncio.to_thread(_append_tta_code_rows, codes)
    except GoogleSheetsError:
        raise
    except HttpError as exc:
        logger.exception("Google Sheets API rejected TTA code export")
        raise GoogleSheetsError("Google Sheets rejected the TTA code export") from exc
    except Exception as exc:
        logger.exception("Google Sheets TTA code export failed")
        raise GoogleSheetsError("Unable to export TTA codes") from exc


async def mark_tta_code_redeemed(code: str, clerk_user_id: str) -> None:
    if not is_user_sheet_configured():
        raise GoogleSheetsError("Google Sheets is not configured")
    try:
        await asyncio.to_thread(_mark_tta_code_redeemed, code, clerk_user_id)
    except GoogleSheetsError:
        raise
    except HttpError as exc:
        logger.exception("Google Sheets API rejected TTA code redemption update")
        raise GoogleSheetsError(
            "Google Sheets rejected the TTA code redemption update"
        ) from exc
    except Exception as exc:
        logger.exception("Google Sheets TTA code redemption update failed")
        raise GoogleSheetsError("Unable to update the redeemed TTA code") from exc
