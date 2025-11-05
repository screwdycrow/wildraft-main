// Authentication route schemas

export const registerSchema = {
  tags: ['auth'],
  summary: 'Register new user',
  description: 'Create a new user account with email and password. Password must be at least 8 characters with uppercase, lowercase, and number.',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'Password (min 8 chars, must contain uppercase, lowercase, and number)',
        example: 'SecurePass123',
      },
      name: {
        type: 'string',
        description: 'Optional user display name',
        example: 'John Doe',
      },
    },
  },
  response: {
    201: {
      description: 'User registered successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            picture: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: {
      description: 'Invalid request',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    409: {
      description: 'User already exists',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const loginSchema = {
  tags: ['auth'],
  summary: 'Login with email/password',
  description: 'Authenticate with email and password credentials',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        description: 'User password',
        example: 'SecurePass123',
      },
    },
  },
  response: {
    200: {
      description: 'Login successful',
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            picture: { type: 'string', nullable: true },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: {
      description: 'Missing credentials',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    401: {
      description: 'Invalid credentials',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const googleOAuthSchema = {
  tags: ['auth'],
  summary: 'Initiate Google OAuth',
  description: 'Redirects to Google OAuth consent screen',
  response: {
    500: {
      description: 'OAuth not configured',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const refreshTokenSchema = {
  tags: ['auth'],
  summary: 'Refresh access token',
  description: 'Get a new access token using a refresh token',
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        description: 'Refresh token received during login',
      },
    },
  },
  response: {
    200: {
      description: 'Tokens refreshed successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: {
      description: 'Refresh token required',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    401: {
      description: 'Invalid refresh token',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const getMeSchema = {
  tags: ['auth'],
  summary: 'Get current user',
  description: 'Get authenticated user information',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'User information',
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            picture: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },  
    404: {
      description: 'User not found',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const logoutSchema = {
  tags: ['auth'],
  summary: 'Logout user',
  description: 'Logout and invalidate refresh token',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Logged out successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};





