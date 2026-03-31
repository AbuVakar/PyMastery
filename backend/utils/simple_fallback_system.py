"""
Simple Fallback System for Code Execution
Basic fallback when external services are unavailable
"""

import subprocess
import tempfile
import os
import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)

class FallbackLevel(Enum):
    """Fallback execution levels"""
    EXTERNAL_API = "external_api"
    LOCAL_EXECUTION = "local_execution"
    SIMULATED = "simulated"

class FallbackStatus(Enum):
    """Fallback execution status"""
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    UNSUPPORTED = "unsupported"

class FallbackResult:
    """Fallback execution result"""
    def __init__(self, status: FallbackStatus, stdout: str = "", stderr: str = "", 
                 execution_time: float = 0.0, fallback_level: FallbackLevel = FallbackLevel.SIMULATED):
        self.status = status
        self.stdout = stdout
        self.stderr = stderr
        self.execution_time = execution_time
        self.fallback_level = fallback_level

def execute_code_with_fallback(source_code: str, language: str, stdin: str = "", 
                             time_limit: int = 5) -> FallbackResult:
    """Execute code with simple fallback system"""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(source_code)
            temp_file = f.name
        
        try:
            # Execute Python code
            result = subprocess.run(
                ['python', temp_file],
                input=stdin,
                text=True,
                capture_output=True,
                timeout=time_limit
            )
            
            return FallbackResult(
                status=FallbackStatus.SUCCESS if result.returncode == 0 else FallbackStatus.ERROR,
                stdout=result.stdout,
                stderr=result.stderr,
                fallback_level=FallbackLevel.LOCAL_EXECUTION
            )
            
        except subprocess.TimeoutExpired:
            return FallbackResult(
                status=FallbackStatus.TIMEOUT,
                stderr="Execution timed out",
                fallback_level=FallbackLevel.LOCAL_EXECUTION
            )
        except Exception as e:
            logger.error(f"Code execution failed: {e}")
            return FallbackResult(
                status=FallbackStatus.ERROR,
                stderr=str(e),
                fallback_level=FallbackLevel.SIMULATED
            )
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except Exception as e:
        logger.error(f"Fallback system failed: {e}")
        return FallbackResult(
            status=FallbackStatus.ERROR,
            stderr=f"Fallback system error: {e}",
            fallback_level=FallbackLevel.SIMULATED
        )

class SimpleFallbackSystem:
    """Simple fallback system for code execution"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def execute(self, request: Dict[str, Any]) -> FallbackResult:
        """Execute code with fallback"""
        source_code = request.get('source_code', '')
        language = request.get('language', 'python')
        stdin = request.get('stdin', '')
        time_limit = request.get('time_limit', 5)
        
        if language.lower() != 'python':
            return FallbackResult(
                status=FallbackStatus.UNSUPPORTED,
                stderr=f"Language '{language}' not supported in fallback mode",
                fallback_level=FallbackLevel.SIMULATED
            )
        
        return execute_code_with_fallback(source_code, language, stdin, time_limit)
