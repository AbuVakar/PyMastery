"""
OpenAI service for AI-powered features
"""
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import logging

from dotenv import load_dotenv

# Force reload from .env to pick up updated API keys during hot reloads
load_dotenv(override=True)# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OpenAI API key not found in environment variables")
        
        # Initialize OpenAI client
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
    
    async def generate_response(self, prompt: str, model: str = "gpt-3.5-turbo", max_tokens: int = 1000) -> str:
        """Generate response using OpenAI"""
        try:
            if not self.client:
                return "OpenAI API key not configured"
            
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant for a learning platform."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise RuntimeError(f"OpenAI unavailable: {e}") from e
    
    async def analyze_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """Analyze code using OpenAI"""
        try:
            if not self.api_key:
                return {"error": "OpenAI API key not configured"}
            
            prompt = f"""
            Analyze this {language} code and provide:
            1. Code quality assessment (1-10)
            2. Potential bugs or issues
            3. Suggestions for improvement
            4. Best practices violations
            5. Complexity score (1-10)
            
            Code:
            ```{language}
            {code}
            ```
            
            Return as JSON with the above structure.
            """
            
            response = await self.generate_response(prompt, max_tokens=1500)
            
            # Try to parse as JSON
            import json
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                return {
                    "analysis": response,
                    "quality_score": 5,
                    "complexity_score": 5,
                    "suggestions": ["Review the code manually"]
                }
                
        except Exception as e:
            logger.error(f"Code analysis error: {e}")
            return {"error": f"Error analyzing code: {str(e)}"}
    
    async def generate_explanation(self, topic: str, difficulty: str = "beginner") -> str:
        """Generate explanation for a topic"""
        try:
            if not self.api_key:
                return "OpenAI API key not configured"
            
            prompt = f"""
            Explain {topic} for a {difficulty} level learner.
            Make it clear, concise, and include examples.
            Keep it under 300 words.
            """
            
            return await self.generate_response(prompt, max_tokens=500)
            
        except Exception as e:
            logger.error(f"Explanation generation error: {e}")
            return f"Error generating explanation: {str(e)}"
    
    async def generate_hint(self, problem: str, code: str, hint_level: int = 1) -> str:
        """Generate hint for a coding problem"""
        try:
            if not self.api_key:
                return "OpenAI API key not configured"
            
            prompt = f"""
            Provide a level {hint_level} hint for this coding problem.
            Don't give the full solution, just guide the learner.
            
            Problem: {problem}
            Current Code: {code}
            
            Level 1: General approach hint
            Level 2: Specific algorithm hint
            Level 3: Code structure hint
            """
            
            return await self.generate_response(prompt, max_tokens=300)
            
        except Exception as e:
            logger.error(f"Hint generation error: {e}")
            return f"Error generating hint: {str(e)}"
