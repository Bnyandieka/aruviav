# Capacitor Setup Guide - Convert Shopki to Mobile App

## Overview
This guide will help you convert your Shopki React web app to iOS and Android native apps using Capacitor, while keeping your website static.

---

## Prerequisites
- **Node.js** (v14+) and npm installed
- **Java Development Kit (JDK)** 11+ for Android
- **Xcode** for iOS (Mac only)
- **Android Studio** for Android development

---

## Step 1: Install Capacitor in Your Project

```bash
cd c:\Users\ADMIN\Documents\shopki

# Install Capacitor CLI and core packages
npm install @capacitor/core
npm install -D @capacitor/cli
```

---

## Step 2: Initialize Capacitor

```bash
# Initialize Capacitor (follow prompts)
npx cap init

# When prompted:
# - App name: Aruviah (or your app name)
# - App ID: com.aruviah.app (or your domain reversed)
# - Directory: build (this is your React build output)
# - Web assets folder: build
```

---

## Step 3: Build Your React App

Before adding platforms, build your React app:

```bash
npm run build
```

This creates the optimized build folder that Capacitor will use.

---

## Step 4: Add iOS Platform

**Requirements: macOS with Xcode**

```bash
npm install @capacitor/ios
npx cap add ios

# Open iOS project in Xcode
npx cap open ios
```

---

## Step 5: Add Android Platform

**Requirements: Android Studio & JDK 11+**

```bash
npm install @capacitor/android
npx cap add android

# Open Android project in Android Studio
npx cap open android
```

---

## Step 6: Essential Capacitor Plugins

Install common plugins your app will need:

```bash
# Storage/Preferences
npm install @capacitor/preferences

# Camera access (if needed)
npm install @capacitor/camera

# Geolocation (if needed)
npm install @capacitor/geolocation

# Network status
npm install @capacitor/network

# Push notifications (for email/order alerts)
npm install @capacitor/push-notifications

# Sync permissions to platforms
npx cap sync
```

---

## Step 7: Update capacitor.config.ts

Create or update `capacitor.config.ts` in your root:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aruviah.app',
  appName: 'Aruviah',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#FFFFFF'
    }
  }
};

export default config;
```

---

## Step 8: Update npm Scripts

Add scripts to `package.json` for easier development:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "build:mobile": "npm run build && npx cap sync",
    "ios": "npm run build:mobile && npx cap open ios",
    "android": "npm run build:mobile && npx cap open android",
    "sync:ios": "npx cap sync ios",
    "sync:android": "npx cap sync android"
  }
}
```

---

## Development Workflow

### For Web (Keep Static)
```bash
npm start          # Runs on localhost:3000
npm run build      # Production build for website
```

### For Mobile Development
```bash
# Build React and sync to mobile
npm run build:mobile

# Open iOS in Xcode
npx cap open ios
# Then build and run from Xcode

# OR Open Android in Android Studio
npx cap open android
# Then build and run from Android Studio
```

### When You Make Code Changes
```bash
# Rebuild and sync changes to mobile platforms
npm run build:mobile
npx cap sync ios     # For iOS
npx cap sync android # For Android
```

---

## Key Capacitor Features You'll Use

### 1. **Preferences** (Replaces localStorage)
```typescript
import { Preferences } from '@capacitor/preferences';

// Store data
await Preferences.set({
  key: 'user_id',
  value: userId
});

// Get data
const { value } = await Preferences.get({ key: 'user_id' });
```

### 2. **Network Status**
```typescript
import { Network } from '@capacitor/network';

const checkNetwork = async () => {
  const status = await Network.getStatus();
  console.log('Connected:', status.connected);
};
```

### 3. **Push Notifications**
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Register for push notifications
await PushNotifications.requestPermissions();
await PushNotifications.register();
```

### 4. **Share** (Native sharing)
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  title: 'Check this product',
  text: 'I found an amazing product on Aruviah',
  url: 'https://aruviah.com/product/123'
});
```

---

## File Structure After Setup

```
shopki/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── context/
│   └── App.jsx
├── build/                 # React build output
│   └── index.html
├── ios/                   # iOS Xcode project
├── android/               # Android Studio project
├── capacitor.config.ts
├── package.json
└── ...
```

---

## Deployment

### iOS (App Store)
1. Open `ios/App/App.xcworkspace` in Xcode
2. Configure signing certificates
3. Build and archive
4. Submit to App Store Connect

### Android (Google Play)
1. Open `android/app` in Android Studio
2. Build > Generate Signed Bundle / APK
3. Sign with your keystore
4. Upload to Google Play Console

---

## Troubleshooting

### App shows blank screen
- Ensure `webDir: 'build'` in capacitor.config.ts
- Check browser console in DevTools (Cmd+Alt+I on Mac, F12 on Windows/Linux)

### Plugins not working
```bash
npx cap sync     # Resync all plugins
npx cap doctor   # Check for issues
```

### Changes not reflecting in mobile app
```bash
npm run build:mobile
npx cap sync ios/android
# Then rebuild in Xcode/Android Studio
```

---

## Next Steps

1. ✅ Install Capacitor
2. ✅ Add iOS/Android platforms
3. ✅ Test on simulator/emulator
4. ✅ Install native plugins as needed
5. ✅ Test web/native features
6. ✅ Build and submit to app stores

---

## Resources
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS App Store Submission](https://developer.apple.com/app-store/)
- [Google Play Console](https://play.google.com/console/)

