# Gemini 3 Flash: Simple Mode Guide

## Overview
This "Simple Mode" moves away from the complex real-time PCM streaming (Live API) and uses the standard **Gemini 3 Flash Preview** API. This is much more stable and easier to implement for mobile.

### How it Works:
1. **Frontend**: Record the entire voice message (e.g., as a `.wav` or `.mp4` file).
2. **Frontend**: Convert the recording to a **Base64 string**.
3. **Frontend**: Send the Base64 string to the backend over WebSocket.
4. **Backend**: Calls Gemini 3 Flash with the full audio.
5. **Backend**: Streams the **text response** back to the frontend chunk-by-chunk.

---

## Connection Details

### WebSocket Endpoint
```
ws://your-backend/api/v1/voice-walkie/simple/ws/{session_id}
```

---

## Message Protocol

### 1. From Frontend to Backend

#### Send Audio Message
Send a JSON string over the WebSocket:
```json
{
  "type": "audio",
  "data": "BASE64_ENCODED_AUDIO_FILE",
  "mime_type": "audio/wav" 
}
```
*Note: `mime_type` can be `audio/wav`, `audio/mp3`, `audio/m4a`, etc. Gemini 3 Flash supports most common formats.*

---

### 2. From Backend to Frontend

#### Setup Complete
Received once when connected:
```json
{
  "type": "setup_complete",
  "message": "Simple Voice Service Ready"
}
```

#### Response Stream
The AI's response will arrive in chunks:

1. **Start**: `{ "type": "text_start" }`
2. **Chunks**: `{ "type": "text_chunk", "text": "Hello" }`
3. **End**: `{ "type": "text_end" }`

---

## Implementation Example (React Native)

```javascript
// 1. Record audio using your favorite library (e.g., expo-av, react-native-audio-recorder-player)
const uri = await recorder.stop();
const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

// 2. Send via WebSocket
const ws = new WebSocket(`ws://backend/api/v1/voice-walkie/simple/ws/${sessionId}`);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'audio',
    data: base64Audio,
    mime_type: 'audio/wav'
  }));
};

// 3. Handle streaming text
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'text_chunk') {
    // Update your UI state with the new text
    setResponseText(prev => prev + msg.text);
  }
  
  if (msg.type === 'text_end') {
    // (Optional) Trigger Text-to-Speech locally if you want the AI to speak back
    Speech.speak(responseText);
  }
};
```

---

## Benefits of Simple Mode
- ✅ **No PCM headaches**: No need to worry about 16kHz, 16-bit, or mono/stereo. Just send a standard audio file.
- ✅ **No Chunking Issues**: No "invalid frame payload" or "all-zero" chunk errors.
- ✅ **Stable Response**: Standard Gemini API is extremely reliable.
- ✅ **Standard Audio Libraries**: Use any mobile audio recording library that can output a file.

---

## Voice Back (AI Speaking)
Since Gemini 3 Flash (standard) returns text, you have two options for the AI to "speak back":
1. **Local TTS**: Use the device's native TTS (e.g., `expo-speech` or `react-native-tts`) on the incoming text chunks.
2. **Backend TTS**: We can add an ElevenLabs or Google TTS step on the backend if requested.

---

## Summary
This mode is **strongly recommended** for the first version of the app to ensure stability and get the product in users' hands quickly.

