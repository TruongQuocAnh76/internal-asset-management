<script setup lang="ts">
import RequestForm from '../../components/RequestForm.vue'

</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-4">
          <NuxtLink
            to="/requests"
            class="p-2 rounded-lg hover:bg-secondary-200 transition-colors"
            aria-label="Back to requests"
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
            <h1 class="text-2xl font-bold text-secondary-900">New Borrow Request</h1>
            <p class="text-secondary-500 mt-1">
              Request an asset for temporary use
            </p>
          </div>
        </div>

        <!-- Process steps indicator -->
        <div class="flex items-center gap-2 text-sm text-secondary-500 bg-white rounded-lg p-4 shadow-soft">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-medium">
              1
            </span>
            <span class="font-medium text-primary-600">Fill Form</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">
              2
            </span>
            <span>Review</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">
              3
            </span>
            <span>Approval</span>
          </div>
          <svg class="w-4 h-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-600 text-xs font-medium">
              4
            </span>
            <span>Fulfillment</span>
          </div>
        </div>
      </div>

      <!-- Request Form -->
      <RequestForm />
    </div>
  </div>
</template>
