// Portal View route schemas

export const createPortalViewSchema = {
  tags: ['portal-views'],
  summary: 'Create portal view',
  description: `Create a new portal view in a library. Portal views are used to display content to players, with configurable display options for encounters, health, AC, actions, and more. Items can be an array of any JSON objects.`,
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
    },
  },
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Portal view name',
        example: 'Player View - Main Battle'
      },
      showEncounter: {
        type: 'boolean',
        default: false,
        description: 'Whether to show combat encounter information',
        example: true
      },
      showHealth: {
        type: 'boolean',
        default: false,
        description: 'Whether to show health information',
        example: true
      },
      showAC: {
        type: 'boolean',
        default: false,
        description: 'Whether to show armor class information',
        example: true
      },
      showActions: {
        type: 'boolean',
        default: false,
        description: 'Whether to show action information',
        example: false
      },
      autoResetImageState: {
        type: 'boolean',
        default: false,
        description: 'Whether to automatically reset image state',
        example: false
      },
      combatEncounterId: {
        type: 'integer',
        nullable: true,
        description: 'Optional combat encounter ID to link to this portal view',
        example: 1
      },
      currentItem: {
        type: 'integer',
        nullable: true,
        description: 'Current item index being displayed',
        example: 0
      },
      items: {
        description: 'Array of items to display in the portal view. Each item can be any JSON object - no validation is performed. This allows maximum flexibility for different types of content.',
        example: [
          {
            id: 'item-1',
            type: 'image',
            url: 'https://example.com/map.jpg',
            position: { x: 0, y: 0 },
            scale: 1.0
          },
          {
            id: 'item-2',
            type: 'stat-block',
            libraryItemId: 42,
            visible: true
          },
          {
            id: 'item-3',
            type: 'note',
            content: 'Player notes',
            position: { x: 100, y: 200 }
          }
        ]
      }
    },
  },
  response: {
    201: {
      description: 'Portal view created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Portal view created successfully' },
        portalView: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Player View - Main Battle' },
            showEncounter: { type: 'boolean', example: true },
            showHealth: { type: 'boolean', example: true },
            showAC: { type: 'boolean', example: true },
            showActions: { type: 'boolean', example: false },
            autoResetImageState: { type: 'boolean', example: false },
            combatEncounterId: { type: 'integer', nullable: true, example: 1 },
            currentItem: { type: 'integer', nullable: true, example: 0 },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            combatEncounter: {
              nullable: true,
              type: 'object'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      description: 'Bad request',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Name is required' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
    403: {
      description: 'Forbidden - Editor access required',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Editor access required' },
      },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const getPortalViewsSchema = {
  tags: ['portal-views'],
  summary: 'Get all portal views',
  description: 'Get all portal views in a library',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
    },
  },
  response: {
    200: {
      description: 'List of portal views',
      type: 'object',
      properties: {
        portalViews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              libraryId: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Player View - Main Battle' },
              showEncounter: { type: 'boolean', example: true },
              showHealth: { type: 'boolean', example: true },
              showAC: { type: 'boolean', example: true },
              showActions: { type: 'boolean', example: false },
              autoResetImageState: { type: 'boolean', example: false },
              combatEncounterId: { type: 'integer', nullable: true, example: 1 },
              currentItem: { type: 'integer', nullable: true, example: 0 },
              items: {
                nullable: true,
                description: 'Free-form JSON array of items'
              },
              combatEncounter: {
                nullable: true,
                type: 'object'
              },
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
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const getPortalViewSchema = {
  tags: ['portal-views'],
  summary: 'Get portal view',
  description: 'Get a single portal view by ID',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'portalViewId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      portalViewId: { 
        type: 'string',
        description: 'Portal View ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
    },
  },
  response: {
    200: {
      description: 'Portal view details',
      type: 'object',
      properties: {
        portalView: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Player View - Main Battle' },
            showEncounter: { type: 'boolean', example: true },
            showHealth: { type: 'boolean', example: true },
            showAC: { type: 'boolean', example: true },
            showActions: { type: 'boolean', example: false },
            autoResetImageState: { type: 'boolean', example: false },
            combatEncounterId: { type: 'integer', nullable: true, example: 1 },
            currentItem: { type: 'integer', nullable: true, example: 0 },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            combatEncounter: {
              nullable: true,
              type: 'object'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
    404: {
      description: 'Portal view not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Portal view not found' },
      },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const updatePortalViewSchema = {
  tags: ['portal-views'],
  summary: 'Update portal view',
  description: 'Update an existing portal view. All fields are optional. Items can be an array of any JSON objects.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'portalViewId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      portalViewId: { 
        type: 'string',
        description: 'Portal View ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Portal view name',
        example: 'Player View - Updated'
      },
      showEncounter: {
        type: 'boolean',
        description: 'Whether to show combat encounter information',
        example: false
      },
      showHealth: {
        type: 'boolean',
        description: 'Whether to show health information',
        example: false
      },
      showAC: {
        type: 'boolean',
        description: 'Whether to show armor class information',
        example: false
      },
      showActions: {
        type: 'boolean',
        description: 'Whether to show action information',
        example: true
      },
      autoResetImageState: {
        type: 'boolean',
        description: 'Whether to automatically reset image state',
        example: true
      },
      combatEncounterId: {
        type: 'integer',
        nullable: true,
        description: 'Combat encounter ID to link to this portal view. Set to null to unlink.',
        example: null
      },
      currentItem: {
        type: 'integer',
        nullable: true,
        description: 'Current item index being displayed',
        example: 1
      },
      items: {
        description: 'Array of items. Accepts any JSON structure - no validation. Each item can be any JSON object.',
        example: [
          {
            id: 'item-1',
            type: 'image',
            url: 'https://example.com/updated-map.jpg',
            position: { x: 50, y: 50 }
          }
        ]
      }
    },
  },
  response: {
    200: {
      description: 'Portal view updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Portal view updated successfully' },
        portalView: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Player View - Updated' },
            showEncounter: { type: 'boolean', example: false },
            showHealth: { type: 'boolean', example: false },
            showAC: { type: 'boolean', example: false },
            showActions: { type: 'boolean', example: true },
            autoResetImageState: { type: 'boolean', example: true },
            combatEncounterId: { type: 'integer', nullable: true, example: null },
            currentItem: { type: 'integer', nullable: true, example: 1 },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            combatEncounter: {
              nullable: true,
              type: 'object'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
    403: {
      description: 'Forbidden - Editor access required',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Editor access required' },
      },
    },
    404: {
      description: 'Portal view not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Portal view not found' },
      },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const deletePortalViewSchema = {
  tags: ['portal-views'],
  summary: 'Delete portal view',
  description: 'Delete a portal view permanently',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'portalViewId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      portalViewId: { 
        type: 'string',
        description: 'Portal View ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
    },
  },
  response: {
    204: {
      description: 'Portal view deleted successfully',
      type: 'null',
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
    403: {
      description: 'Forbidden - Editor access required',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Editor access required' },
      },
    },
    404: {
      description: 'Portal view not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Portal view not found' },
      },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

