import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fileCategoriesApi } from '@/api/fileCategories'
import type { FileCategory } from '@/api/files'

export const useFileCategoriesStore = defineStore('fileCategories', () => {
  const categories = ref<FileCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all categories for a library
  const fetchCategories = async (libraryId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await fileCategoriesApi.getAll(libraryId)
      categories.value = response.categories
      return response.categories
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch file categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new category
  const createCategory = async (libraryId: number, name: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await fileCategoriesApi.create(libraryId, { name })
      categories.value.push(response.category)
      return response.category
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create file category'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a category
  const updateCategory = async (libraryId: number, categoryId: number, name: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await fileCategoriesApi.update(libraryId, categoryId, { name })
      const index = categories.value.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        categories.value[index] = response.category
      }
      return response.category
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update file category'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a category
  const deleteCategory = async (libraryId: number, categoryId: number) => {
    loading.value = true
    error.value = null
    try {
      await fileCategoriesApi.delete(libraryId, categoryId)
      categories.value = categories.value.filter(c => c.id !== categoryId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete file category'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get category by ID
  const getCategoryById = (categoryId: number): FileCategory | undefined => {
    return categories.value.find(c => c.id === categoryId)
  }

  // Get category with files
  const getCategoryWithFiles = async (libraryId: number, categoryId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await fileCategoriesApi.getById(libraryId, categoryId)
      return response.category
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch category'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset store
  const reset = () => {
    categories.value = []
    error.value = null
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryWithFiles,
    reset,
  }
})

