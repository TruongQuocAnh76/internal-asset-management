<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../../auth/composables/useAuth'

const { user } = useAuth()
const userData = ref<any>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    // Simulate fetching user data - in real app, would fetch from API
    const response = await $fetch('/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {
      // Fallback if endpoint doesn't exist yet
      return user.value
    })
    userData.value = response
  } catch (error) {
    console.error('Failed to load user profile:', error)
  } finally {
    isLoading.value = false
  }
})

const handleLogout = async () => {
  try {
    // TODO: Implement logout endpoint
    // await $fetch('/auth/logout', { method: 'POST' })
    
    // Clear user data and redirect
    user.value = null
    navigateTo('/signin')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span class="text-xl font-bold text-secondary-900">Asset Manager</span>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-secondary-900 mb-2">
          Welcome to Asset Management System
        </h1>
        <p class="text-secondary-600 text-lg">
          Manage and track your assets efficiently
        </p>
      </div>

      <!-- User Profile Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Profile Section -->
        <div class="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h2 class="text-2xl font-bold text-white">User Profile</h2>
          </div>
          <div class="p-6">
            <div v-if="isLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
            <div v-else-if="userData || user" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-secondary-600 text-sm font-medium">First Name</p>
                  <p class="text-secondary-900 font-semibold">{{ userData?.first_name || user?.first_name || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-secondary-600 text-sm font-medium">Last Name</p>
                  <p class="text-secondary-900 font-semibold">{{ userData?.last_name || user?.last_name || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-secondary-600 text-sm font-medium">Username</p>
                  <p class="text-secondary-900 font-semibold">{{ userData?.username || user?.username || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-secondary-600 text-sm font-medium">Email</p>
                  <p class="text-secondary-900 font-semibold break-all">{{ userData?.email || user?.email || 'N/A' }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-secondary-600 text-sm font-medium">Department</p>
                  <p class="text-secondary-900 font-semibold">{{ userData?.department || user?.department || 'N/A' }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-secondary-600 text-sm font-medium">User ID</p>
                  <p class="text-secondary-900 font-mono text-sm break-all">{{ userData?.id || user?.id || 'N/A' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-secondary-500">
              No user data available
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="space-y-4">
          <!-- Auth Status Card -->
          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-success-600">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="text-secondary-600 text-sm">Status</p>
                <p class="text-secondary-900 font-bold">Authenticated</p>
              </div>
            </div>
          </div>

          <!-- Session Info Card -->
          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary-600">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 8a2 2 0 11-4 0 2 2 0 014 0zM8 15a4 4 0 00-8 0v2h8v-2z" />
                </svg>
              </div>
              <div>
                <p class="text-secondary-600 text-sm">Session</p>
                <p class="text-secondary-900 font-bold">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <h2 class="text-2xl font-bold text-white">Available Features</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span class="font-medium text-secondary-900">Asset Management</span>
            </div>

            <div class="flex items-center gap-3 p-4 bg-success-50 rounded-lg">
              <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="font-medium text-secondary-900">Analytics</span>
            </div>

            <div class="flex items-center gap-3 p-4 bg-warning-50 rounded-lg">
              <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium text-secondary-900">Tracking</span>
            </div>

            <div class="flex items-center gap-3 p-4 bg-danger-50 rounded-lg">
              <svg class="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="font-medium text-secondary-900">Security</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Info Section (Development Only) -->
      <div class="mt-8 bg-secondary-900 rounded-xl shadow-lg p-6 text-white font-mono text-sm">
        <div class="mb-4">
          <h3 class="text-lg font-bold mb-2">Debug Info (Dev Only)</h3>
          <p class="text-secondary-400 mb-4">Current user state from composable:</p>
        </div>
        <pre class="bg-secondary-950 p-4 rounded overflow-auto max-h-48">{{ JSON.stringify(user, null, 2) || 'No user data' }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
