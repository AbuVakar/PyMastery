"""
Code execution service for PyMastery.

Prefers a self-hosted Judge0 instance and can optionally fall back to a local
Python subprocess when explicitly enabled.
"""

import asyncio
import base64
import logging
import os
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
PLACEHOLDER_FRAGMENTS = ("your-", "placeholder", "changeme", "replace-me", "example")


class Language(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    RUBY = "ruby"
    GO = "go"
    RUST = "rust"
    PHP = "php"
    CSHARP = "csharp"


class ExecutionStatus(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    SUCCESS = "Success"
    ERROR = "Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"
    WRONG_ANSWER = "Wrong Answer"
    RUNTIME_ERROR = "Runtime Error"
    COMPILE_ERROR = "Compile Error"
    INTERNAL_ERROR = "Internal Error"


class ExecutionRequest(BaseModel):
    source_code: str
    language: Language
    stdin: Optional[str] = ""
    expected_output: Optional[str] = None
    time_limit: Optional[int] = 5
    memory_limit: Optional[int] = 128
    max_output_size: Optional[int] = 1024


class ExecutionResult(BaseModel):
    status: ExecutionStatus
    stdout: str
    stderr: str
    compile_output: str
    time: str
    memory: str
    exit_code: int
    execution_time: datetime
    language: str


LANGUAGE_IDS: Dict[Language, int] = {
    Language.PYTHON: 71,
    Language.JAVASCRIPT: 63,
    Language.JAVA: 62,
    Language.CPP: 54,
    Language.C: 50,
    Language.RUBY: 72,
    Language.GO: 60,
    Language.RUST: 73,
    Language.PHP: 68,
    Language.CSHARP: 51,
}

STATUS_MAP: Dict[int, ExecutionStatus] = {
    1: ExecutionStatus.PENDING,
    2: ExecutionStatus.PROCESSING,
    3: ExecutionStatus.SUCCESS,
    4: ExecutionStatus.ERROR,
    5: ExecutionStatus.TIME_LIMIT_EXCEEDED,
    6: ExecutionStatus.COMPILE_ERROR,
    7: ExecutionStatus.WRONG_ANSWER,
    8: ExecutionStatus.RUNTIME_ERROR,
    9: ExecutionStatus.COMPILE_ERROR,
    10: ExecutionStatus.COMPILE_ERROR,
    11: ExecutionStatus.RUNTIME_ERROR,
    12: ExecutionStatus.RUNTIME_ERROR,
    13: ExecutionStatus.INTERNAL_ERROR,
    14: ExecutionStatus.INTERNAL_ERROR,
}


def _looks_like_placeholder(value: str) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return True

    return any(fragment in normalized for fragment in PLACEHOLDER_FRAGMENTS)


def _b64_encode(text: str) -> str:
    return base64.b64encode(text.encode()).decode()


def _b64_decode(value: Optional[str]) -> str:
    if not value:
        return ""

    try:
        return base64.b64decode(value).decode(errors="replace")
    except Exception:
        return value


class Judge0Service:
    """Talks to self-hosted Judge0 CE and exposes honest availability details."""

    def __init__(self) -> None:
        self.base_url = os.getenv("JUDGE0_API_URL", "http://localhost:2358").strip().rstrip("/")
        self.api_key = os.getenv("JUDGE0_API_KEY", "").strip()
        self.host = os.getenv("JUDGE0_HOST", "").strip()
        self.allow_local_fallback = (
            os.getenv("ALLOW_LOCAL_CODE_EXECUTION_FALLBACK", "false").lower() == "true"
        )

        if self.base_url.endswith("/submissions"):
            self.base_url = self.base_url[: -len("/submissions")]

        self.language_ids = LANGUAGE_IDS
        self.uses_rapidapi = (
            "rapidapi.com" in self.base_url.lower() or "rapidapi.com" in self.host.lower()
        )

        config_status = self._determine_configuration()
        self.is_configured = config_status["configured"]
        self.configuration_message = config_status["message"]

        logger.info("Judge0 service initialized at %s", self.base_url)
        if not self.is_configured:
            logger.warning(self.configuration_message)

    async def execute_code(self, request: ExecutionRequest) -> ExecutionResult:
        if not self.is_configured:
            if self.allow_local_fallback and request.language == Language.PYTHON:
                logger.warning(
                    "Judge0 is not fully configured; using Python subprocess fallback instead."
                )
                return await self._subprocess_fallback(request)
            return self._error_result(request.language, self.configuration_message)

        language_id = self.language_ids.get(request.language)
        if language_id is None:
            return self._error_result(request.language, "Unsupported language")

        payload = {
            "language_id": language_id,
            "source_code": _b64_encode(request.source_code),
            "stdin": _b64_encode(request.stdin or ""),
            "cpu_time_limit": float(request.time_limit or 5),
            "memory_limit": (request.memory_limit or 128) * 1024,
        }

        if request.expected_output:
            payload["expected_output"] = _b64_encode(request.expected_output)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/submissions",
                    json=payload,
                    params={"base64_encoded": "true", "wait": "true"},
                    headers=self._request_headers(),
                )

                if response.status_code in (200, 201):
                    data = response.json()
                    status_id = data.get("status", {}).get("id", 0)
                    if status_id in (1, 2):
                        token = data.get("token")
                        if token:
                            data = await self._poll_result(client, token)
                    return self._parse_response(data, request.language)

                logger.warning(
                    "Judge0 returned HTTP %s: %s",
                    response.status_code,
                    response.text[:200],
                )
                return self._error_result(
                    request.language,
                    f"Judge0 returned HTTP {response.status_code}.",
                )
        except httpx.ConnectError:
            logger.warning("Judge0 not reachable at %s - using subprocess fallback", self.base_url)
            if not self.allow_local_fallback:
                return self._error_result(
                    request.language,
                    f"Code execution is unavailable because Judge0 is not reachable at {self.base_url}.",
                )
            return await self._subprocess_fallback(request)
        except Exception as exc:
            logger.error("Judge0 execute_code error: %s", exc)
            return self._error_result(request.language, str(exc))

    async def execute_multiple(self, requests: List[ExecutionRequest]) -> List[ExecutionResult]:
        tasks = [self.execute_code(req) for req in requests]
        raw = await asyncio.gather(*tasks, return_exceptions=True)

        results: List[ExecutionResult] = []
        for index, result in enumerate(raw):
            if isinstance(result, Exception):
                results.append(self._error_result(requests[index].language, str(result)))
            else:
                results.append(result)
        return results

    async def get_supported_languages(self) -> List[Dict[str, Any]]:
        if not self.is_configured:
            if self.allow_local_fallback:
                return [{"id": LANGUAGE_IDS[Language.PYTHON], "name": "Python"}]
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/languages",
                    headers=self._request_headers(),
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as exc:
            logger.warning("Could not fetch languages from Judge0: %s", exc)

        return [
            {"id": lang_id, "name": lang.value.capitalize()}
            for lang, lang_id in self.language_ids.items()
        ]

    async def check_service_status(self) -> Dict[str, Any]:
        if not self.is_configured:
            execution_enabled = self.allow_local_fallback
            return {
                "configured": False,
                "available": False,
                "execution_enabled": execution_enabled,
                "mode": "rapidapi" if self.uses_rapidapi else "self-hosted",
                "url": self.base_url,
                "message": (
                    "Judge0 configuration is incomplete. Python execution will use the local fallback only."
                    if execution_enabled
                    else self.configuration_message
                ),
                "supported_languages": ["python"] if execution_enabled else [lang.value for lang in Language],
                "fallback_enabled": self.allow_local_fallback,
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.base_url}/about",
                    headers=self._request_headers(),
                )
                if response.status_code == 200:
                    return {
                        "configured": True,
                        "available": True,
                        "execution_enabled": True,
                        "mode": "rapidapi" if self.uses_rapidapi else "self-hosted",
                        "url": self.base_url,
                        "message": "Judge0 service is running.",
                        "supported_languages": [lang.value for lang in self.language_ids.keys()],
                        "fallback_enabled": self.allow_local_fallback,
                    }
        except Exception as exc:
            logger.warning("Judge0 status check failed: %s", exc)

        execution_enabled = self.allow_local_fallback
        return {
            "configured": True,
            "available": False,
            "execution_enabled": execution_enabled,
            "mode": "rapidapi" if self.uses_rapidapi else "self-hosted",
            "url": self.base_url,
            "message": (
                f"Judge0 is not reachable at {self.base_url}. Python execution will use the local fallback only."
                if execution_enabled
                else f"Judge0 is configured but not reachable at {self.base_url}."
            ),
            "supported_languages": ["python"] if execution_enabled else [lang.value for lang in self.language_ids.keys()],
            "fallback_enabled": self.allow_local_fallback,
        }

    def validate_code(self, code: str, language: Language) -> Dict[str, Any]:
        _ = language
        result: Dict[str, Any] = {"valid": True, "errors": [], "warnings": []}

        if not code or not code.strip():
            result["valid"] = False
            result["errors"].append("Code cannot be empty")
            return result

        if len(code) > 65536:
            result["warnings"].append("Code is very long (>64 KB). Ensure it is intentional.")

        return result

    def get_language_info(self, language: Language) -> Dict[str, Any]:
        if language not in self.language_ids:
            return {"supported": False, "message": "Language not supported"}

        return {
            "supported": True,
            "language_id": self.language_ids[language],
            "language_name": language.value,
            "real_execution": True,
            "mode": "self-hosted Judge0",
        }

    def _determine_configuration(self) -> Dict[str, Any]:
        if not self.base_url:
            return {
                "configured": False,
                "message": "JUDGE0_API_URL is missing.",
            }

        if self.uses_rapidapi:
            if _looks_like_placeholder(self.api_key):
                return {
                    "configured": False,
                    "message": (
                        "Judge0 RapidAPI access is unavailable because JUDGE0_API_KEY is missing "
                        "or still set to a placeholder value."
                    ),
                }

            if _looks_like_placeholder(self.host):
                return {
                    "configured": False,
                    "message": (
                        "Judge0 RapidAPI access is unavailable because JUDGE0_HOST is missing "
                        "or still set to a placeholder value."
                    ),
                }

        return {
            "configured": True,
            "message": "Judge0 is configured.",
        }

    def _request_headers(self) -> Dict[str, str]:
        if not self.uses_rapidapi:
            return {}

        return {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.host,
        }

    async def _poll_result(
        self,
        client: httpx.AsyncClient,
        token: str,
        max_tries: int = 20,
        delay: float = 0.5,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/submissions/{token}"
        for _ in range(max_tries):
            await asyncio.sleep(delay)
            try:
                response = await client.get(
                    url,
                    params={"base64_encoded": "true"},
                    headers=self._request_headers(),
                )
                if response.status_code == 200:
                    data = response.json()
                    status_id = data.get("status", {}).get("id", 0)
                    if status_id not in (1, 2):
                        return data
            except Exception:
                pass

        return {"status": {"id": 13}, "stderr": "Polling timed out waiting for Judge0"}

    def _parse_response(self, data: Dict[str, Any], language: Language) -> ExecutionResult:
        status_id = data.get("status", {}).get("id", 13)
        status = STATUS_MAP.get(status_id, ExecutionStatus.INTERNAL_ERROR)

        stdout = _b64_decode(data.get("stdout"))
        stderr = _b64_decode(data.get("stderr"))
        compile_output = _b64_decode(data.get("compile_output"))

        raw_exit = data.get("exit_code")
        try:
            exit_code = int(raw_exit) if raw_exit is not None else (
                0 if status == ExecutionStatus.SUCCESS else 1
            )
        except (TypeError, ValueError):
            exit_code = 1

        return ExecutionResult(
            status=status,
            stdout=stdout,
            stderr=stderr,
            compile_output=compile_output,
            time=str(data.get("time") or "0"),
            memory=str(data.get("memory") or "0"),
            exit_code=exit_code,
            execution_time=datetime.now(timezone.utc),
            language=language.value,
        )

    def _error_result(self, language: Language, message: str) -> ExecutionResult:
        return ExecutionResult(
            status=ExecutionStatus.INTERNAL_ERROR,
            stdout="",
            stderr=message,
            compile_output="",
            time="0",
            memory="0",
            exit_code=-1,
            execution_time=datetime.now(timezone.utc),
            language=language.value,
        )

    async def _subprocess_fallback(self, request: ExecutionRequest) -> ExecutionResult:
        """
        Last-resort fallback: runs Python code locally via subprocess.
        Only works for Python. All other languages get a clear error message.
        """
        if request.language != Language.PYTHON:
            return ExecutionResult(
                status=ExecutionStatus.INTERNAL_ERROR,
                stdout="",
                stderr=(
                    f"Judge0 is not running at {self.base_url}. "
                    f"Cannot execute {request.language.value} code without Judge0. "
                    "Please start Judge0 CE: https://github.com/judge0/judge0"
                ),
                compile_output="",
                time="0",
                memory="0",
                exit_code=-1,
                execution_time=datetime.now(timezone.utc),
                language=request.language.value,
            )

        import subprocess
        import sys
        import tempfile
        from pathlib import Path

        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as handle:
                handle.write(request.source_code)
                temp_path = handle.name

            try:
                process = subprocess.run(
                    [sys.executable, temp_path],
                    input=request.stdin or "",
                    capture_output=True,
                    text=True,
                    timeout=request.time_limit or 5,
                )
                status = (
                    ExecutionStatus.SUCCESS
                    if process.returncode == 0
                    else ExecutionStatus.RUNTIME_ERROR
                )
                return ExecutionResult(
                    status=status,
                    stdout=process.stdout,
                    stderr=process.stderr,
                    compile_output="",
                    time=str(request.time_limit or 5),
                    memory="0",
                    exit_code=process.returncode,
                    execution_time=datetime.now(timezone.utc),
                    language=request.language.value,
                )
            except subprocess.TimeoutExpired:
                return ExecutionResult(
                    status=ExecutionStatus.TIME_LIMIT_EXCEEDED,
                    stdout="",
                    stderr="Execution timed out",
                    compile_output="",
                    time=str(request.time_limit or 5),
                    memory="0",
                    exit_code=1,
                    execution_time=datetime.now(timezone.utc),
                    language=request.language.value,
                )
            finally:
                Path(temp_path).unlink(missing_ok=True)
        except Exception as exc:
            return self._error_result(request.language, f"Subprocess fallback error: {exc}")


judge0_service = Judge0Service()
