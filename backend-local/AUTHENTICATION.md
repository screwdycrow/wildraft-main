# Authentication Guide

This project supports two authentication methods:
1. **Email & Password** (traditional)
2. **Google OAuth 2.0** (social login)

Both methods use JWT tokens for session management.

## Setup

See [ENV_SETUP.md](./ENV_SETUP.md) for environment configuration.

## Email & Password Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Response
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Google OAuth

### Initiate OAuth Flow
```http
GET /api/auth/google
```

This redirects to Google's consent screen. After approval, Google redirects back to your callback URL with tokens.

### Callback
```
GET /api/auth/google/callback?code=...
```

Returns the same response format as email/password login.

## Using Tokens

### Access Token
- Short-lived (15 minutes)
- Include in `Authorization` header:
  ```http
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

### Refresh Token
- Long-lived (7 days)
- Use to get new access token:
  ```http
  POST /api/auth/refresh
  Content-Type: application/json

  {
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }
  ```

## Protected Routes

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Frontend Integration

### React Example (Email/Password)

```javascript
// Login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.user;
}

// Make authenticated request
async function fetchProtectedData() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}

// Refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
}
```

### React Example (Google OAuth)

```javascript
// Redirect to Google OAuth
function loginWithGoogle() {
  window.location.href = 'http://localhost:3000/api/auth/google';
}

// Handle callback (in your callback component)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const user = params.get('user');
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Redirect to dashboard
  }
}, []);
```

## Security Notes

- Never commit JWT secrets to version control
- Use HTTPS in production
- Store tokens securely (httpOnly cookies in production recommended)
- Implement token rotation
- Set appropriate CORS origins

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Access Protected Route
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

**"Unauthorized" error**: Check that token is valid and properly formatted in header

**Token expired**: Use refresh token to get new access token

**Invalid password**: Ensure password meets requirements

**Google OAuth not working**: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

For more help, see [QUICKSTART.md](./QUICKSTART.md)
