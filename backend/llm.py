"""Thin, failure-proof Gemini wrapper. Every caller must handle ``None`` with a fallback."""
from __future__ import annotations

import json
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from typing import Any, Optional

log = logging.getLogger("expenseguard.llm")
_pool = ThreadPoolExecutor(max_workers=4)
_model_cache: dict[str, Any] = {}


def available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def _model() -> Any:
    name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    if name not in _model_cache:
        import google.generativeai as genai  # imported lazily: optional dependency at runtime

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        _model_cache[name] = genai.GenerativeModel(name)
    return _model_cache[name]


def _extract_json(text: str) -> Optional[Any]:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fenced:
        text = fenced.group(1)
    start = min([i for i in (text.find("{"), text.find("[")) if i >= 0], default=-1)
    if start < 0:
        return None
    try:
        return json.loads(text[start:])
    except json.JSONDecodeError:
        end = max(text.rfind("}"), text.rfind("]"))
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            return None


def generate_json(prompt: str, timeout: float = 15.0, parts: Optional[list[Any]] = None) -> Optional[Any]:
    """Ask Gemini for JSON. Returns parsed JSON or ``None`` on any failure / no key."""
    if not available():
        return None

    def _call() -> str:
        content = [prompt, *(parts or [])]
        resp = _model().generate_content(content, generation_config={"temperature": 0.6})
        return resp.text

    try:
        text = _pool.submit(_call).result(timeout=timeout)
        return _extract_json(text)
    except FutureTimeout:
        log.warning("Gemini timed out; using fallback")
    except Exception as exc:  # network, quota, auth, safety block...
        log.warning("Gemini failed (%s); using fallback", exc)
    return None
