# Schema Organization

## Why Separate Schemas?

Route files were getting huge with inline schema definitions. We've extracted all Swagger/OpenAPI schemas into separate files for better maintainability.

## Structure

```
src/
├── schemas/
│   ├── common.schemas.ts         # Reusable components
│   ├── auth.schemas.ts            # Auth route schemas
│   ├── library.schemas.ts         # Library route schemas
│   └── library-access.schemas.ts  # Access management schemas
└── routes/
    ├── auth.ts                    # Uses auth.schemas.ts
    ├── libraries.ts               # Uses library.schemas.ts
    └── library-access.ts          # Uses library-access.schemas.ts
```

## Before vs After

### Before (Messy)
```typescript
fastify.post('/register', {
  schema: {
    tags: ['auth'],
    summary: 'Register new user',
    body: {
      type: 'object',
      // ... 50+ lines of schema ...
    },
    response: {
      // ... more lines ...
    }
  }
}, handler);
```

### After (Clean)
```typescript
// schemas/auth.schemas.ts
export const registerSchema = {
  tags: ['auth'],
  summary: 'Register new user',
  body: { /* ... */ },
  response: { /* ... */ }
};

// routes/auth.ts
import { registerSchema } from '../schemas/auth.schemas';

fastify.post('/register', { schema: registerSchema }, handler);
```

## Adding New Routes

1. **Define schema** in the appropriate schema file:
```typescript
// src/schemas/my-feature.schemas.ts
export const createItemSchema = {
  tags: ['items'],
  summary: 'Create item',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Item name' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' }
      }
    }
  }
};
```

2. **Import and use** in route file:
```typescript
// src/routes/my-feature.ts
import { createItemSchema } from '../schemas/my-feature.schemas';

export const myFeatureRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/', { schema: createItemSchema }, async (request, reply) => {
    // Your business logic here
  });
};
```

## Schema Template

```typescript
export const myRouteSchema = {
  tags: ['feature-name'],              // For Swagger grouping
  summary: 'Short description',        // Route summary
  description: 'Detailed description', // Optional details
  security: [{ bearerAuth: [] }],      // If auth required
  
  params: {                            // URL parameters
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  
  body: {                              // Request body (POST/PUT)
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'My Item' }
    }
  },
  
  response: {
    200: {                             // Success response
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' }
      }
    },
    400: {                             // Error responses
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};
```

## Common Response Types

Use `common.schemas.ts` for reusable components:

```typescript
import { errorResponse } from '../schemas/common.schemas';

export const mySchema = {
  response: {
    404: errorResponse,  // Reuse!
  }
};
```

## 204 No Content Responses

For DELETE routes that return no body:

```typescript
response: {
  204: {
    description: 'Deleted successfully',
    type: 'null'  // Important!
  }
}
```

## Best Practices

1. **One schema file per feature** - Keep related schemas together
2. **Descriptive names** - `createLibrarySchema` not `postSchema`
3. **Add examples** - Helps with Swagger "Try it out"
4. **Document everything** - Add `description` to properties
5. **Reuse common parts** - Use `common.schemas.ts`

## Testing Your Schemas

1. Start server: `npm run dev`
2. Check Swagger UI: http://localhost:3000/docs
3. Verify routes appear correctly
4. Test with "Try it out"

## Troubleshooting

**Schema not in Swagger?**
- Check export in schema file
- Verify import in route file
- Ensure schema is in route options

**Validation errors?**
- Check JSON Schema format
- Verify `required` fields exist
- Match TypeScript types with schema

For more info, see [SWAGGER.md](../SWAGGER.md)
