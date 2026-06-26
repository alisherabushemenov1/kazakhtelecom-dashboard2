from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Callable

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class ExcelChangeHandler(FileSystemEventHandler):
    def __init__(self, excel_path: Path, on_change: Callable[[], None]) -> None:
        self.excel_path = excel_path.resolve()
        self.on_change = on_change

    def _matches(self, path: str) -> bool:
        try:
            return Path(path).resolve() == self.excel_path
        except OSError:
            return False

    def on_modified(self, event) -> None:
        if not event.is_directory and self._matches(event.src_path):
            self.on_change()

    def on_created(self, event) -> None:
        if not event.is_directory and self._matches(event.src_path):
            self.on_change()


class ExcelWatcher:
    def __init__(self, excel_path: Path) -> None:
        self.excel_path = excel_path
        self._observer: Observer | None = None
        self._subscribers: set[asyncio.Queue] = set()
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
        queue.put_nowait({"event": "excel_updated"})

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        watch_dir = self.excel_path.parent
        watch_dir.mkdir(parents=True, exist_ok=True)

        handler = ExcelChangeHandler(self.excel_path, self._notify)
        self._observer = Observer()
        self._observer.schedule(handler, str(watch_dir), recursive=False)
        self._observer.start()

    def stop(self) -> None:
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=3)
            self._observer = None
