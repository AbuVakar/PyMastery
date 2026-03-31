import asyncio
import os

from google import genai
from google.genai import types


async def main():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("FAILED: GEMINI_API_KEY is not set")
        return

    client = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(max_output_tokens=300, temperature=0.7)
    try:
        if hasattr(client, "aio"):
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents="What is Python? Answer in 3 sentences.",
                config=config,
            )
        else:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents="What is Python? Answer in 3 sentences.",
                config=config,
            )
        print("SUCCESS:", response.text[:500])
    except Exception as error:
        print("FAILED:", type(error).__name__, str(error)[:300])


asyncio.run(main())
