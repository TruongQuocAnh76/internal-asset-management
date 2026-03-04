<script setup lang="ts">
import PurchaseRequestForm from '../../components/PurchaseRequestForm.vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()

const handleSuccess = () => {
  router.push('/purchase-requests')
}

const handleCancel = () => {
  router.push('/purchase-requests')
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-4">
          <NuxtLink
            to="/purchase-requests"
            class="p-2 rounded-lg hover:bg-secondary-200 transition-colors"
            aria-label="Back to purchase requests"
          >
            <svg
              class="w-5 h-5 text-secondary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold text-secondary-900">New Purchase Request</h1>
            <p class="text-secondary-500 mt-1">
              Submit a request to purchase new assets
            </p>
          </div>
        </div>

        <!-- Process steps -->
        <div class="flex items-center gap-2 text-sm text-secondary-500 bg-white rounded-lg p-4 shadow-soft">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-medium">1</span>
            <span class="font-medium text-primary-600">Submit</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">2</span>
            <span>TL Approval</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">3</span>
            <span>BOD Approval</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">4</span>
            <span>Received</span>
          </div>
        </div>
      </div>

      <!-- Form -->
      <PurchaseRequestForm
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
