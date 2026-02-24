<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: false,
})

const credential = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const { login } = useAuth()

const handleSignin = async () => {
  if (!credential.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const response = await login(credential.value, password.value)
    // Navigate to home
    navigateTo('/home')
  } catch (error: any) {
    errorMessage.value = error.data?.error || error.message || 'An error occurred during signin'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-secondary-900 mb-2">Welcome Back</h1>
        <p class="text-secondary-600">Sign in to manage your assets</p>
      </div>

      <!-- Sign In Form Card -->
      <div class="card">
        <form @submit.prevent="handleSignin" class="space-y-5">
          <!-- Credential Input -->
          <div class="input-group">
            <label for="credential" class="label">Email or Username</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="credential"
                v-model="credential"
                type="text"
                placeholder="you@example.com"
                class="!pl-12"
                required
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="input-group">
            <label for="password" class="label">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="!pl-12"
                required
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message bg-danger-50 border border-danger-200 rounded-lg p-3">
            <div class="flex items-center">
              <svg class="h-5 w-5 text-danger-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-secondary-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-secondary-500">Don't have an account?</span>
          </div>
        </div>

        <!-- Sign Up Link -->
        <NuxtLink
          to="/signup"
          class="btn-outline w-full text-center"
        >
          Create New Account
        </NuxtLink>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-secondary-500 mt-8">
        © 2026 Asset Management System. Internal use only.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
