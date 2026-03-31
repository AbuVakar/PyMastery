"""
AI Service for PyMastery
Handles personalized learning, code analysis, AI tutoring, and intelligent recommendations
"""

import asyncio
import logging
import json
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import openai
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class DifficultyLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class RecommendationType(Enum):
    COURSE = "course"
    PROBLEM = "problem"
    RESOURCE = "resource"
    TUTORIAL = "tutorial"
    PRACTICE = "practice"

@dataclass
class CodeAnalysis:
    """Code analysis results"""
    overall_score: float
    complexity_score: float
    style_score: float
    efficiency_score: float
    readability_score: float
    best_practices_score: float
    issues: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    patterns: List[str]
    anti_patterns: List[str]
    complexity_metrics: Dict[str, Any]

@dataclass
class LearningPath:
    """Personalized learning path"""
    path_id: str
    title: str
    description: str
    estimated_duration: int  # in days
    difficulty_progression: List[DifficultyLevel]
    courses: List[str]
    problems: List[str]
    resources: List[str]
    milestones: List[Dict[str, Any]]
    prerequisites: List[str]
    learning_objectives: List[str]
    personalized_recommendations: List[Dict[str, Any]]

@dataclass
class AITutorSession:
    """AI tutoring session"""
    session_id: str
    user_id: str
    topic: str
    difficulty: DifficultyLevel
    messages: List[Dict[str, Any]]
    learning_style: str
    progress_tracking: Dict[str, Any]
    personalized_hints: List[str]
    common_mistakes: List[str]
    improvement_suggestions: List[str]

class AIService:
    def __init__(self, db: AsyncIOMotorDatabase, openai_api_key: str):
        self.db = db
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
        # Collections
        self.user_profiles_collection = db.user_profiles
        self.learning_paths_collection = db.learning_paths
        self.code_analyses_collection = db.code_analyses
        self.ai_tutor_sessions_collection = db.ai_tutor_sessions
        self.recommendations_collection = db.recommendations
        self.learning_analytics_collection = db.learning_analytics
        
        # AI Models
        self.code_analysis_model = "gpt-3.5-turbo"
        self.tutoring_model = "gpt-3.5-turbo"
        self.recommendation_model = "gpt-3.5-turbo"

    async def initialize_service(self):
        """Initialize AI service with default configurations"""
        try:
            await self._create_indexes()
            await self._create_default_learning_paths()
            logger.info("AI service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {e}")
            raise

    async def _create_indexes(self):
        """Create database indexes for AI features"""
        # User profiles indexes
        await self.user_profiles_collection.create_index("user_id", unique=True)
        await self.user_profiles_collection.create_index("learning_style")
        await self.user_profiles_collection.create_index("difficulty_level")
        
        # Learning paths indexes
        await self.learning_paths_collection.create_index("path_id", unique=True)
        await self.learning_paths_collection.create_index("difficulty_level")
        await self.learning_paths_collection.create_index("estimated_duration")
        
        # Code analyses indexes
        await self.code_analyses_collection.create_index("user_id")
        await self.code_analyses_collection.create_index("created_at", -1)
        await self.code_analyses_collection.create_index("overall_score", -1)
        
        # AI tutor sessions indexes
        await self.ai_tutor_sessions_collection.create_index("session_id", unique=True)
        await self.ai_tutor_sessions_collection.create_index("user_id")
        await self.ai_tutor_sessions_collection.create_index("created_at", -1)
        
        # Recommendations indexes
        await self.recommendations_collection.create_index("user_id")
        await self.recommendations_collection.create_index("type")
        await self.recommendations_collection.create_index("created_at", -1)
        
        # Learning analytics indexes
        await self.learning_analytics_collection.create_index("user_id")
        await self.learning_analytics_collection.create_index("date", -1)
        await self.learning_analytics_collection.create_index("activity_type")

    async def _create_default_learning_paths(self):
        """Create default learning paths for different tracks"""
        default_paths = [
            {
                "path_id": "python_basics",
                "title": "Python Programming Fundamentals",
                "description": "Learn Python from scratch with hands-on exercises",
                "estimated_duration": 30,
                "difficulty_progression": [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE],
                "courses": ["python-intro", "python-basics", "python-data-structures"],
                "problems": ["hello-world", "variables", "functions", "loops", "lists"],
                "resources": ["python-docs", "python-tutorial", "practice-exercises"],
                "milestones": [
                    {"title": "First Program", "day": 1, "description": "Write your first Python program"},
                    {"title": "Functions Mastered", "day": 15, "description": "Create and use functions"},
                    {"title": "Data Structures", "day": 30, "description": "Master lists, dictionaries, and sets"}
                ],
                "prerequisites": [],
                "learning_objectives": [
                    "Understand Python syntax",
                    "Write basic programs",
                    "Use functions and modules",
                    "Work with data structures"
                ],
                "personalized_recommendations": []
            },
            {
                "path_id": "web_development",
                "title": "Full-Stack Web Development",
                "description": "Build modern web applications from frontend to backend",
                "estimated_duration": 90,
                "difficulty_progression": [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED],
                "courses": ["html-css", "javascript-basics", "react", "nodejs", "databases"],
                "problems": ["basic-webpage", "interactive-form", "todo-app", "full-stack-project"],
                "resources": ["mdn-docs", "javascript-tutorial", "react-docs", "nodejs-guide"],
                "milestones": [
                    {"title": "First Webpage", "day": 7, "description": "Create your first HTML/CSS webpage"},
                    {"title": "JavaScript Mastery", "day": 30, "description": "Master JavaScript fundamentals"},
                    {"title": "React Application", "day": 60, "description": "Build a React application"},
                    {"title": "Full-Stack Project", "day": 90, "description": "Complete full-stack project"}
                ],
                "prerequisites": ["python_basics"],
                "learning_objectives": [
                    "Build responsive web pages",
                    "Create interactive applications",
                    "Understand frontend frameworks",
                    "Build backend APIs"
                ],
                "personalized_recommendations": []
            },
            {
                "path_id": "data_science",
                "title": "Data Science and Machine Learning",
                "description": "Learn data analysis, visualization, and machine learning",
                "estimated_duration": 120,
                "difficulty_progression": [DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT],
                "courses": ["statistics", "python-data-science", "machine-learning", "deep-learning"],
                "problems": ["data-analysis", "visualization", "ml-basics", "neural-networks"],
                "resources": ["pandas-docs", "scikit-learn", "tensorflow-tutorial", "kaggle"],
                "milestones": [
                    {"title": "Data Analysis", "day": 30, "description": "Analyze datasets with pandas"},
                    {"title": "Machine Learning Basics", "day": 60, "description": "Build your first ML model"},
                    {"title": "Deep Learning", "day": 90, "description": "Implement neural networks"},
                    {"title": "Capstone Project", "day": 120, "description": "Complete data science project"}
                ],
                "prerequisites": ["python_basics", "web_development"],
                "learning_objectives": [
                    "Analyze and visualize data",
                    "Build machine learning models",
                    "Understand deep learning concepts",
                    "Complete data science projects"
                ],
                "personalized_recommendations": []
            }
        ]

        for path in default_paths:
            await self.learning_paths_collection.update_one(
                {"path_id": path["path_id"]},
                {"$set": path},
                upsert=True
            )

    async def analyze_code(self, user_id: str, code: str, language: str, problem_context: str = "") -> CodeAnalysis:
        """Analyze code quality and provide suggestions"""
        try:
            # Create analysis prompt
            prompt = self._create_code_analysis_prompt(code, language, problem_context)
            
            # Get AI analysis
            response = await self.openai_client.chat.completions.create(
                model=self.code_analysis_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert code analyst. Provide detailed, constructive feedback on code quality, including specific suggestions for improvement."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse analysis
            analysis = await self._parse_code_analysis(analysis_text)
            
            # Store analysis
            await self._store_code_analysis(user_id, code, language, analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing code: {e}")
            # Return default analysis
            return CodeAnalysis(
                overall_score=0.0,
                complexity_score=0.0,
                style_score=0.0,
                efficiency_score=0.0,
                readability_score=0.0,
                best_practices_score=0.0,
                issues=[],
                suggestions=[],
                patterns=[],
                anti_patterns=[],
                complexity_metrics={}
            )

    def _create_code_analysis_prompt(self, code: str, language: str, problem_context: str) -> str:
        """Create a comprehensive code analysis prompt"""
        return f"""
        Analyze the following {language} code and provide detailed feedback:

        Problem Context: {problem_context}

        Code:
        ```{language}
        {code}
        ```

        Please analyze the code and provide:
        1. Overall quality score (0-100)
        2. Complexity score (0-100)
        3. Code style score (0-100)
        4. Efficiency score (0-100)
        5. Readability score (0-100)
        6. Best practices score (0-100)
        7. List of issues found (with line numbers if possible)
        8. Specific suggestions for improvement
        9. Good patterns used
        10. Anti-patterns to avoid
        11. Complexity metrics

        Format your response as JSON with the following structure:
        {{
            "overall_score": 85,
            "complexity_score": 70,
            "style_score": 90,
            "efficiency_score": 80,
            "readability_score": 85,
            "best_practices_score": 88,
            "issues": [
                {{
                    "type": "style",
                    "description": "Inconsistent indentation",
                    "line": 15,
                    "severity": "minor"
                }}
            ],
            "suggestions": [
                {{
                    "type": "improvement",
                    "description": "Use list comprehension instead of for loop",
                    "code": "new_list = [x*2 for x in old_list]",
                    "line": 25
                }}
            ],
            "patterns": ["list comprehension", "function definition"],
            "anti_patterns": ["magic numbers", "deeply nested code"],
            "complexity_metrics": {{
                "cyclomatic_complexity": 5,
                "cognitive_complexity": 8,
                "lines_of_code": 45,
                "maintainability_index": 75
            }}
        }}
        """

    async def _parse_code_analysis(self, analysis_text: str) -> CodeAnalysis:
        """Parse AI analysis into structured format"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                analysis_data = json.loads(json_match.group())
                
                return CodeAnalysis(
                    overall_score=analysis_data.get("overall_score", 0),
                    complexity_score=analysis_data.get("complexity_score", 0),
                    style_score=analysis_data.get("style_score", 0),
                    efficiency_score=analysis_data.get("efficiency_score", 0),
                    readability_score=analysis_data.get("readability_score", 0),
                    best_practices_score=analysis_data.get("best_practices_score", 0),
                    issues=analysis_data.get("issues", []),
                    suggestions=analysis_data.get("suggestions", []),
                    patterns=analysis_data.get("patterns", []),
                    anti_patterns=analysis_data.get("anti_patterns", []),
                    complexity_metrics=analysis_data.get("complexity_metrics", {})
                )
            else:
                # Fallback to simple parsing
                return CodeAnalysis(
                    overall_score=70.0,
                    complexity_score=70.0,
                    style_score=70.0,
                    efficiency_score=70.0,
                    readability_score=70.0,
                    best_practices_score=70.0,
                    issues=[],
                    suggestions=[],
                    patterns=[],
                    anti_patterns=[],
                    complexity_metrics={}
                )
        except Exception as e:
            logger.error(f"Error parsing code analysis: {e}")
            return CodeAnalysis(
                overall_score=0.0,
                complexity_score=0.0,
                style_score=0.0,
                efficiency_score=0.0,
                readability_score=0.0,
                best_practices_score=0.0,
                issues=[],
                suggestions=[],
                patterns=[],
                anti_patterns=[],
                complexity_metrics={}
            )

    async def _store_code_analysis(self, user_id: str, code: str, language: str, analysis: CodeAnalysis):
        """Store code analysis in database"""
        try:
            analysis_record = {
                "user_id": user_id,
                "code": code,
                "language": language,
                "analysis": {
                    "overall_score": analysis.overall_score,
                    "complexity_score": analysis.complexity_score,
                    "style_score": analysis.style_score,
                    "efficiency_score": analysis.efficiency_score,
                    "readability_score": analysis.readability_score,
                    "best_practices_score": analysis.best_practices_score,
                    "issues": analysis.issues,
                    "suggestions": analysis.suggestions,
                    "patterns": analysis.patterns,
                    "anti_patterns": analysis.anti_patterns,
                    "complexity_metrics": analysis.complexity_metrics
                },
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.code_analyses_collection.insert_one(analysis_record)
            
        except Exception as e:
            logger.error(f"Error storing code analysis: {e}")

    async def generate_personalized_learning_path(self, user_id: str, goals: List[str], current_skills: List[str], learning_style: str, time_commitment: int) -> LearningPath:
        """Generate personalized learning path based on user profile"""
        try:
            # Get user profile
            user_profile = await self._get_user_profile(user_id)
            
            # Create learning path prompt
            prompt = self._create_learning_path_prompt(goals, current_skills, learning_style, time_commitment, user_profile)
            
            # Get AI recommendation
            response = await self.openai_client.chat.completions.create(
                model=self.recommendation_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational AI. Create personalized learning paths based on user goals, skills, and learning preferences."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            path_data = await self._parse_learning_path_response(response.choices[0].message.content)
            
            # Create LearningPath object
            learning_path = LearningPath(
                path_id=f"personalized_{user_id}_{datetime.now(timezone.utc).strftime('%Y%m%d')}",
                title=path_data.get("title", "Personalized Learning Path"),
                description=path_data.get("description", "Custom learning path based on your goals"),
                estimated_duration=path_data.get("estimated_duration", 30),
                difficulty_progression=[DifficultyLevel(level) for level in path_data.get("difficulty_progression", ["beginner", "intermediate"])],
                courses=path_data.get("courses", []),
                problems=path_data.get("problems", []),
                resources=path_data.get("resources", []),
                milestones=path_data.get("milestones", []),
                prerequisites=path_data.get("prerequisites", []),
                learning_objectives=path_data.get("learning_objectives", []),
                personalized_recommendations=path_data.get("personalized_recommendations", [])
            )
            
            # Store learning path
            await self._store_learning_path(user_id, learning_path)
            
            return learning_path
            
        except Exception as e:
            logger.error(f"Error generating learning path: {e}")
            # Return default path
            return LearningPath(
                path_id=f"default_{user_id}",
                title="Default Learning Path",
                description="A general learning path for programming",
                estimated_duration=30,
                difficulty_progression=[DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE],
                courses=["python-basics"],
                problems=["hello-world"],
                resources=["python-docs"],
                milestones=[],
                prerequisites=[],
                learning_objectives=[],
                personalized_recommendations=[]
            )

    def _create_learning_path_prompt(self, goals: List[str], current_skills: List[str], learning_style: str, time_commitment: int, user_profile: Dict[str, Any]) -> str:
        """Create a comprehensive learning path generation prompt"""
        return f"""
        Generate a personalized learning path for a programming student with the following profile:

        Goals: {', '.join(goals)}
        Current Skills: {', '.join(current_skills)}
        Learning Style: {learning_style}
        Time Commitment: {time_commitment} hours per week
        User Profile: {json.dumps(user_profile, default=str)}

        Please create a learning path that includes:
        1. A descriptive title
        2. Detailed description
        3. Estimated duration in days
        4. Difficulty progression (beginner -> intermediate -> advanced -> expert)
        5. Recommended courses (course IDs)
        6. Recommended problems (problem IDs)
        7. Learning resources
        8. Milestones with specific achievements
        9. Prerequisites if any
        10. Learning objectives
        11. Personalized recommendations based on their learning style

        Format your response as JSON:
        {{
            "title": "Python for Data Science",
            "description": "Learn Python with focus on data analysis and machine learning",
            "estimated_duration": 60,
            "difficulty_progression": ["beginner", "intermediate", "advanced"],
            "courses": ["python-basics", "python-data-science", "machine-learning"],
            "problems": ["data-analysis", "ml-basics", "visualization"],
            "resources": ["pandas-docs", "scikit-learn", "jupyter-tutorial"],
            "milestones": [
                {{
                    "title": "Python Basics",
                    "day": 15,
                    "description": "Master Python fundamentals"
                }}
            ],
            "prerequisites": [],
            "learning_objectives": ["Master Python syntax", "Analyze data", "Build ML models"],
            "personalized_recommendations": [
                {{
                    "type": "learning_style",
                    "recommendation": "Use visual learning aids for data visualization"
                }}
            ]
        }}
        """

    async def _parse_learning_path_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI learning path response"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Return default structure
                return {
                    "title": "Personalized Learning Path",
                    "description": "Custom learning path based on your goals",
                    "estimated_duration": 30,
                    "difficulty_progression": ["beginner", "intermediate"],
                    "courses": [],
                    "problems": [],
                    "resources": [],
                    "milestones": [],
                    "prerequisites": [],
                    "learning_objectives": [],
                    "personalized_recommendations": []
                }
        except Exception as e:
            logger.error(f"Error parsing learning path response: {e}")
            return {
                "title": "Personalized Learning Path",
                "description": "Custom learning path based on your goals",
                "estimated_duration": 30,
                "difficulty_progression": ["beginner", "intermediate"],
                "courses": [],
                "problems": [],
                "resources": [],
                "milestones": [],
                "prerequisites": [],
                "learning_objectives": [],
                "personalized_recommendations": []
            }

    async def _store_learning_path(self, user_id: str, learning_path: LearningPath):
        """Store learning path in database"""
        try:
            path_record = {
                "user_id": user_id,
                "path_id": learning_path.path_id,
                "title": learning_path.title,
                "description": learning_path.description,
                "estimated_duration": learning_path.estimated_duration,
                "difficulty_progression": [level.value for level in learning_path.difficulty_progression],
                "courses": learning_path.courses,
                "problems": learning_path.problems,
                "resources": learning_path.resources,
                "milestones": learning_path.milestones,
                "prerequisites": learning_path.prerequisites,
                "learning_objectives": learning_path.learning_objectives,
                "personalized_recommendations": learning_path.personalized_recommendations,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.learning_paths_collection.insert_one(path_record)
            
        except Exception as e:
            logger.error(f"Error storing learning path: {e}")

    async def start_ai_tutor_session(self, user_id: str, topic: str, difficulty: DifficultyLevel, learning_style: str) -> AITutorSession:
        """Start an AI tutoring session"""
        try:
            session_id = str(ObjectId())
            
            # Get user profile for personalization
            user_profile = await self._get_user_profile(user_id)
            
            # Create initial tutor message
            initial_message = await self._generate_tutor_welcome(topic, difficulty, learning_style, user_profile)
            
            session = AITutorSession(
                session_id=session_id,
                user_id=user_id,
                topic=topic,
                difficulty=difficulty,
                messages=[
                    {
                        "role": "tutor",
                        "content": initial_message,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ],
                learning_style=learning_style,
                progress_tracking={
                    "topics_covered": [],
                    "questions_asked": 0,
                    "concepts_mastered": [],
                    "struggles_identified": []
                },
                personalized_hints=[],
                common_mistakes=[],
                improvement_suggestions=[]
            )
            
            # Store session
            await self._store_tutor_session(session)
            
            return session
            
        except Exception as e:
            logger.error(f"Error starting AI tutor session: {e}")
            raise

    async def _generate_tutor_welcome(self, topic: str, difficulty: DifficultyLevel, learning_style: str, user_profile: Dict[str, Any]) -> str:
        """Generate personalized welcome message from AI tutor"""
        try:
            prompt = f"""
            You are an expert programming tutor. Generate a personalized welcome message for a student starting a tutoring session.

            Topic: {topic}
            Difficulty: {difficulty.value}
            Learning Style: {learning_style}
            Student Profile: {json.dumps(user_profile, default=str)}

            Create a warm, encouraging welcome message in this exact format:
            ## Welcome to Your {topic} Session! 🎉
            Brief personalized welcome (1-2 sentences).

            ### Key Points
            - Point about their learning style
            - What we'll cover in this session
            - Encouraging note

            Let's start with what you already know about {topic}.

            Keep it conversational and friendly (around 150-200 words).
            """
            
            response = await self.openai_client.chat.completions.create(
                model=self.tutoring_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a friendly, expert programming tutor who personalizes teaching based on student learning styles."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating tutor welcome: {e}")
            return f"## Welcome to Your {topic} Session! 🎉\n\nI'm excited to help you learn about {topic} in a way that matches your learning style.\n\n### Key Points\n- We'll go at your pace\n- Practice with real examples\n- Questions are always welcome\n\nLet's start with what you already know about {topic}."

    async def _store_tutor_session(self, session: AITutorSession):
        """Store AI tutor session in database"""
        try:
            session_record = {
                "session_id": session.session_id,
                "user_id": session.user_id,
                "topic": session.topic,
                "difficulty": session.difficulty.value,
                "messages": session.messages,
                "learning_style": session.learning_style,
                "progress_tracking": session.progress_tracking,
                "personalized_hints": session.personalized_hints,
                "common_mistakes": session.common_mistakes,
                "improvement_suggestions": session.improvement_suggestions,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.ai_tutor_sessions_collection.insert_one(session_record)
            
        except Exception as e:
            logger.error(f"Error storing tutor session: {e}")

    async def send_tutor_message(self, session_id: str, user_message: str) -> str:
        """Send message to AI tutor and get response"""
        try:
            # Get session
            session = await self.ai_tutor_sessions_collection.find_one({"session_id": session_id})
            if not session:
                raise ValueError("Session not found")
            
            # Add user message
            session["messages"].append({
                "role": "student",
                "content": user_message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Generate AI response
            ai_response = await self._generate_tutor_response(session, user_message)
            
            # Add AI response
            session["messages"].append({
                "role": "tutor",
                "content": ai_response,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Update session
            await self.ai_tutor_sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "messages": session["messages"],
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error sending tutor message: {e}")
            return "I'm having trouble responding right now. Please try again later."

    async def _generate_tutor_response(self, session: Dict[str, Any], user_message: str) -> str:
        """Generate AI tutor response"""
        try:
            # Create conversation context
            messages = [
                {
                    "role": "system",
                    "content": f"""You are an expert programming tutor specializing in {session['topic']}. 
                    The student's difficulty level is {session['difficulty']} and their learning style is {session['learning_style']}.
                    Be encouraging, patient, and adapt your teaching style to their preferences.
                    Provide clear explanations and practical examples.
                    
                    Always respond in this exact format:
                    ## [Topic]
                    Brief explanation.
                    
                    ### Key Points
                    - Point 1
                    - Point 2
                    - Point 3
                    
                    ### Example (if applicable)
                    ```python
                    # code example
                    ```"""
                }
            ]
            
            # Add conversation history
            for msg in session["messages"][-10:]:  # Last 10 messages for context
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            response = await self.openai_client.chat.completions.create(
                model=self.tutoring_model,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating tutor response: {e}")
            return "## Here to Help!\n\nI'm here to help you learn programming step by step.\n\n### Key Points\n- Ask any question about programming\n- Get clear, simple explanations\n- Practice with examples\n\nWhat would you like to learn about?"

    async def generate_recommendations(self, user_id: str, recommendation_type: RecommendationType, limit: int = 5) -> List[Dict[str, Any]]:
        """Generate personalized recommendations"""
        try:
            # Get user profile and learning history
            user_profile = await self._get_user_profile(user_id)
            learning_analytics = await self._get_learning_analytics(user_id)
            
            # Create recommendation prompt
            prompt = self._create_recommendation_prompt(user_profile, learning_analytics, recommendation_type, limit)
            
            # Get AI recommendations
            response = await self.openai_client.chat.completions.create(
                model=self.recommendation_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational AI who provides personalized learning recommendations based on user profiles and learning patterns."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.8
            )
            
            recommendations = await self._parse_recommendations_response(response.choices[0].message.content)
            
            # Store recommendations
            await self._store_recommendations(user_id, recommendation_type, recommendations)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []

    def _create_recommendation_prompt(self, user_profile: Dict[str, Any], learning_analytics: List[Dict[str, Any]], recommendation_type: RecommendationType, limit: int) -> str:
        """Create recommendation generation prompt"""
        return f"""
        Generate {limit} personalized {recommendation_type.value} recommendations based on the user's profile and learning patterns:

        User Profile: {json.dumps(user_profile, default=str)}
        Learning Analytics: {json.dumps(learning_analytics, default=str)}

        Please provide recommendations that are:
        1. Personalized to their skill level and learning style
        2. Based on their learning patterns and progress
        3. Relevant to their goals and interests
        4. Challenging but achievable
        5. Include brief explanations for why each recommendation is suitable

        Format your response as JSON:
        [
            {{
                "title": "Python Functions Practice",
                "description": "Practice writing and using functions in Python",
                "difficulty": "intermediate",
                "estimated_time": "2 hours",
                "reason": "Based on your progress in Python basics",
                "tags": ["python", "functions", "practice"]
            }}
        ]
        """

    async def _parse_recommendations_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse AI recommendations response"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return []
        except Exception as e:
            logger.error(f"Error parsing recommendations response: {e}")
            return []

    async def _store_recommendations(self, user_id: str, recommendation_type: RecommendationType, recommendations: List[Dict[str, Any]]):
        """Store recommendations in database"""
        try:
            for rec in recommendations:
                recommendation_record = {
                    "user_id": user_id,
                    "type": recommendation_type.value,
                    "title": rec.get("title", ""),
                    "description": rec.get("description", ""),
                    "difficulty": rec.get("difficulty", "beginner"),
                    "estimated_time": rec.get("estimated_time", ""),
                    "reason": rec.get("reason", ""),
                    "tags": rec.get("tags", []),
                    "created_at": datetime.now(timezone.utc),
                    "viewed": False
                }
                
                await self.recommendations_collection.insert_one(recommendation_record)
                
        except Exception as e:
            logger.error(f"Error storing recommendations: {e}")

    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile for personalization"""
        try:
            profile = await self.user_profiles_collection.find_one({"user_id": user_id})
            
            if not profile:
                # Create default profile
                default_profile = {
                    "user_id": user_id,
                    "learning_style": "visual",
                    "difficulty_level": "beginner",
                    "goals": [],
                    "current_skills": [],
                    "time_commitment": 5,
                    "preferred_topics": [],
                    "learning_pace": "moderate",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                await self.user_profiles_collection.insert_one(default_profile)
                return default_profile
            
            return profile
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return {}

    async def _get_learning_analytics(self, user_id: str) -> List[Dict[str, Any]]:
        """Get learning analytics for personalization"""
        try:
            analytics = await self.learning_analytics_collection.find(
                {"user_id": user_id}
            ).sort("date", -1).limit(50).to_list(None)
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting learning analytics: {e}")
            return []

    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile for better personalization"""
        try:
            await self.user_profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        **profile_data,
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False

    async def track_learning_activity(self, user_id: str, activity_type: str, data: Dict[str, Any]):
        """Track learning activity for analytics"""
        try:
            activity_record = {
                "user_id": user_id,
                "activity_type": activity_type,
                "data": data,
                "date": datetime.now(timezone.utc),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            await self.learning_analytics_collection.insert_one(activity_record)
            
        except Exception as e:
            logger.error(f"Error tracking learning activity: {e}")

    async def get_learning_insights(self, user_id: str) -> Dict[str, Any]:
        """Get learning insights and analytics"""
        try:
            # Get recent activities
            activities = await self.learning_analytics_collection.find(
                {"user_id": user_id}
            ).sort("date", -1).limit(100).to_list(None)
            
            # Calculate insights
            insights = {
                "total_activities": len(activities),
                "activity_by_type": {},
                "learning_streak": 0,
                "most_active_day": None,
                "skill_progress": {},
                "time_spent": 0,
                "completion_rate": 0.0
            }
            
            # Analyze activities
            for activity in activities:
                activity_type = activity["activity_type"]
                insights["activity_by_type"][activity_type] = insights["activity_by_type"].get(activity_type, 0) + 1
            
            # Calculate learning streak (simplified)
            insights["learning_streak"] = await self._calculate_learning_streak(user_id)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error getting learning insights: {e}")
            return {}

    async def _calculate_learning_streak(self, user_id: str) -> int:
        """Calculate current learning streak"""
        try:
            # Get last 30 days of activities
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            activities = await self.learning_analytics_collection.find({
                "user_id": user_id,
                "date": {"$gte": thirty_days_ago}
            }).sort("date", -1).to_list(None)
            
            if not activities:
                return 0
            
            # Calculate consecutive days with activity
            streak = 0
            current_date = datetime.now(timezone.utc).date()
            
            for i in range(30):
                check_date = current_date - timedelta(days=i)
                day_activities = [a for a in activities if a["date"].date() == check_date]
                
                if day_activities:
                    streak += 1
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"Error calculating learning streak: {e}")
            return 0

# Global AI service instance
ai_service = None

async def get_ai_service(db: AsyncIOMotorDatabase, openai_api_key: str) -> AIService:
    """Get or create AI service instance"""
    global ai_service
    
    if ai_service is None:
        ai_service = AIService(db, openai_api_key)
        await ai_service.initialize_service()
    
    return ai_service
