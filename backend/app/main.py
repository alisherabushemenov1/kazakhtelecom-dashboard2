from __future__ import annotations

import asyncio
import threading
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt

from .auth import get_current_user
from .config import EXCEL_PATH, HOST, JWT_SECRET, PORT, SHEETS_POLL_INTERVAL, USE_GOOGLE_SHEETS
from .data_source import load_dashboard_data, source_info
from .database import close_db, connect_db
from .poller import SheetsPoller
from .routes.auth import router as auth_router
from .watcher import ExcelWatcher

_cache: dict[str, Any] | None = None
_load_lock = threading.Lock()
_excel_watcher = ExcelWatcher(EXCEL_PATH)


def load_data() -> dict[str, Any]:
    global _cache
    with _load_lock:
        prev_hash = _cache.get("contentHash") if _cache else None
        _cache = load_dashboard_data()
        new_hash = _cache.get("contentHash")
        if prev_hash and new_hash and prev_hash != new_hash:
            print(f"Google Sheets: новые данные ({new_hash[:8]}...)")
        return _cache


_sheets_poller = SheetsPoller(SHEETS_POLL_INTERVAL, on_refresh=load_data)


def get_data() -> dict[str, Any]:
    if _cache is None:
        raise HTTPException(
            status_code=503,
            detail="Данные ещё загружаются из Google Sheets. Подождите несколько секунд.",
        )
    return _cache


async def _background_load() -> None:
    try:
        await asyncio.to_thread(load_data)
        print(f"Данные загружены: {_cache.get('fileName') if _cache else '?'}")
    except Exception as exc:
        print(f"Ошибка загрузки данных: {exc}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print("MongoDB подключена")
    loop = asyncio.get_running_loop()
    if USE_GOOGLE_SHEETS:
        _sheets_poller.start(loop)
        asyncio.create_task(_background_load())
        print(f"Google Sheets polling каждые {SHEETS_POLL_INTERVAL} сек")
    else:
        await asyncio.to_thread(load_data)
        print(f"Данные загружены: {_cache.get('fileName') if _cache else '?'}")
        _excel_watcher.start(loop)
        print(f"Excel watcher: {EXCEL_PATH}")
    yield
    if USE_GOOGLE_SHEETS:
        _sheets_poller.stop()
    else:
        _excel_watcher.stop()
    await close_db()

app = FastAPI(title="Kazakhtelecom Project Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": "mongodb",
        "dataReady": _cache is not None,
        **source_info(),
    }


@app.get("/api/dashboard")
def dashboard(response: Response, _user=Depends(get_current_user)):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    return get_data()


@app.get("/api/dashboard/sync")
def dashboard_sync(response: Response, _user=Depends(get_current_user)):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    data = get_data()
    return {
        "contentHash": data.get("contentHash"),
        "updatedAt": data.get("updatedAt"),
        "fetchMethod": data.get("fetchMethod"),
        "planBkv2026": data.get("kpis", {}).get("planBkv2026"),
        "totalProjects": data.get("kpis", {}).get("totalProjects"),
    }


@app.post("/api/reload")
def reload_data(_user=Depends(get_current_user)):
    return load_data()


async def _authenticate_ws(websocket: WebSocket) -> bool:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return False
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("sub"):
            await websocket.close(code=4401)
            return False
    except JWTError:
        await websocket.close(code=4401)
        return False
    return True


def _refresh_subscribers() -> asyncio.Queue:
    if USE_GOOGLE_SHEETS:
        return _sheets_poller.subscribe()
    return _excel_watcher.subscribe()


def _unsubscribe(queue: asyncio.Queue) -> None:
    if USE_GOOGLE_SHEETS:
        _sheets_poller.unsubscribe(queue)
    else:
        _excel_watcher.unsubscribe(queue)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if not await _authenticate_ws(websocket):
        return

    await websocket.accept()
    queue = _refresh_subscribers()
    try:
        await websocket.send_json({"event": "connected"})
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"event": "ping"})
                continue

            if message.get("event") in {"excel_updated", "data_updated"}:
                await websocket.send_json({"event": "data_updated"})
    except WebSocketDisconnect:
        pass
    finally:
        _unsubscribe(queue)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
