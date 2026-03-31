#!/usr/bin/env python3
"""
AI Service Testing Suite for PyMastery
Comprehensive testing for AI functionality including fallback behavior
"""

import asyncio
import pytest
import json
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime
import httpx

from services.ai_service import AIService, AIRequest, AIResponse


class TestAIService:
    """Comprehensive AI Service Tests"""
    
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance for testing"""
        # Mock environment variables
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'test-key-123',
            'OPENAI_MODEL': 'gpt-3.5-turbo',
            'OPENAI_MAX_TOKENS': '1000'
        }):
            return AIService()
    
    @pytest.fixture
    def ai_service_no_key(self):
        """Create AI service without API key for fallback testing"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': '',
            'OPENAI_MODEL': 'gpt-3.5-turbo',
            'OPENAI_MAX_TOKENS': '1000'
        }):
            return AIService()

    @pytest.mark.asyncio
    async def test_ai_service_initialization_with_key(self, ai_service):
        """Test AI service initialization with API key"""
        assert ai_service.api_key == 'test-key-123'
        assert ai_service.model == 'gpt-3.5-turbo'
        assert ai_service.max_tokens == 1000
        assert ai_service.client is not None

    @pytest.mark.asyncio
    async def test_ai_service_initialization_without_key(self, ai_service_no_key):
        """Test AI service initialization without API key (fallback mode)"""
        assert ai_service_no_key.api_key == ''
        assert ai_service_no_key.client is None

    @pytest.mark.asyncio
    async def test_analyze_code_with_api_key(self, ai_service):
        """Test code analysis with working API key"""
        # Mock OpenAI response
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "This code has medium complexity and good quality."
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "total_tokens": 150
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                code="def hello_world():\n    print('Hello, World!')",
                language="python",
                question="Analyze this code"
            )
            
            result = await ai_service.analyze_code(request)
            
            assert isinstance(result, AIResponse)
            assert "medium complexity" in result.content.lower()
            assert result.analysis is not None
            assert result.analysis["complexity"] in ["low", "medium", "high"]
            assert isinstance(result.analysis["quality"], int)
            assert 1 <= result.analysis["quality"] <= 10
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_analyze_code_fallback_mode(self, ai_service_no_key):
        """Test code analysis in fallback mode (no API key)"""
        request = AIRequest(
            code="def hello_world():\n    print('Hello, World!')",
            language="python",
            question="Analyze this code"
        )
        
        result = await ai_service_no_key.analyze_code(request)
        
        assert isinstance(result, AIResponse)
        assert "unavailable" in result.content.lower()
        assert result.analysis is not None
        assert result.analysis["complexity"] == "medium"
        assert result.analysis["quality"] == 7
        assert len(result.analysis["improvements"]) > 0

    @pytest.mark.asyncio
    async def test_explain_code_with_api_key(self, ai_service):
        """Test code explanation with working API key"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "This code defines a function that prints 'Hello, World!'"
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 80,
                "completion_tokens": 40,
                "total_tokens": 120
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                code="def hello_world():\n    print('Hello, World!')",
                language="python",
                user_level="beginner"
            )
            
            result = await ai_service.explain_code(request)
            
            assert isinstance(result, AIResponse)
            assert "function" in result.content.lower()
            assert result.explanation == result.content
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_debug_code_with_api_key(self, ai_service):
        """Test code debugging with working API key"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "The error is likely due to undefined variable. Check variable names."
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 120,
                "completion_tokens": 60,
                "total_tokens": 180
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                code="print(undefined_var)",
                language="python",
                error_message="NameError: name 'undefined_var' is not defined"
            )
            
            result = await ai_service.debug_code(request)
            
            assert isinstance(result, AIResponse)
            assert "variable" in result.content.lower()
            assert result.suggestions is not None
            assert len(result.suggestions) > 0
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_provide_tutoring_with_api_key(self, ai_service):
        """Test AI tutoring with working API key"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "Let me help you understand Python functions step by step..."
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 90,
                "completion_tokens": 45,
                "total_tokens": 135
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                current_topic="Python functions",
                question="How do I create a function?",
                user_level="beginner"
            )
            
            result = await ai_service.provide_tutoring(request)
            
            assert isinstance(result, AIResponse)
            assert "function" in result.content.lower()
            assert result.suggestions is not None
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_get_code_suggestions_with_api_key(self, ai_service):
        """Test code suggestions with working API key"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "Line 1: Add docstring\nCode: def hello_world():\n    \"\"\"Prints Hello World\"\"\""
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 70,
                "completion_tokens": 35,
                "total_tokens": 105
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                code="def hello_world():\n    print('Hello, World!')",
                language="python",
                cursor_position=0
            )
            
            result = await ai_service.get_code_suggestions(request)
            
            assert isinstance(result, AIResponse)
            assert result.code_suggestions is not None
            assert len(result.code_suggestions) > 0
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_get_learning_path_with_api_key(self, ai_service):
        """Test learning path recommendations with working API key"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "Based on your current level, I recommend learning variables first..."
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "total_tokens": 150
            }
        }

        with patch.object(ai_service, '_make_openai_request', return_value=mock_response):
            request = AIRequest(
                current_topic="Python basics",
                user_level="beginner"
            )
            
            result = await ai_service.get_learning_path(request)
            
            assert isinstance(result, AIResponse)
            assert "variables" in result.content.lower()
            assert result.suggestions is not None
            assert result.usage == mock_response["usage"]

    @pytest.mark.asyncio
    async def test_make_openai_request_success(self, ai_service):
        """Test successful OpenAI API request"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Test response"
                    }
                }
            ],
            "usage": {"total_tokens": 100}
        }
        mock_client.post.return_value = mock_response
        
        ai_service.client = mock_client
        
        result = await ai_service._make_openai_request("Test prompt")
        
        assert result["content"] == "Test response"
        assert result["usage"]["total_tokens"] == 100

    @pytest.mark.asyncio
    async def test_make_openai_request_error(self, ai_service):
        """Test OpenAI API request error handling"""
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad request"
        mock_client.post.return_value = mock_response
        
        ai_service.client = mock_client
        
        with pytest.raises(Exception, match="OpenAI API error: 400"):
            await ai_service._make_openai_request("Test prompt")

    @pytest.mark.asyncio
    async def test_check_status_with_api_key(self, ai_service):
        """Test AI service status check with API key"""
        status = await ai_service.check_status()
        
        assert isinstance(status, dict)
        assert status["available"] is True
        assert "AI service is available" in status["message"]
        assert status["model"] == "gpt-3.5-turbo"
        assert status["max_tokens"] == 1000

    @pytest.mark.asyncio
    async def test_check_status_without_api_key(self, ai_service_no_key):
        """Test AI service status check without API key"""
        status = await ai_service_no_key.check_status()
        
        assert isinstance(status, dict)
        assert status["available"] is False
        assert "unavailable" in status["message"].lower()
        assert status["model"] is None
        assert status["max_tokens"] is None

    @pytest.mark.asyncio
    async def test_get_usage_stats(self, ai_service):
        """Test AI usage statistics"""
        stats = await ai_service.get_usage_stats()
        
        assert isinstance(stats, dict)
        assert "total_requests" in stats
        assert "total_tokens" in stats
        assert "available_features" in stats
        assert isinstance(stats["available_features"], list)

    def test_extract_complexity(self, ai_service):
        """Test complexity extraction from AI response"""
        assert ai_service._extract_complexity("This code has high complexity") == "high"
        assert ai_service._extract_complexity("This code is simple and low complexity") == "low"
        assert ai_service._extract_complexity("This code is normal") == "medium"

    def test_extract_quality_score(self, ai_service):
        """Test quality score extraction from AI response"""
        assert ai_service._extract_quality_score("Quality score: 8/10") == 8
        assert ai_service._extract_quality_score("Quality: 5") == 5
        assert ai_service._extract_quality_score("No score mentioned") == 7  # Default

    def test_extract_improvements(self, ai_service):
        """Test improvements extraction from AI response"""
        content = """
        Here are some improvements:
        - Add comments to your code
        - Improve variable names
        - Handle edge cases
        """
        improvements = ai_service._extract_improvements(content)
        
        assert len(improvements) == 3
        assert "Add comments" in improvements[0]
        assert "variable names" in improvements[1]

    def test_extract_suggestions(self, ai_service):
        """Test suggestions extraction from AI response"""
        content = """
        I suggest:
        - Review the documentation
        - Practice more examples
        - Ask for help
        """
        suggestions = ai_service._extract_suggestions(content)
        
        assert len(suggestions) == 3
        assert "documentation" in suggestions[0]
        assert "examples" in suggestions[1]

    def test_extract_code_suggestions(self, ai_service):
        """Test code suggestions extraction from AI response"""
        content = """
        Line 1: Add docstring
        Code: def hello_world():
        Line 2: Add type hints
        Code: def hello_world() -> None:
        """
        suggestions = ai_service._extract_code_suggestions(content)
        
        assert len(suggestions) == 2
        assert suggestions[0]["line"] == 1
        assert "docstring" in suggestions[0]["suggestion"]
        assert suggestions[1]["line"] == 1
        assert "type hints" in suggestions[1]["suggestion"]

    def test_get_fallback_response(self, ai_service):
        """Test fallback response generation"""
        response = ai_service._get_fallback_response("analysis")
        
        assert isinstance(response, AIResponse)
        assert "unavailable" in response.content.lower()
        assert response.analysis is not None
        assert response.analysis["complexity"] == "medium"
        assert response.analysis["quality"] == 7

    @pytest.mark.asyncio
    async def test_error_handling_in_analyze_code(self, ai_service):
        """Test error handling in code analysis"""
        # Mock exception in OpenAI request
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                code="test code",
                language="python"
            )
            
            result = await ai_service.analyze_code(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()

    @pytest.mark.asyncio
    async def test_error_handling_in_explain_code(self, ai_service):
        """Test error handling in code explanation"""
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                code="test code",
                language="python"
            )
            
            result = await ai_service.explain_code(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()

    @pytest.mark.asyncio
    async def test_error_handling_in_debug_code(self, ai_service):
        """Test error handling in debugging"""
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                code="test code",
                language="python",
                error_message="Test error"
            )
            
            result = await ai_service.debug_code(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()
            assert result.suggestions is not None

    @pytest.mark.asyncio
    async def test_error_handling_in_tutoring(self, ai_service):
        """Test error handling in tutoring"""
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                current_topic="Python",
                question="Test question",
                user_level="beginner"
            )
            
            result = await ai_service.provide_tutoring(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()
            assert result.suggestions is not None

    @pytest.mark.asyncio
    async def test_error_handling_in_code_suggestions(self, ai_service):
        """Test error handling in code suggestions"""
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                code="test code",
                language="python",
                cursor_position=0
            )
            
            result = await ai_service.get_code_suggestions(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()
            assert result.code_suggestions is not None

    @pytest.mark.asyncio
    async def test_error_handling_in_learning_path(self, ai_service):
        """Test error handling in learning path"""
        with patch.object(ai_service, '_make_openai_request', side_effect=Exception("API Error")):
            request = AIRequest(
                current_topic="Python",
                user_level="beginner"
            )
            
            result = await ai_service.get_learning_path(request)
            
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()
            assert result.suggestions is not None


# Integration Tests
class TestAIServiceIntegration:
    """AI Service Integration Tests"""
    
    @pytest.mark.asyncio
    async def test_full_ai_workflow_with_fallback(self):
        """Test complete AI workflow with fallback behavior"""
        # Create AI service without API key
        ai_service = AIService()
        
        # Test all AI functions work with fallbacks
        functions_to_test = [
            ('analyze_code', AIRequest(code="test", language="python")),
            ('explain_code', AIRequest(code="test", language="python")),
            ('debug_code', AIRequest(code="test", language="python", error_message="error")),
            ('provide_tutoring', AIRequest(current_topic="test", question="test", user_level="beginner")),
            ('get_code_suggestions', AIRequest(code="test", language="python")),
            ('get_learning_path', AIRequest(current_topic="test", user_level="beginner"))
        ]
        
        for func_name, request in functions_to_test:
            func = getattr(ai_service, func_name)
            result = await func(request)
            
            assert isinstance(result, AIResponse)
            assert result.content is not None
            assert len(result.content) > 0
            
            # Check that fallback responses are appropriate
            if func_name in ['analyze_code', 'explain_code', 'debug_code', 'tutoring']:
                assert "unavailable" in result.content.lower() or "temporarily" in result.content.lower()

    @pytest.mark.asyncio
    async def test_ai_service_status_check_integration(self):
        """Test AI service status check integration"""
        ai_service = AIService()
        status = await ai_service.check_status()
        
        assert isinstance(status, dict)
        assert "available" in status
        assert "message" in status
        
        # Should work regardless of API key availability
        if ai_service.client is None:
            assert status["available"] is False


# Performance Tests
class TestAIServicePerformance:
    """AI Service Performance Tests"""
    
    @pytest.mark.asyncio
    async def test_ai_service_response_time(self):
        """Test AI service response time"""
        import time
        
        ai_service = AIService()
        
        # Test fallback response time (should be fast)
        start_time = time.time()
        result = await ai_service.analyze_code(
            AIRequest(code="test", language="python")
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Fallback responses should be very fast (< 100ms)
        assert response_time < 0.1
        assert isinstance(result, AIResponse)

    @pytest.mark.asyncio
    async def test_concurrent_ai_requests(self):
        """Test concurrent AI request handling"""
        ai_service = AIService()
        
        # Create multiple concurrent requests
        requests = [
            ai_service.analyze_code(AIRequest(code=f"code_{i}", language="python"))
            for i in range(10)
        ]
        
        # Execute all requests concurrently
        results = await asyncio.gather(*requests, return_exceptions=True)
        
        # All should succeed with fallback responses
        assert len(results) == 10
        for result in results:
            assert isinstance(result, AIResponse)
            assert "unavailable" in result.content.lower()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
