<script setup lang="ts">
interface Props {
  userName?: string
}

defineProps<Props>()

const emit = defineEmits<{
  logout: []
}>()

const handleLogout = () => {
  emit('logout')
}
</script>

<template>
  <nav class="bg-white shadow-soft sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-xl font-bold text-secondary-900">Asset Manager</span>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-4">
          <!-- User info -->
          <div v-if="userName" class="hidden sm:flex items-center gap-2 text-secondary-600">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span class="text-sm font-medium">{{ userName }}</span>
          </div>

          <!-- Logout button -->
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
