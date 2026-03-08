<script setup lang="ts">
import type { Category } from '../../types/category.types'
import { useCategories } from '../../composables/useCategories'

definePageMeta({
  layout: 'default',
})

const { getAllCategories, deleteCategory } = useCategories()
const router = useRouter()

const categories = ref<Category[]>([])
const isLoading = ref(false)
const search = ref('')
const deleteConfirm = ref<string | null>(null)

const fetchCategories = async () => {
  isLoading.value = true
  try {
    const { data } = await getAllCategories({ search: search.value, limit: 100 })
    if (data.value) {
      categories.value = data.value
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteCategory(id)
    deleteConfirm.value = null
    await fetchCategories()
  } catch (err) {
    console.error('Error deleting category:', err)
  }
}

const getMethodLabel = (method: string | null | undefined) => {
  if (!method) return '-'
  return method === 'STRAIGHT_LINE' ? 'Straight Line' : 'Declining Balance'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
  }).format(amount)
}

onMounted(() => {
  fetchCategories()
})

watch(search, () => {
  fetchCategories()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-100 rounded-xl">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-secondary-900">Categories</h1>
            <p class="text-secondary-600 mt-1">Manage asset categories and their default depreciation settings</p>
          </div>
        </div>

        <NuxtLink to="/categories/new" class="btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Category
        </NuxtLink>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search categories..."
            class="!pl-10 w-full"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Table -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-secondary-200 bg-secondary-50">
                <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-600">Name</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-600">Code</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-600">Depreciation Method</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-600">Salvage Value</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-600">Life (months)</th>
                <th class="text-right py-3 px-4 text-sm font-semibold text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="categories.length === 0">
                <td colspan="6" class="text-center py-8 text-secondary-500">
                  No categories found
                </td>
              </tr>
              <tr
                v-for="cat in categories"
                :key="cat.id"
                class="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
              >
                <td class="py-3 px-4 font-medium text-secondary-900">{{ cat.name }}</td>
                <td class="py-3 px-4 text-secondary-600">
                  <span class="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-sm font-mono">{{ cat.code }}</span>
                </td>
                <td class="py-3 px-4 text-secondary-600">{{ getMethodLabel(cat.default_depreciation_method) }}</td>
                <td class="py-3 px-4 text-secondary-600">
                  {{ cat.salvage_value != null ? formatCurrency(cat.salvage_value) : '-' }}
                </td>
                <td class="py-3 px-4 text-secondary-600">{{ cat.default_life_months ?? '-' }}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink
                      :to="`/categories/${cat.id}/edit`"
                      class="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </NuxtLink>
                    <button
                      v-if="deleteConfirm !== cat.id"
                      @click="deleteConfirm = cat.id"
                      class="p-2 text-secondary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div v-else class="flex items-center gap-1">
                      <button
                        @click="handleDelete(cat.id)"
                        class="px-2 py-1 text-xs bg-danger-500 text-white rounded hover:bg-danger-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        @click="deleteConfirm = null"
                        class="px-2 py-1 text-xs bg-secondary-200 text-secondary-700 rounded hover:bg-secondary-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
