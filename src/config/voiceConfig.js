/**
 * Voice Walkie-Talkie Configuration
 * 
 * Configuration for Gemini 3 Flash voice integration with PowerUp system
 */

// Get environment variables - works with both Expo and web
const getEnvVar = (key, defaultValue) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

export const VOICE_CONFIG = {
  // Backend API URL (adjust for production)
  backendUrl: getEnvVar('VITE_VOICE_BACKEND_URL', 'http://localhost:8000'),
  
  // JWT Token for authentication (Bearer token)
  // For development with placeholder auth, any value works
  jwtToken: getEnvVar('VITE_JWT_TOKEN', 'demo_jwt_token'),
  
  // User ID for development (must match backend placeholder: "demo_user_id")
  // In production, this should come from actual user authentication
  demoUserId: getEnvVar('VITE_DEMO_USER_ID', 'demo_user_id'),
  
  // Audio recording configuration for Gemini 3 Flash
  audioConfig: {
    sampleRate: 16000,        // 16kHz required by Gemini
    channels: 1,              // Mono audio
    bitsPerSample: 16,        // 16-bit audio
    chunkIntervalMs: 64,      // Stream audio every 64ms for optimal latency
    audioSource: 6,           // VOICE_RECOGNITION source for Android
    wavFile: 'walkie_talkie.wav'
  },
  
  // Gemini voice configuration
  voiceName: 'Puck',          // Low-latency voice option
  enableBargeIn: true,        // Allow interruptions
  
  // Session settings
  sessionTimeout: 900000,     // 15 minutes in milliseconds
  maxRecordingDuration: 120,  // 2 minutes max per message
  
  // API endpoints
  endpoints: {
    startSession: '/api/v1/voice-walkie/session/start',
    endSession: '/api/v1/voice-walkie/session/end',
    saveResults: '/api/v1/voice-walkie/powerup/session/save',
    getContexts: '/api/v1/voice-walkie/powerup/contexts',
    getContext: '/api/v1/voice-walkie/powerup'
  },
  
  // Retry configuration
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint) => {
  return `${VOICE_CONFIG.backendUrl}${VOICE_CONFIG.endpoints[endpoint]}`;
};

// Helper to check if backend is available
export const checkBackendAvailability = async () => {
  try {
    const response = await fetch(`${VOICE_CONFIG.backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

