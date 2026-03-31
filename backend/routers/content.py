"""
Course and problem endpoints used by the current frontend.

These routes prefer database-backed data and expose when sample/demo content is
being returned so the UI can stay honest about what is live.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from auth.dependencies import get_current_user
from database.mongodb import get_database
from services.auth_service import auth_service

logger = logging.getLogger(__name__)

courses_router = APIRouter(prefix="/api/v1/courses")
problems_router = APIRouter(prefix="/api/v1/problems")


class ProblemCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    difficulty: str = "medium"
    category: str = "Algorithms"
    points: int = 100
    constraints: List[str] = Field(default_factory=list)
    starter_code: str = ""


SEED_COURSES: List[Dict[str, Any]] = [
    {
        "id": "1",
        "title": "Python for Beginners",
        "description": "Build strong Python fundamentals with guided lessons and practice.",
        "difficulty": "beginner",
        "category": "Fundamentals",
        "duration": "8 weeks",
        "lesson_count": 18,
        "progress": 18,
        "status": "available",
        "next_deadline": "2026-04-02T12:00:00.000Z",
        "instructor": "PyMastery Team",
        "language": "Python 3.12+",
        "access": "Lifetime",
        "certificate": "Included",
        "outcomes": [
            "Read and write core Python syntax confidently",
            "Work with files, functions, and collections",
            "Debug beginner-friendly coding problems",
        ],
        "modules": [
            {
                "id": "python-setup",
                "title": "Python setup and workflow",
                "lessons": 4,
                "completed": True,
                "summary": "Install tooling and learn the core workflow.",
            },
            {
                "id": "python-core",
                "title": "Variables, control flow, and functions",
                "lessons": 5,
                "completed": False,
                "summary": "Practice core Python syntax.",
            },
        ],
    },
    {
        "id": "2",
        "title": "React Development",
        "description": "Learn modern React patterns with TypeScript and routing.",
        "difficulty": "intermediate",
        "category": "Frontend",
        "duration": "10 weeks",
        "lesson_count": 24,
        "progress": 64,
        "status": "enrolled",
        "next_deadline": "2026-04-05T12:00:00.000Z",
        "instructor": "Frontend Guild",
        "language": "TypeScript + React",
        "access": "Lifetime",
        "certificate": "Included",
        "outcomes": [
            "Build routed SPA flows",
            "Model UI state cleanly",
            "Handle async loading and errors",
        ],
        "modules": [
            {
                "id": "react-foundations",
                "title": "React foundations and JSX",
                "lessons": 6,
                "completed": True,
                "summary": "Refresh component thinking and JSX composition.",
            },
            {
                "id": "react-routing",
                "title": "Routing and shared layouts",
                "lessons": 5,
                "completed": False,
                "summary": "Design route-aware screens and shells.",
            },
        ],
    },
    {
        "id": "3",
        "title": "Web Development Bootcamp",
        "description": "Go from HTML and CSS to full-stack app thinking with guided projects.",
        "difficulty": "beginner",
        "category": "Full Stack",
        "duration": "16 weeks",
        "lesson_count": 30,
        "progress": 82,
        "status": "enrolled",
        "next_deadline": "2026-04-10T12:00:00.000Z",
        "instructor": "Web Builders Team",
        "language": "HTML, CSS, JavaScript",
        "access": "Lifetime",
        "certificate": "Included",
        "outcomes": [
            "Build responsive pages with intent",
            "Use JavaScript for interaction",
            "Ship a polished capstone website",
        ],
        "modules": [
            {
                "id": "web-html",
                "title": "HTML structure and semantics",
                "lessons": 6,
                "completed": True,
                "summary": "Build accessible content structure.",
            },
            {
                "id": "web-css",
                "title": "CSS layouts and responsive design",
                "lessons": 8,
                "completed": True,
                "summary": "Use grids, flexbox, and spacing systems.",
            },
        ],
    },
]

SEED_PROBLEMS: List[Dict[str, Any]] = [
    {
        "id": "1",
        "title": "Two Sum",
        "description": "Return the indices of two numbers that add up to a target.",
        "difficulty": "easy",
        "category": "Algorithms",
        "status": "Solved",
        "points": 50,
        "constraints": ["Input array length is at least 2.", "Return indices in any order."],
        "starter_code": "def solution(nums, target):\n    pass",
    },
    {
        "id": "2",
        "title": "Python Decorators",
        "description": "Refactor repeated logging logic into a reusable decorator.",
        "difficulty": "medium",
        "category": "Fundamentals",
        "status": "Todo",
        "points": 100,
        "constraints": ["Use decorator syntax.", "Preserve wrapped function arguments."],
        "starter_code": "def log_calls(func):\n    pass",
    },
    {
        "id": "3",
        "title": "Sliding Window Maximum",
        "description": "Track the maximum value in every fixed-size window efficiently.",
        "difficulty": "hard",
        "category": "Algorithms",
        "status": "Attempted",
        "points": 260,
        "constraints": ["Aim for O(n) time.", "Use a deque or equivalent structure."],
        "starter_code": "def max_sliding_window(nums, k):\n    pass",
    },
]


def _serialize_document(document: Dict[str, Any]) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for key, value in document.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def _seed_course_by_id(course_id: str) -> Dict[str, Any]:
    return next((course for course in SEED_COURSES if course["id"] == course_id), SEED_COURSES[0])


def _seed_problem_by_id(problem_id: str) -> Dict[str, Any]:
    return next((problem for problem in SEED_PROBLEMS if problem["id"] == problem_id), SEED_PROBLEMS[0])


async def _get_enrolled_course_ids(db: Any, user_id: str) -> set[str]:
    try:
        enrollments = await db.enrollments.find({"user_id": user_id}).to_list(length=None)
    except Exception:
        return set()

    return {str(entry.get("course_id")) for entry in enrollments if entry.get("course_id") is not None}


def _apply_enrollment_state(course: Dict[str, Any], enrolled_course_ids: set[str]) -> Dict[str, Any]:
    course_copy = dict(course)
    course_id = str(course_copy.get("id") or course_copy.get("_id") or "")
    if course_id in enrolled_course_ids:
        course_copy["status"] = "enrolled"
        course_copy.setdefault("progress", 0)
    return course_copy


@courses_router.get("")
async def list_courses(
    limit: int = Query(12, ge=1, le=100),
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    db = None
    source = "database"

    try:
        db = await get_database()
        query: Dict[str, Any] = {}
        if difficulty:
            query["difficulty"] = difficulty
        courses = await db.courses.find(query).limit(limit).to_list(length=limit)
        serialized = [_serialize_document(course) for course in courses]
    except Exception:
        serialized = list(SEED_COURSES)
        source = "seed"

    if not serialized:
        serialized = list(SEED_COURSES)
        source = "seed"

    if db is not None:
        enrolled_course_ids = await _get_enrolled_course_ids(db, str(current_user.get("sub")))
        serialized = [_apply_enrollment_state(course, enrolled_course_ids) for course in serialized]

    if status:
        serialized = [
            course for course in serialized if str(course.get("status", "")).lower() == status.lower()
        ]

    return {
        "courses": serialized[:limit],
        "user_id": current_user.get("sub"),
        "source": source,
        "demo_mode": source != "database",
    }


@courses_router.get("/{course_id}")
async def get_course(course_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = None

    try:
        db = await get_database()
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
        if not course:
            course = await db.courses.find_one({"id": course_id})
        if course:
            serialized_course = _serialize_document(course)
            enrolled_course_ids = await _get_enrolled_course_ids(db, str(current_user.get("sub")))
            serialized_course = _apply_enrollment_state(serialized_course, enrolled_course_ids)
            return {
                "course": serialized_course,
                "user_id": current_user.get("sub"),
                "source": "database",
                "demo_mode": False,
            }
    except Exception:
        pass

    seeded_course = _seed_course_by_id(course_id)
    if db is not None:
        enrolled_course_ids = await _get_enrolled_course_ids(db, str(current_user.get("sub")))
        seeded_course = _apply_enrollment_state(seeded_course, enrolled_course_ids)

    return {
        "course": seeded_course,
        "user_id": current_user.get("sub"),
        "source": "seed",
        "demo_mode": True,
    }


@courses_router.post("/{course_id}/enroll")
async def enroll_in_course(
    course_id: str,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        db = await get_database()
    except Exception as exc:
        logger.error("Enrollment database unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Course enrollment is unavailable because the database connection is not ready.",
        ) from exc

    course_title = "PyMastery Course"
    course = None

    try:
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        course = None

    if not course:
        course = await db.courses.find_one({"id": course_id})

    seed_course = _seed_course_by_id(course_id)
    if course and "title" in course:
        course_title = course["title"]
    elif seed_course and "title" in seed_course:
        course_title = seed_course["title"]

    enrollment = {
        "user_id": current_user["sub"],
        "course_id": course_id,
        "status": "enrolled",
        "progress_percentage": 0,
        "enrolled_at": datetime.now(timezone.utc),
        "last_accessed": datetime.now(timezone.utc),
    }

    try:
        await db.enrollments.update_one(
            {"user_id": current_user["sub"], "course_id": course_id},
            {"$set": enrollment},
            upsert=True,
        )
    except Exception as exc:
        logger.error("Failed to save enrollment: %s", exc)
        raise HTTPException(status_code=503, detail="Enrollment could not be saved right now.") from exc

    user_email = current_user.get("email")
    user_name = current_user.get("name", "Student")

    if user_email:
        try:
            from services.email_service import send_email

            dashboard_url = f"{auth_service.frontend_url.rstrip('/')}/dashboard"
            contact_url = f"{auth_service.frontend_url.rstrip('/')}/contact"
            email_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #4f46e5, #3b82f6); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0; font-size: 24px;">Welcome to {course_title}</h2>
                    <p style="color: #e0e7ff; margin: 10px 0 0; font-size: 16px;">Your enrollment was successful</p>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Hi <strong>{user_name}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                        You have successfully enrolled in <strong>{course_title}</strong>. We are excited to have you on board.
                    </p>
                    <div style="margin: 32px 0; text-align: center;">
                        <a href="{dashboard_url}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Start Learning Now
                        </a>
                    </div>
                    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;">Tips for Success:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.5;">
                            <li>Set aside at least 30 minutes every day.</li>
                            <li>Use the AI Tutor whenever you are stuck.</li>
                            <li>Practice coding directly in the execution environment when it is available.</li>
                        </ul>
                    </div>
                    <p style="font-size: 14px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                        If you have any questions, reply to this email or use the <a href="{contact_url}" style="color: #3b82f6;">Contact Us</a> page.
                        <br><br>Happy Coding,<br><strong>The PyMastery Team</strong>
                    </p>
                </div>
            </div>
            """

            background_tasks.add_task(
                send_email,
                user_email,
                f"Welcome to {course_title}",
                email_html,
            )
        except Exception as exc:
            logger.error("Failed to queue enrollment email: %s", exc)

    return {
        "success": True,
        "course_id": course_id,
        "status": "enrolled",
        "message": "Enrollment saved",
    }


@problems_router.get("")
async def list_problems(
    limit: int = Query(50, ge=1, le=200),
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    source = "database"

    try:
        db = await get_database()
        query: Dict[str, Any] = {}
        if difficulty:
            query["difficulty"] = difficulty
        if tag:
            query["$or"] = [{"category": tag}, {"tags": tag}]
        problems = await db.problems.find(query).limit(limit).to_list(length=limit)
        serialized = [_serialize_document(problem) for problem in problems]
    except Exception:
        serialized = list(SEED_PROBLEMS)
        source = "seed"

    if not serialized:
        serialized = list(SEED_PROBLEMS)
        source = "seed"

    return {
        "problems": serialized[:limit],
        "user_id": current_user.get("sub"),
        "source": source,
        "demo_mode": source != "database",
    }


@problems_router.get("/{problem_id}")
async def get_problem(problem_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        db = await get_database()
        problem = await db.problems.find_one({"_id": ObjectId(problem_id)})
        if not problem:
            problem = await db.problems.find_one({"id": problem_id})
        if problem:
            return {
                "problem": _serialize_document(problem),
                "user_id": current_user.get("sub"),
                "source": "database",
                "demo_mode": False,
            }
    except Exception:
        pass

    return {
        "problem": _seed_problem_by_id(problem_id),
        "user_id": current_user.get("sub"),
        "source": "seed",
        "demo_mode": True,
    }


@problems_router.post("")
async def create_problem(
    request: ProblemCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    problem = {
        "title": request.title,
        "description": request.description,
        "difficulty": request.difficulty,
        "category": request.category,
        "points": request.points,
        "constraints": request.constraints,
        "starter_code": request.starter_code,
        "author_id": current_user["sub"],
        "author_name": current_user["name"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "status": "Todo",
    }

    try:
        db = await get_database()
        result = await db.problems.insert_one(problem)
        problem["id"] = str(result.inserted_id)
    except Exception:
        problem["id"] = f"problem_{int(datetime.now(timezone.utc).timestamp())}"

    return {"success": True, "problem": _serialize_document(problem)}
