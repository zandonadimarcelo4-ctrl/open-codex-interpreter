"""Minimal local implementation of the LiteLLM interface used by the project.

This stub supports the ``completion`` helper with streaming semantics that
mirror the legacy chat-completions APIs relied upon by the project. It is
intentionally lightweight so deployments can run in offline or air-gapped
environments where installing the full ``litellm`` distribution is not
possible.
"""
from __future__ import annotations

import json
import os
import typing as t
import urllib.parse

import requests

DEFAULT_API_BASE = None


class LiteLLMError(RuntimeError):
    """Raised when a completion request cannot be fulfilled."""


def _normalise_base_url(api_base: str | None) -> str:
    base = api_base or os.getenv("LITELLM_API_BASE") or DEFAULT_API_BASE
    if not base:
        raise LiteLLMError(
            "Set LITELLM_API_BASE or pass api_base to point the client at your provider.",
        )
    return base.rstrip("/")


def _build_headers(api_key: str | None, extra_headers: dict[str, str] | None = None) -> dict[str, str]:
    key = api_key or os.getenv("LITELLM_API_KEY")
    if not key:
        raise LiteLLMError("An API key is required to invoke LiteLLM completions.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    return headers


def _build_payload(
    *,
    model: str,
    messages: list[dict[str, t.Any]],
    functions: list[dict[str, t.Any]] | None,
    temperature: float | None,
    **kwargs: t.Any,
) -> dict[str, t.Any]:
    payload: dict[str, t.Any] = {
        "model": model,
        "messages": messages,
    }
    if functions:
        payload["functions"] = functions
    if temperature is not None:
        payload["temperature"] = temperature

    # Forward any additional keyword arguments consumers might supply.
    for key, value in kwargs.items():
        if key in {"stream", "api_key", "api_base"}:
            continue
        payload[key] = value

    return payload


def completion(
    *,
    model: str,
    messages: list[dict[str, t.Any]],
    functions: list[dict[str, t.Any]] | None = None,
    stream: bool | None = None,
    temperature: float | None = None,
    api_key: str | None = None,
    api_base: str | None = None,
    extra_headers: dict[str, str] | None = None,
    **kwargs: t.Any,
) -> t.Union[dict[str, t.Any], t.Iterator[dict[str, t.Any]]]:
    """Send a chat completion request to the configured provider.

    The implementation mirrors the historical ``ChatCompletion.create`` contract
    relied upon by the project so existing streaming logic continues to function.
    """

    base_url = _normalise_base_url(api_base)
    url = urllib.parse.urljoin(base_url + "/", "chat/completions")
    headers = _build_headers(api_key, extra_headers)
    payload = _build_payload(
        model=model,
        messages=messages,
        functions=functions,
        temperature=temperature,
        **kwargs,
    )

    request_kwargs: dict[str, t.Any] = {"json": payload, "headers": headers, "timeout": 600}

    if stream:
        request_kwargs["stream"] = True
        response = requests.post(url, **request_kwargs)
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise LiteLLMError(str(exc)) from exc

        def _stream() -> t.Iterator[dict[str, t.Any]]:
            for raw_line in response.iter_lines(decode_unicode=True):
                if not raw_line:
                    continue
                line = raw_line.strip()
                if not line or line == "data: [DONE]":
                    continue
                if line.startswith("data:"):
                    line = line[len("data:"):].strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as exc:  # pragma: no cover - defensive
                    raise LiteLLMError(f"Failed to decode completion chunk: {line}") from exc

        return _stream()

    response = requests.post(url, **request_kwargs)
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise LiteLLMError(str(exc)) from exc

    return response.json()


__all__ = [
    "LiteLLMError",
    "completion",
]
