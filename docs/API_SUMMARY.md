# Wildraft Prisma Backend - API Summary

## Overview

This backend provides a comprehensive API for managing D&D 5E content with flexible library management, item organization, and collaborative features.

## Base URL
```
http://localhost:3000
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)
- **POST** `/register` - Register new user
- **POST** `/login` - Login with email/password
- **POST** `/google` - Initiate Google OAuth
- **POST** `/refresh` - Refresh access token
- **GET** `/me` - Get current user info
- **POST** `/logout` - Logout user

[Full Documentation](AUTHENTICATION.md)

---

### Users (`/api/users`)
- **GET** `/` - Get all users (admin)
- **GET** `/:id` - Get user by ID
- **PUT** `/:id` - Update user
- **DELETE** `/:id` - Delete user

---

### Libraries (`/api/libraries`)
- **GET** `/` - Get all accessible libraries
- **POST** `/` - Create new library
- **GET** `/:id` - Get library details
- **PUT** `/:id` - Update library
- **DELETE** `/:id` - Delete library

[Full Documentation](LIBRARIES.md)

---

### Library Access (`/api/libraries/:libraryId/access`)
- **GET** `/:libraryId/access` - Get all users with access
- **POST** `/:libraryId/access` - Grant access to user
- **PUT** `/:libraryId/access/:accessId` - Update user's access role
- **DELETE** `/:libraryId/access/:accessId` - Revoke access
- **GET** `/:libraryId/access/pending` - Get pending invitations
- **POST** `/:libraryId/access/invite` - Invite user by email

**Access Roles:**
- **OWNER**: Full control, can delete library
- **EDITOR**: Can edit content, manage viewer access
- **VIEWER**: Read-only access

---

### Library Items (`/api/libraries/:libraryId/items`)
- **POST** `/:libraryId/items` - Create library item
- **GET** `/:libraryId/items` - Get all items
- **GET** `/:libraryId/items/:itemId` - Get single item
- **PUT** `/:libraryId/items/:itemId` - Update item
- **DELETE** `/:libraryId/items/:itemId` - Delete item

**Item Types:**
- **STAT_BLOCK_DND_5E**: D&D 5E creature/NPC stat blocks
- **NOTE**: Text notes with formatting
- **ITEM_DND_5E**: D&D 5E items/equipment
- **CHARACTER_DND_5E**: Player characters or NPCs

[Full Documentation](LIBRARY_ITEMS_API.md)
[Examples](LIBRARY_ITEMS_EXAMPLES.md)

---

### Tags (`/api/libraries/:libraryId/tags`)
- **POST** `/:libraryId/tags` - Create tag
- **GET** `/:libraryId/tags` - Get all tags
- **GET** `/:libraryId/tags/:tagId` - Get single tag with items
- **PUT** `/:libraryId/tags/:tagId` - Update tag
- **DELETE** `/:libraryId/tags/:tagId` - Delete tag

[Full Documentation](TAGS_API.md)

---

## Quick Start Guide

### 1. Register and Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Save the accessToken from the response
export TOKEN="<your-access-token>"
```

### 2. Create a Library

```bash
curl -X POST http://localhost:3000/api/libraries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Campaign",
    "description": "Content for my D&D campaign"
  }'

# Save the library ID from the response
export LIBRARY_ID="1"
```

### 3. Create Tags

```bash
# Combat tag
curl -X POST http://localhost:3000/api/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Combat", "color": "#E74C3C"}'

# Monster tag
curl -X POST http://localhost:3000/api/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Monster", "color": "#27AE60"}'
```

### 4. Create a Stat Block

```bash
curl -X POST http://localhost:3000/api/libraries/$LIBRARY_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "STAT_BLOCK_DND_5E",
    "name": "Goblin Warrior",
    "description": "A basic goblin warrior",
    "data": {
      "cr": "1/4",
      "hp": 7,
      "ac": 15,
      "speed": "30 ft.",
      "str": 8,
      "dex": 14,
      "con": 10,
      "int": 10,
      "wis": 8,
      "cha": 8
    },
    "tagIds": [1, 2]
  }'
```

### 5. Get All Items

```bash
curl -X GET http://localhost:3000/api/libraries/$LIBRARY_ID/items \
  -H "Authorization: Bearer $TOKEN"
```

---

## Swagger/OpenAPI Documentation

Interactive API documentation is available at:
```
http://localhost:3000/documentation
```

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response examples
- Schema definitions
- Authentication configuration

To export the OpenAPI specification:
```bash
npm run export-openapi
```

[Swagger Setup Guide](SWAGGER.md)

---

## Data Model

### User
- id, email, name, password, picture, googleId
- refreshToken, createdAt, updatedAt
- Relations: libraryAccess[], userFiles[]

### Library
- id, name, description, template
- createdAt, updatedAt
- Relations: access[], items[], tags[]

### LibraryAccess
- id, userId, libraryId, role
- createdAt, updatedAt
- Roles: OWNER, EDITOR, VIEWER

### LibraryItem
- id, libraryId, type, name, description
- data (JSON), createdAt, updatedAt
- Relations: tags[]
- Types: STAT_BLOCK_DND_5E, NOTE, ITEM_DND_5E, CHARACTER_DND_5E

### Tag
- id, name, color, libraryId
- createdAt, updatedAt
- Relations: libraryItems[]

[Full Schema Documentation](SCHEMA_ORGANIZATION.md)

---

## Environment Setup

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Server
PORT=3000
NODE_ENV="development"
```

[Full Setup Guide](ENV_SETUP.md)

---

## Development

### Install Dependencies
```bash
npm install
```

### Run Migrations
```bash
npx prisma migrate dev
```

### Start Development Server
```bash
npm run dev
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Tests
```bash
npm test
```

---

## Project Structure

```
wildraft-prisma-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── index.ts              # Main entry point
│   ├── lib/                  # Utilities
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── item-schemas.ts   # Item validation
│   │   └── library-permissions.ts
│   ├── middleware/           # Middleware
│   │   ├── auth.ts
│   │   └── library-access.ts
│   ├── routes/               # API routes
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── libraries.ts
│   │   ├── library-access.ts
│   │   ├── library-items.ts
│   │   └── tags.ts
│   └── schemas/              # Swagger schemas
│       ├── auth.schemas.ts
│       ├── user.schemas.ts
│       ├── library.schemas.ts
│       ├── library-access.schemas.ts
│       ├── library-item.schemas.ts
│       └── tag.schemas.ts
├── docs/                     # Documentation
└── package.json
```

---

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens, Google OAuth
- **API Documentation**: Swagger/OpenAPI
- **Validation**: AJV for item schemas
- **Security**: bcrypt for password hashing

---

## Features

### ✅ User Management
- Email/password authentication
- Google OAuth integration
- JWT with refresh tokens
- Password strength validation

### ✅ Library Management
- Create and manage multiple libraries
- Flexible access control (Owner/Editor/Viewer)
- User invitations and access management
- Cascade deletion for data integrity

### ✅ Library Items
- Four item types with type-specific validation
- Flexible JSON data structure
- Custom fields support
- Tag-based organization

### ✅ Tags
- Color-coded organization
- Item counting
- Unique within library
- Automatic cleanup on deletion

### ✅ Documentation
- Comprehensive Swagger/OpenAPI docs
- Code examples in multiple languages
- Detailed API guides
- Interactive testing interface

---

## API Rate Limits

Currently no rate limits are enforced. Consider implementing rate limiting in production:

```typescript
// Example with fastify-rate-limit
await fastify.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '15 minutes'
});
```

---

## Security Considerations

1. **Always use HTTPS in production**
2. **Set secure JWT secrets** (use long random strings)
3. **Implement rate limiting**
4. **Validate all user input**
5. **Use environment variables** for sensitive data
6. **Enable CORS** only for trusted domains
7. **Keep dependencies updated**

---

## Support & Contributing

For issues, questions, or contributions:
1. Check the documentation in the `docs/` folder
2. Review existing issues
3. Create a new issue with detailed information
4. Follow the coding standards in the project

---

## License

[Your License Here]

---

## Version History

### v1.0.0 (Current)
- Initial release
- User authentication (email/password + Google OAuth)
- Library management with access control
- Library items (4 types with validation)
- Tags system
- Complete Swagger documentation
- Comprehensive API examples

---

## Next Steps

Consider implementing:
- [ ] Search and filtering for items
- [ ] Pagination for large result sets
- [ ] File upload for images/PDFs
- [ ] Export/import library data
- [ ] Activity logs
- [ ] WebSocket support for real-time updates
- [ ] Email notifications
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Template libraries

