# Frontend Integration Guide - Simplified Architecture

## ⚠️ IMPORTANT ARCHITECTURE CHANGE

**Frontend NEVER connects to Gemini directly!**

```
OLD (Insecure):
Mobile App → Gemini API (❌ Exposes API key)

NEW (Secure):
Mobile App → Backend WebSocket → Gemini API (✅ API key stays on backend)
```

---

## New Architecture

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │ 1. POST /session/start
         ↓
┌─────────────────┐
│  FastAPI Backend│
│  - Validates user
│  - Gets PowerUp
│  - Creates session
└────────┬────────┘
         │ 2. Returns session_id + ws_endpoint
         │    (Backend WS, NOT Gemini!)
         ↓
┌─────────────────┐
│   Mobile App    │
│ Connects to:    │
│ ws://backend/ws/│
│   {session_id}  │
└────────┬────────┘
         │ 3. Send audio chunks
         ↓
┌─────────────────┐
│ Backend Proxy   │
│ - Receives audio│
│ - Forwards to   │
│   Gemini (secure)
│ - Returns response
└────────┬────────┘
         │ 4. Audio response
         ↓
┌─────────────────┐
│   Mobile App    │
│  Plays audio    │
└─────────────────┘
```

---

## Step-by-Step Integration

### Step 1: Start Session (HTTP)

```javascript
// Start session with backend
const response = await fetch('http://your-backend/api/v1/voice-walkie/session/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,  // Your auth
  },
  body: JSON.stringify({
    user_id: 'user_123',
    powerup_id: 1,  // Optional - for PowerUp mode
    ai_speaks_first: true,  // Optional - AI greets first
    voice_name: 'Puck',
  }),
});

const session = await response.json();
console.log('Session started:', session);

// Response:
// {
//   "session_id": "wt_abc123...",
//   "ws_endpoint": "ws://backend/api/v1/voice-walkie/ws/wt_abc123",  // ← Connect here!
//   "config": {...},
//   "expires_at": "2025-12-20T16:00:00Z",
//   "powerup_context": {...},  // If PowerUp requested
//   "first_message": "..."  // If ai_speaks_first=true
// }
```

### Step 2: Connect WebSocket (To Backend, NOT Gemini!)

```javascript
// Extract WebSocket endpoint from response
const wsEndpoint = session.ws_endpoint;

// Connect to BACKEND WebSocket (NOT Gemini!)
const ws = new WebSocket(wsEndpoint);

ws.onopen = () => {
  console.log('✅ Connected to backend WebSocket');
  
  // Backend automatically connects to Gemini for you
  // You'll receive setup_complete message when ready
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'setup_complete':
      console.log('✅ Backend proxy ready - can start recording');
      break;
    
    case 'audio_response':
      // AI's audio response
      const audioData = message.data;  // Base64 PCM
      playAudio(audioData);
      break;
    
    case 'error':
      console.error('Error:', message.error);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Step 3: Send Audio (When User Speaks)

```javascript
// When user PRESSES mic button
function startRecording() {
  // Start recording audio
  AudioRecord.start();
  
  // Stream audio chunks
  recordingInterval = setInterval(async () => {
    // Get audio chunk (PCM 16kHz, 16-bit, mono)
    const audioChunk = await AudioRecord.getChunk();
    
    // Convert to base64
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioChunk)));
    
    // Send to BACKEND (not Gemini!)
    ws.send(JSON.stringify({
      type: 'audio',
      data: base64Audio
    }));
  }, 64);  // Every 64ms
}

// When user RELEASES mic button
function stopRecording() {
  // Stop recording
  AudioRecord.stop();
  clearInterval(recordingInterval);
  
  // Send end-of-turn signal to backend
  ws.send(JSON.stringify({
    type: 'end_of_turn'
  }));
  
  console.log('Waiting for AI response...');
}
```

### Step 4: Receive & Play Audio Response

```javascript
function playAudio(base64Data) {
  // Decode base64 to audio bytes
  const audioBytes = atob(base64Data);
  
  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(audioBytes.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < audioBytes.length; i++) {
    view[i] = audioBytes.charCodeAt(i);
  }
  
  // Play audio (implementation depends on your audio library)
  // Example with react-native-sound:
  Sound.loadAsync({ uri: bufferToUri(buffer) })
    .then(({ sound }) => {
      sound.playAsync();
    });
}
```

### Step 5: Clean Up

```javascript
// When user closes chat screen
async function endSession() {
  // Close WebSocket
  if (ws) {
    ws.close();
  }
  
  // End session with backend
  await fetch('http://your-backend/api/v1/voice-walkie/session/end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify({
      session_id: session.session_id,
      user_id: 'user_123',
    }),
  });
}
```

---

## Complete React Native Service

```javascript
// WalkieTalkieService.js
class WalkieTalkieService {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
    this.ws = null;
    this.sessionId = null;
    this.isRecording = false;
  }

  // Step 1: Initialize session
  async initializeSession(userId, powerupId = null, aiSpeaksFirst = false) {
    const response = await fetch(`${this.backendUrl}/api/v1/voice-walkie/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getJWT()}`,
      },
      body: JSON.stringify({
        user_id: userId,
        powerup_id: powerupId,
        ai_speaks_first: aiSpeaksFirst,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    const session = await response.json();
    this.sessionId = session.session_id;
    
    return session;
  }

  // Step 2: Connect WebSocket
  async connectWebSocket(wsEndpoint) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsEndpoint);

      this.ws.onopen = () => {
        console.log('✅ Connected to backend');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'setup_complete') {
          console.log('✅ Proxy ready');
          resolve();
        } else if (message.type === 'audio_response') {
          this.playAudio(message.data);
        } else if (message.type === 'error') {
          console.error('Error:', message.error);
        }
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

  // Step 3: Send audio
  async startRecording() {
    this.isRecording = true;
    AudioRecord.start();

    this.recordingInterval = setInterval(async () => {
      if (!this.isRecording) return;

      const audioChunk = await AudioRecord.getChunk();
      const base64Audio = this.arrayBufferToBase64(audioChunk);

      this.ws.send(JSON.stringify({
        type: 'audio',
        data: base64Audio
      }));
    }, 64);
  }

  stopRecording() {
    this.isRecording = false;
    AudioRecord.stop();
    clearInterval(this.recordingInterval);

    this.ws.send(JSON.stringify({
      type: 'end_of_turn'
    }));
  }

  // Step 4: Play audio
  playAudio(base64Data) {
    // Implementation depends on your audio library
    const audioBytes = atob(base64Data);
    // ... play audio
  }

  // Step 5: Clean up
  async endSession(userId) {
    if (this.ws) {
      this.ws.close();
    }

    await fetch(`${this.backendUrl}/api/v1/voice-walkie/session/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getJWT()}`,
      },
      body: JSON.stringify({
        session_id: this.sessionId,
        user_id: userId,
      }),
    });
  }

  arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }
}

export default WalkieTalkieService;
```

---

## Key Differences from Old Approach

| Aspect | OLD (Wrong) | NEW (Correct) |
|--------|-------------|---------------|
| **WebSocket URL** | `wss://generativelanguage.googleapis.com/...` | `ws://your-backend/api/v1/voice-walkie/ws/{session_id}` |
| **API Key** | Exposed to frontend | Hidden on backend |
| **Setup Config** | Frontend sends | Backend handles |
| **Security** | ❌ Vulnerable | ✅ Secure |
| **Rate Limiting** | None | Backend enforced |
| **Logging** | Client-side only | Centralized |

---

## Environment Variables (Frontend)

```javascript
// .env or config
BACKEND_URL=https://your-backend.com  // Your backend, NOT Gemini!
```

**DO NOT put these in frontend:**
- ❌ `GOOGLE_API_KEY` - stays on backend only!
- ❌ Gemini WebSocket URL - backend handles this

---

## Testing

```javascript
// test_walkie_talkie.js
async function testWalkieTalkie() {
  const service = new WalkieTalkieService('http://localhost:8000');
  
  // 1. Start session
  const session = await service.initializeSession('test_user', 1, true);
  console.log('Session:', session.session_id);
  
  // 2. Connect WebSocket (to backend!)
  await service.connectWebSocket(session.ws_endpoint);
  console.log('Connected');
  
  // 3. Simulate recording
  await service.startRecording();
  await new Promise(r => setTimeout(r, 3000));  // Record for 3 seconds
  service.stopRecording();
  
  // 4. Wait for response
  await new Promise(r => setTimeout(r, 2000));
  
  // 5. Clean up
  await service.endSession('test_user');
}
```

---

## Summary for Frontend Team

### ✅ DO:
1. Connect to **backend WebSocket** (NOT Gemini)
2. Send audio as base64 PCM chunks
3. Receive audio responses from backend
4. Use JWT auth for session start/end

### ❌ DON'T:
1. Connect directly to Gemini API
2. Handle API keys in frontend
3. Send setup config (backend does this)
4. Store Gemini credentials

### Message Types:

**Send to Backend:**
```javascript
{ type: 'audio', data: 'base64...' }
{ type: 'end_of_turn' }
{ type: 'cancel' }  // For interruptions
```

**Receive from Backend:**
```javascript
{ type: 'setup_complete' }
{ type: 'audio_response', data: 'base64...', mime_type: 'audio/pcm' }
{ type: 'error', error: '...' }
```

That's it! Backend handles all the complexity. 🎉

