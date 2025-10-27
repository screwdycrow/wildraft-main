// User management schemas

export const updateProfileSchema = {
  tags: ['users'],
  summary: 'Update profile',
  description: 'Update current user profile information (name, email)',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'User display name',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'newemail@example.com',
      },
    },
  },
  response: {
    200: {
      description: 'Profile updated successfully',
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
    409: {
      description: 'Email already in use',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const changePasswordSchema = {
  tags: ['users'],
  summary: 'Change password',
  description: 'Change current user password. Requires current password for verification.',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        description: 'Current password',
        example: 'OldPass123',
      },
      newPassword: {
        type: 'string',
        minLength: 8,
        description: 'New password (min 8 chars, must contain uppercase, lowercase, and number)',
        example: 'NewPass123',
      },
    },
  },
  response: {
    200: {
      description: 'Password changed successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    400: {
      description: 'Invalid request or password does not meet requirements',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    401: {
      description: 'Unauthorized or incorrect current password',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

