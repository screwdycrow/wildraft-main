// UserFileCategory route schemas

import { Type } from '@sinclair/typebox';

export const createUserFileCategorySchema = {
  tags: ['file-categories'],
  summary: 'Create file category',
  description: 'Create a new file category in a library. Categories are used to organize user files within a library. Category names must be unique within a library.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.String({ 
      minLength: 1, 
      description: 'Category name (must be unique within the library)',
      example: 'Maps'
    }),
  }),
  response: {
    201: Type.Object({
      message: Type.String({ example: 'File category created successfully' }),
      category: Type.Object({
        id: Type.Number({ example: 1 }),
        name: Type.String({ example: 'Maps' }),
        libraryId: Type.Number({ example: 1 }),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
      }),
    }),
    400: Type.Object({
      error: Type.String({ example: 'Category name is required' }),
    }),
    401: Type.Object({ 
      error: Type.String({ example: 'Unauthorized' }) 
    }),
    403: Type.Object({ 
      error: Type.String({ example: 'Insufficient permissions - requires EDITOR or OWNER access' }) 
    }),
    409: Type.Object({
      error: Type.String({ example: 'Category with this name already exists' }),
    }),
    500: Type.Object({ 
      error: Type.String({ example: 'Failed to create category' }), 
      message: Type.String({ example: 'Database connection error' }) 
    }),
  },
};

export const getLibraryFileCategoriesSchema = {
  tags: ['file-categories'],
  summary: 'Get all file categories in library',
  description: 'Get all file categories in a library. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      categories: Type.Array(
        Type.Object({
          id: Type.Number(),
          name: Type.String(),
          libraryId: Type.Number(),
          fileCount: Type.Number({ description: 'Number of files in this category' }),
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

export const getUserFileCategorySchema = {
  tags: ['file-categories'],
  summary: 'Get single file category',
  description: 'Get a specific file category by ID with its associated files. Requires at least VIEWER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    categoryId: Type.String({ description: 'Category ID', example: '1' }),
  }),
  response: {
    200: Type.Object({
      category: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        libraryId: Type.Number(),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
        userFiles: Type.Array(
          Type.Object({
            id: Type.Number(),
            fileName: Type.String(),
            fileType: Type.String(),
            fileSize: Type.Number(),
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
      error: Type.String({ example: 'Category not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const updateUserFileCategorySchema = {
  tags: ['file-categories'],
  summary: 'Update file category',
  description: 'Update a file category\'s name. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    categoryId: Type.String({ description: 'Category ID', example: '1' }),
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ 
      minLength: 1, 
      description: 'New category name',
      example: 'Battle Maps'
    })),
  }),
  response: {
    200: Type.Object({
      message: Type.String({ example: 'Category updated successfully' }),
      category: Type.Object({
        id: Type.Number(),
        name: Type.String(),
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
      error: Type.String({ example: 'Category with this name already exists' }),
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

export const deleteUserFileCategorySchema = {
  tags: ['file-categories'],
  summary: 'Delete file category',
  description: 'Delete a file category from a library. Files in this category will have their categoryId set to null. Requires EDITOR or OWNER access.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({
    libraryId: Type.String({ description: 'Library ID', example: '1' }),
    categoryId: Type.String({ description: 'Category ID', example: '1' }),
  }),
  response: {
    204: Type.Null({ description: 'Category deleted successfully' }),
    401: Type.Object({ 
      error: Type.String() 
    }),
    403: Type.Object({ 
      error: Type.String() 
    }),
    404: Type.Object({ 
      error: Type.String({ example: 'Category not found' }) 
    }),
    500: Type.Object({ 
      error: Type.String(), 
      message: Type.String() 
    }),
  },
};

