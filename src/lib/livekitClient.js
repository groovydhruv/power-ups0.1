/**
 * STUB IMPLEMENTATION - LiveKit Client for React Native
 * 
 * TODO FOR DEVELOPERS:
 * 1. Install LiveKit: npm install @livekit/react-native @livekit/react-native-webrtc
 * 2. Set up your LiveKit server URL and API key/secret
 * 3. Create a backend endpoint to generate LiveKit tokens
 * 4. Replace the mock function below with actual API call
 * 
 * Example real implementation:
 * 
 * export async function fetchLivekitToken({ roomName, identity }) {
 *   const response = await fetch('https://your-backend.com/api/livekit-token', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ roomName, identity }),
 *   });
 *   const data = await response.json();
 *   return { token: data.token, url: data.url };
 * }
 * 
 * For now, this returns a rejected promise to simulate connection unavailable.
 */

// Mock implementation for prototype
export async function fetchLivekitToken({ roomName, identity }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock error - developers will replace this
  throw new Error('LiveKit not configured. This is a UI prototype - integrate LiveKit for voice functionality.');
}

// Mock room connection status
export const LIVEKIT_CONFIGURED = false;
