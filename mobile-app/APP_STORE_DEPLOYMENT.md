# 📱 PyMastery Mobile App - App Store Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the PyMastery mobile app to the Apple App Store and Google Play Store.

## 📋 Prerequisites

### 🔧 Development Environment
- **Node.js** 16+ installed
- **Expo CLI** installed (`npm install -g @expo/cli`)
- **Expo account** (free tier is sufficient)
- **Git** for version control

### 🍎 iOS Deployment Requirements
- **macOS** computer (required for iOS builds)
- **Xcode** 13+ installed
- **Apple Developer Account** ($99/year)
- **iOS device** for testing (optional but recommended)

### 🤖 Android Deployment Requirements
- **Android Studio** installed
- **Java Development Kit** (JDK) 8+
- **Android SDK** installed
- **Google Play Developer Account** ($25 one-time)

---

## 🚀 Quick Start

### 1. Build the App

#### For Android (Windows/macOS/Linux)
```bash
cd mobile-app
./build-and-deploy.bat android
```

#### For iOS (macOS only)
```bash
cd mobile-app
./build-and-deploy.sh ios
```

#### For Web
```bash
cd mobile-app
./build-and-deploy.sh web
```

#### For Everything
```bash
cd mobile-app
./build-and-deploy.sh all
```

---

## 📱 Google Play Store Deployment

### Step 1: Prepare Your App

1. **Update App Information**
   ```bash
   # Edit app.json with your app details
   cd mobile-app
   # Update name, slug, version, and package name
   ```

2. **Generate App Bundle**
   ```bash
   expo build:android --type app-bundle --release-channel production
   ```

3. **Download the AAB file**
   - The build will be available in your browser
   - Save the `.aab` file to your computer

### Step 2: Create Google Play Console Account

1. **Sign up** at [Google Play Console](https://play.google.com/console/signup/)
2. **Pay the $25 registration fee**
3. **Complete your developer profile**

### Step 3: Create Your App

1. **Click "Create App"** in the Play Console
2. **Select app type**: "App" (not game)
3. **Enter app details**:
   - App name: "PyMastery"
   - Default language: English
   - Free or paid: Free
   - App category: Education

### Step 4: Store Listing

1. **App details**:
   - App name: PyMastery
   - Short description: "Master Python programming with interactive lessons"
   - Full description: Use the content from `assets/app-store/description.txt`

2. **Graphics**:
   - App icon: Use `assets/icon.png`
   - Feature graphic: 1024x500px image
   - Screenshots: 2-8 screenshots (320x3840px for phones)

3. **Categorization**:
   - Application type: Application
   - Category: Education
   - Content rating: Everyone

### Step 5: Content Rating

1. **Complete the questionnaire**
2. **Get content rating certificate**
3. **Submit for review**

### Step 6: App Content

1. **Target audience**: Everyone
2. **Content**: No sensitive content
3. **Privacy policy**: Add your privacy policy URL

### Step 7: Pricing & Distribution

1. **Free app**: No pricing needed
2. **Availability**: All countries
3. **Distribution**: Google Play Store only

### Step 8: Release Management

1. **Create internal test** (optional)
2. **Upload your AAB file**:
   - Drag and drop the `.aab` file
   - Wait for processing
   - Check for any issues

3. **Create release track**:
   - Choose "Production" or "Open Testing"
   - Add release notes
   - Roll out percentage: 100%

4. **Review and publish**:
   - Review all information
   - Click "Publish"
   - Wait for Google review (usually 1-3 days)

---

## 🍎 Apple App Store Deployment

### Step 1: Prepare Your App

1. **Update App Configuration**
   ```bash
   cd mobile-app
   # Update app.json with iOS-specific settings
   ```

2. **Generate IPA File**
   ```bash
   expo build:ios --type archive --release-channel production
   ```

3. **Download the IPA file**
   - The build will be available in your browser
   - Save the `.ipa` file to your computer

### Step 2: Apple Developer Account Setup

1. **Enroll** at [Apple Developer Program](https://developer.apple.com/programs/)
2. **Pay the $99 annual fee**
3. **Complete your developer profile**

### Step 3: Create App ID

1. **Sign in** to [Apple Developer Portal](https://developer.apple.com/)
2. **Go to Certificates, Identifiers & Profiles**
3. **Create App ID**:
   - Description: PyMastery
   - Bundle ID: com.pymastery.app
   - Capabilities: Push Notifications, Location Services, Camera

### Step 4: Create Distribution Certificate

1. **Generate Certificate Signing Request (CSR)**:
   ```bash
   # On Mac
   Keychain Access > Certificate Assistant > Request a Certificate
   ```

2. **Create Distribution Certificate**:
   - Upload CSR to Apple Developer Portal
   - Download the certificate
   - Install in Keychain Access

### Step 5: Create Provisioning Profile

1. **Create Distribution Profile**:
   - Select App ID: com.pymastery.app
   - Select Distribution Certificate
   - Download the profile
   - Install in Xcode

### Step 6: Prepare App in Xcode

1. **Open Xcode**
2. **Create new project** (or open existing)
3. **Set Bundle ID**: com.pymastery.app
4. **Set team**: Your Apple Developer team
5. **Configure capabilities**:
   - Push Notifications
   - Location Services
   - Camera
   - Photo Library

### Step 7: Archive and Upload

1. **Build and archive**:
   ```bash
   # Or use Xcode
   Product > Archive
   ```

2. **Upload to App Store Connect**:
   - Select the archive
   - Click "Upload to App Store"
   - Wait for processing

### Step 8: App Store Connect Setup

1. **Sign in** to [App Store Connect](https://appstoreconnect.apple.com/)
2. **Create new app**:
   - Platform: iOS
   - Name: PyMastery
   - Primary Language: English
   - Bundle ID: com.pymastery.app
   - SKU: PYMASTERY001

3. **App Information**:
   - App name: PyMastery
   - Subtitle: Master Python Programming
   - Description: Use content from `assets/app-store/description.txt`
   - Keywords: Use content from `assets/app-store/keywords.txt`
   - Support URL: Your support website
   - Marketing URL: Your marketing website
   - Privacy Policy URL: Your privacy policy

4. **Pricing and Availability**:
   - Price: Free
   - Availability: All countries

5. **App Privacy**:
   - Complete privacy questionnaire
   - No data collection (if applicable)

6. **App Store Information**:
   - Category: Education
   - Age Rating: 4+
   - Size: Automatic from build

7. **Screenshots**:
   - iPhone: 6.7" Display (1290x2796px)
   - iPad: 12.9" Display (2048x2732px)
   - Required: At least one iPhone screenshot

8. **App Review Information**:
   - Demo account: Test credentials
   - Notes: Any special instructions

### Step 9: Submit for Review

1. **Create new version**:
   - Version: 1.0.0
   - What's new: "Initial release"

2. **Add build**:
   - Select the uploaded build
   - Wait for processing

3. **Submit for review**:
   - Review all information
   - Click "Submit for Review"
   - Wait for Apple review (usually 1-7 days)

---

## 🔧 Build Configuration

### Environment Variables

Create a `.env.production` file:
```bash
# App Configuration
APP_NAME=PyMastery
APP_SLUG=pymastery
APP_VERSION=1.0.0
BUILD_NUMBER=1

# API Configuration
API_BASE_URL=https://api.pymastery.com
API_VERSION=v1

# Analytics
ANALYTICS_ENABLED=true
SENTRY_DSN=your_sentry_dsn

# Features
CAMERA_ENABLED=true
LOCATION_ENABLED=true
NOTIFICATIONS_ENABLED=true
BIOMETRIC_ENABLED=true

# Build Configuration
ENVIRONMENT=production
NODE_ENV=production
```

### App Configuration (app.json)

```json
{
  "expo": {
    "name": "PyMastery",
    "slug": "pymastery",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pymastery.app",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera for profile pictures and code scanning",
        "NSLocationWhenInUseUsageDescription": "This app uses location for location-based learning features",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "This app uses location for location-based learning features",
        "NSMicrophoneUsageDescription": "This app uses microphone for voice features",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library for profile pictures"
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "package": "com.pymastery.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      ["expo-camera"],
      ["expo-location"],
      ["expo-notifications"]
    ]
  }
}
```

---

## 📊 App Store Assets

### Required Assets

#### Icons
- **App Icon**: 1024x1024px PNG
- **Adaptive Icon**: Various sizes for Android
- **Notification Icon**: 96x96px PNG

#### Screenshots
- **iPhone**: 1290x2796px (6.7" Display)
- **iPad**: 2048x2732px (12.9" Display)
- **Android**: Various sizes (320x3840px to 1440x2560px)

#### Feature Graphics
- **Google Play**: 1024x500px JPG/PNG
- **App Store**: Not required but recommended

### Asset Generation

Use the provided build script to generate basic assets:
```bash
./build-and-deploy.sh assets
```

---

## 🔍 Testing Before Release

### 1. Functional Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### 2. Device Testing
- **Real device testing** on multiple devices
- **Different screen sizes** and resolutions
- **Different OS versions** (iOS 14+, Android 8+)

### 3. Performance Testing
- **Memory usage** monitoring
- **Battery usage** testing
- **Network performance** testing

### 4. Store Compliance Testing
- **Content rating** compliance
- **Privacy policy** compliance
- **Terms of service** compliance

---

## 🚀 Post-Launch Checklist

### 1. Monitoring Setup
- **Analytics integration** (Firebase Analytics, etc.)
- **Crash reporting** (Sentry, etc.)
- **Performance monitoring** (New Relic, etc.)

### 2. User Support
- **Support email** setup
- **FAQ section** in app
- **Help documentation**

### 3. Marketing
- **App store optimization** (ASO)
- **Social media** promotion
- **Website integration**

### 4. Updates
- **Version management** strategy
- **Update schedule** planning
- **Feature rollout** planning

---

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
- **Check dependencies**: `npm install`
- **Clear cache**: `expo start --clear`
- **Update Expo CLI**: `npm install -g @expo/cli@latest`

#### Permission Issues
- **Check app.json** permissions configuration
- **Verify platform-specific** permission requirements
- **Test on real devices** not just simulators

#### Store Rejection
- **Review store guidelines** carefully
- **Check content rating** compliance
- **Verify all required assets** are provided

#### Performance Issues
- **Profile the app** with React Native tools
- **Optimize images** and assets
- **Reduce bundle size** with code splitting

### Support Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer/
- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)
- **Downloads**: Track daily/weekly/monthly downloads
- **Active Users**: Monitor daily/monthly active users
- **Retention Rate**: Measure user retention over time
- **App Store Rating**: Monitor ratings and reviews
- **Crash Rate**: Track app stability
- **Load Time**: Monitor app performance

### Analytics Integration
```bash
# Install analytics
npm install @react-native-firebase/analytics

# Install crash reporting
npm install @sentry/react-native
```

---

## 🎉 Conclusion

Congratulations! Your PyMastery mobile app is now ready for deployment to the Apple App Store and Google Play Store. Follow this guide carefully to ensure a smooth deployment process.

Remember to:
1. **Test thoroughly** before submission
2. **Follow store guidelines** strictly
3. **Monitor performance** after launch
4. **Update regularly** with improvements

Good luck with your app launch! 🚀
