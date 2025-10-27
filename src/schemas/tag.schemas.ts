// Tag route schemas

export const createTagSchema = {
  tags: ['tags'],
  summary: 'Create tag',
  description: 'Create a new tag in a library. Tags are used to organize and categorize library items. Tag names must be unique within a library.',
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
        description: 'Tag name (must be unique within the library)',
        example: 'Combat'
      },
      color: {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$',
        description: 'Tag color in hex format (e.g., #FF0000 for red)',
        example: '#FF5733'
      }
    },
    examples: [
      {
        name: 'Combat',
        color: '#FF0000'
      },
      {
        name: 'Monster',
        color: '#00FF00'
      },
      {
        name: 'Magic Item',
        color: '#9B59B6'
      }
    ]
  },
  response: {
    201: {
      description: 'Tag created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tag created successfully' },
        tag: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Combat' },
            color: { type: 'string', example: '#FF0000' },
            libraryId: { type: 'number', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      description: 'Invalid request',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Tag name is required' }
      }
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Unauthorized' } } 
    },
    403: { 
      description: 'Insufficient permissions - requires EDITOR or OWNER access', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Insufficient permissions' } } 
    },
    409: {
      description: 'Tag name already exists in this library',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Tag with this name already exists' }
      }
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string', example: 'Failed to create tag' }, 
        message: { type: 'string', example: 'Database connection error' } 
      } 
    }
  }
};

export const getLibraryTagsSchema = {
  tags: ['tags'],
  summary: 'Get all tags in library',
  description: 'Get all tags in a library. Requires at least VIEWER access.',
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
      description: 'List of tags',
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              color: { type: 'string' },
              libraryId: { type: 'number' },
              itemCount: { type: 'number', description: 'Number of items using this tag' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          example: [
            {
              id: 1,
              name: 'Combat',
              color: '#FF0000',
              libraryId: 1,
              itemCount: 5,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z'
            },
            {
              id: 2,
              name: 'Monster',
              color: '#00FF00',
              libraryId: 1,
              itemCount: 3,
              createdAt: '2025-01-02T00:00:00.000Z',
              updatedAt: '2025-01-02T00:00:00.000Z'
            }
          ]
        }
      }
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Access denied', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string' }, 
        message: { type: 'string' } 
      } 
    }
  }
};

export const getTagSchema = {
  tags: ['tags'],
  summary: 'Get single tag',
  description: 'Get a specific tag by ID with its associated items. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'tagId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      tagId: { 
        type: 'string',
        description: 'Tag ID',
        example: '1'
      },
    },
  },
  response: {
    200: {
      description: 'Tag details with items',
      type: 'object',
      properties: {
        tag: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            libraryId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            libraryItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string', nullable: true }
                }
              }
            }
          },
          example: {
            id: 1,
            name: 'Combat',
            color: '#FF0000',
            libraryId: 1,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            libraryItems: [
              {
                id: 5,
                name: 'Goblin Warrior',
                type: 'STAT_BLOCK_DND_5E',
                description: 'A basic goblin warrior'
              },
              {
                id: 7,
                name: 'Ancient Red Dragon',
                type: 'STAT_BLOCK_DND_5E',
                description: 'A terrifying dragon'
              }
            ]
          }
        }
      }
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Access denied', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    404: { 
      description: 'Tag not found', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Tag not found' } } 
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string' }, 
        message: { type: 'string' } 
      } 
    }
  }
};

export const updateTagSchema = {
  tags: ['tags'],
  summary: 'Update tag',
  description: 'Update a tag\'s name or color. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'tagId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      tagId: { 
        type: 'string',
        description: 'Tag ID',
        example: '1'
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'New tag name',
        example: 'Combat Encounter'
      },
      color: {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$',
        description: 'New tag color in hex format',
        example: '#FF0000'
      }
    },
    examples: [
      {
        name: 'Combat Encounter'
      },
      {
        color: '#3498DB'
      },
      {
        name: 'Epic Battle',
        color: '#E74C3C'
      }
    ]
  },
  response: {
    200: {
      description: 'Tag updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tag updated successfully' },
        tag: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            libraryId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      description: 'Invalid request',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Insufficient permissions', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    404: { 
      description: 'Tag not found', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    409: {
      description: 'Tag name already exists',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Tag with this name already exists' }
      }
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string' }, 
        message: { type: 'string' } 
      } 
    }
  }
};

export const deleteTagSchema = {
  tags: ['tags'],
  summary: 'Delete tag',
  description: 'Delete a tag from a library. This will remove the tag from all associated items. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'tagId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      tagId: { 
        type: 'string',
        description: 'Tag ID',
        example: '1'
      },
    },
  },
  response: {
    204: {
      description: 'Tag deleted successfully',
      type: 'null',
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Insufficient permissions', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    404: { 
      description: 'Tag not found', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Tag not found' } } 
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string' }, 
        message: { type: 'string' } 
      } 
    }
  }
};

