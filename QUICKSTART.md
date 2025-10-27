# Quick Start

Get running in 5 minutes!

## Prerequisites

- PostgreSQL running
- `.env` file configured (see [ENV_SETUP.md](./ENV_SETUP.md))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run database migration
npx prisma db push

# 3. Start server
npm run dev
```

Server runs at http://localhost:3000

## Test Authentication

### Email/Password (Works Immediately!)

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Use the returned accessToken
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/auth/me
```

**Password requirements**: 8+ chars, uppercase, lowercase, number

### Google OAuth (Optional)

1. Set up Google credentials (see [ENV_SETUP.md](./ENV_SETUP.md))
2. Visit: http://localhost:3000/api/auth/google
3. Sign in with Google
4. Get tokens from response

## API Documentation

Interactive docs at http://localhost:3000/docs

## Frontend Integration

```javascript
// Register/Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken } = await response.json();
localStorage.setItem('accessToken', accessToken);

// Authenticated requests
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Protect Routes

```typescript
import { authenticateToken } from '../middleware/auth';

fastify.get('/protected', 
  { preHandler: authenticateToken },
  async (request, reply) => {
    const userId = request.user?.userId;
    return { message: 'Authenticated!' };
  }
);
```

## Common Issues

**Token expired**: Use refresh token endpoint
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

**CORS errors**: Check `CORS_ORIGIN` in `.env` matches your frontend URL

**Google OAuth not working**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

## What's Available

- ✅ Email/Password authentication
- ✅ Google OAuth
- ✅ JWT tokens (access + refresh)
- ✅ Protected routes
- ✅ Library management with RBAC
- ✅ Swagger documentation

## Next Steps

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth details
- [LIBRARIES.md](./LIBRARIES.md) - Library system
- [SWAGGER.md](./SWAGGER.md) - API docs
- http://localhost:3000/docs - Interactive API explorer

## Production Checklist

- [ ] Change JWT secrets
- [ ] Use HTTPS
- [ ] Update OAuth redirect URIs
- [ ] Set CORS_ORIGIN to your domain
- [ ] Run `npm run build`
- [ ] Run `npx prisma migrate deploy`
