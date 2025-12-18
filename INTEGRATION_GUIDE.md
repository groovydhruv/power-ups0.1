# Integration Guide for Developers

This React Native mobile app prototype is ready for you to integrate with your backend services. This guide explains how to connect Supabase for data persistence and LiveKit for voice conversations.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Environment Configuration](#environment-configuration)
3. [Supabase Integration](#supabase-integration)
4. [LiveKit Integration](#livekit-integration)
5. [Replacing Mock Data](#replacing-mock-data)
6. [AsyncStorage Structure](#asyncstorage-structure)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Project Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Installation

```bash
# Install dependencies
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## Environment Configuration

### 1. Install react-native-dotenv

```bash
npm install react-native-dotenv
```

### 2. Create `.env` file in project root

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# LiveKit Configuration
LIVEKIT_API_URL=https://your-backend.com/api/livekit-token
```

### 3. Update `babel.config.js`

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
  ],
};
```

### 4. Add `.env` to `.gitignore`

```bash
echo ".env" >> .gitignore
```

---

## Supabase Integration

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Update `src/lib/supabaseClient.js`

Replace the stub implementation with:

```javascript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseReady = () => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
};
```

### Step 3: Database Schema

Create these tables in your Supabase project:

#### `users` table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `powerup_metadata` table
```sql
CREATE TABLE powerup_metadata (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT,
  context TEXT,
  url TEXT,
  key_topics TEXT[],
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `user_progress` table
```sql
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  resource_id TEXT NOT NULL,
  started BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  conversation_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);
```

### Step 4: Update `src/lib/dataApi.js`

Uncomment the Supabase integration code in the file and set `isSupabaseReady = true`:

```javascript
export const isSupabaseReady = true; // Change from false to true
```

Then uncomment all the `/* TODO: Uncomment when Supabase is configured */` blocks.

---

## LiveKit Integration

### Step 1: Install LiveKit Dependencies

```bash
npm install @livekit/react-native @livekit/react-native-webrtc
```

### Step 2: iOS Permissions (Info.plist)

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice conversations</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera for video conversations</string>
```

### Step 3: Android Permissions (AndroidManifest.xml)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Step 4: Create Backend Token Endpoint

You need a backend endpoint that generates LiveKit tokens. Example (Node.js/Express):

```javascript
const { AccessToken } = require('livekit-server-sdk');

app.post('/api/livekit-token', async (req, res) => {
  const { roomName, identity } = req.body;
  
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: identity,
    }
  );
  
  at.addGrant({ roomJoin: true, room: roomName });
  
  const token = at.toJwt();
  const url = process.env.LIVEKIT_URL;
  
  res.json({ token, url });
});
```

### Step 5: Update `src/lib/livekitClient.js`

Replace the mock implementation:

```javascript
import { LIVEKIT_API_URL } from '@env';

export async function fetchLivekitToken({ roomName, identity }) {
  try {
    const response = await fetch(LIVEKIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName, identity }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { token: data.token, url: data.url };
  } catch (error) {
    console.error('Failed to fetch LiveKit token:', error);
    throw error;
  }
}

export const LIVEKIT_CONFIGURED = true;
```

### Step 6: Update `src/components/VoiceConversation.jsx`

Replace the mock implementation with LiveKit integration:

```javascript
import { LiveKitRoom, useLocalParticipant } from '@livekit/react-native';
import { fetchLivekitToken } from '../lib/livekitClient';

// Inside component:
const [lkToken, setLkToken] = useState('');
const [lkUrl, setLkUrl] = useState('');

useEffect(() => {
  const loadToken = async () => {
    try {
      const { token, url } = await fetchLivekitToken({
        roomName: `powerup-${resource.id}`,
        identity: `user-${Date.now()}`,
      });
      setLkToken(token);
      setLkUrl(url);
    } catch (err) {
      console.error('LiveKit token error:', err);
    }
  };
  loadToken();
}, [resource.id]);

// Replace mock video card with LiveKit room
return (
  <LiveKitRoom
    serverUrl={lkUrl}
    token={lkToken}
    connect={true}
    audio={true}
    video={false}
  >
    {/* Your UI components */}
  </LiveKitRoom>
);
```

---

## Replacing Mock Data

Currently, the app uses mock data from `src/data/mockData.js`. Once Supabase is integrated:

1. The app will automatically fetch data from Supabase
2. Mock data acts as a fallback if Supabase is unavailable
3. You can populate Supabase with the mock data structure:

```javascript
// Example: Insert mock topics into Supabase
import { topics, resources } from './src/data/mockData';

async function seedDatabase() {
  // Insert topics as powerup_metadata
  for (const topic of topics) {
    await supabase.from('powerup_metadata').insert({
      title: topic.title,
      theme: topic.description,
      // ... other fields
    });
  }
}
```

---

## AsyncStorage Structure

The app uses AsyncStorage for local data persistence:

### Keys Used

1. **`navi_username`** - Stores the current username
2. **`navi_user_id_${username}`** - Stores unique user ID per username
3. **`learning-platform-progress-${username}`** - Stores progress data

### Progress Data Structure

```json
{
  "resource-id-1": {
    "started": true,
    "completed": true,
    "conversationCompleted": false
  },
  "resource-id-2": {
    "started": true,
    "completed": false,
    "conversationCompleted": false
  }
}
```

### Clearing Data (for testing)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all app data
await AsyncStorage.clear();

// Clear specific key
await AsyncStorage.removeItem('navi_username');
```

---

## Testing

### Test on iOS Simulator

```bash
npm run ios
```

### Test on Android Emulator

```bash
npm run android
```

### Test on Physical Devices

#### iOS
1. Connect iPhone via USB
2. Open `ios/ProjectDashboard.xcworkspace` in Xcode
3. Select your device and run

#### Android
1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `npm run android`

### Testing LiveKit
- Use two devices/simulators to test voice conversations
- Check microphone permissions are granted
- Monitor console logs for connection status

### Testing Supabase
- Check network requests in React Native Debugger
- Verify data syncs between local and cloud
- Test offline fallback to mock data

---

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
# Clear cache and restart
npx react-native start --reset-cache
```

#### 2. iOS Build Failures
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### 3. Android Build Failures
```bash
cd android
./gradlew clean
cd ..
```

#### 4. Environment Variables Not Loading
- Ensure `.env` file is in project root
- Restart Metro bundler after adding `.env`
- Check babel.config.js has dotenv plugin

#### 5. LiveKit Connection Failures
- Verify backend token endpoint is accessible
- Check microphone permissions are granted
- Ensure WebRTC is supported on device/simulator

#### 6. Supabase Connection Failures
- Verify credentials in `.env` are correct
- Check Supabase project is active
- Enable RLS policies if needed

### Debug Tools

```bash
# React Native Debugger
npm install -g react-native-debugger

# Flipper (included with React Native)
# Open Flipper and it will auto-detect running app
```

### Logs

```bash
# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android
```

---

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [LiveKit React Native Docs](https://docs.livekit.io/client-sdk-js/react-native/)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)

---

## Support

For questions or issues during integration:
1. Check the troubleshooting section above
2. Review the inline comments in stub implementation files
3. Refer to official documentation for each service
4. Check React Native community forums

Good luck with your integration! 🚀

