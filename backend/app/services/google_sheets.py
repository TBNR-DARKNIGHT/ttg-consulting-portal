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


def _write_user_row(row: UserSheetRow) -> None:
    service = _service()
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
