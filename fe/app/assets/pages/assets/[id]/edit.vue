<script setup lang="ts">
import AssetForm from '../../../components/AssetForm.vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

const assetId = computed(() => route.params.id as string)

const handleSuccess = () => {
  // Show success and stay on page (for edit mode)
  // The success toast is shown by the form component
}

const handleCancel = () => {
  // Go back to assets list or asset detail
  router.push('/asset')
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-sm text-secondary-500 mb-4">
          <NuxtLink to="/asset" class="hover:text-primary-600 transition-colors">
            Assets
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <NuxtLink :to="`/assets/${assetId}`" class="hover:text-primary-600 transition-colors">
            Asset Details
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-secondary-900 font-medium">Edit</span>
        </nav>
        
        <div class="flex items-center gap-4">
          <div class="p-3 bg-warning-100 rounded-xl">
            <svg class="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-secondary-900">Edit Asset</h1>
            <p class="text-secondary-600 mt-1">Update the asset information below</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <AssetForm
        mode="edit"
        :asset-id="assetId"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
