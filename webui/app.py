"""FastAPI application offering a polished web UI for the unified agent."""
from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from dev_framework.main import UnifiedDevAgent, UnifiedDevAgentConfig, UnifiedDevAgentRunResult

app = FastAPI(title="Unified Dev Agent Studio", version="1.0")

_static_dir = Path(__file__).parent / "static"
_templates_dir = Path(__file__).parent / "templates"

app.mount("/static", StaticFiles(directory=_static_dir), name="static")
_templates = Jinja2Templates(directory=str(_templates_dir))

_agent = UnifiedDevAgent(config=UnifiedDevAgentConfig())


class PromptRequest(BaseModel):
    prompt: str


class RunResponse(BaseModel):
    prompt: str
    intention: str
    plan: list[str] | None = None
    search_result: str | None = None
    conversation_summary: str | None = None
    execution_results: list[dict[str, str | int]]
    notifications: list[dict[str, str]]

    @classmethod
    def from_result(cls, result: UnifiedDevAgentRunResult) -> "RunResponse":
        payload = result.to_dict()
        return cls(**payload)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return _templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/run", response_model=RunResponse)
async def run_agent(payload: PromptRequest) -> RunResponse:
    result = await asyncio.to_thread(_agent.run, payload.prompt)
    return RunResponse.from_result(result)


def run(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Launch the FastAPI server with Uvicorn."""
    import uvicorn

    uvicorn.run("webui.app:app", host=host, port=port, reload=False, log_level="info")


__all__ = ["app", "run"]
