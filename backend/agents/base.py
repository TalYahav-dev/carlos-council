from __future__ import annotations

from pathlib import Path
from typing import AsyncGenerator

from openai import AsyncOpenAI

import config

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def _load_prompt(filename: str) -> str:
    """Load a prompt from the prompts/ directory."""
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


class BaseAgent:
    agent_id: str = ""
    name: str = ""
    prompt_file: str = ""

    def __init__(self) -> None:
        self.system_prompt = _load_prompt(self.prompt_file)
        self.client = AsyncOpenAI(
            api_key=config.API_KEY,
            base_url=config.BASE_URL,
            timeout=config.LLM_TIMEOUT,
            max_retries=config.LLM_MAX_RETRIES,
        )

    async def stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        """Stream tokens from the LLM. Yields individual tokens."""
        response = await self.client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[{"role": "system", "content": self.system_prompt}] + messages,
            stream=True,
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def complete(self, messages: list[dict]) -> str:
        """Non-streaming completion, returns full text."""
        tokens: list[str] = []
        async for token in self.stream(messages):
            tokens.append(token)
        return "".join(tokens)
