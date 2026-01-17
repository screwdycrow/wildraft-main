# Backend Development Guidelines

## Table of Contents

1. [Project Structure](#project-structure)
2. [Code Style & Best Practices](#code-style--best-practices)
3. [Version Tracking System](#version-tracking-system)
4. [File URL Management](#file-url-management)
5. [Error Handling](#error-handling)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Best Practices](#database-best-practices)
8. [API Design Principles](#api-design-principles)
9. [Testing Guidelines](#testing-guidelines)
10. [Performance Optimization](#performance-optimization)

---

## Project Structure

```
src/
├── index.ts                 # Main server entry point
├── lib/                     # Core libraries and utilities
│   ├── prisma.ts           # Prisma client instance
│   ├── jwt.ts              # JWT token utilities
│   └── s3.ts               # S3 file operations
├── middleware/              # Request middleware
│   ├── auth.ts             # Authentication middleware
│   └── library-access.ts   # Library access control
├── routes/                  # API route handlers
│   ├── index.ts            # Route registration
│   ├── auth.ts             # Authentication routes
│   ├── libraries.ts        # Library routes
│   ├── tags.ts             # Tag routes
│   ├── library-items.ts    # Library item routes
│   ├── versions.ts         # Version tracking routes
│   └── ...
├── schemas/                 # Request/response schemas
│   ├── library.schemas.ts
│   ├── tag.schemas.ts
│   └── ...
├── utils/                   # Utility functions
│   └── library-version.ts  # Version increment helpers
└── websocket/               # WebSocket handlers
    └── portal-view-socket.ts
```

---

## Code Style & Best Practices

### TypeScript

- **Always use TypeScript types** - Avoid `any` when possible
- **Use interfaces for request/response types**:
  ```typescript
  fastify.get<{
    Params: { id: string };
    Body: { name: string };
    Querystring: { limit?: number };
  }>('/:id', async (request, reply) => {
    // TypeScript knows request.params.id, request.body.name, etc.
  });
  ```

### Async/Await

- **Always use async/await** - Avoid promise chains
- **Handle errors properly**:
  ```typescript
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    request.log.error({ error }, 'Operation failed');
    reply.code(500);
    return { error: 'Operation failed' };
  }
  ```

### Logging

- **Use structured logging**:
  ```typescript
  // Good
  request.log.info({ userId, libraryId }, 'Library accessed');
  request.log.error({ error, libraryId }, 'Failed to fetch library');
  
  // Bad
  console.log('Library accessed');
  console.error('Error:', error);
  ```

### Naming Conventions

- **Routes**: Use RESTful naming (`/libraries/:id/items`)
- **Functions**: Use descriptive names (`incrementLibraryVersion`)
- **Variables**: Use camelCase (`libraryId`, `userAccess`)
- **Constants**: Use UPPER_SNAKE_CASE (`DEFAULT_CACHE_EXPIRES_IN`)

---

## Version Tracking System

### When to Increment Versions

The version tracking system automatically increments versions when data changes. **You must increment versions in your route handlers** when:

#### Library Version (`version`)
- ✅ Library created → Create version record (initialized to 1)
- ✅ Library updated → Call `incrementLibraryVersion(libraryId)`

**Example:**
```typescript
// In libraries.ts - Update route
const library = await prisma.library.update({
  where: { id },
  data: { name, description }
});

// IMPORTANT: Increment version after update
await incrementLibraryVersion(id);
```

#### Tags Version (`tagsVersion`)
- ✅ Tag created → Call `incrementTagsVersion(libraryId)`
- ✅ Tag updated → Call `incrementTagsVersion(libraryId)`
- ✅ Tag deleted → Call `incrementTagsVersion(libraryId)`

**Example:**
```typescript
// In tags.ts - Create route
const tag = await prisma.tag.create({
  data: { libraryId, name, color }
});

// IMPORTANT: Increment tags version
await incrementTagsVersion(libraryId);
```

#### Items Version (`itemsVersion`)
- ✅ Item created → Call `incrementItemsVersion(libraryId)`
- ✅ Item updated → Call `incrementItemsVersion(libraryId)`
- ✅ Item deleted → Call `incrementItemsVersion(libraryId)`

**Example:**
```typescript
// In library-items.ts - Update route
const item = await prisma.libraryItem.update({
  where: { id: itemId },
  data: { name, data }
});

// IMPORTANT: Increment items version
await incrementItemsVersion(libraryId);
```

### Helper Functions

Use the helper functions from `src/utils/library-version.ts`:

```typescript
import {
  incrementLibraryVersion,
  incrementTagsVersion,
  incrementItemsVersion
} from '../utils/library-version';

// These functions automatically:
// 1. Create version record if it doesn't exist
// 2. Increment the appropriate version counter
// 3. Update the updatedAt timestamp
```

### Creating New Libraries

When creating a library, create the version record in the same transaction:

```typescript
const library = await prisma.library.create({
  data: {
    name,
    description,
    access: { create: { userId, role: 'OWNER' } },
    version: {
      create: {
        version: 1,
        tagsVersion: 1,
        itemsVersion: 1,
      },
    },
  },
});
```

### Common Mistakes

❌ **Don't forget to increment versions** - Clients rely on version numbers for caching  
❌ **Don't increment wrong version** - Tags changes → `tagsVersion`, not `version`  
❌ **Don't increment on reads** - Only increment on create/update/delete operations  

---

## File URL Management

### Expiration Times

- **Download URLs**: Default 6 hours (21600 seconds)
- **Upload URLs**: Default 1 hour (3600 seconds)
- **Configurable**: Via environment variables

### Environment Variables

```env
# File URL expiration (in seconds)
FILE_DOWNLOAD_URL_EXPIRES_IN=21600  # 6 hours
FILE_UPLOAD_URL_EXPIRES_IN=3600     # 1 hour
```

### Generating File URLs

Always use the helper functions with proper expiration:

```typescript
import { getSignedDownloadUrl } from '../lib/s3';
import { enrichUserFileWithDownloadUrl } from './user-files';

// For cached files (6 hours default)
const downloadUrl = await getSignedDownloadUrl(filePath);
// or
const enrichedFile = await enrichUserFileWithDownloadUrl(userFile);

// For custom expiration
const downloadUrl = await getSignedDownloadUrl(filePath, 3600); // 1 hour
```

### Security

- **Always validate file ownership** before generating URLs
- **Clamp expiration times** between 1 hour and 7 days
- **Never expose S3 credentials** - Always use presigned URLs

---

## Error Handling

### Standard Error Responses

Always return consistent error responses:

```typescript
// 400 Bad Request
reply.code(400);
return {
  error: 'Bad Request',
  message: 'Invalid library ID'
};

// 401 Unauthorized
reply.code(401);
return {
  error: 'Unauthorized',
  message: 'Authentication required'
};

// 403 Forbidden
reply.code(403);
return {
  error: 'Forbidden',
  message: 'Insufficient permissions'
};

// 404 Not Found
reply.code(404);
return {
  error: 'Not Found',
  message: 'Library not found'
};

// 500 Internal Server Error
reply.code(500);
return {
  error: 'Internal Server Error',
  message: error instanceof Error ? error.message : 'Unknown error'
};
```

### Try-Catch Blocks

Always wrap database operations in try-catch:

```typescript
try {
  const library = await prisma.library.findUnique({
    where: { id: libraryId }
  });
  
  if (!library) {
    reply.code(404);
    return { error: 'Not Found', message: 'Library not found' };
  }
  
  return { library };
} catch (error) {
  request.log.error({ error, libraryId }, 'Failed to fetch library');
  reply.code(500);
  return {
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### Logging Errors

Always log errors with context:

```typescript
request.log.error(
  { error, userId, libraryId, operation: 'update' },
  'Failed to update library'
);
```

---

## Authentication & Authorization

### Middleware Order

Always apply middleware in the correct order:

```typescript
fastify.get(
  '/:id',
  {
    preHandler: [
      authenticateToken,      // 1. Check authentication
      requireEditorAccess     // 2. Check permissions
    ]
  },
  async (request, reply) => {
    // Handler code
  }
);
```

### Access Control

Use the appropriate middleware:

- `authenticateToken` - Verify JWT token
- `requireViewerAccess` - Require VIEWER, EDITOR, or OWNER
- `requireEditorAccess` - Require EDITOR or OWNER
- `requireOwnerAccess` - Require OWNER only

### User Context

After authentication, user info is available in `request.user`:

```typescript
const userId = request.user!.userId;
const email = request.user!.email;
```

---

## Database Best Practices

### Prisma Queries

- **Use `findUnique` for single records by ID**
- **Use `findFirst` for single records with conditions**
- **Use `findMany` for multiple records**
- **Always include error handling**

### Transactions

Use transactions for related operations:

```typescript
await prisma.$transaction(async (tx) => {
  const library = await tx.library.create({ data: {...} });
  await tx.libraryVersion.create({
    data: { libraryId: library.id, version: 1, ... }
  });
  return library;
});
```

### Relations

Use Prisma's relation API:

```typescript
// Include relations
const library = await prisma.library.findUnique({
  where: { id },
  include: {
    access: true,
    tags: true,
    libraryItems: true
  }
});

// Connect relations
await prisma.libraryItem.create({
  data: {
    libraryId,
    name,
    tags: {
      connect: tagIds.map(id => ({ id }))
    }
  }
});
```

### Indexes

Always index foreign keys and frequently queried fields:

```prisma
model LibraryItem {
  libraryId Int
  library   Library @relation(...)
  
  @@index([libraryId])  // Index foreign key
  @@index([type])       // Index frequently queried field
}
```

---

## API Design Principles

### RESTful Routes

Follow REST conventions:

```
GET    /api/libraries           # List all
GET    /api/libraries/:id       # Get one
POST   /api/libraries           # Create
PUT    /api/libraries/:id       # Update
DELETE /api/libraries/:id       # Delete
```

### Nested Resources

Use nested routes for related resources:

```
GET    /api/libraries/:id/tags
POST   /api/libraries/:id/tags
GET    /api/libraries/:id/items
POST   /api/libraries/:id/items
```

### Query Parameters

Use query parameters for filtering, pagination, etc.:

```
GET /api/libraries/:id/items?type=STAT_BLOCK_DND_5E&limit=10
```

### Response Format

Always return consistent response formats:

```typescript
// Single resource
return { library: {...} };

// Multiple resources
return { libraries: [...] };

// With message
return {
  message: 'Library created successfully',
  library: {...}
};
```

---

## Testing Guidelines

### Unit Tests

Test utility functions and helpers:

```typescript
describe('incrementLibraryVersion', () => {
  it('should increment version', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('GET /api/libraries/:id', () => {
  it('should return library', async () => {
    // Test implementation
  });
});
```

### Test Data

Use test fixtures and factories:

```typescript
const createTestLibrary = async () => {
  return prisma.library.create({
    data: {
      name: 'Test Library',
      // ...
    }
  });
};
```

---

## Performance Optimization

### Database Queries

- **Use `select` to limit fields**:
  ```typescript
  const library = await prisma.library.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      // Only select what you need
    }
  });
  ```

- **Use `include` wisely** - Don't over-fetch:
  ```typescript
  // Good - only include what you need
  include: { tags: true }
  
  // Bad - includes everything
  include: { tags: true, items: true, access: true, ... }
  ```

### Caching

- **Use version tracking** for client-side caching
- **Consider server-side caching** for frequently accessed data
- **Cache file URLs** with proper expiration

### Batch Operations

Use batch endpoints when possible:

```typescript
// Good - Single API call
POST /api/versions/batch
{ "libraryIds": [1, 2, 3, 4, 5] }

// Bad - Multiple API calls
GET /api/libraries/1/versions
GET /api/libraries/2/versions
GET /api/libraries/3/versions
// ...
```

### Pagination

Always paginate large result sets:

```typescript
const items = await prisma.libraryItem.findMany({
  where: { libraryId },
  take: 20,  // Limit
  skip: 0,   // Offset
  orderBy: { createdAt: 'desc' }
});
```

---

## Common Patterns

### Creating with Relations

```typescript
const library = await prisma.library.create({
  data: {
    name,
    access: {
      create: {
        userId,
        role: 'OWNER'
      }
    },
    version: {
      create: {
        version: 1,
        tagsVersion: 1,
        itemsVersion: 1
      }
    }
  }
});
```

### Updating with Version Increment

```typescript
const library = await prisma.library.update({
  where: { id },
  data: { name, description }
});

await incrementLibraryVersion(id);
```

### Enriching with File URLs

```typescript
const item = await prisma.libraryItem.findUnique({
  where: { id },
  include: {
    featuredImage: true,
    userFiles: true
  }
});

const enrichedItem = {
  ...item,
  featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
  userFiles: await enrichUserFilesWithDownloadUrls(item.userFiles)
};
```

---

## Security Checklist

- ✅ Always validate user input
- ✅ Always check authentication
- ✅ Always check authorization
- ✅ Always validate file ownership before generating URLs
- ✅ Never expose sensitive data in responses
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Sanitize user input
- ✅ Rate limit API endpoints
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

---

## Deployment Checklist

- ✅ Set all required environment variables
- ✅ Run database migrations
- ✅ Generate Prisma client
- ✅ Test all endpoints
- ✅ Verify file upload/download works
- ✅ Check WebSocket connections
- ✅ Monitor error logs
- ✅ Set up health checks
- ✅ Configure CORS properly
- ✅ Set up rate limiting

---

## Getting Help

- Check existing route files for examples
- Review Prisma documentation: https://www.prisma.io/docs
- Review Fastify documentation: https://www.fastify.io/docs
- Check error logs for detailed error messages
- Use TypeScript types to understand expected data structures

---

## Quick Reference

### Version Increment Functions

```typescript
import {
  incrementLibraryVersion,  // For library metadata changes
  incrementTagsVersion,      // For tag changes
  incrementItemsVersion      // For item changes
} from '../utils/library-version';
```

### File URL Helpers

```typescript
import {
  enrichUserFileWithDownloadUrl,
  enrichUserFilesWithDownloadUrls
} from './user-files';
```

### Middleware

```typescript
import {
  authenticateToken,
  requireViewerAccess,
  requireEditorAccess,
  requireOwnerAccess
} from '../middleware/auth';
```

### Default Expiration Times

- Download URLs: 6 hours (21600 seconds)
- Upload URLs: 1 hour (3600 seconds)

---

**Remember:** When in doubt, check existing code for patterns and examples! 🚀

