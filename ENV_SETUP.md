# Environment Setup

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wildraft?schema=public"

# JWT Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Google OAuth (optional - for Google login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# CORS (frontend URL)
CORS_ORIGIN=http://localhost:3000
```

## Google OAuth Setup (Optional)

Only needed if you want Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth client ID → Web application
4. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Secret to `.env`

## Security

- ⚠️ Never commit `.env` to git
- Change JWT secrets before production
- Use HTTPS in production

See [QUICKSTART.md](./QUICKSTART.md) for complete setup instructions.
