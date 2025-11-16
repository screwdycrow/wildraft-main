// DM Screen route schemas

export const createDMScreenSchema = {
  tags: ['dm-screens'],
  summary: 'Create DM screen',
  description: `Create a new DM screen in a library. DM screens are used to organize and display content for the Dungeon Master, with an items array that can contain any JSON objects.`,
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
        description: 'DM screen name',
        example: 'Main DM Screen'
      },
      items: {
        description: 'Array of items to display in the DM screen. Each item can be any JSON object - no validation is performed. This allows maximum flexibility for different types of content (images, stat blocks, notes, tokens, custom widgets, etc.).',
        example: [
          {
            id: 'item-1',
            type: 'stat-block',
            libraryItemId: 42,
            position: { x: 0, y: 0 }
          },
          {
            id: 'item-2',
            type: 'note',
            content: 'DM notes',
            position: { x: 100, y: 200 }
          }
        ]
      },
      settings: {
        description: 'JSON object containing settings for the DM screen. Can contain any JSON structure - no validation is performed. This allows flexible configuration options.',
        example: {
          layout: 'grid',
          columns: 3,
          theme: 'dark',
          autoSave: true,
          customOptions: {
            showGrid: true,
            gridSize: 50
          }
        }
      }
    },
  },
  response: {
    201: {
      description: 'DM screen created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'DM screen created successfully' },
        dmScreen: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Main DM Screen' },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            settings: {
              nullable: true,
              description: 'Free-form JSON object for settings'
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

export const getDMScreensSchema = {
  tags: ['dm-screens'],
  summary: 'Get all DM screens',
  description: 'Get all DM screens in a library',
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
      description: 'List of DM screens',
      type: 'object',
      properties: {
        dmScreens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              libraryId: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Main DM Screen' },
              items: {
                nullable: true,
                description: 'Free-form JSON array of items'
              },
              content: {
                nullable: true,
                description: 'Free-form JSON array of content'
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

export const getDMScreenSchema = {
  tags: ['dm-screens'],
  summary: 'Get DM screen',
  description: 'Get a single DM screen by ID',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'dmScreenId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      dmScreenId: { 
        type: 'string',
        description: 'DM Screen ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
    },
  },
  response: {
    200: {
      description: 'DM screen details',
      type: 'object',
      properties: {
        dmScreen: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Main DM Screen' },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            settings: {
              nullable: true,
              description: 'Free-form JSON object for settings'
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
      description: 'DM screen not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'DM screen not found' },
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

export const updateDMScreenSchema = {
  tags: ['dm-screens'],
  summary: 'Update DM screen',
  description: 'Update an existing DM screen. All fields are optional. Items can be an array of any JSON objects.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'dmScreenId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      dmScreenId: { 
        type: 'string',
        description: 'DM Screen ID (UUID)',
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
        description: 'DM screen name',
        example: 'Updated DM Screen'
      },
      items: {
        description: 'Array of items. Accepts any JSON structure - no validation. Each item can be any JSON object.',
        example: [
          {
            id: 'item-1',
            type: 'stat-block',
            libraryItemId: 42,
            position: { x: 50, y: 50 }
          }
        ]
      },
      settings: {
        description: 'JSON object containing settings. Accepts any JSON structure - no validation.',
        example: {
          layout: 'grid',
          columns: 4,
          theme: 'light'
        }
      }
    },
  },
  response: {
    200: {
      description: 'DM screen updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'DM screen updated successfully' },
        dmScreen: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Updated DM Screen' },
            items: {
              nullable: true,
              description: 'Free-form JSON array of items'
            },
            settings: {
              nullable: true,
              description: 'Free-form JSON object for settings'
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
      description: 'DM screen not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'DM screen not found' },
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

export const deleteDMScreenSchema = {
  tags: ['dm-screens'],
  summary: 'Delete DM screen',
  description: 'Delete a DM screen permanently',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'dmScreenId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      dmScreenId: { 
        type: 'string',
        description: 'DM Screen ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
    },
  },
  response: {
    204: {
      description: 'DM screen deleted successfully',
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
      description: 'DM screen not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'DM screen not found' },
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

