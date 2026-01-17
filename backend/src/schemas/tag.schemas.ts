// Tag route schemas

import { Type } from '@sinclair/typebox';

export const createTagSchema = {
  tags: ['tags'],
  summary: 'Create tag',
  description: 'Create a new tag in a library. Tags are used to organize and categorize library items. Tag names must be unique within a library.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.String({ 
      minLength: 1, 
      description: 'Tag name (must be unique within the library)',
      example: 'Combat'
    }),
    color: Type.Optional(Type.String({ 
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'Tag color in hex format (e.g., #FF0000 for red)',
      example: '#FF5733'
    })),
    folderId: Type.Optional(Type.Union([Type.Number(), Type.Null()], {
      description: 'Optional tag folder ID for grouping tags',
      example: 1
    })),
    featuredImageId: Type.Optional(Type.Union([Type.Number(), Type.Null()], {
      description: 'Optional featured image file ID',
      example: 5
    })),
    order: Type.Optional(Type.Number({ 
      description: 'Display order (defaults to 0)',
      example: 1
    })),
  }),
  response: {
    201: Type.Object({
      message: Type.String({ example: 'Tag created successfully' }),
      tag: Type.Object({
        id: Type.Number({ example: 1 }),
        name: Type.String({ example: 'Combat' }),
        color: Type.String({ example: '#FF0000' }),
        order: Type.Number({ example: 0 }),
        folderId: Type.Union([Type.Number(), Type.Null()]),
        folder: Type.Union([
          Type.Object({
            id: Type.Number(),
            name: Type.String(),
            order: Type.Number(),
          }),
          Type.Null()
        ]),
        featuredImageId: Type.Union([Type.Number(), Type.Null()]),
        featuredImage: Type.Union([
          Type.Object({
            id: Type.Number(),
            fileName: Type.String(),
            fileUrl: Type.String(),
            fileType: Type.String(),
          }),
          Type.Null()
        ]),
        libraryId: Type.Number({ example: 1 }),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' })
      }),
    }),
    400: Type.Object({
      error: Type.String({ example: 'Tag name is required' })
    }),
    401: Type.Object({ 
      error: Type.String({ example: 'Unauthorized' }) 
    }),
    403: Type.Object({ 
      error: Type.String({ example: 'Insufficient permissions - requires EDITOR or OWNER access' }) 
    }),
    409: Type.Object({
      error: Type.String({ example: 'Tag with this name already exists' })
    }),
    500: Type.Object({ 
      error: Type.String({ example: 'Failed to create tag' }), 
      message: Type.String({ example: 'Database connection error' }) 
    }),
  }
};

export const getLibraryTagsSchema = {
  tags: ['tags'],
  summary: 'Get all tags in library',
  description: 'Get all tags in a library. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      tags: Type.Array(
        Type.Object({
          id: Type.Number(),
          name: Type.String(),
          color: Type.String(),
          order: Type.Number(),
          folderId: Type.Union([Type.Number(), Type.Null()]),
          folder: Type.Union([
            Type.Object({
              id: Type.Number(),
              name: Type.String(),
              order: Type.Number(),
            }),
            Type.Null()
          ]),
          featuredImageId: Type.Union([Type.Number(), Type.Null()]),
          featuredImage: Type.Union([
            Type.Object({
              id: Type.Number(),
              fileName: Type.String(),
              fileUrl: Type.String(),
              fileType: Type.String(),
            }),
            Type.Null()
          ]),
          libraryId: Type.Number(),
          itemCount: Type.Number({ description: 'Number of items using this tag' }),
          createdAt: Type.String({ format: 'date-time' }),
          updatedAt: Type.String({ format: 'date-time' })
        })
      ),
    }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const getTagSchema = {
  tags: ['tags'],
  summary: 'Get single tag',
  description: 'Get a specific tag by ID with its associated items. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    tagId: Type.String({ description: 'Tag ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      tag: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        color: Type.String(),
        order: Type.Number(),
        folderId: Type.Union([Type.Number(), Type.Null()]),
        folder: Type.Union([
          Type.Object({
            id: Type.Number(),
            name: Type.String(),
            order: Type.Number(),
          }),
          Type.Null()
        ]),
        featuredImageId: Type.Union([Type.Number(), Type.Null()]),
        featuredImage: Type.Union([
          Type.Object({
            id: Type.Number(),
            fileName: Type.String(),
            fileUrl: Type.String(),
            fileType: Type.String(),
          }),
          Type.Null()
        ]),
        libraryId: Type.Number(),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
        libraryItems: Type.Array(
          Type.Object({
            id: Type.Number(),
            name: Type.String(),
            type: Type.String(),
            description: Type.Union([Type.String(), Type.Null()])
          })
        ),
      }),
    }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    404: Type.Object({ 
      error: Type.String({ example: 'Tag not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const updateTagSchema = {
  tags: ['tags'],
  summary: 'Update tag',
  description: 'Update a tag\'s name, color, folder, featured image, or order. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    tagId: Type.String({ description: 'Tag ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ 
      minLength: 1, 
      description: 'New tag name',
      example: 'Combat Encounter'
    })),
    color: Type.Optional(Type.String({ 
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'New tag color in hex format',
      example: '#FF0000'
    })),
    folderId: Type.Optional(Type.Union([Type.Number(), Type.Null()], {
      description: 'New tag folder ID. Provide null to clear.',
      example: 1
    })),
    featuredImageId: Type.Optional(Type.Union([Type.Number(), Type.Null()], {
      description: 'New featured image file ID. Provide null to clear.',
      example: 5
    })),
    order: Type.Optional(Type.Number({ 
      description: 'New display order',
      example: 2
    })),
  }),
  response: {
    200: Type.Object({
      message: Type.String({ example: 'Tag updated successfully' }),
      tag: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        color: Type.String(),
        order: Type.Number(),
        folderId: Type.Union([Type.Number(), Type.Null()]),
        folder: Type.Union([
          Type.Object({
            id: Type.Number(),
            name: Type.String(),
            order: Type.Number(),
          }),
          Type.Null()
        ]),
        featuredImageId: Type.Union([Type.Number(), Type.Null()]),
        featuredImage: Type.Union([
          Type.Object({
            id: Type.Number(),
            fileName: Type.String(),
            fileUrl: Type.String(),
            fileType: Type.String(),
          }),
          Type.Null()
        ]),
        libraryId: Type.Number(),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' })
      }),
    }),
    400: Type.Object({
      error: Type.String()
    }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    404: Type.Object({ 
      error: Type.String() 
    }),
    409: Type.Object({
      error: Type.String({ example: 'Tag with this name already exists' })
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const deleteTagSchema = {
  tags: ['tags'],
  summary: 'Delete tag',
  description: 'Delete a tag from a library. This will remove the tag from all associated items. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    tagId: Type.String({ description: 'Tag ID', example: '1' }),
  }),
  response: {
    204: Type.Null({ description: 'Tag deleted successfully' }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    404: Type.Object({ 
      error: Type.String({ example: 'Tag not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

