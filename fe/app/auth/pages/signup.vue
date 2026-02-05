<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const department = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const { signup } = useAuth()

const handleSignup = async () => {
  // Validation
  if (!firstName.value || !lastName.value || !username.value || !email.value || !password.value || !confirmPassword.value || !department.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const response = await signup(username.value, email.value, firstName.value, lastName.value, password.value, department.value)

    successMessage.value = 'Account created successfully! Redirecting...'
    
    // Navigate to home
    setTimeout(() => {
      navigateTo('/home')
    }, 2000)
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
        <h1 class="text-3xl font-bold text-secondary-900 mb-2">Create Account</h1>
        <p class="text-secondary-600">Join the asset management system</p>
      </div>

      <!-- Sign Up Form Card -->
      <div class="card">
        <form @submit.prevent="handleSignup" class="space-y-5">
          <!-- Name Fields Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- First Name -->
            <div class="input-group">
              <label for="firstName" class="label">First Name</label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                placeholder="John"
                required
              />
            </div>

            <!-- Last Name -->
            <div class="input-group">
              <label for="lastName" class="label">Last Name</label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <!-- Username Input -->
          <div class="input-group">
            <label for="username" class="label">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="johndoe"
              required
            />
          </div>

          <!-- Department Input -->
          <div class="input-group">
            <label for="department" class="label">Department</label>
            <input
              id="department"
              v-model="department"
              type="text"
              placeholder="Engineering"
              required
            />
          </div>

          <!-- Email Input -->
          <div class="input-group">
            <label for="email" class="label">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
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
            <p class="text-xs text-secondary-500 mt-1">Must be at least 8 characters</p>
          </div>

          <!-- Confirm Password Input -->
          <div class="input-group">
            <label for="confirmPassword" class="label">Confirm Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
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

          <!-- Success Message -->
          <div v-if="successMessage" class="success-message bg-success-50 border border-success-200 rounded-lg p-3">
            <div class="flex items-center">
              <svg class="h-5 w-5 text-success-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>{{ successMessage }}</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Create Account</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-secondary-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-secondary-500">Already have an account?</span>
          </div>
        </div>

        <!-- Sign In Link -->
        <NuxtLink
          to="/signin"
          class="btn-outline w-full text-center"
        >
          Sign In Instead
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
