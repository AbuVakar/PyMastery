#!/bin/bash

# PyMastery Mobile App - Build and Deployment Script
# This script builds the app for iOS and Android deployment

set -e

echo "🚀 PyMastery Mobile App - Build & Deployment Script"
echo "=================================================="

# Configuration
APP_NAME="PyMastery"
APP_SLUG="pymastery"
VERSION="1.0.0"
BUILD_NUMBER="1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the mobile-app directory."
    exit 1
fi

# Check dependencies
log_info "Checking dependencies..."
if ! npm list expo-camera > /dev/null 2>&1; then
    log_warning "Installing missing dependencies..."
    npm install
fi

# Clean previous builds
log_info "Cleaning previous builds..."
rm -rf dist/
rm -rf build/
rm -rf .expo/

# Pre-build checks
log_info "Running pre-build checks..."

# Check if we're logged into Expo
if ! expo whoami > /dev/null 2>&1; then
    log_warning "Not logged into Expo. Please run 'expo login' first."
    exit 1
fi

# Check Android build environment
if command -v adb &> /dev/null; then
    log_success "Android SDK detected"
else
    log_warning "Android SDK not detected. Android build may fail."
fi

# Check iOS build environment (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &> /dev/null; then
        log_success "Xcode detected"
    else
        log_warning "Xcode not detected. iOS build may fail."
    fi
fi

# Build for Android
build_android() {
    log_info "Building for Android..."
    
    # Check if keystore exists
    if [ ! -f "android/app/keystore.jks" ]; then
        log_warning "Android keystore not found. Creating debug keystore..."
        mkdir -p android/app/
        keytool -genkey -v -keystore android/app/keystore.jks -alias pymastery -keyalg RSA -keysize 2048 -validity 10000 -storepass pymastery123 -keypass pymastery123 -dname "CN=PyMastery, OU=Development, O=PyMastery, L=City, S=State, C=US"
    fi
    
    # Build APK
    log_info "Building Android APK..."
    expo build:android --type apk --release-channel production
    
    # Build AAB (recommended for Play Store)
    log_info "Building Android App Bundle..."
    expo build:android --type app-bundle --release-channel production
    
    log_success "Android build completed!"
    log_info "APK and AAB files are available in the build directory."
}

# Build for iOS
build_ios() {
    log_info "Building for iOS..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS build requires macOS."
        return 1
    fi
    
    # Check if we have an Apple Developer account
    if ! expo apple:auth:status > /dev/null 2>&1; then
        log_warning "Not authenticated with Apple. Please run 'expo apple:auth:login' first."
        return 1
    fi
    
    # Build IPA
    log_info "Building iOS IPA..."
    expo build:ios --type archive --release-channel production
    
    log_success "iOS build completed!"
    log_info "IPA file is available in the build directory."
}

# Build for Web
build_web() {
    log_info "Building for Web..."
    
    expo build:web
    
    log_success "Web build completed!"
    log_info "Web build is available in the web-build directory."
}

# Generate app store assets
generate_assets() {
    log_info "Generating app store assets..."
    
    # Create app store screenshots directory
    mkdir -p assets/app-store/
    
    # Generate app store description
    cat > assets/app-store/description.txt << EOF
PyMastery - Master Python Programming

Learn Python programming with our comprehensive mobile app. Features include:
• Interactive coding challenges
• AI-powered mentor
• Real-time code execution
• Study groups and forums
• Progress tracking and analytics
• Offline learning support

Perfect for beginners and experienced developers alike.
EOF
    
    # Generate app store keywords
    cat > assets/app-store/keywords.txt << EOF
python, programming, coding, learn, education, tutorial, development, software, computer science, technology
EOF
    
    log_success "App store assets generated!"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Install test dependencies if needed
    if ! npm list jest > /dev/null 2>&1; then
        npm install --save-dev jest @testing-library/react-native
    fi
    
    # Run tests
    npm test
    
    log_success "Tests completed!"
}

# Main build function
main() {
    log_info "Starting build process for $APP_NAME v$VERSION"
    
    # Parse command line arguments
    case "${1:-all}" in
        "android")
            build_android
            ;;
        "ios")
            build_ios
            ;;
        "web")
            build_web
            ;;
        "assets")
            generate_assets
            ;;
        "test")
            run_tests
            ;;
        "all")
            generate_assets
            run_tests
            build_android
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                build_ios
            else
                log_warning "Skipping iOS build (not on macOS)"
            fi
            
            build_web
            ;;
        *)
            echo "Usage: $0 [android|ios|web|assets|test|all]"
            echo "  android  - Build for Android (APK + AAB)"
            echo "  ios      - Build for iOS (IPA) [macOS only]"
            echo "  web      - Build for Web"
            echo "  assets   - Generate app store assets"
            echo "  test     - Run tests"
            echo "  all      - Build everything (default)"
            exit 1
            ;;
    esac
    
    log_success "Build process completed!"
    log_info "Build artifacts are ready for deployment to app stores."
}

# Run main function
main "$@"
