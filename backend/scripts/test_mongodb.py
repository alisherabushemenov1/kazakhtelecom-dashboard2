"""Quick MongoDB Atlas connectivity check. Run: python scripts/test_mongodb.py"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from app.config import MONGODB_URI  # noqa: E402


async def main() -> int:
    if not MONGODB_URI:
        print("MONGODB_URI не задан в backend/.env")
        return 1

    host = MONGODB_URI.split("@")[-1].split("/")[0]
    print(f"Кластер: {host}")

    try:
        import urllib.request

        ip = urllib.request.urlopen("https://api.ipify.org", timeout=5).read().decode()
        print(f"Ваш публичный IP: {ip}")
        print("Добавьте его в Atlas: Network Access -> Add IP Address")
    except OSError:
        pass

    client = AsyncIOMotorClient(
        MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000,
    )
    try:
        await client.admin.command("ping")
        print("Подключение OK")
        return 0
    except Exception as exc:
        print(f"Ошибка: {exc}")
        if "TLSV1_ALERT_INTERNAL_ERROR" in str(exc) or "SSL handshake failed" in str(exc):
            print(
                "\nЧаще всего это IP не в whitelist Atlas.\n"
                "Atlas: Network Access -> Add IP Address -> ваш IP или 0.0.0.0/0 (только для разработки)"
            )
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
