<script setup lang="ts">
import type { ComponentPickerAsset } from '../types/kit.types'
import { useKits } from '../composables/useKits'

interface Props {
  visible: boolean
  categoryFilter?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'select': [asset: ComponentPickerAsset | null, assetType: string]
}>()

const { searchAvailableAssets } = useKits()

const searchQuery = ref('')
const assetType = ref('')
const isPlaceholder = ref(false)
const assets = ref<ComponentPickerAsset[]>([])
const isSearching = ref(false)
const selectedAsset = ref<ComponentPickerAsset | null>(null)
const debounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const commonAssetTypes = [
  'Monitor',
  'Keyboard',
  'Mouse',
  'Laptop',
  'Desktop',
  'Headset',
  'Webcam',
  'Docking Station',
  'Cable',
  'Case',
  'Chair',
  'Desk'
]

const handleSearch = async () => {
  if (searchQuery.value.length < 2 && !props.categoryFilter) {
    assets.value = []
    return
  }

  isSearching.value = true
  try {
    const results = await searchAvailableAssets(searchQuery.value, props.categoryFilter)
    // Filter to only show available assets
    assets.value = (Array.isArray(results) ? results : []).filter(a => a.status === 'READY')
  } catch (err) {
    console.error('Search failed:', err)
    assets.value = []
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = () => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  debounceTimeout.value = setTimeout(handleSearch, 300)
}

const handleSelectAsset = (asset: ComponentPickerAsset) => {
  selectedAsset.value = asset
  assetType.value = asset.category?.name || ''
}

const handleConfirm = () => {
  if (isPlaceholder.value) {
    if (assetType.value.trim()) {
      emit('select', null, assetType.value.trim())
      resetAndClose()
    }
  } else if (selectedAsset.value) {
    emit('select', selectedAsset.value, assetType.value || selectedAsset.value.category?.name || '')
    resetAndClose()
  }
}

const resetAndClose = () => {
  searchQuery.value = ''
  assetType.value = ''
  isPlaceholder.value = false
  assets.value = []
  selectedAsset.value = null
  emit('close')
}

const canConfirm = computed(() => {
  if (isPlaceholder.value) {
    return assetType.value.trim().length > 0
  }
  return selectedAsset.value !== null
})

watch(() => props.visible, (visible) => {
  if (!visible) {
    resetAndClose()
  }
})

onUnmounted(() => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-secondary-900">Add Component</h2>
            <button
              @click="resetAndClose"
              class="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Mode Toggle -->
            <div class="mb-6">
              <div class="flex rounded-lg bg-secondary-100 p-1">
                <button
                  @click="isPlaceholder = false"
                  class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="!isPlaceholder ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'"
                >
                  Specific Asset
                </button>
                <button
                  @click="isPlaceholder = true"
                  class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="isPlaceholder ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'"
                >
                  Any of Type
                </button>
              </div>
              <p class="text-xs text-secondary-500 mt-2">
                {{ isPlaceholder 
                  ? 'Reserve a component slot for any available asset of the specified type' 
                  : 'Bind a specific asset (by serial/code) to this kit'
                }}
              </p>
            </div>

            <!-- Placeholder Mode: Asset Type Selection -->
            <div v-if="isPlaceholder">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Asset Type <span class="text-danger-500">*</span>
              </label>
              <input
                v-model="assetType"
                type="text"
                list="asset-types-list"
                placeholder="e.g., Monitor, Keyboard, Mouse"
                class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <datalist id="asset-types-list">
                <option v-for="type in commonAssetTypes" :key="type" :value="type" />
              </datalist>
              <div class="flex flex-wrap gap-2 mt-3">
                <button
                  v-for="type in commonAssetTypes.slice(0, 6)"
                  :key="type"
                  @click="assetType = type"
                  class="px-3 py-1.5 text-xs font-medium bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-md transition-colors"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <!-- Specific Asset Mode: Search -->
            <div v-else>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Search Assets</label>
              <div class="relative mb-4">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  v-model="searchQuery"
                  @input="debouncedSearch"
                  type="text"
                  placeholder="Search by name, code, or serial..."
                  class="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <!-- Search Results -->
              <div class="border border-secondary-200 rounded-lg overflow-hidden">
                <div v-if="isSearching" class="p-8 text-center">
                  <svg class="animate-spin h-6 w-6 text-primary-600 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>

                <div v-else-if="assets.length === 0 && searchQuery.length >= 2" class="p-8 text-center text-secondary-500">
                  <svg class="w-10 h-10 mx-auto mb-2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No available assets found</p>
                </div>

                <div v-else-if="searchQuery.length < 2" class="p-8 text-center text-secondary-500">
                  <svg class="w-10 h-10 mx-auto mb-2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Type at least 2 characters to search</p>
                </div>

                <div v-else class="max-h-64 overflow-y-auto divide-y divide-secondary-100">
                  <button
                    v-for="asset in assets"
                    :key="asset.id"
                    @click="handleSelectAsset(asset)"
                    class="w-full px-4 py-3 flex items-center gap-4 hover:bg-secondary-50 transition-colors text-left"
                    :class="{ 'bg-primary-50 ring-1 ring-primary-500': selectedAsset?.id === asset.id }"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-secondary-900">{{ asset.name }}</span>
                        <span class="text-xs font-mono text-secondary-500">{{ asset.code }}</span>
                      </div>
                      <div class="text-sm text-secondary-500 mt-0.5">
                        {{ asset.category?.name }}
                        <span v-if="asset.serial" class="ml-2">• {{ asset.serial }}</span>
                      </div>
                    </div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-700">
                      Available
                    </span>
                    <div v-if="selectedAsset?.id === asset.id" class="text-primary-600">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Selected Asset Preview -->
              <div v-if="selectedAsset" class="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-primary-900">Selected: {{ selectedAsset.name }}</p>
                    <p class="text-xs text-primary-700">{{ selectedAsset.code }} • {{ selectedAsset.category?.name }}</p>
                  </div>
                  <button
                    @click="selectedAsset = null"
                    class="text-primary-600 hover:text-primary-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3">
            <button
              @click="resetAndClose"
              class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              :disabled="!canConfirm"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Component
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
