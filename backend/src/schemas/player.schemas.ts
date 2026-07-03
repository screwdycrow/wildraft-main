// Player-scoped content schemas

export const getSharedContentSchema = {
  tags: ['player'],
  summary: 'Everything in a library shared with the current user',
  description:
    'For PLAYER members: only explicitly shared items, DM screens, and portal views. For VIEWER+ members: everything in the library (lets a DM preview the player experience).',
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
        library: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER', 'PLAYER'] },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string', nullable: true },
              color: { type: 'string' },
              permission: { type: 'string', enum: ['VIEW', 'EDIT'] },
              featuredImage: {
                type: 'object',
                nullable: true,
                additionalProperties: true,
              },
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
              updatedAt: { type: 'string', format: 'date-time' },
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
    403: {
      type: 'object',
      properties: { error: { type: 'string' }, message: { type: 'string' } },
    },
  },
};
