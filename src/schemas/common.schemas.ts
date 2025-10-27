// Common reusable schema components

export const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};

export const errorResponseWithMessage = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    name: { type: 'string', nullable: true },
    picture: { type: 'string', nullable: true },
  },
};

export const userWithTimestamps = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    name: { type: 'string', nullable: true },
    picture: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const authTokensResponse = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
};

export const accessRoleEnum = ['OWNER', 'EDITOR', 'VIEWER'];

export const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'integer',
      description: 'Resource ID',
    },
  },
};

export const commonResponses = {
  401: {
    description: 'Unauthorized',
    ...errorResponse,
  },
  403: {
    description: 'Access denied',
    ...errorResponse,
  },
  404: {
    description: 'Not found',
    ...errorResponse,
  },
  500: {
    description: 'Internal server error',
    ...errorResponse,
  },
};

