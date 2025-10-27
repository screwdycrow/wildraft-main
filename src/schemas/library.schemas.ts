// Library route schemas

export const getLibrariesSchema = {
  tags: ['libraries'],
  summary: 'Get all accessible libraries',
  description: 'Get all libraries the user has access to, including their role for each library',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'List of libraries',
      type: 'object',
      properties: {
        libraries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const createLibrarySchema = {
  tags: ['libraries'],
  summary: 'Create new library',
  description: 'Create a new library. Creator automatically receives OWNER access.',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Library name',
        example: 'My Library',
      },
      description: {
        type: 'string',
        description: 'Optional library description',
        example: 'A collection of resources',
      },
    },
  },
  response: {
    201: {
      description: 'Library created successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        library: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            userRole: { type: 'string', enum: ['OWNER'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      description: 'Invalid request',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const getLibrarySchema = {
  tags: ['libraries'],
  summary: 'Get library details',
  description: 'Get detailed information about a library. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Library ID' },
    },
  },
  response: {
    200: {
      description: 'Library details',
      type: 'object',
      properties: {
        library: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            userRole: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Access denied', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Library not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const updateLibrarySchema = {
  tags: ['libraries'],
  summary: 'Update library',
  description: 'Update library details. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Library ID' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, description: 'Library name' },
      description: { type: 'string', description: 'Library description' },
    },
  },
  response: {
    200: {
      description: 'Library updated',
      type: 'object',
      properties: {
        message: { type: 'string' },
        library: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: { description: 'Invalid request', type: 'object', properties: { error: { type: 'string' } } },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Insufficient permissions', type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const deleteLibrarySchema = {
  tags: ['libraries'],
  summary: 'Delete library',
  description: 'Delete a library. Requires OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'Library ID' },
    },
  },
  response: {
    204: { 
      description: 'Library deleted',
      type: 'null',
    },
    401: { description: 'Unauthorized', type: 'object', properties: { error: { type: 'string' } } },
    403: { description: 'Insufficient permissions', type: 'object', properties: { error: { type: 'string' } } },
    404: { description: 'Library not found', type: 'object', properties: { error: { type: 'string' } } },
  },
};

