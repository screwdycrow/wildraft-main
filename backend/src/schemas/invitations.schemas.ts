// Player invitation link schemas

const invitationObject = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    token: { type: 'string' },
    role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER', 'PLAYER'] },
    email: { type: 'string', nullable: true },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    maxUses: { type: 'number', nullable: true },
    uses: { type: 'number' },
    revokedAt: { type: 'string', format: 'date-time', nullable: true },
    usedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' }, message: { type: 'string' } },
};

export const createInvitationSchema = {
  tags: ['invitations'],
  summary: 'Create an invite link',
  description:
    'Create a shareable invitation link for a library. Requires EDITOR access. The frontend builds the URL as {origin}/invite/{token}.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: { libraryId: { type: 'integer' } },
  },
  body: {
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['EDITOR', 'VIEWER', 'PLAYER'], default: 'PLAYER' },
      email: { type: 'string', format: 'email', nullable: true },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      maxUses: { type: 'number', nullable: true, minimum: 1 },
    },
  },
  response: {
    201: {
      description: 'Invitation created',
      type: 'object',
      properties: { invitation: invitationObject },
    },
    400: errorResponse,
    403: errorResponse,
  },
};

export const listInvitationsSchema = {
  tags: ['invitations'],
  summary: 'List invitations for a library',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: { libraryId: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        invitations: { type: 'array', items: invitationObject },
      },
    },
    403: errorResponse,
  },
};

export const revokeInvitationSchema = {
  tags: ['invitations'],
  summary: 'Revoke an invitation',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'invitationId'],
    properties: {
      libraryId: { type: 'integer' },
      invitationId: { type: 'string' },
    },
  },
  response: {
    204: { description: 'Invitation revoked', type: 'null' },
    404: errorResponse,
  },
};

export const getInvitationByTokenSchema = {
  tags: ['invitations'],
  summary: 'Inspect an invite link (public)',
  description: 'Returns library name, role, and validity for the invite landing page. No auth required.',
  params: {
    type: 'object',
    required: ['token'],
    properties: { token: { type: 'string' } },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        library: {
          type: 'object',
          properties: { id: { type: 'number' }, name: { type: 'string' } },
        },
        role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER', 'PLAYER'] },
        email: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['valid', 'expired', 'revoked', 'exhausted'] },
      },
    },
    404: errorResponse,
  },
};

export const claimInvitationSchema = {
  tags: ['invitations'],
  summary: 'Claim an invite link',
  description: 'Grants the invite role on the library to the authenticated user.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['token'],
    properties: { token: { type: 'string' } },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        libraryId: { type: 'number' },
        role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER', 'PLAYER'] },
        alreadyMember: { type: 'boolean' },
      },
    },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
  },
};
