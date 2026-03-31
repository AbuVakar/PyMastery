"""
AI Integration Service for PyMastery
"""
import asyncio
import json
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
from pydantic import BaseModel, validator

logger = logging.getLogger(__name__)

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    user_id: str
    context: Optional[str] = None
    
    @validator('code')
    def validate_code(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Code cannot be empty')
        if len(v) > 50000:  # 50KB limit
            raise ValueError('Code too large')
        return v

class CodeAnalysisResponse(BaseModel):
    success: bool
    analysis: Dict[str, Any]
    suggestions: List[str]
    score: float
    complexity: str
    issues: List[Dict[str, str]]
    execution_time: Optional[float] = None

class AIMentorRequest(BaseModel):
    question: str
    user_context: Dict[str, Any]
    learning_level: str = "beginner"
    topic: Optional[str] = None

class AIMentorResponse(BaseModel):
    answer: str
    hints: List[str]
    code_example: Optional[str]
    difficulty: str
    related_topics: List[str]

class AIIntegrationService:
    """AI-powered code analysis and mentorship service"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1"
        self.model = "gpt-4"
        self.max_tokens = 2000
        self.temperature = 0.7
        
    async def analyze_code(self, request: CodeAnalysisRequest) -> CodeAnalysisResponse:
        """Analyze code with AI"""
        start_time = datetime.utcnow()
        
        try:
            # Prepare analysis prompt
            prompt = self._build_code_analysis_prompt(request)
            
            # Call AI service
            response = await self._call_ai_service(prompt)
            
            # Parse response
            analysis_data = self._parse_analysis_response(response)
            
            # Calculate execution time
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            return CodeAnalysisResponse(
                success=True,
                analysis=analysis_data["analysis"],
                suggestions=analysis_data["suggestions"],
                score=analysis_data["score"],
                complexity=analysis_data["complexity"],
                issues=analysis_data["issues"],
                execution_time=execution_time
            )
            
        except Exception as e:
            logger.error(f"Code analysis failed: {str(e)}")
            return CodeAnalysisResponse(
                success=False,
                analysis={},
                suggestions=[f"Analysis failed: {str(e)}"],
                score=0.0,
                complexity="unknown",
                issues=[{"type": "error", "message": str(e)}],
                execution_time=(datetime.utcnow() - start_time).total_seconds()
            )
    
    def _build_code_analysis_prompt(self, request: CodeAnalysisRequest) -> str:
        """Build prompt for code analysis"""
        return f"""
        Analyze the following {request.language} code:
        
        ```{request.language}
        {request.code}
        ```
        
        Provide a comprehensive analysis including:
        1. Code quality assessment (0-100 score)
        2. Complexity level (simple/moderate/complex)
        3. Performance suggestions
        4. Best practices recommendations
        5. Potential issues or bugs
        6. Security vulnerabilities
        
        Context: {request.context or 'General code review'}
        
        Respond in JSON format with the following structure:
        {{
            "analysis": {{
                "quality": "assessment",
                "patterns": ["pattern1", "pattern2"],
                "architecture": "assessment"
            }},
            "suggestions": ["suggestion1", "suggestion2"],
            "score": 85.5,
            "complexity": "moderate",
            "issues": [
                {{"type": "warning", "message": "message"}},
                {{"type": "error", "message": "message"}}
            ]
        }}
        """
    
    async def get_ai_mentor(self, request: AIMentorRequest) -> AIMentorResponse:
        """Get AI mentor assistance"""
        try:
            # Build mentor prompt
            prompt = self._build_mentor_prompt(request)
            
            # Call AI service
            response = await self._call_ai_service(prompt)
            
            # Parse response
            mentor_data = self._parse_mentor_response(response)
            
            return AIMentorResponse(
                answer=mentor_data["answer"],
                hints=mentor_data["hints"],
                code_example=mentor_data.get("code_example"),
                difficulty=mentor_data["difficulty"],
                related_topics=mentor_data["related_topics"]
            )
            
        except Exception as e:
            logger.error(f"AI mentor failed: {str(e)}")
            return AIMentorResponse(
                answer=f"I'm having trouble responding right now. Please try again. Error: {str(e)}",
                hints=["Try rephrasing your question", "Check if the topic is related to programming"],
                code_example=None,
                difficulty="unknown",
                related_topics=[]
            )
    
    def _build_mentor_prompt(self, request: AIMentorRequest) -> str:
        """Build prompt for AI mentor"""
        user_context_str = json.dumps(request.user_context, indent=2)
        
        return f"""
        You are an AI programming mentor helping a {request.learning_level} programmer.
        
        User Question: {request.question}
        Topic: {request.topic or 'General programming'}
        
        User Context: {user_context_str}
        
        Provide a helpful response that:
        1. Answers the question clearly and concisely
        2. Provides 2-3 helpful hints for further learning
        3. Includes a code example if relevant
        4. Suggests related topics for continued learning
        5. Adapts the difficulty level to {request.learning_level}
        
        Respond in JSON format:
        {{
            "answer": "clear answer",
            "hints": ["hint1", "hint2", "hint3"],
            "code_example": "example code if relevant",
            "difficulty": "easy/medium/hard",
            "related_topics": ["topic1", "topic2"]
        }}
        """
    
    async def _call_ai_service(self, prompt: str) -> str:
        """Call AI service (OpenAI)"""
        if not self.api_key:
            # Fallback to mock response for development
            logger.warning("OpenAI API key not configured, using fallback response")
            return self._get_fallback_response(prompt)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful AI programming assistant. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"AI service error: {response.status_code} - {response.text}")
                    return self._get_fallback_response(prompt)
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"AI service call failed: {str(e)}")
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Get fallback response when AI service is unavailable"""
        if "analyze the following" in prompt.lower():
            return json.dumps({
                "analysis": {
                    "quality": "Unable to analyze due to service unavailability",
                    "patterns": [],
                    "architecture": "unknown"
                },
                "suggestions": ["AI service is temporarily unavailable", "Please try again later"],
                "score": 0.0,
                "complexity": "unknown",
                "issues": [{"type": "error", "message": "AI service unavailable"}]
            })
        elif "programming mentor" in prompt.lower():
            return json.dumps({
                "answer": "I'm currently experiencing technical difficulties. Please try again later.",
                "hints": ["Check your internet connection", "Try rephrasing your question"],
                "code_example": None,
                "difficulty": "medium",
                "related_topics": ["programming", "learning"]
            })
        else:
            return json.dumps({
                "response": "AI service is currently unavailable. Please try again later."
            })
    
    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """Parse AI analysis response"""
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response[json_start:json_end]
            return json.loads(json_str)
            
        except Exception as e:
            logger.error(f"Failed to parse analysis response: {str(e)}")
            # Return fallback response
            return {
                "analysis": {"quality": "Unable to analyze", "patterns": [], "architecture": "unknown"},
                "suggestions": ["Unable to provide suggestions due to parsing error"],
                "score": 0.0,
                "complexity": "unknown",
                "issues": [{"type": "error", "message": "Analysis parsing failed"}]
            }
    
    def _parse_mentor_response(self, response: str) -> Dict[str, Any]:
        """Parse AI mentor response"""
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response[json_start:json_end]
            return json.loads(json_str)
            
        except Exception as e:
            logger.error(f"Failed to parse mentor response: {str(e)}")
            # Return fallback response
            return {
                "answer": response[:500] + "..." if len(response) > 500 else response,
                "hints": ["Try asking a more specific question"],
                "code_example": None,
                "difficulty": "medium",
                "related_topics": []
            }
    
    async def generate_code_suggestion(self, problem: str, language: str) -> str:
        """Generate code suggestion for a problem"""
        try:
            prompt = f"""
            Generate a solution for the following programming problem in {language}:
            
            Problem: {problem}
            
            Provide clean, well-commented code that follows best practices.
            Include error handling and edge cases.
            """
            
            response = await self._call_ai_service(prompt)
            
            # Extract code block from response
            code_start = response.find('```')
            code_end = response.find('```', code_start + 3)
            
            if code_start != -1 and code_end != -1:
                return response[code_start + 3:code_end].replace(f'{language}\n', '')
            
            return response
            
        except Exception as e:
            logger.error(f"Code suggestion failed: {str(e)}")
            return f"Unable to generate code suggestion: {str(e)}"
    
    async def explain_code(self, code: str, language: str) -> str:
        """Explain what code does"""
        try:
            prompt = f"""
            Explain the following {language} code in simple terms:
            
            ```{language}
            {code}
            ```
            
            Provide:
            1. Overall purpose
            2. Key components
            3. How it works step by step
            4. Potential improvements
            """
            
            response = await self._call_ai_service(prompt)
            return response
            
        except Exception as e:
            logger.error(f"Code explanation failed: {str(e)}")
            return f"Unable to explain code: {str(e)}"

# Global AI service instance
ai_service = AIIntegrationService()
