// Library Item route schemas

export const createLibraryItemSchema = {
  tags: ['library-items'],
  summary: 'Create library item',
  description: `Create a new item in a library. Supports different item types with type-specific validation:
  
**STAT_BLOCK_DND_5E**: D&D 5E creature/NPC stat blocks (requires: cr, hp, ac, speed)
**NOTE**: Text notes with optional formatting (requires: content)
**ITEM_DND_5E**: D&D 5E items/equipment (requires: rarity, itemType)
**CHARACTER_DND_5E**: D&D 5E player characters or NPCs (requires: level, class, race)

All types support custom fields beyond the required ones.`,
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
    required: ['type', 'name', 'data'],
    properties: {
      type: {
        type: 'string',
        enum: ['STAT_BLOCK_DND_5E', 'NOTE', 'ITEM_DND_5E', 'CHARACTER_DND_5E'],
        description: 'Item type - determines validation rules for data field',
        example: 'STAT_BLOCK_DND_5E'
      },
      name: {
        type: 'string',
        minLength: 1,
        description: 'Item name',
        example: 'Goblin Warrior'
      },
      description: {
        type: 'string',
        description: 'Optional item description',
        example: 'A basic goblin warrior stat block for encounters'
      },
      data: {
        type: 'object',
        description: `Type-specific data object. Required fields vary by type:
        
**STAT_BLOCK_DND_5E**: { cr, hp, ac, speed, ... }
**NOTE**: { content, format?, ... }
**ITEM_DND_5E**: { rarity, itemType, ... }
**CHARACTER_DND_5E**: { level, class, race, ... }

Additional custom fields are always allowed.`,
        example: {
          cr: '1/2',
          hp: 7,
          ac: 15,
          speed: '30 ft.',
          str: 8,
          dex: 14,
          con: 10,
          int: 10,
          wis: 8,
          cha: 8,
          size: 'Small',
          type: 'humanoid',
          alignment: 'neutral evil'
        }
      },
      tagIds: {
        type: 'array',
        items: { type: 'integer' },
        description: 'Array of tag IDs to associate with the item',
        example: [1, 2, 3]
      }
    },
    examples: [
      {
        // STAT_BLOCK_DND_5E Example
        type: 'STAT_BLOCK_DND_5E',
        name: 'Goblin Warrior',
        description: 'A basic goblin warrior for low-level encounters',
        data: {
          cr: '1/4',
          hp: 7,
          ac: 15,
          speed: '30 ft.',
          str: 8,
          dex: 14,
          con: 10,
          int: 10,
          wis: 8,
          cha: 8,
          size: 'Small',
          type: 'humanoid (goblinoid)',
          alignment: 'neutral evil',
          languages: 'Common, Goblin',
          senses: 'darkvision 60 ft., passive Perception 9',
          actions: [
            {
              name: 'Scimitar',
              roll: '1d20+4',
              range: '5 ft.',
              description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) slashing damage.'
            }
          ],
          traits: [
            {
              name: 'Nimble Escape',
              description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.'
            }
          ]
        },
        tagIds: [1, 2]
      },
      {
        // NOTE Example
        type: 'NOTE',
        name: 'Session 5 - The Ancient Temple',
        description: 'Key plot points and events from session 5',
        data: {
          content: '# Session 5: The Ancient Temple\n\n## Key Events\n- Party arrived at the Temple\n- Met the hermit Zephyr\n- Found the Sundering Crystal\n\n## Next Session\n- Explore lower levels',
          format: 'markdown',
          isPinned: true,
          category: 'Session Notes'
        },
        tagIds: [3]
      },
      {
        // ITEM_DND_5E Example
        type: 'ITEM_DND_5E',
        name: 'Flame Tongue',
        description: 'A legendary blade that erupts in flames on command',
        data: {
          rarity: 'rare',
          itemType: 'weapon (longsword)',
          attunement: true,
          value: '5000 gp',
          weight: 3,
          damage: '1d8 slashing + 2d6 fire',
          properties: ['versatile', 'finesse'],
          effect: 'You can use a bonus action to speak the command word, causing flames to erupt from the blade. Deals an extra 2d6 fire damage.'
        },
        tagIds: [4, 5]
      },
      {
        // CHARACTER_DND_5E Example
        type: 'CHARACTER_DND_5E',
        name: 'Eldrin Brightwood',
        description: 'High Elf Wizard specializing in evocation magic',
        data: {
          level: 5,
          class: 'Wizard',
          race: 'High Elf',
          subclass: 'School of Evocation',
          background: 'Sage',
          playerName: 'John Smith',
          alignment: 'Lawful Good',
          str: 8,
          dex: 14,
          con: 12,
          int: 18,
          wis: 13,
          cha: 10,
          hp: 28,
          maxHp: 28,
          ac: 12,
          speed: '30 ft.',
          equipment: [
            { name: 'Spellbook', type: 'gear', equipped: true },
            { name: 'Staff', type: 'weapon', equipped: true }
          ],
          spells: [
            { name: 'Fireball', level: 3, school: 'Evocation', prepared: true },
            { name: 'Magic Missile', level: 1, school: 'Evocation', prepared: true }
          ]
        },
        tagIds: [6, 7]
      }
    ]
  },
  response: {
    201: {
      description: 'Item created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Item created successfully' },
        item: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            libraryId: { type: 'number', example: 1 },
            type: { 
              type: 'string', 
              enum: ['STAT_BLOCK_DND_5E', 'NOTE', 'ITEM_DND_5E', 'CHARACTER_DND_5E'],
              example: 'STAT_BLOCK_DND_5E'
            },
            name: { type: 'string', example: 'Goblin Warrior' },
            description: { type: 'string', nullable: true, example: 'A basic goblin warrior' },
            data: { 
              type: 'object',
              description: 'Type-specific data object with all fields'
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  color: { type: 'string' },
                  libraryId: { type: 'number' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      description: 'Invalid request or validation error',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid data for item type' },
        details: { 
          type: 'array',
          items: { type: 'string' },
          example: ['cr: must have required property', 'hp: must be number']
        }
      }
    },
    401: { 
      description: 'Unauthorized - missing or invalid authentication', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Unauthorized' } } 
    },
    403: { 
      description: 'Insufficient permissions - requires EDITOR or OWNER access', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Insufficient permissions' } } 
    },
    500: { 
      description: 'Server error', 
      type: 'object', 
      properties: { 
        error: { type: 'string', example: 'Failed to create item' }, 
        message: { type: 'string', example: 'Database connection error' } 
      } 
    }
  }
};

export const getLibraryItemsSchema = {
  tags: ['library-items'],
  summary: 'Get all library items',
  description: 'Get all items in a library. Returns items in descending order by creation date. Requires at least VIEWER access.',
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
      description: 'List of items in the library',
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              libraryId: { type: 'number' },
              type: { 
                type: 'string', 
                enum: ['STAT_BLOCK_DND_5E', 'NOTE', 'ITEM_DND_5E', 'CHARACTER_DND_5E']
              },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              data: { type: 'object' },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    color: { type: 'string' },
                    libraryId: { type: 'number' }
                  }
                }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          example: [
            {
              id: 1,
              libraryId: 1,
              type: 'STAT_BLOCK_DND_5E',
              name: 'Goblin Warrior',
              description: 'A basic goblin warrior',
              data: {
                cr: '1/4',
                hp: 7,
                ac: 15,
                speed: '30 ft.',
                str: 8,
                dex: 14,
                con: 10
              },
              tags: [
                { id: 1, name: 'Combat', color: '#FF0000', libraryId: 1 },
                { id: 2, name: 'Monster', color: '#00FF00', libraryId: 1 }
              ],
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z'
            },
            {
              id: 2,
              libraryId: 1,
              type: 'NOTE',
              name: 'Session 5 Notes',
              description: 'Important plot points',
              data: {
                content: '# Session 5\n\n- Party found the temple',
                format: 'markdown',
                isPinned: true
              },
              tags: [
                { id: 3, name: 'Session', color: '#0000FF', libraryId: 1 }
              ],
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
      description: 'Access denied - no access to this library', 
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

export const getLibraryItemSchema = {
  tags: ['library-items'],
  summary: 'Get single library item',
  description: 'Get a specific item by ID. Requires at least VIEWER access to the library.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'itemId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      itemId: { 
        type: 'string',
        description: 'Item ID',
        example: '5'
      },
    },
  },
  response: {
    200: {
      description: 'Item details',
      type: 'object',
      properties: {
        item: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            libraryId: { type: 'number' },
            type: { 
              type: 'string', 
              enum: ['STAT_BLOCK_DND_5E', 'NOTE', 'ITEM_DND_5E', 'CHARACTER_DND_5E']
            },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            data: { 
              type: 'object',
              description: 'Type-specific data with all fields' 
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  color: { type: 'string' },
                  libraryId: { type: 'number' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          example: {
            id: 5,
            libraryId: 1,
            type: 'CHARACTER_DND_5E',
            name: 'Eldrin Brightwood',
            description: 'High Elf Wizard specializing in evocation magic',
            data: {
              level: 5,
              class: 'Wizard',
              race: 'High Elf',
              subclass: 'School of Evocation',
              background: 'Sage',
              playerName: 'John Smith',
              str: 8,
              dex: 14,
              con: 12,
              int: 18,
              wis: 13,
              cha: 10,
              hp: 28,
              maxHp: 28,
              ac: 12,
              speed: '30 ft.',
              equipment: [
                { name: 'Spellbook', type: 'gear', equipped: true }
              ],
              spells: [
                { name: 'Fireball', level: 3, prepared: true }
              ]
            },
            tags: [
              { id: 6, name: 'PC', color: '#FFFF00', libraryId: 1 },
              { id: 7, name: 'Wizard', color: '#FF00FF', libraryId: 1 }
            ],
            createdAt: '2025-01-03T00:00:00.000Z',
            updatedAt: '2025-01-03T00:00:00.000Z'
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
      description: 'Item not found', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Item not found' } } 
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

export const updateLibraryItemSchema = {
  tags: ['library-items'],
  summary: 'Update library item',
  description: `Update an existing library item. All fields are optional - only provided fields will be updated. 
  
If updating the data field, it must still conform to the item's type schema. Requires EDITOR or OWNER access.`,
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'itemId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      itemId: { 
        type: 'string',
        description: 'Item ID',
        example: '5'
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Item name',
        example: 'Goblin Warrior (Elite)'
      },
      description: {
        type: 'string',
        description: 'Item description (pass empty string to clear)',
        example: 'An elite goblin warrior with better equipment'
      },
      data: {
        type: 'object',
        description: 'Type-specific data object. Must conform to the existing item type schema.',
        example: {
          cr: '1',
          hp: 15,
          ac: 16,
          speed: '30 ft.'
        }
      },
      tagIds: {
        type: 'array',
        items: { type: 'integer' },
        description: 'Array of tag IDs. Replaces all existing tags.',
        example: [1, 2, 4]
      }
    },
    examples: [
      {
        // Update stat block HP and AC
        name: 'Goblin Warrior (Elite)',
        data: {
          cr: '1/2',
          hp: 15,
          ac: 16,
          speed: '30 ft.',
          str: 10,
          dex: 16
        }
      },
      {
        // Update note content
        name: 'Session 5 - Updated',
        data: {
          content: '# Session 5 (Updated)\n\n## New Events\n- Additional discoveries made',
          format: 'markdown',
          isPinned: true
        }
      },
      {
        // Update only tags
        tagIds: [1, 3, 5]
      }
    ]
  },
  response: {
    200: {
      description: 'Item updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Item updated successfully' },
        item: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            libraryId: { type: 'number' },
            type: { 
              type: 'string', 
              enum: ['STAT_BLOCK_DND_5E', 'NOTE', 'ITEM_DND_5E', 'CHARACTER_DND_5E']
            },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            data: { type: 'object' },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  color: { type: 'string' },
                  libraryId: { type: 'number' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      description: 'Invalid request or validation error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        details: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Insufficient permissions - requires EDITOR or OWNER access', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    404: { 
      description: 'Item not found', 
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

export const deleteLibraryItemSchema = {
  tags: ['library-items'],
  summary: 'Delete library item',
  description: 'Delete an item from a library. This action cannot be undone. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'itemId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      itemId: { 
        type: 'string',
        description: 'Item ID',
        example: '5'
      },
    },
  },
  response: {
    204: {
      description: 'Item deleted successfully',
      type: 'null',
    },
    401: { 
      description: 'Unauthorized', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    403: { 
      description: 'Insufficient permissions - requires EDITOR or OWNER access', 
      type: 'object', 
      properties: { error: { type: 'string' } } 
    },
    404: { 
      description: 'Item not found', 
      type: 'object', 
      properties: { error: { type: 'string', example: 'Item not found' } } 
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

