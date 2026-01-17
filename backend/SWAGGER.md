# API Documentation (Swagger)

## Access Swagger UI

Once the server is running:

```
http://localhost:3000/docs
```

## Using Swagger

### 1. Explore Routes
- Routes are organized by tags: `auth`, `libraries`, `library-access`, `users`, `health`
- Click any route to see details and try it out

### 2. Authenticate
Most routes require authentication:

1. **Get a token** - Use one of these routes:
   - `POST /api/auth/register` - Create account
   - `POST /api/auth/login` - Login with email/password
   - `GET /api/auth/google` - Login with Google

2. **Copy the `accessToken`** from the response

3. **Click "Authorize" button** (top right with lock icon)

4. **Enter token**:
   ```
   Bearer YOUR_TOKEN_HERE
   ```

5. Click "Authorize" then "Close"

Now you can test protected routes! ✅

### 3. Test Endpoints
- Click "Try it out"
- Fill in parameters
- Click "Execute"
- View response

## Export for Postman

Export the OpenAPI specification:

```bash
npm run docs:export
```

This creates `openapi.json` in the root directory.

### Import to Postman

1. Open Postman
2. Click "Import"
3. Select `openapi.json`
4. All routes are imported with full documentation!

### Set up Auth in Postman

1. Send a login/register request
2. Copy the `accessToken`
3. Go to Collection settings → Authorization
4. Type: Bearer Token
5. Paste your token
6. All requests now include auth! 🎉

## OpenAPI JSON

Direct access to the spec:
```
http://localhost:3000/docs/json
```

## Common Issues

**"Unauthorized" errors**: Click the Authorize button and add your token

**Routes not showing**: Make sure the server is running and check the console for errors

**Changes not appearing**: Restart the server to see schema updates

## Quick Reference

**Swagger UI**: http://localhost:3000/docs  
**OpenAPI JSON**: http://localhost:3000/docs/json  
**Export command**: `npm run docs:export`
