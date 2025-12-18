# Learning Platform - React Native Mobile App

A mobile learning platform built with React Native, featuring topics, resources, progress tracking, and voice conversations. This is a **UI prototype** ready for backend integration.

## 🎯 Overview

This app has been converted from a web application to a React Native mobile app prototype. It includes:

- ✅ Full mobile UI with native components
- ✅ Navigation system (React Navigation)
- ✅ Local storage with AsyncStorage
- ✅ Mock data for prototyping
- ✅ Stub implementations for Supabase and LiveKit
- ✅ Comprehensive integration guide for developers

## 📱 Features

- **User Authentication**: Simple username-based auth with AsyncStorage
- **Topic Selection**: Browse and unlock topics based on progress
- **Resource Management**: Track resources with start/complete states
- **Progress Tracking**: Visual progress bars and completion tracking
- **Voice Conversations**: Mock UI ready for LiveKit integration
- **Offline Support**: Works with mock data, syncs when backend is integrated

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- React Native development environment
  - **iOS**: Xcode 14+ and CocoaPods
  - **Android**: Android Studio and SDK

### Installation

```bash
# Install dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
project-dashboard-ui/
├── App.js                          # Main app component
├── index.js                        # React Native entry point
├── app.json                        # App metadata
├── babel.config.js                 # Babel configuration
├── metro.config.js                 # Metro bundler config
├── package.json                    # Dependencies
│
├── src/
│   ├── components/                 # React Native components
│   │   ├── Icons.jsx              # SVG icons (react-native-svg)
│   │   ├── UsernameScreen.jsx     # Username input screen
│   │   ├── TopicSelection.jsx     # Topics grid with ScrollView
│   │   ├── ResourceList.jsx       # Resources with FlatList
│   │   └── VoiceConversation.jsx  # Mock voice conversation UI
│   │
│   ├── context/
│   │   └── ProgressContext.jsx    # Progress tracking (AsyncStorage)
│   │
│   ├── data/
│   │   └── mockData.js            # Mock topics and resources
│   │
│   ├── lib/
│   │   ├── dataApi.js             # Data fetching (mock/Supabase)
│   │   ├── supabaseClient.js      # Supabase stub
│   │   └── livekitClient.js       # LiveKit stub
│   │
│   ├── navigation/
│   │   └── AppNavigator.jsx       # Stack Navigator
│   │
│   └── styles/
│       ├── theme.js               # Theme colors and constants
│       └── commonStyles.js        # Shared StyleSheet styles
│
├── INTEGRATION_GUIDE.md           # Developer integration guide
└── README.md                      # This file
```

## 🔧 Key Conversions from Web to Mobile

| Web Technology | React Native Replacement |
|----------------|-------------------------|
| `<div>` | `<View>` |
| `<button>` | `<TouchableOpacity>` |
| `<p>`, `<h1>`, `<h2>` | `<Text>` |
| `<input>` | `<TextInput>` |
| `localStorage` | `AsyncStorage` |
| CSS / inline styles | `StyleSheet.create()` |
| React Router | React Navigation |
| SVG | `react-native-svg` |
| Hover effects | Press states |
| `backgroundImage` | `<ImageBackground>` |

## 🎨 UI Components

### UsernameScreen
- TextInput with keyboard handling
- KeyboardAvoidingView for iOS
- AsyncStorage for persistence

### TopicSelection
- ScrollView with topic cards
- ImageBackground for topic images
- Progress bars with percentage
- Lock/unlock logic based on completion

### ResourceList
- FlatList for performance
- Expandable resource cards
- Thumbnail with press to open
- Status tracking (Start → Complete → Conversation)

### VoiceConversation
- Mock UI with timer
- Animated pulse indicator
- Microphone toggle (UI only)
- Ready for LiveKit integration

## 📊 Data Flow

```
┌─────────────────┐
│  AsyncStorage   │  ← Local persistence
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ ProgressContext │  ← State management
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Components    │  ← UI rendering
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    dataApi      │  ← Mock data (ready for Supabase)
└─────────────────┘
```

## 🔗 Backend Integration

This is a **UI prototype** using mock data. To integrate with your backend:

### 1. Supabase Integration
See **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** for detailed instructions on:
- Setting up Supabase client
- Database schema
- Replacing mock data with real API calls

### 2. LiveKit Integration
See **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** for:
- Installing LiveKit dependencies
- Setting up iOS/Android permissions
- Creating token endpoint
- Replacing mock voice UI with real WebRTC

### 3. Environment Variables
Create `.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
LIVEKIT_API_URL=https://your-backend.com/api/livekit-token
```

## 📱 Mobile-Specific Features

### Touch Targets
All interactive elements meet the **44x44 point minimum** (iOS HIG standard)

### Safe Areas
Uses `SafeAreaView` to avoid notches and home indicators

### Keyboard Handling
- `KeyboardAvoidingView` for text inputs
- Automatic keyboard dismissal

### Navigation
- Stack Navigator with native gestures
- Back swipe on iOS
- Hardware back button on Android

### Performance
- `FlatList` for efficient list rendering
- `ImageBackground` for optimized image loading
- Minimal re-renders with proper state management

## 🧪 Testing

### With Mock Data (Current)
```bash
npm run ios    # iOS Simulator
npm run android # Android Emulator
```

The app will work fully with mock data from `src/data/mockData.js`

### After Backend Integration
1. Set up `.env` with real credentials
2. Follow integration guide to connect Supabase
3. Follow integration guide to connect LiveKit
4. Test on real devices for permissions (microphone, etc.)

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
npx react-native start --reset-cache
```

### iOS Build Issues
```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

### Android Build Issues
```bash
cd android && ./gradlew clean && cd ..
```

See **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** for more troubleshooting tips.

## 📦 Dependencies

### Core
- `react-native` - Mobile framework
- `react` - UI library
- `@react-navigation/native` - Navigation
- `@react-navigation/stack` - Stack navigator

### Storage & Data
- `@react-native-async-storage/async-storage` - Local storage

### UI Components
- `react-native-svg` - SVG support
- `react-native-safe-area-context` - Safe area handling
- `react-native-gesture-handler` - Gesture support
- `react-native-screens` - Native screen optimization

### To Be Integrated
- `@supabase/supabase-js` - Database (install when ready)
- `@livekit/react-native` - Voice chat (install when ready)

## 🎯 Next Steps for Developers

1. ✅ **Review the code structure** - Familiarize yourself with components
2. ✅ **Test the prototype** - Run on simulators/emulators
3. 📖 **Read INTEGRATION_GUIDE.md** - Understand backend integration
4. 🔧 **Set up Supabase** - Follow integration guide
5. 🎙️ **Set up LiveKit** - Follow integration guide
6. 🚀 **Deploy** - Build for iOS App Store / Google Play Store

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [LiveKit React Native](https://docs.livekit.io/client-sdk-js/react-native/)

## 📄 License

ISC

---

**Built with ❤️ as a UI prototype ready for your backend integration**

