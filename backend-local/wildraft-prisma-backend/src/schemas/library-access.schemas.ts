// Library access management schemas

export const getLibraryAccessSchema = {
  tags: ['library-access'],
  summary: 'List library access',
  description: 'Get all users who have access to a library. Requires OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: {
      libraryId: { type: 'integer', description: 'Library ID' },
    },
  },
  response: {
    200: {
      description: 'List of users with access',
      type: 'object',
      properties: {
        access: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              userId: { type: 'number' },
              role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER'] },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Access denied', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Library not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const grantLibraryAccessSchema = {
  tags: ['library-access'],
  summary: 'Grant library access',
  description: 'Grant access to a user by email. Requires OWNER access. Role can be EDITOR or VIEWER (not OWNER).',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: {
      libraryId: { type: 'integer', description: 'Library ID' },
    },
  },
  body: {
    type: 'object',
    required: ['email', 'role'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email of the user to grant access to',
        example: 'user@example.com',
      },
      role: {
        type: 'string',
        enum: ['EDITOR', 'VIEWER'],
        description: 'Access role (EDITOR or VIEWER)',
        example: 'EDITOR',
      },
    },
  },
  response: {
    201: {
      description: 'Access granted',
      type: 'object',
      properties: {
        message: { type: 'string' },
        access: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            userId: { type: 'number' },
            libraryId: { type: 'number' },
            role: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: { description: 'Invalid request', type: 'object', properties: { error: { type: 'string' } } },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Access denied', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'User or library not found', type: 'object', properties: { error: { type: 'string' } } },
    409: { description: 'User already has access', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const updateLibraryAccessSchema = {
  tags: ['library-access'],
  summary: 'Update user role',
  description: 'Change a user\'s access role. Requires OWNER access. Cannot change OWNER role.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'accessId'],
    properties: {
      libraryId: { type: 'integer', description: 'Library ID' },
      accessId: { type: 'integer', description: 'Access record ID' },
    },
  },
  body: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['EDITOR', 'VIEWER'],
        description: 'New access role',
        example: 'VIEWER',
      },
    },
  },
  response: {
    200: {
      description: 'Role updated',
      type: 'object',
      properties: {
        message: { type: 'string' },
        access: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            role: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: { description: 'Invalid request', type: 'object', properties: { error: { type: 'string' } } },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Access denied', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Access record not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const revokeLibraryAccessSchema = {
  tags: ['library-access'],
  summary: 'Revoke library access',
  description: 'Remove a user\'s access to a library. Requires OWNER access. Cannot remove OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'accessId'],
    properties: {
      libraryId: { type: 'integer', description: 'Library ID' },
      accessId: { type: 'integer', description: 'Access record ID' },
    },
  },
  response: {
    204: { 
      description: 'Access revoked',
      type: 'null',
    },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Access denied', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Access record not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const leaveLibrarySchema = {
  tags: ['library-access'],
  summary: 'Leave library',
  description: 'Remove yourself from a library. Owners cannot leave their own libraries.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: {
      libraryId: { type: 'integer', description: 'Library ID' },
    },
  },
  response: {
    204: { 
      description: 'Left library successfully',
      type: 'null',
    },
    400: { description: 'Cannot leave', type: 'object', properties: { error: { type: 'string' } } },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Cannot leave own library', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Library not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

