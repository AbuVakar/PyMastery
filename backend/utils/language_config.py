"""
Language Configuration for Code Execution Fallback System
Defines supported languages, their requirements, and execution settings
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class LanguageType(Enum):
    """Language type categories"""
    INTERPRETED = "interpreted"
    COMPILED = "compiled"
    HYBRID = "hybrid"

class ExecutionEnvironment(Enum):
    """Execution environment types"""
    LOCAL = "local"
    DOCKER = "docker"
    SANDBOX = "sandbox"
    WEB = "web"

@dataclass
class LanguageConfig:
    """Configuration for a programming language"""
    name: str
    extensions: List[str]
    compiler: Optional[str] = None
    interpreter: Optional[str] = None
    language_type: LanguageType = LanguageType.INTERPRETED
    execution_env: ExecutionEnvironment = ExecutionEnvironment.LOCAL
    version_check_command: Optional[str] = None
    compilation_command: Optional[str] = None
    execution_command: Optional[str] = None
    file_suffix: Optional[str] = None
    memory_limit_mb: int = 128
    time_limit_seconds: int = 5
    security_level: str = "medium"  # low, medium, high
    requires_compilation: bool = False
    supports_stdin: bool = True
    supports_file_operations: bool = False

# Language configurations
LANGUAGE_CONFIGS: Dict[str, LanguageConfig] = {
    "python": LanguageConfig(
        name="Python",
        extensions=[".py"],
        interpreter="python3",
        language_type=LanguageType.INTERPRETED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="python3 --version",
        execution_command="python3",
        file_suffix=".py",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=False,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "javascript": LanguageConfig(
        name="JavaScript",
        extensions=[".js", ".mjs"],
        interpreter="node",
        language_type=LanguageType.INTERPRETED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="node --version",
        execution_command="node",
        file_suffix=".js",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=False,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "java": LanguageConfig(
        name="Java",
        extensions=[".java"],
        compiler="javac",
        interpreter="java",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="java -version",
        compilation_command="javac",
        execution_command="java",
        file_suffix=".java",
        memory_limit_mb=512,
        time_limit_seconds=15,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "cpp": LanguageConfig(
        name="C++",
        extensions=[".cpp", ".cc", ".cxx"],
        compiler="g++",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="g++ --version",
        compilation_command="g++",
        execution_command="",
        file_suffix=".cpp",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "c": LanguageConfig(
        name="C",
        extensions=[".c"],
        compiler="gcc",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="gcc --version",
        compilation_command="gcc",
        execution_command="",
        file_suffix=".c",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "go": LanguageConfig(
        name="Go",
        extensions=[".go"],
        compiler="go",
        interpreter="go",
        language_type=LanguageType.HYBRID,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="go version",
        compilation_command="go build",
        execution_command="go run",
        file_suffix=".go",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=False,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "rust": LanguageConfig(
        name="Rust",
        extensions=[".rs"],
        compiler="rustc",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="rustc --version",
        compilation_command="rustc",
        execution_command="",
        file_suffix=".rs",
        memory_limit_mb=512,
        time_limit_seconds=15,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "ruby": LanguageConfig(
        name="Ruby",
        extensions=[".rb"],
        interpreter="ruby",
        language_type=LanguageType.INTERPRETED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="ruby --version",
        execution_command="ruby",
        file_suffix=".rb",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=False,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "php": LanguageConfig(
        name="PHP",
        extensions=[".php"],
        interpreter="php",
        language_type=LanguageType.INTERPRETED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="php --version",
        execution_command="php",
        file_suffix=".php",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=False,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "typescript": LanguageConfig(
        name="TypeScript",
        extensions=[".ts"],
        compiler="tsc",
        interpreter="node",
        language_type=LanguageType.HYBRID,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="tsc --version",
        compilation_command="tsc",
        execution_command="node",
        file_suffix=".ts",
        memory_limit_mb=256,
        time_limit_seconds=10,
        security_level="medium",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=True
    ),
    
    "csharp": LanguageConfig(
        name="C#",
        extensions=[".cs"],
        compiler="mcs",
        interpreter="mono",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="mcs --version",
        compilation_command="mcs",
        execution_command="mono",
        file_suffix=".cs",
        memory_limit_mb=512,
        time_limit_seconds=15,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "swift": LanguageConfig(
        name="Swift",
        extensions=[".swift"],
        compiler="swiftc",
        language_type=LanguageType.COMPILED,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="swift --version",
        compilation_command="swiftc",
        execution_command="",
        file_suffix=".swift",
        memory_limit_mb=512,
        time_limit_seconds=15,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    ),
    
    "kotlin": LanguageConfig(
        name="Kotlin",
        extensions=[".kt", ".kts"],
        compiler="kotlinc",
        interpreter="kotlin",
        language_type=LanguageType.HYBRID,
        execution_env=ExecutionEnvironment.LOCAL,
        version_check_command="kotlinc -version",
        compilation_command="kotlinc",
        execution_command="kotlin",
        file_suffix=".kt",
        memory_limit_mb=512,
        time_limit_seconds=15,
        security_level="high",
        requires_compilation=True,
        supports_stdin=True,
        supports_file_operations=False
    )
}

class LanguageManager:
    """Manages language configurations and execution capabilities"""
    
    def __init__(self):
        self.supported_languages = list(LANGUAGE_CONFIGS.keys())
        self.language_configs = LANGUAGE_CONFIGS
    
    def get_language_config(self, language: str) -> Optional[LanguageConfig]:
        """Get configuration for a specific language"""
        return self.language_configs.get(language.lower())
    
    def is_language_supported(self, language: str) -> bool:
        """Check if a language is supported"""
        return language.lower() in self.supported_languages
    
    def get_supported_languages(self) -> List[str]:
        """Get list of all supported languages"""
        return self.supported_languages.copy()
    
    def get_languages_by_type(self, language_type: LanguageType) -> List[str]:
        """Get languages filtered by type"""
        return [
            lang for lang, config in self.language_configs.items()
            if config.language_type == language_type
        ]
    
    def get_languages_by_environment(self, execution_env: ExecutionEnvironment) -> List[str]:
        """Get languages filtered by execution environment"""
        return [
            lang for lang, config in self.language_configs.items()
            if config.execution_env == execution_env
        ]
    
    def validate_language_requirements(self, language: str) -> Dict[str, any]:
        """Validate if requirements for a language are met"""
        config = self.get_language_config(language)
        if not config:
            return {
                "valid": False,
                "error": f"Language {language} not supported"
            }
        
        validation_result = {
            "valid": True,
            "language": language,
            "config": config,
            "requirements_met": {},
            "warnings": []
        }
        
        # Check compiler/interpreter availability
        if config.compiler:
            try:
                import subprocess
                result = subprocess.run(
                    [config.version_check_command or config.compiler, "--version"],
                    capture_output=True,
                    timeout=5
                )
                validation_result["requirements_met"]["compiler_available"] = result.returncode == 0
            except Exception:
                validation_result["requirements_met"]["compiler_available"] = False
                validation_result["warnings"].append(f"Compiler {config.compiler} not available")
        
        if config.interpreter:
            try:
                import subprocess
                result = subprocess.run(
                    [config.version_check_command or config.interpreter, "--version"],
                    capture_output=True,
                    timeout=5
                )
                validation_result["requirements_met"]["interpreter_available"] = result.returncode == 0
            except Exception:
                validation_result["requirements_met"]["interpreter_available"] = False
                validation_result["warnings"].append(f"Interpreter {config.interpreter} not available")
        
        return validation_result
    
    def get_execution_command(self, language: str, file_path: str) -> List[str]:
        """Get execution command for a language"""
        config = self.get_language_config(language)
        if not config:
            return []
        
        if config.requires_compilation:
            if language == "java":
                # Special case for Java
                class_name = "Main"  # Default class name
                return ["java", "-cp", str(file_path.parent), class_name]
            elif config.execution_command:
                return [config.execution_command, str(file_path)]
            else:
                return []
        else:
            if config.execution_command:
                return [config.execution_command, str(file_path)]
            else:
                return []
    
    def get_compilation_command(self, language: str, source_file: str, output_file: str) -> List[str]:
        """Get compilation command for a language"""
        config = self.get_language_config(language)
        if not config or not config.compilation_command:
            return []
        
        if language == "cpp" or language == "c":
            return [config.compilation_command, "-o", output_file, source_file]
        elif language == "java":
            return [config.compilation_command, source_file]
        elif language == "rust":
            return [config.compilation_command, "-o", output_file, source_file]
        else:
            return [config.compilation_command, source_file]

# Global language manager instance
language_manager = LanguageManager()

def get_language_config(language: str) -> Optional[LanguageConfig]:
    """Get language configuration (convenience function)"""
    return language_manager.get_language_config(language)

def is_language_supported(language: str) -> bool:
    """Check if language is supported (convenience function)"""
    return language_manager.is_language_supported(language)

def get_supported_languages() -> List[str]:
    """Get all supported languages (convenience function)"""
    return language_manager.get_supported_languages()
