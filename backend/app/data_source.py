from __future__ import annotations

from typing import Any

from .config import EXCEL_PATH, USE_GOOGLE_SHEETS
from .parser import parse_dataframe, parse_excel
from .sheets import fetch_sheet_dataframe


def load_dashboard_data() -> dict[str, Any]:
    if USE_GOOGLE_SHEETS:
        df, meta = fetch_sheet_dataframe()
        result = parse_dataframe(
            df,
            updated_at=meta["updated_at"],
            file_name=meta["file_name"],
            file_path=meta["file_path"],
            source=meta["source"],
        )
        result["contentHash"] = meta["content_hash"]
        result["fetchMethod"] = meta["fetch_method"]
        return result

    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Excel file not found: {EXCEL_PATH}")
    return parse_excel(EXCEL_PATH)


def source_info() -> dict[str, Any]:
    if USE_GOOGLE_SHEETS:
        from .config import GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME, GOOGLE_SHEET_URL, SHEETS_POLL_INTERVAL

        return {
            "type": "google_sheets",
            "sheetId": GOOGLE_SHEET_ID,
            "sheetName": GOOGLE_SHEET_NAME,
            "url": GOOGLE_SHEET_URL,
            "pollIntervalSec": SHEETS_POLL_INTERVAL,
        }

    return {
        "type": "excel",
        "path": str(EXCEL_PATH),
        "exists": EXCEL_PATH.exists(),
    }
