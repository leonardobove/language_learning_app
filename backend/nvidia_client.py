import logging
from typing import AsyncIterator
from openai import AsyncOpenAI
from backend.config import NVIDIA_API_KEY, NVIDIA_MODEL, NVIDIA_BASE_URL

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=NVIDIA_API_KEY,
            base_url=NVIDIA_BASE_URL,
        )
    return _client


async def chat_stream(messages: list[dict]) -> AsyncIterator[str]:
    """Stream chat completions from NVIDIA NIM, yielding text chunks."""
    client = get_client()
    stream = await client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=messages,
        stream=True,
        max_tokens=1024,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


async def generate_summary(prompt: str) -> str:
    """Non-streaming call for session summarisation."""
    client = get_client()
    response = await client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=False,
        max_tokens=512,
    )
    return response.choices[0].message.content or ""


async def check_health() -> bool:
    try:
        client = get_client()
        models = await client.models.list()
        return True
    except Exception:
        return False


async def list_models() -> list[str]:
    try:
        client = get_client()
        models = await client.models.list()
        return [m.id for m in models.data]
    except Exception:
        return [NVIDIA_MODEL]
