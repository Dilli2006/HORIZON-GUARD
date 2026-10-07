"""In-process Server-Sent-Events broker with a small replay buffer."""
from __future__ import annotations

import asyncio
import json
import threading
from collections import deque
from typing import Any, AsyncIterator, Optional


class EventBroker:
    def __init__(self, replay: int = 20) -> None:
        self._subs: list[tuple[asyncio.Queue[tuple[int, dict[str, Any]]], asyncio.AbstractEventLoop]] = []
        self._buffer: deque[tuple[int, dict[str, Any]]] = deque(maxlen=replay)
        self._next_id = 1
        self._lock = threading.Lock()

    def publish(self, event: dict[str, Any]) -> None:
        """Thread-safe publish (callable from sync FastAPI endpoints running in a threadpool)."""
        with self._lock:
            item = (self._next_id, event)
            self._next_id += 1
            self._buffer.append(item)
            subs = list(self._subs)
        for q, loop in subs:
            try:
                loop.call_soon_threadsafe(q.put_nowait, item)
            except RuntimeError:  # loop closed
                pass

    async def stream(self, last_event_id: Optional[int] = None) -> AsyncIterator[str]:
        q: asyncio.Queue[tuple[int, dict[str, Any]]] = asyncio.Queue()
        loop = asyncio.get_running_loop()
        with self._lock:
            self._subs.append((q, loop))
            backlog = [it for it in self._buffer if last_event_id is not None and it[0] > last_event_id]
        try:
            yield "retry: 3000\n\n"
            for eid, ev in backlog:
                yield f"id: {eid}\ndata: {json.dumps(ev, default=str)}\n\n"
            while True:
                try:
                    eid, ev = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"id: {eid}\ndata: {json.dumps(ev, default=str)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            with self._lock:
                self._subs = [s for s in self._subs if s[0] is not q]


broker = EventBroker()
