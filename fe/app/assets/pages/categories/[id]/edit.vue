<script setup lang="ts">
import CategoryForm from '../../../components/CategoryForm.vue'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const categoryId = route.params.id as string

const handleSuccess = () => {
  router.push('/categories')
}

const handleCancel = () => {
  router.push('/categories')
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-sm text-secondary-500 mb-4">
          <NuxtLink to="/categories" class="hover:text-primary-600 transition-colors">
            Categories
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-secondary-900 font-medium">Edit Category</span>
        </nav>

        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-100 rounded-xl">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-secondary-900">Edit Category</h1>
            <p class="text-secondary-600 mt-1">Update category details and default depreciation settings</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <CategoryForm
        mode="edit"
        :category-id="categoryId"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
