// Player sharing schemas (per-item, per-DM-screen, per-portal)

const userSummary = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    name: { type: 'string', nullable: true },
    picture: { type: 'string', nullable: true },
  },
};

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' }, message: { type: 'string' } },
};

const libraryParams = (extra: Record<string, unknown>, required: string[]) => ({
  type: 'object',
  required: ['libraryId', ...required],
  properties: { libraryId: { type: 'integer' }, ...extra },
});

export const getItemSharesSchema = {
  tags: ['shares'],
  summary: 'List players an item is shared with',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ itemId: { type: 'integer' } }, ['itemId']),
  response: {
    200: {
      type: 'object',
      properties: {
        shares: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              user: userSummary,
              permission: { type: 'string', enum: ['VIEW', 'EDIT'] },
            },
          },
        },
      },
    },
    404: errorResponse,
  },
};

export const putItemSharesSchema = {
  tags: ['shares'],
  summary: 'Replace the share list of an item',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ itemId: { type: 'integer' } }, ['itemId']),
  body: {
    type: 'object',
    required: ['shares'],
    properties: {
      shares: {
        type: 'array',
        items: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'number' },
            permission: { type: 'string', enum: ['VIEW', 'EDIT'], default: 'VIEW' },
          },
        },
      },
    },
  },
  response: { 400: errorResponse, 404: errorResponse },
};

export const getDmScreenSharesSchema = {
  tags: ['shares'],
  summary: 'List players a DM screen is shared with',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ dmScreenId: { type: 'string' } }, ['dmScreenId']),
  response: {
    200: {
      type: 'object',
      properties: {
        shares: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              user: userSummary,
              canEdit: { type: 'boolean' },
            },
          },
        },
      },
    },
    404: errorResponse,
  },
};

export const putDmScreenSharesSchema = {
  tags: ['shares'],
  summary: 'Replace the share list of a DM screen',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ dmScreenId: { type: 'string' } }, ['dmScreenId']),
  body: {
    type: 'object',
    required: ['shares'],
    properties: {
      shares: {
        type: 'array',
        items: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'number' },
            canEdit: { type: 'boolean', default: true },
          },
        },
      },
    },
  },
  response: { 400: errorResponse, 404: errorResponse },
};

export const getPortalSharesSchema = {
  tags: ['shares'],
  summary: 'List players a portal view is shared with',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ portalViewId: { type: 'string' } }, ['portalViewId']),
  response: {
    200: {
      type: 'object',
      properties: {
        shares: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              user: userSummary,
            },
          },
        },
      },
    },
    404: errorResponse,
  },
};

export const putPortalSharesSchema = {
  tags: ['shares'],
  summary: 'Replace the share list of a portal view',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ portalViewId: { type: 'string' } }, ['portalViewId']),
  body: {
    type: 'object',
    required: ['shares'],
    properties: {
      shares: {
        type: 'array',
        items: {
          type: 'object',
          required: ['userId'],
          properties: { userId: { type: 'number' } },
        },
      },
    },
  },
  response: { 400: errorResponse, 404: errorResponse },
};

export const getPlayerSharesSchema = {
  tags: ['shares'],
  summary: 'Aggregate everything shared with one player in a library',
  security: [{ bearerAuth: [] }],
  params: libraryParams({ userId: { type: 'integer' } }, ['userId']),
  response: {
    200: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              type: { type: 'string' },
              permission: { type: 'string', enum: ['VIEW', 'EDIT'] },
            },
          },
        },
        dmScreens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              canEdit: { type: 'boolean' },
            },
          },
        },
        portalViews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
    404: errorResponse,
  },
};
