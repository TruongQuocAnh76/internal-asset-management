<script setup lang="ts">
import type { KitComponent } from '../types/kit.types'

interface Props {
  components: KitComponent[]
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'replace': [componentId: string]
  'remove': [componentId: string]
  'convert-to-placeholder': [componentId: string]
}>()

const showMenu = ref<string | null>(null)

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-secondary-100 text-secondary-700'
  const colors = {
    READY: 'bg-success-100 text-success-700',
    IN_USE: 'bg-primary-100 text-primary-700',
    MAINTENANCE: 'bg-warning-100 text-warning-700',
  }
  return colors[status as keyof typeof colors] || 'bg-secondary-100 text-secondary-700'
}

const toggleMenu = (componentId: string) => {
  showMenu.value = showMenu.value === componentId ? null : componentId
}

const closeMenu = () => {
  showMenu.value = null
}

// Close menu on outside click
onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="px-6 py-4 border-b border-secondary-200">
      <h3 class="text-lg font-semibold text-secondary-900 flex items-center gap-2">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Components
        <span class="text-sm font-normal text-secondary-500">({{ components.length }})</span>
      </h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="divide-y divide-secondary-100">
      <div v-for="i in 3" :key="i" class="p-4">
        <div class="flex items-center gap-4 animate-pulse">
          <div class="w-12 h-12 bg-secondary-200 rounded-lg"></div>
          <div class="flex-1">
            <div class="h-4 w-32 bg-secondary-200 rounded mb-2"></div>
            <div class="h-3 w-24 bg-secondary-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Components List -->
    <div v-else-if="components.length > 0" class="divide-y divide-secondary-100">
      <div
        v-for="component in components"
        :key="component.id"
        class="p-4 hover:bg-secondary-50 transition-colors"
      >
        <div class="flex items-center gap-4">
          <!-- Component Icon -->
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="component.isPlaceholder ? 'bg-warning-100' : 'bg-primary-100'"
          >
            <span class="text-lg font-bold" :class="component.isPlaceholder ? 'text-warning-600' : 'text-primary-600'">
              {{ component.quantity }}x
            </span>
          </div>

          <!-- Component Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-secondary-900">{{ component.assetType }}</span>
              <span
                v-if="component.isPlaceholder"
                class="text-xs px-2 py-0.5 bg-warning-100 text-warning-700 rounded"
              >
                Type Placeholder
              </span>
            </div>

            <div v-if="component.asset" class="text-sm text-secondary-600">
              <span class="font-mono">{{ component.asset.code }}</span>
              <span class="mx-1">•</span>
              <span>{{ component.asset.name }}</span>
              <span v-if="component.asset.serial" class="mx-1">•</span>
              <span v-if="component.asset.serial" class="font-mono text-xs">{{ component.asset.serial }}</span>
            </div>
            <div v-else class="text-sm text-secondary-500 italic">
              Any available {{ component.assetType.toLowerCase() }}
            </div>
          </div>

          <!-- Status Badge -->
          <div v-if="component.asset?.status" class="flex-shrink-0">
            <span 
              class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
              :class="getStatusColor(component.asset.status)"
            >
              {{ component.asset.status.replace('_', ' ') }}
            </span>
          </div>

          <!-- Actions Menu -->
          <div class="relative flex-shrink-0">
            <button
              @click.stop="toggleMenu(component.id)"
              class="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition-all duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showMenu === component.id"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10"
              >
                <button
                  v-if="!component.isPlaceholder"
                  @click="emit('replace', component.id); closeMenu()"
                  class="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Replace Asset
                </button>
                <button
                  v-if="!component.isPlaceholder"
                  @click="emit('convert-to-placeholder', component.id); closeMenu()"
                  class="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Convert to Placeholder
                </button>
                <button
                  @click="emit('remove', component.id); closeMenu()"
                  class="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Component
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <svg class="w-12 h-12 mx-auto text-secondary-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
      <p class="text-secondary-600 font-medium">No components defined</p>
      <p class="text-sm text-secondary-500 mt-1">Add components to this kit using the Manage Components action</p>
    </div>
  </div>
</template>
