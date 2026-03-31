from __future__ import annotations

import asyncio
from types import SimpleNamespace

from services import gemini_service as gemini_module


class FakeSafetySetting:
    def __init__(self, *, category: str, threshold: str):
        self.category = category
        self.threshold = threshold


class FakeGenerateContentConfig:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeModels:
    def __init__(self, response):
        self._response = response
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return self._response


class RaisingModels:
    def generate_content(self, **_kwargs):
        raise RuntimeError("simulated upstream failure")


def _build_fake_types():
    return SimpleNamespace(
        GenerateContentConfig=FakeGenerateContentConfig,
        SafetySetting=FakeSafetySetting,
    )


def test_generate_ai_response_uses_google_genai_client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    fake_response = SimpleNamespace(text="Mocked Gemini answer")
    fake_models = FakeModels(fake_response)
    client_capture = {}

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            client_capture["api_key"] = api_key
            return SimpleNamespace(models=fake_models)

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    assert service.is_available is True
    assert client_capture["api_key"] == "test-key"

    result = asyncio.run(service.generate_ai_response("Explain loops", "question"))
    assert result["response"] == "Mocked Gemini answer"
    assert result["message_type"] == "question"
    assert result["provider"] == "gemini"
    assert result["is_fallback"] is False

    assert len(fake_models.calls) == 1
    call = fake_models.calls[0]
    assert call["model"] == service.model_name
    assert "Explain loops" in call["contents"]

    config = call["config"]
    assert config.max_output_tokens == 800
    assert config.temperature == 0.7
    assert len(config.safety_settings) == len(gemini_module.SAFETY_SETTINGS)
    assert config.safety_settings[0].category == gemini_module.SAFETY_SETTINGS[0][0]


def test_generate_ai_response_reads_candidate_parts_when_text_missing(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    candidate_response = SimpleNamespace(
        text=None,
        candidates=[
            SimpleNamespace(
                content=SimpleNamespace(
                    parts=[SimpleNamespace(text="Part one "), SimpleNamespace(text="part two")]
                )
            )
        ],
    )
    fake_models = FakeModels(candidate_response)

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=fake_models)

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    result = asyncio.run(service.generate_ai_response("Explain recursion", "explanation"))
    assert result["response"] == "Part one part two"
    assert result["provider"] == "gemini"
    assert result["is_fallback"] is False


def test_generate_ai_response_falls_back_when_sdk_call_fails(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=RaisingModels())

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    result = asyncio.run(service.generate_ai_response("Help me debug this", "code_help"))

    assert result["message_type"] == "code_help"
    assert result["confidence"] == 0.7
    assert result["provider"] == "fallback"
    assert result["is_fallback"] is True
    assert "response" in result and len(result["response"]) > 0


def test_runtime_status_reports_live_after_successful_response(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    fake_response = SimpleNamespace(text="OK")
    fake_models = FakeModels(fake_response)

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=fake_models)

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    result = asyncio.run(service.generate_ai_response("Explain loops", "question"))
    status = asyncio.run(service.get_runtime_status())

    assert result["provider"] == "gemini"
    assert status["available"] is True
    assert status["model"] == service.model_name
    assert status["unavailable_reason"] is None


def test_runtime_status_reports_demo_until_a_live_response_is_verified(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    fake_response = SimpleNamespace(text="OK")
    fake_models = FakeModels(fake_response)

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=fake_models)

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    status = asyncio.run(service.get_runtime_status())

    assert status["available"] is False
    assert status["fallback_enabled"] is True
    assert status["unavailable_reason"] == gemini_module.DEMO_MODE_AI_REASON


def test_runtime_status_reports_demo_when_request_fails(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=RaisingModels())

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    result = asyncio.run(service.generate_ai_response("Help me debug this", "code_help"))
    status = asyncio.run(service.get_runtime_status())

    assert result["provider"] == "fallback"
    assert status["available"] is False
    assert status["fallback_enabled"] is True
    assert status["unavailable_reason"] == gemini_module.LIVE_GEMINI_UNAVAILABLE_REASON


def test_generate_ai_response_uses_clean_quota_reason(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_module, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(gemini_module, "genai_types", _build_fake_types())

    class QuotaModels:
        def generate_content(self, **_kwargs):
            raise RuntimeError("429 RESOURCE_EXHAUSTED quota exceeded")

    class FakeGenAI:
        @staticmethod
        def Client(api_key: str):
            return SimpleNamespace(models=QuotaModels())

    monkeypatch.setattr(gemini_module, "genai", FakeGenAI)

    service = gemini_module.GeminiService()
    result = asyncio.run(service.generate_ai_response("Help me debug this", "code_help"))

    assert result["provider"] == "fallback"
    assert result["fallback_reason"] == gemini_module.GEMINI_QUOTA_EXHAUSTED_REASON
