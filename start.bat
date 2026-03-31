@echo off
REM PyMastery Development Startup Script for Windows

setlocal enabledelayedexpansion

echo PyMastery Development Startup Script
echo ==================================
echo.

REM Colors for output (limited in Windows)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Skip over functions
goto main

REM Function to check if directory exists
:check_directory
if not exist "%~1" (
    echo %ERROR% %~1 directory not found!
    exit /b 1
)
goto :eof

REM Function to check if file exists
:check_file
if not exist "%~1" (
    echo %WARNING% %~1 file not found, copying from example
    if exist "%~2" (
        copy "%~2" "%~1" >nul
    )
)
goto :eof

:main
REM Main execution
echo Checking directories...

call :check_directory "frontend"
call :check_directory "backend"

echo Checking environment files...
call :check_file "frontend\.env" "frontend\.env.example"
call :check_file "backend\.env" "backend\.env.example"

echo Checking dependencies...

REM Check frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

REM Check backend dependencies
if not exist "backend\.venv" (
    echo Setting up Python virtual environment...
    cd backend
    python -m venv .venv
    call .venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

echo Starting PyMastery services...

REM Start backend
echo Starting backend...
cd backend
start /B cmd /c "call .venv\Scripts\activate && python start.py"
set BACKEND_PID=%ERRORLEVEL%
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Check if backend is healthy
curl -f http://localhost:8001/api/health >nul 2>&1
if !errorlevel! equ 0 (
    echo %SUCCESS% Backend is healthy!
) else (
    echo %ERROR% Backend failed to start!
    exit /b 1
)

REM Start frontend
echo Starting frontend...
cd frontend
start /B cmd /c "npm run dev:quiet"
set FRONTEND_PID=%ERRORLEVEL%
cd ..

echo %SUCCESS% PyMastery is starting up!
echo.
echo Services:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8001
echo   API Docs: http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop all services
echo.

REM Keep script running
pause
