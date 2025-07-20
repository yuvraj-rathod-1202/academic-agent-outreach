# Backend API Requirements

This document outlines the required backend API endpoints for the refresh token functionality.

## Required Endpoints

### 1. OAuth Callback Endpoint
**URL:** `POST /auth/callback`

**Description:** Exchange authorization code for access and refresh tokens

**Request Body:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "access_token": "ya29.access_token_here",
  "refresh_token": "1//refresh_token_here",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Implementation Notes:**
- Use Google's OAuth2 token exchange endpoint
- Exchange the authorization code for tokens using your Google OAuth2 credentials
- Return both access_token and refresh_token to the frontend

### 2. Token Refresh Endpoint
**URL:** `POST /auth/refresh`

**Description:** Refresh an expired access token using refresh token

**Request Body:**
```json
{
  "refresh_token": "1//refresh_token_here"
}
```

**Response:**
```json
{
  "access_token": "ya29.new_access_token_here",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Implementation Notes:**
- Use Google's OAuth2 refresh endpoint
- The refresh_token stays the same and should not be updated
- Return the new access_token with its expiry time

## Google OAuth2 Configuration

### Required Scopes
- `https://www.googleapis.com/auth/gmail.send`

### OAuth2 Flow Type
- Authorization Code Flow (not Implicit Flow)
- This allows getting refresh tokens on the first authorization

### Environment Variables Needed
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000 (or your domain)
```

## Implementation Example (Python/FastAPI)

```python
import httpx
from fastapi import HTTPException

@app.post("/auth/callback")
async def auth_callback(request: dict):
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": request["code"],
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code")
            
        return token_response.json()

@app.post("/auth/refresh")
async def refresh_token(request: dict):
    async with httpx.AsyncClient() as client:
        refresh_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": request["refresh_token"],
                "grant_type": "refresh_token",
            }
        )
        
        if refresh_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to refresh token")
            
        return refresh_response.json()
```

## Security Considerations

1. **Refresh Token Storage**: Refresh tokens should be stored securely in Firestore with proper user access controls
2. **Token Expiry**: Access tokens typically expire in 1 hour - implement automatic refresh logic
3. **Error Handling**: Handle cases where refresh tokens become invalid (user must re-authenticate)
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **HTTPS Only**: All authentication endpoints should only work over HTTPS in production

## Testing

1. Test the authorization flow with a new user
2. Verify tokens are properly stored in Firestore
3. Test automatic token refresh when access token expires
4. Test error handling when refresh token is invalid
