from __future__ import annotations

import asyncio
from typing import Callable

from .sheets import fetch_sheet_dataframe


class SheetsPoller:
    def __init__(
        self,
        interval_sec: int,
        on_refresh: Callable[[], dict] | None = None,
    ) -> None:
        self.interval_sec = interval_sec
        self.on_refresh = on_refresh
        self._subscribers: set[asyncio.Queue] = set()
        self._task: asyncio.Task | None = None
        self._last_revision: str | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=8)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self._subscribers.discard(queue)

    def _notify(self) -> None:
        if not self._loop:
            return
        for queue in list(self._subscribers):
            self._loop.call_soon_threadsafe(self._put_nowait, queue)

    @staticmethod
    def _put_nowait(queue: asyncio.Queue) -> None:
        if queue.full():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        queue.put_nowait({"event": "data_updated"})

    async def _poll_loop(self) -> None:
        while True:
            try:
                prev_hash = self._last_revision
                data = await asyncio.to_thread(self._refresh)
                new_hash = data.get("contentHash") if data else None
                if prev_hash and new_hash and prev_hash != new_hash:
                    print(f"Google Sheets: новые данные ({new_hash[:8]}...)")
                    self._notify()
                self._last_revision = new_hash
            except Exception as exc:
                print(f"Sheets poll error: {exc}")
            await asyncio.sleep(self.interval_sec)

    def _refresh(self) -> dict:
        if not self.on_refresh:
            return {}
        return self.on_refresh()

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        self._task = asyncio.create_task(self._poll_loop())

    def stop(self) -> None:
        if self._task:
            self._task.cancel()
            self._task = None
