# Mobile App Integration - Authentication Guide

## Backend Authentication Details

### Current Authentication Implementation

The Voice Walkie-Talkie API uses a **placeholder authentication system** that needs to be replaced with your actual authentication.

---

## 1. Endpoint: `/api/v1/voice-walkie/session/start`

**File**: `app/api/v1/routers/voice_walkie.py`

```python
from fastapi import APIRouter, HTTPException, Depends, status

router = APIRouter(prefix="/voice-walkie", tags=["Voice Walkie-Talkie"])


# PLACEHOLDER AUTHENTICATION DEPENDENCY
async def get_current_user_id(
    # token: str = Depends(oauth2_scheme)  # UNCOMMENT when integrating
) -> str:
    """
    Get current authenticated user ID.
    
    TODO: Integrate with your existing authentication system.
    For now, this is a placeholder that should be replaced with
    actual JWT token validation.
    """
    # Placeholder - replace with actual auth
    # In production, validate JWT token and extract user_id
    return "demo_user_id"


@router.post(
    "/session/start",
    response_model=SessionStartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new voice session",
)
async def start_session(
    request: SessionStartRequest,
    user_id: str = Depends(get_current_user_id),  # <-- Authentication happens here
):
    """
    Start a new voice walkie-talkie session.
    
    Requires authentication via JWT token.
    """
    try:
        # Validate user_id matches request
        if request.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID mismatch"
            )
        
        # ... rest of endpoint code
```

---

## 2. What You Need to Implement

### Option A: JWT Token Authentication (Recommended)

If your backend uses JWT tokens, replace the placeholder with:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate JWT token and extract user_id.
    
    Expected Authorization header: Bearer <token>
    """
    try:
        token = credentials.credentials
        
        # Decode JWT token
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        
        # Extract user_id from token
        user_id = payload.get("user_id") or payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id"
            )
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

### Option B: API Key Authentication

If you use API keys:

```python
from fastapi import Header, HTTPException

async def get_current_user_id(
    x_api_key: str = Header(..., alias="X-API-Key")
) -> str:
    """
    Validate API key and return user_id.
    
    Expected header: X-API-Key: your_api_key
    """
    # Validate API key against database
    user_id = await validate_api_key(x_api_key)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return user_id
```

### Option C: Session-Based Authentication

If you use sessions/cookies:

```python
from fastapi import Cookie, HTTPException

async def get_current_user_id(
    session_id: str = Cookie(...)
) -> str:
    """
    Validate session cookie and return user_id.
    """
    user_id = await get_user_from_session(session_id)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    return user_id
```

---

## 3. Mobile App Request Format

### With JWT Token (Most Common)

```javascript
// JavaScript/TypeScript example
const response = await fetch(`${BACKEND_URL}/api/v1/voice-walkie/session/start`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,  // <-- Add your JWT token here
  },
  body: JSON.stringify({
    user_id: 'user_123',
    powerup_id: 42,
    ai_speaks_first: true,
    voice_name: 'Puck',
  }),
});
```

### With API Key

```javascript
const response = await fetch(`${BACKEND_URL}/api/v1/voice-walkie/session/start`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': YOUR_API_KEY,  // <-- Add your API key here
  },
  body: JSON.stringify({
    user_id: 'user_123',
    powerup_id: 42,
    ai_speaks_first: true,
  }),
});
```

---

## 4. Environment Variables

### Backend `.env` Configuration

```bash
# Required
GOOGLE_API_KEY=your_google_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Authentication (choose based on your method)
JWT_SECRET=your_jwt_secret_key          # For JWT
JWT_ALGORITHM=HS256                     # For JWT
API_KEY_SECRET=your_api_key_secret      # For API key auth
SESSION_SECRET=your_session_secret      # For session auth
```

---

## 5. Complete Integration Steps

### Step 1: Update Backend Authentication

Replace the `get_current_user_id()` function in `app/api/v1/routers/voice_walkie.py` with your actual authentication method (JWT, API key, or session).

### Step 2: Test Authentication

```bash
# Test with curl
curl -X POST http://localhost:8000/api/v1/voice-walkie/session/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "user_123",
    "powerup_id": 1,
    "ai_speaks_first": true
  }'
```

### Step 3: Mobile App Integration

```javascript
// React Native example
import AsyncStorage from '@react-native-async-storage/async-storage';

class WalkieTalkieService {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
  }

  async initializeSession(userId, powerupId = null) {
    try {
      // Get stored JWT token
      const jwtToken = await AsyncStorage.getItem('jwt_token');
      
      if (!jwtToken) {
        throw new Error('Not authenticated');
      }

      // Start session with authentication
      const response = await fetch(
        `${this.backendUrl}/api/v1/voice-walkie/session/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,  // <-- JWT token
          },
          body: JSON.stringify({
            user_id: userId,
            powerup_id: powerupId,
            ai_speaks_first: true,
            voice_name: 'Puck',
          }),
        }
      );

      if (response.status === 401) {
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start session');
      }

      const sessionData = await response.json();
      
      this.sessionId = sessionData.session_id;
      this.apiKey = sessionData.google_api_key;
      this.wsEndpoint = sessionData.ws_endpoint;
      this.config = sessionData.config;

      console.log('✅ Session initialized:', this.sessionId);
      return sessionData;
      
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      throw error;
    }
  }
}
```

---

## 6. Error Handling

### Common Authentication Errors

```javascript
// Handle authentication errors in your app
async function startSession() {
  try {
    const session = await service.initializeSession(userId, powerupId);
  } catch (error) {
    if (error.message.includes('Authentication failed')) {
      // Token expired or invalid - redirect to login
      navigation.navigate('Login');
    } else if (error.message.includes('403')) {
      // User ID mismatch
      Alert.alert('Error', 'Invalid user credentials');
    } else if (error.message.includes('429')) {
      // Rate limit exceeded
      Alert.alert('Error', 'Too many requests. Please try again later.');
    } else {
      // Other errors
      Alert.alert('Error', 'Failed to start session');
    }
  }
}
```

---

## 7. Security Best Practices

### DO ✅

1. **Store tokens securely**:
   ```javascript
   import * as SecureStore from 'expo-secure-store';
   await SecureStore.setItemAsync('jwt_token', token);
   ```

2. **Refresh expired tokens**:
   ```javascript
   if (response.status === 401) {
     await refreshToken();
     // Retry request
   }
   ```

3. **Validate HTTPS**:
   ```javascript
   if (!backendUrl.startsWith('https://')) {
     throw new Error('Backend must use HTTPS');
   }
   ```

### DON'T ❌

1. Don't store tokens in AsyncStorage (use SecureStore)
2. Don't log tokens to console in production
3. Don't hardcode API keys in your app
4. Don't skip token expiration checks

---

## 8. Testing Authentication

### Test Script

```javascript
// test_auth.js
async function testAuthentication() {
  const BACKEND_URL = 'http://localhost:8000';
  const JWT_TOKEN = 'your_test_token_here';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/voice-walkie/session/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          user_id: 'test_user',
          voice_name: 'Puck',
        }),
      }
    );

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);

    if (response.ok) {
      console.log('✅ Authentication successful!');
      console.log('Session ID:', data.session_id);
    } else {
      console.log('❌ Authentication failed:', data.detail);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testAuthentication();
```

---

## Summary for Mobile Developer

**Current State**: 
- ⚠️ Authentication is a PLACEHOLDER returning `"demo_user_id"`
- ⚠️ Needs to be replaced with your actual auth system

**To Integrate**:

1. **Ask your backend team**: What authentication method do you use?
   - JWT tokens? (Most common)
   - API keys?
   - Session cookies?

2. **Get from backend team**:
   - Authentication endpoint (if not already available)
   - Token format/structure
   - How to include auth credentials in requests

3. **Mobile app needs to send**:
   - `Authorization: Bearer <token>` header (for JWT)
   - Or `X-API-Key: <key>` header (for API keys)
   - Or session cookie (for session auth)

4. **Request body** (`SessionStartRequest`):
   ```json
   {
     "user_id": "string",
     "powerup_id": 42,           // optional
     "ai_speaks_first": true,    // optional
     "voice_name": "Puck",       // optional
     "enable_barge_in": true     // optional
   }
   ```

**Contact your backend team to implement the authentication method that matches your existing system!**

