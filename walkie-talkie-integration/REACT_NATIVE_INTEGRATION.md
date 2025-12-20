# React Native Integration Guide
# Voice Walkie-Talkie with Gemini 3 Flash

This guide provides comprehensive instructions for integrating the Voice Walkie-Talkie service into your React Native mobile app.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Implementation](#implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This implementation enables ultra-low-latency voice messaging using:
- **Gemini 3 Flash** (released Dec 17, 2025)
- **WebSocket streaming** for real-time audio
- **Direct speech-to-speech** interaction
- **Target latency**: 300-600ms from button release to first audio

### Key Features

✅ Real-time audio streaming while user speaks  
✅ Sub-500ms Time-to-First-Token (TTFT)  
✅ Native speech-to-speech (no STT/TTS middleware)  
✅ Barge-in support for interruptions  
✅ Automatic session management  

---

## Architecture

```
User Presses Mic Button
        ↓
Start Recording PCM Audio (16kHz, 16-bit, mono)
        ↓
Stream chunks to WebSocket → Gemini 3 Flash
        ↓
User Releases Button
        ↓
Send end_of_turn signal
        ↓
Receive Audio Response (24kHz PCM)
        ↓
Play Audio in Real-time
```

---

## Prerequisites

### Required Libraries

```bash
# Audio recording
npm install react-native-audio-record
# or
expo install expo-av

# WebSocket (built-in, but can use enhanced version)
npm install react-native-websocket

# Audio playback
npm install react-native-sound
# or use expo-av

# Permissions
npm install react-native-permissions
```

### iOS Setup

Add to `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice messaging</string>
```

### Android Setup

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Installation

### 1. Install Dependencies

```bash
npm install react-native-audio-record react-native-sound react-native-permissions
```

### 2. Link Native Modules (if not using auto-linking)

```bash
cd ios && pod install && cd ..
```

### 3. Configure Audio Recording

```javascript
// audioConfig.js
import AudioRecord from 'react-native-audio-record';

const AUDIO_CONFIG = {
  sampleRate: 16000,        // 16kHz
  channels: 1,              // Mono
  bitsPerSample: 16,        // 16-bit
  audioSource: 6,           // VOICE_RECOGNITION
  wavFile: 'walkie_talkie.wav'
};

AudioRecord.init(AUDIO_CONFIG);
```

---

## Implementation

### Step 1: Create WalkieTalkieService

```javascript
// services/WalkieTalkieService.js

import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

class WalkieTalkieService {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
    this.ws = null;
    this.sessionId = null;
    this.isRecording = false;
    this.audioQueue = [];
    this.currentSound = null;
  }

  /**
   * Initialize session - Call when user opens chat screen
   */
  async initializeSession(userId) {
    try {
      // Start session with backend
      const response = await fetch(`${this.backendUrl}/api/v1/voice-walkie/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
        },
        body: JSON.stringify({
          user_id: userId,
          voice_name: 'Puck',  // Low-latency voice
          enable_barge_in: true,
        }),
      });

      const data = await response.json();
      
      this.sessionId = data.session_id;
      this.apiKey = data.google_api_key;
      this.wsEndpoint = data.ws_endpoint;
      this.config = data.config;

      console.log('Session initialized:', this.sessionId);
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }

  /**
   * Start recording - Call when user presses mic button
   */
  async startRecording() {
    try {
      // Connect WebSocket if not connected
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this._connectWebSocket();
      }

      // Start audio recording
      AudioRecord.start();
      this.isRecording = true;

      // Start streaming audio chunks
      this._startAudioStream();

      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording - Call when user releases mic button
   */
  async stopRecording() {
    try {
      this.isRecording = false;

      // Stop audio recording
      const audioFile = await AudioRecord.stop();
      
      // Send end-of-turn signal
      this._sendEndOfTurn();

      console.log('Stopped recording, waiting for AI response...');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }

  /**
   * Connect to Gemini WebSocket
   */
  async _connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsEndpoint);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send setup configuration
        this._sendSetupConfig();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this._handleWebSocketMessage(event);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    });
  }

  /**
   * Send setup configuration to Gemini
   */
  _sendSetupConfig() {
    const setupMessage = {
      setup: {
        model: "models/gemini-3-flash",
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Puck"
              }
            }
          }
        },
        system_instruction: {
          parts: [{
            text: "You are a helpful AI assistant in a voice conversation. Keep responses concise and natural."
          }]
        }
      }
    };

    this.ws.send(JSON.stringify(setupMessage));
    console.log('Sent setup config');
  }

  /**
   * Stream audio chunks while recording
   */
  _startAudioStream() {
    const CHUNK_INTERVAL = 64; // 64ms chunks

    this.streamInterval = setInterval(async () => {
      if (!this.isRecording) {
        clearInterval(this.streamInterval);
        return;
      }

      try {
        // Get audio chunk (last 64ms of recorded audio)
        const audioData = await AudioRecord.getAudioChunk();
        
        if (audioData && audioData.length > 0) {
          // Convert to base64
          const base64Audio = this._arrayBufferToBase64(audioData);
          
          // Send to Gemini
          const audioMessage = {
            realtime_input: {
              media_chunks: [{
                mime_type: "audio/pcm",
                data: base64Audio
              }]
            }
          };

          this.ws.send(JSON.stringify(audioMessage));
        }
      } catch (error) {
        console.error('Error streaming audio:', error);
      }
    }, CHUNK_INTERVAL);
  }

  /**
   * Send end-of-turn signal
   */
  _sendEndOfTurn() {
    const endMessage = {
      client_content: {
        turn_complete: true
      }
    };

    this.ws.send(JSON.stringify(endMessage));
  }

  /**
   * Handle incoming WebSocket messages
   */
  _handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);

      // Handle audio response
      if (message.server_content && message.server_content.model_turn) {
        const parts = message.server_content.model_turn.parts;
        
        for (const part of parts) {
          if (part.inline_data && part.inline_data.mime_type.includes('audio')) {
            // Play audio response
            this._playAudioResponse(part.inline_data.data);
          }
        }
      }

      // Handle setup complete
      if (message.setup_complete) {
        console.log('Setup complete, ready to stream');
      }

      // Handle errors
      if (message.error) {
        console.error('Gemini error:', message.error);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Play audio response from Gemini
   */
  async _playAudioResponse(base64Audio) {
    try {
      // Decode base64 to audio file
      const audioPath = await this._saveBase64ToFile(base64Audio);

      // Play audio
      this.currentSound = new Sound(audioPath, '', (error) => {
        if (error) {
          console.error('Failed to load sound:', error);
          return;
        }

        this.currentSound.play((success) => {
          if (success) {
            console.log('Audio playback complete');
          } else {
            console.error('Audio playback failed');
          }

          // Clean up
          this.currentSound.release();
          this.currentSound = null;
        });
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  /**
   * End session - Call when user closes chat screen
   */
  async endSession() {
    try {
      // Stop recording if active
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Close WebSocket
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // End session with backend
      await fetch(`${this.backendUrl}/api/v1/voice-walkie/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: this.userId,
        }),
      });

      console.log('Session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  _arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return btoa(binary);
  }

  /**
   * Helper: Save base64 audio to file
   */
  async _saveBase64ToFile(base64Data) {
    // Implementation depends on your file system library
    // This is a placeholder
    const fs = require('react-native-fs');
    const path = `${fs.CachesDirectoryPath}/response_${Date.now()}.pcm`;
    
    await fs.writeFile(path, base64Data, 'base64');
    return path;
  }
}

export default WalkieTalkieService;
```

### Step 2: Create UI Component

```javascript
// components/WalkieTalkieButton.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import WalkieTalkieService from '../services/WalkieTalkieService';

const WalkieTalkieButton = ({ userId, backendUrl }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const service = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initialize service on mount
    initializeService();

    return () => {
      // Clean up on unmount
      if (service.current) {
        service.current.endSession();
      }
    };
  }, []);

  const initializeService = async () => {
    service.current = new WalkieTalkieService(backendUrl);
    const success = await service.current.initializeSession(userId);
    setIsInitialized(success);
  };

  const handlePressIn = async () => {
    if (!isInitialized) return;

    setIsPressed(true);
    startPulseAnimation();

    try {
      await service.current.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsPressed(false);
    }
  };

  const handlePressOut = async () => {
    setIsPressed(false);
    stopPulseAnimation();

    try {
      await service.current.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isInitialized}
        style={styles.buttonContainer}
      >
        <Animated.View
          style={[
            styles.button,
            isPressed && styles.buttonPressed,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.buttonText}>
            {isPressed ? '🎤 Speaking...' : 'Hold to Talk'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {!isInitialized && (
        <Text style={styles.statusText}>Initializing...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonPressed: {
    backgroundColor: '#ea4335',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 10,
    color: '#666',
  },
});

export default WalkieTalkieButton;
```

### Step 3: Integrate into Your App

```javascript
// App.js

import React from 'react';
import { View, StyleSheet } from 'react';
import WalkieTalkieButton from './components/WalkieTalkieButton';

const App = () => {
  const BACKEND_URL = 'https://your-backend.com';
  const USER_ID = 'user_123';

  return (
    <View style={styles.container}>
      <WalkieTalkieButton 
        userId={USER_ID}
        backendUrl={BACKEND_URL}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
```

---

## Testing

### 1. Test Audio Permissions

```javascript
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

async function requestMicrophonePermission() {
  const result = await request(
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO
  );

  if (result === RESULTS.GRANTED) {
    console.log('Microphone permission granted');
    return true;
  } else {
    console.log('Microphone permission denied');
    return false;
  }
}
```

### 2. Test WebSocket Connection

```javascript
// Add to WalkieTalkieService for debugging

_connectWebSocket() {
  console.log('Connecting to:', this.wsEndpoint);
  
  this.ws = new WebSocket(this.wsEndpoint);
  
  this.ws.onopen = () => {
    console.log('✅ WebSocket CONNECTED');
  };
  
  this.ws.onerror = (error) => {
    console.error('❌ WebSocket ERROR:', error);
  };
}
```

### 3. Monitor Latency

```javascript
// Track performance metrics

class PerformanceTracker {
  startTime = null;

  startRecording() {
    this.startTime = Date.now();
  }

  async stopRecording() {
    const ttft = Date.now() - this.startTime;
    console.log(`Time to First Token: ${ttft}ms`);

    // Send to backend
    await fetch(`${BACKEND_URL}/api/v1/voice-walkie/session/metrics`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: this.sessionId,
        ttft_ms: ttft,
      }),
    });
  }
}
```

---

## Troubleshooting

### Issue: No audio being sent

**Solution**: Check audio recording permissions and format

```javascript
// Verify audio config
AudioRecord.on('data', data => {
  console.log('Audio chunk size:', data.length);
});
```

### Issue: WebSocket connection fails

**Solution**: Verify API key and endpoint

```javascript
console.log('WS Endpoint:', this.wsEndpoint);
console.log('API Key valid:', this.apiKey.startsWith('AIza'));
```

### Issue: High latency

**Solutions**:
1. Use WiFi instead of cellular
2. Reduce chunk size to 32ms
3. Pre-warm WebSocket connection
4. Check backend logs for bottlenecks

### Issue: Audio playback choppy

**Solution**: Buffer audio before playing

```javascript
// Buffer multiple chunks before playback
const audioBuffer = [];
const MIN_BUFFER_SIZE = 3;

if (audioBuffer.length >= MIN_BUFFER_SIZE) {
  playBufferedAudio();
}
```

---

## Performance Tips

1. **Pre-warm Connection**: Open WebSocket when screen mounts
2. **Optimize Chunk Size**: 64ms chunks = good balance
3. **Use Native Drivers**: Always use `useNativeDriver: true`
4. **Monitor Memory**: Release audio resources after playback
5. **Error Recovery**: Auto-reconnect on WebSocket disconnect

---

## Next Steps

1. Integrate with your authentication system
2. Add conversation history UI
3. Implement audio visualization
4. Add multi-language support
5. Enhance error handling and retry logic

For more details, see the [backend API documentation](../README.md).

