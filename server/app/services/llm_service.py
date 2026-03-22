"""
LLM Service - Unified interface for Ollama, OpenAI, Anthropic, and Groq
Handles model listing and streaming chat completions
"""
import httpx
import json
from typing import AsyncGenerator
from app.config import settings

# Model registry
MODELS = [
    # Ollama (local)
    {"id": "llama3.2", "name": "Llama 3.2 (3B)", "provider": "ollama", "description": "Meta's compact model"},
    {"id": "llama3.2:1b", "name": "Llama 3.2 (1B)", "provider": "ollama", "description": "Smallest Llama, very fast"},
    {"id": "mistral", "name": "Mistral 7B", "provider": "ollama", "description": "Efficient and capable"},
    {"id": "gemma2:2b", "name": "Gemma 2 (2B)", "provider": "ollama", "description": "Google's lightweight model"},
    {"id": "qwen2.5:3b", "name": "Qwen 2.5 (3B)", "provider": "ollama", "description": "Alibaba's multilingual model"},
    {"id": "phi3:mini", "name": "Phi-3 Mini", "provider": "ollama", "description": "Microsoft's compact model"},
    {"id": "deepseek-r1:1.5b", "name": "DeepSeek R1 (1.5B)", "provider": "ollama", "description": "DeepSeek reasoning model"},
    # Groq (cloud - free)
    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "provider": "groq", "description": "Meta's powerful 70B model via Groq"},
    {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B", "provider": "groq", "description": "Fast and capable 8B model"},
    {"id": "gemma2-9b-it", "name": "Gemma 2 9B", "provider": "groq", "description": "Google's 9B model via Groq"},
    {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "provider": "groq", "description": "Mistral's mixture-of-experts model"},
    # OpenAI (cloud)
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "description": "OpenAI's flagship model"},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai", "description": "Fast and affordable"},
    # Anthropic (cloud)
    {"id": "claude-sonnet-4-5-20250514", "name": "Claude Sonnet 4.5", "provider": "anthropic", "description": "Balanced model"},
    {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "provider": "anthropic", "description": "Fast and efficient"},
]


class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.groq_key = settings.GROQ_API_KEY

    async def get_available_models(self) -> list:
        """Return models with availability status"""
        models = []
        for model in MODELS:
            m = {**model}
            if model["provider"] == "ollama":
                m["available"] = await self._check_ollama_model(model["id"])
            elif model["provider"] == "openai":
                m["available"] = bool(self.openai_key)
            elif model["provider"] == "anthropic":
                m["available"] = bool(self.anthropic_key)
            elif model["provider"] == "groq":
                m["available"] = bool(self.groq_key)
            models.append(m)
        return models

    async def _check_ollama_model(self, model_id: str) -> bool:
        """Check if an Ollama model is installed locally"""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.ollama_url}/api/tags", timeout=3.0
                )
                if resp.status_code == 200:
                    installed = [m["name"].split(":")[0] for m in resp.json().get("models", [])]
                    base_name = model_id.split(":")[0]
                    return base_name in installed
        except Exception:
            pass
        return False

    async def stream_chat(
        self, model_id: str, messages: list
    ) -> AsyncGenerator[str, None]:
        """Route to the correct provider and stream response"""
        provider = self._get_provider(model_id)

        if provider == "ollama":
            async for chunk in self._stream_ollama(model_id, messages):
                yield chunk
        elif provider == "openai":
            async for chunk in self._stream_openai(model_id, messages):
                yield chunk
        elif provider == "anthropic":
            async for chunk in self._stream_anthropic(model_id, messages):
                yield chunk
        elif provider == "groq":
            async for chunk in self._stream_groq(model_id, messages):
                yield chunk
        else:
            yield f"Error: Unknown model '{model_id}'"

    def _get_provider(self, model_id: str) -> str:
        for model in MODELS:
            if model["id"] == model_id:
                return model["provider"]
        return "ollama"  # Default to Ollama

    # --- Ollama -----------------------------------------------

    async def _stream_ollama(
        self, model_id: str, messages: list
    ) -> AsyncGenerator[str, None]:
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/chat",
                    json={"model": model_id, "messages": messages, "stream": True},
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError:
            yield "Error: Cannot connect to Ollama. Make sure it's running with `ollama serve`."
        except Exception as e:
            yield f"Error: {str(e)}"

    # --- OpenAI -----------------------------------------------

    async def _stream_openai(
        self, model_id: str, messages: list
    ) -> AsyncGenerator[str, None]:
        if not self.openai_key:
            yield "Error: OpenAI API key not configured. Set OPENAI_API_KEY in your .env file."
            return

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_id,
                        "messages": messages,
                        "stream": True,
                    },
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                content = (
                                    data.get("choices", [{}])[0]
                                    .get("delta", {})
                                    .get("content", "")
                                )
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"Error: {str(e)}"

    # --- Anthropic --------------------------------------------

    async def _stream_anthropic(
        self, model_id: str, messages: list
    ) -> AsyncGenerator[str, None]:
        if not self.anthropic_key:
            yield "Error: Anthropic API key not configured. Set ANTHROPIC_API_KEY in your .env file."
            return

        # Convert messages format (Anthropic uses a different schema)
        anthropic_messages = []
        for msg in messages:
            if msg["role"] in ("user", "assistant"):
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_id,
                        "max_tokens": 4096,
                        "messages": anthropic_messages,
                        "stream": True,
                    },
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                if data.get("type") == "content_block_delta":
                                    content = data.get("delta", {}).get("text", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"Error: {str(e)}"

    # --- Groq -------------------------------------------------

    async def _stream_groq(
        self, model_id: str, messages: list
    ) -> AsyncGenerator[str, None]:
        if not self.groq_key:
            yield "Error: Groq API key not configured. Set GROQ_API_KEY in your .env file."
            return

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_id,
                        "messages": messages,
                        "stream": True,
                    },
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                content = (
                                    data.get("choices", [{}])[0]
                                    .get("delta", {})
                                    .get("content", "")
                                )
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"Error: {str(e)}"