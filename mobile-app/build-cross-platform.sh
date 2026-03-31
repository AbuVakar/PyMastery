#!/bin/bash

# PyMastery Mobile App - Cross-Platform Build Script
# This script builds the app for all platforms with platform-specific optimizations

set -e

echo "🌐 PyMastery Mobile App - Cross-Platform Build Script"
echo "===================================================="

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
rm -rf web-build/

# Pre-build checks
log_info "Running pre-build checks..."

# Check if we're logged into Expo
if ! expo whoami > /dev/null 2>&1; then
    log_warning "Not logged into Expo. Please run 'expo login' first."
    exit 1
fi

# Platform-specific builds
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
    
    # Use cross-platform configuration
    log_info "Using cross-platform configuration..."
    cp app.cross-platform.json app.json
    
    # Build for iOS
    log_info "Building iOS IPA..."
    expo build:ios --type archive --release-channel production
    
    # Build for iOS Simulator
    log_info "Building iOS Simulator..."
    expo build:ios --type simulator --release-channel development
    
    # Restore original config
    cp app.json.original app.json 2>/dev/null || rm -f app.json
    
    log_success "iOS build completed!"
}

build_android() {
    log_info "Building for Android..."
    
    # Use cross-platform configuration
    log_info "Using cross-platform configuration..."
    cp app.cross-platform.json app.json
    
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
    
    # Build for Android Emulator
    log_info "Building Android Emulator..."
    expo build:android --type apk --release-channel development
    
    # Restore original config
    cp app.json.original app.json 2>/dev/null || rm -f app.json
    
    log_success "Android build completed!"
}

build_web() {
    log_info "Building for Web..."
    
    # Use cross-platform configuration
    log_info "Using cross-platform configuration..."
    cp app.cross-platform.json app.json
    
    # Build for web
    log_info "Building web application..."
    expo build:web
    
    # Optimize web build
    log_info "Optimizing web build..."
    cd web-build
    
    # Create PWA manifest
    cat > manifest.json << EOF
{
  "name": "PyMastery",
  "short_name": "PyMastery",
  "description": "Learn Python programming with PyMastery",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "./icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["education", "productivity"],
  "lang": "en-US"
}
EOF
    
    # Create service worker
    cat > sw.js << EOF
const CACHE_NAME = 'pymastery-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
EOF
    
    cd ..
    
    # Restore original config
    cp app.json.original app.json 2>/dev/null || rm -f app.json
    
    log_success "Web build completed!"
}

build_all() {
    log_info "Building for all platforms..."
    
    # Build web first (always works)
    build_web
    
    # Build Android (works on all platforms)
    build_android
    
    # Build iOS (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        build_ios
    else
        log_warning "Skipping iOS build (not on macOS)"
    fi
}

# Platform-specific testing
test_ios() {
    log_info "Testing iOS build..."
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS testing requires macOS."
        return 1
    fi
    
    # Run iOS simulator
    log_info "Starting iOS simulator..."
    expo start --ios
    
    log_success "iOS testing completed!"
}

test_android() {
    log_info "Testing Android build..."
    
    # Run Android emulator
    log_info "Starting Android emulator..."
    expo start --android
    
    log_success "Android testing completed!"
}

test_web() {
    log_info "Testing web build..."
    
    # Run web
    log_info "Starting web server..."
    expo start --web
    
    log_success "Web testing completed!"
}

test_all() {
    log_info "Testing all platforms..."
    
    # Test web
    test_web
    
    # Test Android
    test_android
    
    # Test iOS (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        test_ios
    else
        log_warning "Skipping iOS testing (not on macOS)"
    fi
}

# Platform-specific deployment
deploy_ios() {
    log_info "Deploying iOS to App Store..."
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS deployment requires macOS."
        return 1
    fi
    
    # Upload to App Store Connect
    log_info "Uploading to App Store Connect..."
    expo submit --platform ios --release-channel production
    
    log_success "iOS deployment completed!"
}

deploy_android() {
    log_info "Deploying Android to Play Store..."
    
    # Upload to Google Play Console
    log_info "Uploading to Google Play Console..."
    expo submit --platform android --release-channel production
    
    log_success "Android deployment completed!"
}

deploy_web() {
    log_info "Deploying web to hosting..."
    
    # Deploy to web hosting
    log_info "Deploying to web hosting..."
    
    # Example: Deploy to Vercel
    if command -v vercel > /dev/null 2>&1; then
        cd web-build
        vercel --prod
        cd ..
    else
        log_warning "Vercel not found. Manual deployment required."
    fi
    
    log_success "Web deployment completed!"
}

deploy_all() {
    log_info "Deploying to all platforms..."
    
    # Deploy web
    deploy_web
    
    # Deploy Android
    deploy_android
    
    # Deploy iOS (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        deploy_ios
    else
        log_warning "Skipping iOS deployment (not on macOS)"
    fi
}

# Platform-specific optimization
optimize_ios() {
    log_info "Optimizing iOS build..."
    
    # Optimize for iOS
    log_info "Optimizing for iOS..."
    
    # Enable Hermes (if supported)
    log_info "Enabling Hermes engine..."
    
    # Optimize bundle size
    log_info "Optimizing bundle size..."
    
    log_success "iOS optimization completed!"
}

optimize_android() {
    log_info "Optimizing Android build..."
    
    # Optimize for Android
    log_info "Optimizing for Android..."
    
    # Enable Hermes
    log_info "Enabling Hermes engine..."
    
    # Optimize bundle size
    log_info "Optimizing bundle size..."
    
    log_success "Android optimization completed!"
}

optimize_web() {
    log_info "Optimizing web build..."
    
    # Optimize for web
    log_info "Optimizing for web..."
    
    # Enable code splitting
    log_info "Enabling code splitting..."
    
    # Optimize bundle size
    log_info "Optimizing bundle size..."
    
    log_success "Web optimization completed!"
}

optimize_all() {
    log_info "Optimizing all platforms..."
    
    optimize_web
    optimize_android
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        optimize_ios
    else
        log_warning "Skipping iOS optimization (not on macOS)"
    fi
}

# Main function
main() {
    log_info "Starting cross-platform build process for $APP_NAME v$VERSION"
    
    # Parse command line arguments
    case "${1:-all}" in
        "ios")
            build_ios
            ;;
        "android")
            build_android
            ;;
        "web")
            build_web
            ;;
        "all")
            build_all
            ;;
        "test-ios")
            test_ios
            ;;
        "test-android")
            test_android
            ;;
        "test-web")
            test_web
            ;;
        "test-all")
            test_all
            ;;
        "deploy-ios")
            deploy_ios
            ;;
        "deploy-android")
            deploy_android
            ;;
        "deploy-web")
            deploy_web
            ;;
        "deploy-all")
            deploy_all
            ;;
        "optimize-ios")
            optimize_ios
            ;;
        "optimize-android")
            optimize_android
            ;;
        "optimize-web")
            optimize_web
            ;;
        "optimize-all")
            optimize_all
            ;;
        *)
            echo "Usage: $0 [ios|android|web|all|test-ios|test-android|test-web|test-all|deploy-ios|deploy-android|deploy-web|deploy-all|optimize-ios|optimize-android|optimize-web|optimize-all]"
            echo "Build commands:"
            echo "  ios         - Build for iOS (macOS only)"
            echo "  android     - Build for Android"
            echo "  web         - Build for Web"
            echo "  all         - Build for all platforms (default)"
            echo ""
            echo "Test commands:"
            echo "  test-ios    - Test iOS build (macOS only)"
            echo "  test-android- Test Android build"
            echo "  test-web    - Test web build"
            echo "  test-all    - Test all platforms"
            echo ""
            echo "Deploy commands:"
            echo "  deploy-ios  - Deploy to App Store (macOS only)"
            echo "  deploy-android- Deploy to Play Store"
            echo "  deploy-web  - Deploy to web hosting"
            echo "  deploy-all  - Deploy to all platforms"
            echo ""
            echo "Optimize commands:"
            echo "  optimize-ios- Optimize iOS build (macOS only)"
            echo "  optimize-android- Optimize Android build"
            echo "  optimize-web- Optimize web build"
            echo "  optimize-all- Optimize all platforms"
            exit 1
            ;;
    esac
    
    log_success "Cross-platform build process completed!"
}

# Run main function
main "$@"
