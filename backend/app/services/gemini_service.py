"""
Thin wrapper around the Gemini API's generateContent REST endpoint.

Uses plain httpx rather than the SDK to keep the dependency footprint small.
Requests structured JSON output directly from the model (response_mime_type),
which avoids fragile string parsing of the response.
"""

import json

import httpx

from app.core.config import settings

GEMINI_ENDPOINT_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


class GeminiError(Exception):
    pass


async def generate_json(prompt: str, timeout: float = 60.0) -> dict:
    """Send a prompt to Gemini and parse the response as JSON.

    Raises GeminiError on any failure (network, API error, or malformed JSON)
    so callers can turn it into a clean HTTP error rather than a raw 500.
    """
    if not settings.gemini_api_key:
        raise GeminiError("GEMINI_API_KEY is not configured on the backend.")

    url = GEMINI_ENDPOINT_TEMPLATE.format(model=settings.gemini_model)

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.7,
        },
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": settings.gemini_api_key,
                },
                json=payload,
            )
        except httpx.RequestError as e:
            raise GeminiError(f"Could not reach Gemini API: {e}") from e

    if response.status_code != 200:
        raise GeminiError(f"Gemini API returned {response.status_code}: {response.text[:300]}")

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise GeminiError(f"Unexpected Gemini response shape: {data}") from e

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise GeminiError(f"Gemini did not return valid JSON: {text[:300]}") from e