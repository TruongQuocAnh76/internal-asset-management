import type { Category, CategoryFormData } from '../types/category.types'

export const useCategories = () => {
  const config = useRuntimeConfig()

  const getAllCategories = async (params: { page?: number; limit?: number; search?: string; sort?: 'asc' | 'desc' } = {}) => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    const url = `/category${queryString ? `?${queryString}` : ''}`

    try {
      const result = await $fetch<Category[]>(url, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include',
      })
      return { data: ref(result), error: ref<any>(null) }
    } catch (err) {
      return { data: ref<Category[] | null>(null), error: ref(err) }
    }
  }

  const getCategoryById = async (id: string) => {
    return await $fetch<Category>(`/category/${id}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
  }

  const createCategory = async (formData: CategoryFormData) => {
    return await $fetch<Category>('/category', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData,
    })
  }

  const updateCategory = async (id: string, formData: Partial<CategoryFormData>) => {
    return await $fetch<Category>(`/category/${id}`, {
      method: 'PATCH',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData,
    })
  }

  const deleteCategory = async (id: string) => {
    return await $fetch(`/category/${id}`, {
      method: 'DELETE',
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
  }

  return {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
