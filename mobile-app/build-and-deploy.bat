@echo off
REM PyMastery Mobile App - Windows Build and Deployment Script
REM This script builds the app for iOS and Android deployment on Windows

setlocal enabledelayedexpansion

echo 🚀 PyMastery Mobile App - Build & Deployment Script
echo ==================================================

REM Configuration
set APP_NAME=PyMastery
set APP_SLUG=pymastery
set VERSION=1.0.0
set BUILD_NUMBER=1

REM Helper functions
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM Check if we're in the right directory
if not exist package.json (
    call :log_error "package.json not found. Please run this script from the mobile-app directory."
    exit /b 1
)

REM Check dependencies
call :log_info "Checking dependencies..."
npm list expo-camera >nul 2>&1
if errorlevel 1 (
    call :log_warning "Installing missing dependencies..."
    npm install
)

REM Clean previous builds
call :log_info "Cleaning previous builds..."
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist .expo rmdir /s /q .expo

REM Pre-build checks
call :log_info "Running pre-build checks..."

REM Check if we're logged into Expo
expo whoami >nul 2>&1
if errorlevel 1 (
    call :log_warning "Not logged into Expo. Please run 'expo login' first."
    exit /b 1
)

REM Check Android build environment
where adb >nul 2>&1
if not errorlevel 1 (
    call :log_success "Android SDK detected"
) else (
    call :log_warning "Android SDK not detected. Android build may fail."
)

REM Build for Android
:build_android
call :log_info "Building for Android..."

REM Check if keystore exists
if not exist android\app\keystore.jks (
    call :log_warning "Android keystore not found. Creating debug keystore..."
    if not exist android\app mkdir android\app
    keytool -genkey -v -keystore android\app\keystore.jks -alias pymastery -keyalg RSA -keysize 2048 -validity 10000 -storepass pymastery123 -keypass pymastery123 -dname "CN=PyMastery, OU=Development, O=PyMastery, L=City, S=State, C=US"
    if errorlevel 1 (
        call :log_error "Failed to create keystore. Please ensure Java is installed and keytool is in PATH."
        exit /b 1
    )
)

REM Build APK
call :log_info "Building Android APK..."
expo build:android --type apk --release-channel production
if errorlevel 1 (
    call :log_error "Android APK build failed."
    exit /b 1
)

REM Build AAB (recommended for Play Store)
call :log_info "Building Android App Bundle..."
expo build:android --type app-bundle --release-channel production
if errorlevel 1 (
    call :log_error "Android App Bundle build failed."
    exit /b 1
)

call :log_success "Android build completed!"
call :log_info "APK and AAB files are available in the build directory."
goto :eof

REM Build for Web
:build_web
call :log_info "Building for Web..."
expo build:web
if errorlevel 1 (
    call :log_error "Web build failed."
    exit /b 1
)

call :log_success "Web build completed!"
call :log_info "Web build is available in the web-build directory."
goto :eof

REM Generate app store assets
:generate_assets
call :log_info "Generating app store assets..."

REM Create app store screenshots directory
if not exist assets\app-store mkdir assets\app-store

REM Generate app store description
echo PyMastery - Master Python Programming > assets\app-store\description.txt
echo. >> assets\app-store\description.txt
echo Learn Python programming with our comprehensive mobile app. Features include: >> assets\app-store\description.txt
echo • Interactive coding challenges >> assets\app-store\description.txt
echo • AI-powered mentor >> assets\app-store\description.txt
echo • Real-time code execution >> assets\app-store\description.txt
echo • Study groups and forums >> assets\app-store\description.txt
echo • Progress tracking and analytics >> assets\app-store\description.txt
echo • Offline learning support >> assets\app-store\description.txt
echo. >> assets\app-store\description.txt
echo Perfect for beginners and experienced developers alike. >> assets\app-store\description.txt

REM Generate app store keywords
echo python, programming, coding, learn, education, tutorial, development, software, computer science, technology > assets\app-store\keywords.txt

call :log_success "App store assets generated!"
goto :eof

REM Run tests
:run_tests
call :log_info "Running tests..."

REM Install test dependencies if needed
npm list jest >nul 2>&1
if errorlevel 1 (
    npm install --save-dev jest @testing-library/react-native
)

REM Run tests
npm test
if errorlevel 1 (
    call :log_warning "Some tests failed."
) else (
    call :log_success "All tests passed!"
)
goto :eof

REM Main build function
:main
call :log_info "Starting build process for %APP_NAME% v%VERSION%"

REM Parse command line arguments
if "%1"=="" set BUILD_TYPE=all
if "%1"=="" set BUILD_TYPE=all
if not "%1"=="" set BUILD_TYPE=%1

if "%BUILD_TYPE%"=="android" (
    call :build_android
) else if "%BUILD_TYPE%"=="web" (
    call :build_web
) else if "%BUILD_TYPE%"=="assets" (
    call :generate_assets
) else if "%BUILD_TYPE%"=="test" (
    call :run_tests
) else if "%BUILD_TYPE%"=="all" (
    call :generate_assets
    call :run_tests
    call :build_android
    call :build_web
    
    call :log_info "iOS build skipped (Windows platform)"
) else (
    echo Usage: %0 [android^|web^|assets^|test^|all]
    echo   android  - Build for Android (APK + AAB)
    echo   web      - Build for Web
    echo   assets   - Generate app store assets
    echo   test     - Run tests
    echo   all      - Build everything (default)
    exit /b 1
)

call :log_success "Build process completed!"
call :log_info "Build artifacts are ready for deployment to app stores."
goto :eof

REM Run main function
call :main %1
