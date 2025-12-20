# 🚨 CRITICAL: Frontend Audio Streaming Issue

## The Problem

Your current implementation is sending the **ENTIRE audio recording** in ONE message after the user stops talking. This causes Gemini to reject it with error:

```
❌ Gemini WebSocket error: received 1007 (invalid frame payload data)
```

**What you're doing (WRONG):**
```
User holds button → Record audio → User releases → Send entire recording → end_of_turn
```

**What you MUST do (CORRECT):**
```
User holds button → Stream chunks continuously → User releases → end_of_turn
```

---

## Evidence from Logs

```
📝 First audio chunk length: 166548 chars
❌ Gemini WebSocket error: received 1007 (invalid frame payload data)
```

**166,548 characters** = ~125KB = **3-4 seconds of audio in ONE chunk**

This is **too large** for the WebSocket frame and defeats the purpose of the streaming Live API.

---

## Why Streaming is Required

The Gemini Live API is designed for **real-time, low-latency** interaction:

1. **AI processes while you speak** - Not after you finish
2. **Smaller WebSocket frames** - Large frames get rejected
3. **Faster response** - AI can start thinking before you finish
4. **Natural conversation** - Like a real walkie-talkie

---

## How to Fix It

### ❌ WRONG Implementation

```typescript
// DON'T DO THIS
let audioBuffer = [];

function onAudioData(chunk) {
  // Collecting all audio
  audioBuffer.push(chunk);
}

function onStopRecording() {
  // Sending everything at once - WRONG!
  const allAudio = concatenate(audioBuffer);
  const base64 = encode(allAudio);
  ws.send({ type: 'audio', data: base64 });
  ws.send({ type: 'end_of_turn' });
}
```

### ✅ CORRECT Implementation

```typescript
// DO THIS
function onAudioData(chunk) {
  // Send each chunk immediately as you record
  const base64 = encode(chunk);
  ws.send({ type: 'audio', data: base64 });
}

function onStopRecording() {
  // Only send end_of_turn, audio already streamed
  ws.send({ type: 'end_of_turn' });
}
```

---

## Required Changes

### 1. Stream Audio Continuously

**While the user is holding the button**, send audio chunks as they are captured:

```typescript
// Start recording when button pressed
audioRecorder.onDataAvailable = (pcmChunk) => {
  // Convert to base64 immediately
  const base64Audio = bufferToBase64(pcmChunk);
  
  // Send immediately - DON'T wait!
  ws.send(JSON.stringify({
    type: 'audio',
    data: base64Audio
  }));
};

// Configure chunk interval (100-200ms recommended)
audioRecorder.start({
  intervalMs: 100  // Send chunks every 100ms
});
```

### 2. Send Smaller Chunks

**Chunk Size Guidelines:**
- **Recommended**: 100-200ms of audio per chunk
- **Max Size**: < 50,000 base64 characters (~1 second)
- **Sample Calculation**: 
  - 16kHz × 16-bit × 0.1s = 3,200 bytes = ~4,267 base64 chars ✅
  - 16kHz × 16-bit × 4s = 128,000 bytes = ~170,667 base64 chars ❌

### 3. Only Send end_of_turn at the End

```typescript
function stopRecording() {
  // Stop the recorder
  audioRecorder.stop();
  
  // Send end_of_turn signal
  ws.send(JSON.stringify({
    type: 'end_of_turn'
  }));
}
```

---

## Platform-Specific Examples

### React Native (iOS/Android)

```typescript
import { AudioRecord } from 'react-native-audio-record';

// Configure recorder for streaming
AudioRecord.init({
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6, // VOICE_RECOGNITION
  wavFile: null   // No file, just stream
});

// Stream audio chunks
AudioRecord.on('data', (data) => {
  // data is base64 PCM already
  ws.send(JSON.stringify({
    type: 'audio',
    data: data
  }));
});

// Start recording (sends chunks automatically)
AudioRecord.start();

// Stop recording
AudioRecord.stop();
ws.send(JSON.stringify({ type: 'end_of_turn' }));
```

### Expo

```typescript
import { Audio } from 'expo-av';

const recording = new Audio.Recording();

// Configure for streaming
await recording.prepareToRecordAsync({
  android: {
    extension: '.pcm',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.pcm',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
});

// Set up progress update (for streaming chunks)
recording.setOnRecordingStatusUpdate((status) => {
  if (status.isRecording) {
    // Get recorded chunk and send it
    // Note: You may need to use native module for true streaming
    sendAudioChunk();
  }
});

await recording.startAsync();
```

### Native Module (Recommended for True Streaming)

For best performance, create a native module that:
1. Captures audio from microphone
2. Encodes to PCM
3. Converts to base64
4. Calls JavaScript callback every 100ms
5. JavaScript sends immediately to WebSocket

---

## Testing Your Fix

### ✅ Expected Logs (Good)

```
📝 First audio chunk: 4267 chars (~3.1KB, ~200ms of audio)
📝 First audio chunk: 8534 chars (~6.2KB, ~400ms of audio)
```

### ❌ Current Logs (Bad)

```
📝 First audio chunk: 166548 chars (~121KB, ~7.8s of audio)
❌ Audio chunk too large
```

---

## Validation

The backend now validates chunk sizes:
- **Chunks > 50,000 chars** will be rejected with error
- You'll receive: `{ type: 'error', error: 'Audio chunk too large...' }`

This forces you to implement proper streaming.

---

## Message Flow (Correct)

```
User presses button
  ↓
Start recording
  ↓
[While holding button]
  → { type: 'audio', data: 'chunk1...' }  (at 0.1s)
  → { type: 'audio', data: 'chunk2...' }  (at 0.2s)
  → { type: 'audio', data: 'chunk3...' }  (at 0.3s)
  → { type: 'audio', data: 'chunk4...' }  (at 0.4s)
  ... (chunks sent continuously)
  ↓
User releases button
  ↓
Stop recording
  → { type: 'end_of_turn' }
  ↓
Wait for AI response
  ← { type: 'audio_start', messageId: '...' }
  ← { type: 'audio_response', data: '...' }
  ...
```

---

## Summary

**What to change:**
1. ❌ Don't buffer all audio and send at once
2. ✅ Send audio chunks immediately as they're recorded
3. ✅ Configure recorder to provide chunks every 100-200ms
4. ✅ Each chunk should be < 50,000 base64 characters
5. ✅ Only send `end_of_turn` after stopping recorder

**Why it matters:**
- Gemini Live API requires streaming for low latency
- Large chunks get rejected by WebSocket
- User experience will be poor without streaming

**This is not optional** - The Live API is designed for streaming and will not work with buffered audio.

---

## Need Help?

If you're unsure how to implement audio streaming on your platform:
1. Check the platform-specific examples above
2. Look into native audio capture APIs
3. Consider using a native module for real-time streaming
4. Test with the backend validation (chunks must be < 50K chars)

The backend is ready and waiting for proper streaming! 🚀

