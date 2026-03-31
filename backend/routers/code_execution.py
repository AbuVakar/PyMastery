"""
Code Execution API Router
Handles code execution using self-hosted Judge0 sandbox
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import asyncio
import logging

from services.judge0_service import Judge0Service, ExecutionRequest, ExecutionResult, Language, ExecutionStatus
from auth.dependencies import get_current_user
from database.mongodb import get_database

router = APIRouter(prefix="/api/v1/code", tags=["Code Execution"])

logger = logging.getLogger(__name__)

# Singleton – reused across requests
_judge0 = Judge0Service()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CodeSubmissionRequest(BaseModel):
    source_code: str
    language: str
    stdin: Optional[str] = ""
    expected_output: Optional[str] = None
    time_limit: Optional[int] = 5
    memory_limit: Optional[int] = 128
    problem_id: Optional[str] = None
    save_submission: Optional[bool] = True


class CodeSubmissionResponse(BaseModel):
    submission_id: str
    status: str
    result: Optional[ExecutionResult] = None
    message: str
    execution_time: datetime


class BatchExecutionRequest(BaseModel):
    submissions: List[CodeSubmissionRequest]
    max_concurrent: Optional[int] = 5


class TestRunRequest(BaseModel):
    source_code: str
    language: str
    test_cases: List[Dict[str, str]]   # [{"input": "...", "expected": "..."}]
    time_limit: Optional[int] = 5
    memory_limit: Optional[int] = 128


class TestRunResponse(BaseModel):
    test_results: List[Dict[str, Any]]
    total_passed: int
    total_failed: int
    overall_status: str
    execution_time: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_language(lang_str: str) -> Language:
    try:
        return Language(lang_str.lower())
    except ValueError:
        supported = [lang.value for lang in Language]
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: '{lang_str}'. Supported: {supported}",
        )


def _build_exec_request(req: CodeSubmissionRequest, language: Language) -> ExecutionRequest:
    return ExecutionRequest(
        source_code=req.source_code,
        language=language,
        stdin=req.stdin,
        expected_output=req.expected_output,
        time_limit=req.time_limit,
        memory_limit=req.memory_limit,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/execute")
async def execute_code(
    request: CodeSubmissionRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Execute code using self-hosted Judge0 sandbox."""
    language = _parse_language(request.language)

    service_status = await _judge0.check_service_status()
    execution_enabled = bool(service_status.get("execution_enabled", service_status.get("available")))
    if not execution_enabled:
        raise HTTPException(
            status_code=503,
            detail=service_status.get("message", "Code execution is unavailable in this environment."),
        )

    validation = _judge0.validate_code(request.source_code, language)
    if not validation["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Code validation failed: {', '.join(validation['errors'])}",
        )

    exec_req = _build_exec_request(request, language)
    result = await _judge0.execute_code(exec_req)

    if result.status == ExecutionStatus.INTERNAL_ERROR and result.stderr:
        unavailable_markers = (
            "not reachable",
            "unavailable",
            "missing",
            "placeholder",
            "not fully configured",
        )
        if any(marker in result.stderr.lower() for marker in unavailable_markers):
            raise HTTPException(status_code=503, detail=result.stderr)

    submission_id = "temp_" + str(datetime.now(timezone.utc).timestamp())
    if request.save_submission and current_user:
        saved_id = await _save_submission(current_user.get("_id") or current_user.get("sub"), request, result)
        if saved_id:
            submission_id = saved_id

    if current_user:
        background_tasks.add_task(
            _log_execution,
            current_user.get("_id") or current_user.get("sub"),
            request.language,
            result.status.value,
            len(request.source_code),
        )

    return CodeSubmissionResponse(
        submission_id=submission_id,
        status=result.status.value,
        result=result,
        message="Code executed successfully" if result.status == ExecutionStatus.SUCCESS else (result.stderr or result.status.value),
        execution_time=result.execution_time,
    )


@router.post("/batch-execute")
async def batch_execute_code(
    request: BatchExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Execute multiple code submissions concurrently via Judge0."""
    if len(request.submissions) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 submissions per batch.")

    exec_requests: List[ExecutionRequest] = []
    for sub in request.submissions:
        language = _parse_language(sub.language)
        exec_requests.append(_build_exec_request(sub, language))

    results = await _judge0.execute_multiple(exec_requests)

    responses = [
        {
            "index": i,
            "status": r.status.value,
            "result": r.model_dump(),
            "message": "Success" if r.status == ExecutionStatus.SUCCESS else r.status.value,
        }
        for i, r in enumerate(results)
    ]

    return {
        "batch_id": f"batch_{datetime.now(timezone.utc).timestamp()}",
        "total_submissions": len(request.submissions),
        "results": responses,
        "execution_time": datetime.now(timezone.utc),
    }


@router.post("/test-run")
async def test_code_with_test_cases(
    request: TestRunRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Run code against multiple test cases via Judge0."""
    language = _parse_language(request.language)

    exec_requests = [
        ExecutionRequest(
            source_code=request.source_code,
            language=language,
            stdin=tc.get("input", ""),
            expected_output=tc.get("expected", ""),
            time_limit=request.time_limit,
            memory_limit=request.memory_limit,
        )
        for tc in request.test_cases
    ]

    results = await _judge0.execute_multiple(exec_requests)

    test_results: List[Dict[str, Any]] = []
    passed = failed = 0

    for i, result in enumerate(results):
        tc = request.test_cases[i]
        expected = (tc.get("expected") or "").strip()
        actual = (result.stdout or "").strip()
        ok = actual == expected
        if ok:
            passed += 1
        else:
            failed += 1

        test_results.append({
            "test_case_index": i,
            "input": tc.get("input", ""),
            "expected_output": expected,
            "actual_output": actual,
            "passed": ok,
            "status": result.status.value,
            "execution_time": result.time,
            "memory_usage": result.memory,
            "stderr": result.stderr,
            "compile_output": result.compile_output,
        })

    if failed == 0:
        overall = "All Tests Passed"
    elif passed > 0:
        overall = "Partial Success"
    else:
        overall = "All Tests Failed"

    response = TestRunResponse(
        test_results=test_results,
        total_passed=passed,
        total_failed=failed,
        overall_status=overall,
        execution_time=datetime.now(timezone.utc),
    )

    if current_user:
        background_tasks.add_task(
            _save_test_run,
            current_user.get("_id") or current_user.get("sub"),
            request,
            response,
        )

    return response


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported programming languages from Judge0."""
    try:
        languages = await _judge0.get_supported_languages()
        return {
            "languages": languages,
            "supported": [lang.value for lang in Language],
            "default_time_limit": 5,
            "default_memory_limit": 128,
            "max_time_limit": 30,
            "max_memory_limit": 1024,
            "mode": "self-hosted Judge0",
        }
    except Exception as exc:
        logger.error("Error fetching languages: %s", exc)
        # Fallback static list
        return {
            "languages": [
                {"id": 71, "name": "Python 3"},
                {"id": 63, "name": "JavaScript (Node.js)"},
                {"id": 62, "name": "Java"},
                {"id": 54, "name": "C++ (GCC)"},
                {"id": 50, "name": "C (GCC)"},
                {"id": 72, "name": "Ruby"},
                {"id": 60, "name": "Go"},
                {"id": 73, "name": "Rust"},
                {"id": 68, "name": "PHP"},
                {"id": 51, "name": "C# (Mono)"},
            ],
            "supported": [lang.value for lang in Language],
            "default_time_limit": 5,
            "default_memory_limit": 128,
            "max_time_limit": 30,
            "max_memory_limit": 1024,
            "mode": "self-hosted Judge0 (offline – static fallback)",
        }


@router.get("/service-status")
async def get_service_status():
    """Check if the self-hosted Judge0 service is reachable."""
    try:
        return await _judge0.check_service_status()
    except Exception as exc:
        logger.error("Error checking service status: %s", exc)
        return {
            "configured": False,
            "available": False,
            "execution_enabled": False,
            "mode": "self-hosted",
            "message": f"Status check failed: {exc}",
            "supported_languages": [lang.value for lang in Language],
            "fallback_enabled": False,
        }


@router.get("/submissions/{user_id}")
async def get_user_submissions(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get a user's code submission history."""
    current_id = str(current_user.get("_id") or current_user.get("sub") or "")
    if current_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db = await get_database()
    raw = (
        await db.code_submissions.find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
        .to_list(length=None)
    )

    return {
        "submissions": [
            {
                "id": str(s["_id"]),
                "language": s.get("language"),
                "status": s.get("status"),
                "execution_time": s.get("execution_time"),
                "memory_usage": s.get("memory_usage"),
                "created_at": s.get("created_at"),
                "code_length": len(s.get("source_code", "")),
                "problem_id": s.get("problem_id"),
            }
            for s in raw
        ],
        "total": len(raw),
        "limit": limit,
        "offset": offset,
    }


# ---------------------------------------------------------------------------
# Background helpers
# ---------------------------------------------------------------------------

async def _save_submission(
    user_id: str, request: CodeSubmissionRequest, result: ExecutionResult
) -> Optional[str]:
    try:
        db = await get_database()
        doc = {
            "user_id": user_id,
            "source_code": request.source_code,
            "language": request.language,
            "stdin": request.stdin,
            "expected_output": request.expected_output,
            "status": result.status.value,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "compile_output": result.compile_output,
            "execution_time": result.time,
            "memory_usage": result.memory,
            "exit_code": result.exit_code,
            "problem_id": request.problem_id,
            "created_at": datetime.now(timezone.utc),
        }
        res = await db.code_submissions.insert_one(doc)
        return str(res.inserted_id)
    except Exception as exc:
        logger.error("Error saving submission: %s", exc)
        return None


async def _save_test_run(user_id: str, request: TestRunRequest, response: TestRunResponse):
    try:
        db = await get_database()
        await db.test_runs.insert_one({
            "user_id": user_id,
            "source_code": request.source_code,
            "language": request.language,
            "test_cases": request.test_cases,
            "test_results": response.test_results,
            "total_passed": response.total_passed,
            "total_failed": response.total_failed,
            "overall_status": response.overall_status,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception as exc:
        logger.error("Error saving test run: %s", exc)


async def _log_execution(user_id: str, language: str, status: str, code_length: int):
    try:
        db = await get_database()
        await db.code_execution_logs.insert_one({
            "user_id": user_id,
            "language": language,
            "status": status,
            "code_length": code_length,
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception as exc:
        logger.error("Error logging execution: %s", exc)
