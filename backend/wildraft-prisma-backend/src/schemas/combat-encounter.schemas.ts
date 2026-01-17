// Combat Encounter route schemas

export const createCombatEncounterSchema = {
  tags: ['combat-encounters'],
  summary: 'Create combat encounter',
  description: `Create a new combat encounter in a library. Encounters track initiative, rounds, combatants, and custom counters for D&D combat management.`,
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
        description: 'Encounter name',
        example: 'Goblin Ambush'
      },
      description: {
        type: 'string',
        description: 'Optional encounter description',
        example: 'A surprise attack by goblin raiders on the road'
      },
      round: {
        type: 'integer',
        default: 1,
        minimum: 1,
        description: 'Current combat round',
        example: 1
      },
      initativeCount: {
        type: 'integer',
        default: 0,
        description: 'Initiative counter for tracking turn order',
        example: 0
      },
      counters: {
        description: 'Array of custom counters for tracking various combat metrics. Accepts any JSON structure - no validation.',
        example: [
          { id: 'counter-1', name: 'Legendary Actions', value: 3, max: 3, color: '#FFD700' },
          { id: 'counter-2', name: 'Spell Slots', value: 5, max: 8, color: '#4169E1' }
        ]
      },
      combatants: {
        description: 'Array of combatants in the encounter with initiative and status tracking. Accepts any JSON structure - no validation.',
        example: [
          {
            id: 'combatant-1',
            name: 'Goblin Warrior',
            initiative: 15,
            hp: 7,
            maxHp: 7,
            ac: 15,
            conditions: [],
            isPlayer: false,
            libraryItemId: 42
          },
          {
            id: 'combatant-2',
            name: 'Thoren (Fighter)',
            initiative: 18,
            hp: 45,
            maxHp: 52,
            ac: 18,
            conditions: ['blessed'],
            isPlayer: true,
            notes: '+1d4 to attack rolls'
          }
        ]
      }
    },
  },
  response: {
    201: {
      description: 'Combat encounter created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Combat encounter created successfully' },
        encounter: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Goblin Ambush' },
            description: { type: 'string', nullable: true, example: 'A surprise attack by goblin raiders' },
            round: { type: 'integer', example: 1 },
            initativeCount: { type: 'integer', example: 0 },
            counters: {
              nullable: true,
              description: 'Free-form JSON array',
              example: [{ id: 'counter-1', name: 'Legendary Actions', value: 3, max: 3 }]
            },
            combatants: {
              nullable: true,
              description: 'Free-form JSON array',
              example: [{
                id: 'combatant-1',
                name: 'Goblin Warrior',
                initiative: 15,
                hp: 7,
                maxHp: 7,
                ac: 15
              }]
            },
            portalViews: {
              type: 'array',
              items: { type: 'object' },
              example: []
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

export const getCombatEncountersSchema = {
  tags: ['combat-encounters'],
  summary: 'Get all combat encounters',
  description: 'Get all combat encounters in a library',
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
      description: 'List of combat encounters',
      type: 'object',
      properties: {
        encounters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              libraryId: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Goblin Ambush' },
              description: { type: 'string', nullable: true, example: 'A surprise attack by goblin raiders' },
              round: { type: 'integer', example: 1 },
              initativeCount: { type: 'integer', example: 0 },
              counters: {
                nullable: true,
                description: 'Free-form JSON array'
              },
              combatants: {
                nullable: true,
                description: 'Free-form JSON array'
              },
              portalViews: {
                type: 'array',
                items: { type: 'object' }
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

export const getCombatEncounterSchema = {
  tags: ['combat-encounters'],
  summary: 'Get combat encounter',
  description: 'Get a single combat encounter by ID',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'encounterId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      encounterId: { 
        type: 'string',
        description: 'Encounter ID',
        example: '1'
      },
    },
  },
  response: {
    200: {
      description: 'Combat encounter details',
      type: 'object',
      properties: {
        encounter: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Goblin Ambush' },
            description: { type: 'string', nullable: true, example: 'A surprise attack by goblin raiders' },
            round: { type: 'integer', example: 1 },
            initativeCount: { type: 'integer', example: 0 },
            counters: {
              nullable: true,
              description: 'Free-form JSON array'
            },
            combatants: {
              nullable: true,
              description: 'Free-form JSON array'
            },
            portalViews: {
              type: 'array',
              items: { type: 'object' }
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
      description: 'Encounter not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Combat encounter not found' },
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

export const updateCombatEncounterSchema = {
  tags: ['combat-encounters'],
  summary: 'Update combat encounter',
  description: 'Update an existing combat encounter. All fields are optional.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'encounterId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      encounterId: { 
        type: 'string',
        description: 'Encounter ID',
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
        description: 'Encounter name',
        example: 'Goblin Ambush (Updated)'
      },
      description: {
        type: 'string',
        description: 'Encounter description',
        example: 'Updated description'
      },
      round: {
        type: 'integer',
        minimum: 1,
        description: 'Current combat round',
        example: 3
      },
      initativeCount: {
        type: 'integer',
        description: 'Initiative counter',
        example: 2
      },
      counters: {
        description: 'Array of custom counters. Accepts any JSON structure - no validation.'
      },
      combatants: {
        description: 'Array of combatants. Accepts any JSON structure - no validation.'
      }
    },
  },
  response: {
    200: {
      description: 'Combat encounter updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Combat encounter updated successfully' },
        encounter: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            libraryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Goblin Ambush (Updated)' },
            description: { type: 'string', nullable: true },
            round: { type: 'integer', example: 3 },
            initativeCount: { type: 'integer', example: 2 },
            counters: {
              nullable: true,
              description: 'Free-form JSON array'
            },
            combatants: {
              nullable: true,
              description: 'Free-form JSON array'
            },
            portalViews: {
              type: 'array',
              items: { type: 'object' }
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
      description: 'Encounter not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Combat encounter not found' },
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

export const deleteCombatEncounterSchema = {
  tags: ['combat-encounters'],
  summary: 'Delete combat encounter',
  description: 'Delete a combat encounter permanently',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['libraryId', 'encounterId'],
    properties: {
      libraryId: { 
        type: 'string',
        description: 'Library ID',
        example: '1'
      },
      encounterId: { 
        type: 'string',
        description: 'Encounter ID',
        example: '1'
      },
    },
  },
  response: {
    204: {
      description: 'Combat encounter deleted successfully',
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
      description: 'Encounter not found',
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Combat encounter not found' },
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


