from __future__ import annotations

import concurrent.futures
import hashlib
import io
import time
from datetime import datetime, timezone
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

import pandas as pd

from .config import (
    GOOGLE_CREDENTIALS_PATH,
    GOOGLE_SHEET_GID,
    GOOGLE_SHEET_ID,
    GOOGLE_SHEET_NAME,
    GOOGLE_SHEET_URL,
)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
_FETCH_TIMEOUT_SEC = 45


def _cache_bust() -> int:
    return int(time.time() * 1000)


def sheet_export_url() -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}/export"
        f"?format=xlsx&gid={GOOGLE_SHEET_GID}&t={_cache_bust()}"
    )


def _fetch_via_export() -> bytes:
    request = Request(
        sheet_export_url(),
        headers={
            "User-Agent": "kazakhtelecom-dashboard/1.0",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )
    with urlopen(request, timeout=60) as response:
        return response.read()


def _fetch_via_api() -> tuple[list[list[str]], str]:
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_fetch_via_api_inner)
        try:
            return future.result(timeout=_FETCH_TIMEOUT_SEC)
        except concurrent.futures.TimeoutError as exc:
            raise TimeoutError("Google Sheets API не ответил вовремя") from exc


def _fetch_via_api_inner() -> tuple[list[list[str]], str]:
    import gspread
    from google.oauth2.service_account import Credentials

    if not GOOGLE_CREDENTIALS_PATH.exists():
        raise FileNotFoundError(
            f"Файл credentials не найден: {GOOGLE_CREDENTIALS_PATH}. "
            "Скачайте JSON-ключ сервисного аккаунта Google Cloud."
        )

    creds = Credentials.from_service_account_file(str(GOOGLE_CREDENTIALS_PATH), scopes=SCOPES)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)

    try:
        worksheet = spreadsheet.get_worksheet_by_id(int(GOOGLE_SHEET_GID))
    except gspread.WorksheetNotFound as exc:
        raise RuntimeError(
            f"Лист с gid={GOOGLE_SHEET_GID} не найден в таблице {GOOGLE_SHEET_ID}"
        ) from exc

    values = worksheet.get_all_values()
    revision = _content_hash_from_rows(values)
    return values, revision


def _values_to_dataframe(values: list[list[str]]) -> pd.DataFrame:
    if not values:
        raise ValueError("Google Sheet пуст")

    width = max(len(row) for row in values)
    padded = [row + [""] * (width - len(row)) for row in values]
    return pd.DataFrame(padded)


def _dataframe_from_bytes(payload: bytes) -> pd.DataFrame:
    return pd.read_excel(io.BytesIO(payload), header=None)


def _content_hash_from_rows(values: list[list[str]]) -> str:
    normalized = "\n".join("\t".join(row) for row in values)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _content_hash_from_dataframe(df: pd.DataFrame) -> str:
    return hashlib.sha256(
        df.fillna("").astype(str).to_csv(index=False).encode("utf-8")
    ).hexdigest()


def _fetch_export_dataframe() -> tuple[pd.DataFrame, str]:
    payload = _fetch_via_export()
    df = _dataframe_from_bytes(payload)
    if len(df) < 10:
        raise ValueError("Экспорт Google Sheet вернул слишком мало строк")
    return df, _content_hash_from_dataframe(df)


def fetch_sheet_revision() -> str:
    if GOOGLE_CREDENTIALS_PATH.exists():
        _, revision = _fetch_via_api()
        return revision

    _, revision = _fetch_export_dataframe()
    return revision


def fetch_sheet_dataframe() -> tuple[pd.DataFrame, dict[str, Any]]:
    updated_at = datetime.now(timezone.utc).isoformat()

    if GOOGLE_CREDENTIALS_PATH.exists():
        values, revision = _fetch_via_api()
        df = _values_to_dataframe(values)
        method = "api"
    else:
        try:
            df, revision = _fetch_export_dataframe()
            method = "export"
        except URLError as exc:
            raise RuntimeError(
                "Не удалось скачать Google Sheet. Сделайте таблицу доступной "
                "по ссылке (Читатель) или положите google-credentials.json в backend/."
            ) from exc

    meta = {
        "updated_at": updated_at,
        "file_name": GOOGLE_SHEET_NAME,
        "file_path": GOOGLE_SHEET_URL,
        "source": "google_sheets",
        "content_hash": revision,
        "fetch_method": method,
    }
    return df, meta


def fetch_sheet_hash() -> str:
    return fetch_sheet_revision()
