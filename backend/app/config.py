from pathlib import Path
import os
import re
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_EXCEL = PROJECT_ROOT / "data" / "projects.xlsx"

excel_env = os.getenv("EXCEL_PATH", str(DEFAULT_EXCEL))
EXCEL_PATH = Path(excel_env)
if not EXCEL_PATH.is_absolute():
    EXCEL_PATH = (BASE_DIR / EXCEL_PATH).resolve()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

DATA_SOURCE = os.getenv("DATA_SOURCE", "sheets").strip().lower()
USE_GOOGLE_SHEETS = DATA_SOURCE in {"sheets", "google_sheets", "google"}

GOOGLE_SHEET_ID = os.getenv(
    "GOOGLE_SHEET_ID",
    "1USfU_dHU0dODWiPIjItoEicBzD19gFZPkU-E-prQ3vs",
)
GOOGLE_SHEET_GID = os.getenv("GOOGLE_SHEET_GID", "581878771")
GOOGLE_SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "БКВ 2026")
GOOGLE_SHEET_URL = os.getenv(
    "GOOGLE_SHEET_URL",
    f"https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}/edit?gid={GOOGLE_SHEET_GID}",
)
GOOGLE_CREDENTIALS_PATH = Path(
    os.getenv("GOOGLE_CREDENTIALS_PATH", str(BASE_DIR / "google-credentials.json"))
)
if not GOOGLE_CREDENTIALS_PATH.is_absolute():
    GOOGLE_CREDENTIALS_PATH = (BASE_DIR / GOOGLE_CREDENTIALS_PATH).resolve()

SHEETS_POLL_INTERVAL = int(os.getenv("SHEETS_POLL_INTERVAL", "30"))

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "kazakhtelecom_dashboard")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "10080"))

DEFAULT_PERIOD_KEY = "may"
DEFAULT_YTD_KEY = "jan_may"

MONTH_KEY_OVERRIDES = {
    "январь": "january",
    "февраль": "february",
    "март": "march",
    "апрель": "april",
    "май": "may",
    "июнь": "june",
    "июль": "july",
    "август": "august",
    "сентябрь": "september",
    "октябрь": "october",
    "ноябрь": "november",
    "декабрь": "december",
    "январь-апрель": "jan_april",
    "январь-май": "jan_may",
    "1 квартал 2026": "q1_2026",
    "2 квартал 2026": "q2_2026",
    "3 квартал 2026": "q3_2026",
    "4 квартал 2026": "q4_2026",
}


def month_key(label: str) -> str:
    normalized = label.strip().lower()
    if normalized in MONTH_KEY_OVERRIDES:
        return MONTH_KEY_OVERRIDES[normalized]
    slug = re.sub(r"[^a-z0-9]+", "_", normalized)
    return slug.strip("_") or normalized
