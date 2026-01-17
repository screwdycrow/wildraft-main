// TagFolder route schemas

import { Type } from '@sinclair/typebox';

export const createTagFolderSchema = {
  tags: ['tag-folders'],
  summary: 'Create tag folder',
  description: 'Create a new tag folder in a library. Tag folders are used to organize tags within a library. Folder names must be unique within a library.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.String({ 
      minLength: 1, 
      description: 'Folder name (must be unique within the library)',
      example: 'Encounters'
    }),
    order: Type.Optional(Type.Number({ 
      description: 'Display order (defaults to 0)',
      example: 1
    })),
  }),
  response: {
    201: Type.Object({
      message: Type.String({ example: 'Tag folder created successfully' }),
      folder: Type.Object({
        id: Type.Number({ example: 1 }),
        name: Type.String({ example: 'Encounters' }),
        order: Type.Number({ example: 1 }),
        libraryId: Type.Number({ example: 1 }),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
      }),
    }),
    400: Type.Object({
      error: Type.String({ example: 'Folder name is required' }),
    }),
    401: Type.Object({ 
      error: Type.String({ example: 'Unauthorized' }) 
    }),
    403: Type.Object({ 
      error: Type.String({ example: 'Insufficient permissions - requires EDITOR or OWNER access' }) 
    }),
    409: Type.Object({
      error: Type.String({ example: 'Folder with this name already exists' }),
    }),
    500: Type.Object({ 
      error: Type.String({ example: 'Failed to create folder' }), 
      message: Type.String({ example: 'Database connection error' }) 
    }),
  },
};

export const getLibraryTagFoldersSchema = {
  tags: ['tag-folders'],
  summary: 'Get all tag folders in library',
  description: 'Get all tag folders in a library. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      folders: Type.Array(
        Type.Object({
          id: Type.Number(),
          name: Type.String(),
          order: Type.Number(),
          libraryId: Type.Number(),
          tagCount: Type.Number({ description: 'Number of tags in this folder' }),
          createdAt: Type.String({ format: 'date-time' }),
          updatedAt: Type.String({ format: 'date-time' }),
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

export const getTagFolderSchema = {
  tags: ['tag-folders'],
  summary: 'Get single tag folder',
  description: 'Get a specific tag folder by ID with its associated tags. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    folderId: Type.String({ description: 'Tag folder ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      folder: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        order: Type.Number(),
        libraryId: Type.Number(),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
        tags: Type.Array(
          Type.Object({
            id: Type.Number(),
            name: Type.String(),
            color: Type.String(),
            order: Type.Number(),
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
      error: Type.String({ example: 'Tag folder not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const updateTagFolderSchema = {
  tags: ['tag-folders'],
  summary: 'Update tag folder',
  description: 'Update a tag folder\'s name or order. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    folderId: Type.String({ description: 'Tag folder ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ 
      minLength: 1, 
      description: 'New folder name',
      example: 'Combat Encounters'
    })),
    order: Type.Optional(Type.Number({ 
      description: 'New display order',
      example: 2
    })),
  }),
  response: {
    200: Type.Object({
      message: Type.String({ example: 'Tag folder updated successfully' }),
      folder: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        order: Type.Number(),
        libraryId: Type.Number(),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
      }),
    }),
    400: Type.Object({
      error: Type.String(),
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
      error: Type.String({ example: 'Folder with this name already exists' }),
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const deleteTagFolderSchema = {
  tags: ['tag-folders'],
  summary: 'Delete tag folder',
  description: 'Delete a tag folder from a library. Tags in this folder will have their folderId set to null. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    folderId: Type.String({ description: 'Tag folder ID', example: '1' }),
  }),
  response: {
    204: Type.Null({ description: 'Tag folder deleted successfully' }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    404: Type.Object({ 
      error: Type.String({ example: 'Tag folder not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

