from __future__ import annotations

from urllib.error import URLError
from urllib.request import urlopen

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ServerSelectionTimeoutError

from .config import MONGODB_DB, MONGODB_URI

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def _public_ip() -> str | None:
    try:
        return urlopen("https://api.ipify.org", timeout=5).read().decode().strip()
    except (URLError, OSError, TimeoutError):
        return None


def _ssl_help_message() -> str:
    ip = _public_ip()
    ip_line = f"\n  Ваш публичный IP: {ip}" if ip else ""
    return (
        "Не удалось подключиться к MongoDB Atlas (ошибка SSL/TLS)."
        f"{ip_line}\n"
        "Скорее всего ваш IP не добавлен в whitelist Atlas:\n"
        "  1. Откройте https://cloud.mongodb.com\n"
        "  2. Network Access -> Add IP Address\n"
        "  3. Добавьте ваш IP или 0.0.0.0/0 (только для разработки)\n"
        "  4. Подождите 1-2 минуты и перезапустите backend\n"
        "Проверка: python scripts/test_mongodb.py"
    )


async def connect_db() -> None:
    global _client, _db

    if not MONGODB_URI or "<db_password>" in MONGODB_URI:
        raise RuntimeError(
            "Укажите MONGODB_URI в backend/.env — замените <db_password> на пароль MongoDB Atlas"
        )

    _client = AsyncIOMotorClient(
        MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=15000,
    )
    _db = _client[MONGODB_DB]

    try:
        await _client.admin.command("ping")
    except ServerSelectionTimeoutError as exc:
        if "SSL handshake failed" in str(exc) or "TLSV1_ALERT_INTERNAL_ERROR" in str(exc):
            raise RuntimeError(_ssl_help_message()) from exc
        raise

    await _db.users.create_index("email", unique=True)


async def close_db() -> None:
    global _client, _db
    if _client:
        _client.close()
    _client = None
    _db = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("MongoDB не подключена")
    return _db
