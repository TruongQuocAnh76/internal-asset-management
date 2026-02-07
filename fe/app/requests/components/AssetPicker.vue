<script setup lang="ts">
import type { RequestAsset } from '../types/request.types'
import { useRequests } from '../composables/useRequests'

interface Props {
  isOpen: boolean
  categoryId: string
  isProcessing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'select': [assetId: string]
}>()

const { getAvailableAssets } = useRequests()

const assets = ref<RequestAsset[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedAssetId = ref<string | null>(null)
const error = ref<string | null>(null)

const loadAssets = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { data } = await getAvailableAssets(props.categoryId, searchQuery.value)
    if (data.value) {
      assets.value = data.value
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load available assets'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = (e: Event) => {
  const target = e.target as HTMLInputElement
  searchQuery.value = target.value
  loadAssets()
}

const selectAsset = (assetId: string) => {
  selectedAssetId.value = assetId
}

const handleConfirm = () => {
  if (selectedAssetId.value) {
    emit('select', selectedAssetId.value)
  }
}

const handleClose = () => {
  if (!props.isProcessing) {
    selectedAssetId.value = null
    searchQuery.value = ''
    emit('close')
  }
}

// Load assets when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedAssetId.value = null
    searchQuery.value = ''
    loadAssets()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-picker-title"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-secondary-200">
              <div class="flex items-center justify-between">
                <div>
                  <h3 id="asset-picker-title" class="text-lg font-semibold text-secondary-900">
                    Assign Asset
                  </h3>
                  <p class="text-sm text-secondary-500">
                    Select an available asset to assign to this request
                  </p>
                </div>
                <button
                  type="button"
                  class="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100"
                  @click="handleClose"
                  :disabled="isProcessing"
                  aria-label="Close"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Search -->
              <div class="mt-4 relative">
                <input
                  type="text"
                  :value="searchQuery"
                  @input="handleSearch"
                  placeholder="Search assets..."
                  class="w-full pl-10"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    class="h-5 w-5 text-secondary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4">
              <!-- Loading state -->
              <div v-if="isLoading" class="animate-pulse space-y-3">
                <div v-for="i in 5" :key="i" class="flex items-center gap-4 p-3">
                  <div class="h-10 w-10 bg-secondary-200 rounded-lg"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-secondary-200 rounded w-1/3"></div>
                    <div class="h-3 bg-secondary-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <!-- Error state -->
              <div v-else-if="error" class="text-center py-8">
                <svg
                  class="w-12 h-12 mx-auto text-danger-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p class="mt-2 text-secondary-600">{{ error }}</p>
                <button
                  type="button"
                  class="mt-4 btn-secondary"
                  @click="loadAssets"
                >
                  Try Again
                </button>
              </div>

              <!-- Empty state -->
              <div
                v-else-if="assets.length === 0"
                class="text-center py-8"
              >
                <svg
                  class="w-12 h-12 mx-auto text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p class="mt-2 text-secondary-600">No available assets found</p>
                <p class="text-sm text-secondary-500 mt-1">
                  You may need to escalate this to procurement
                </p>
              </div>

              <!-- Asset list -->
              <ul v-else class="space-y-2" role="listbox" aria-label="Available assets">
                <li
                  v-for="asset in assets"
                  :key="asset.id"
                  role="option"
                  :aria-selected="asset.id === selectedAssetId"
                  :class="[
                    'p-3 rounded-lg border-2 cursor-pointer transition-all',
                    asset.id === selectedAssetId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                  ]"
                  @click="selectAsset(asset.id)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'p-2 rounded-lg',
                        asset.id === selectedAssetId ? 'bg-primary-100' : 'bg-secondary-100'
                      ]"
                    >
                      <svg
                        :class="[
                          'w-5 h-5',
                          asset.id === selectedAssetId ? 'text-primary-600' : 'text-secondary-500'
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-secondary-900">{{ asset.name }}</p>
                      <p class="text-sm text-secondary-500">{{ asset.code }}</p>
                    </div>
                    <div
                      v-if="asset.id === selectedAssetId"
                      class="text-primary-600"
                    >
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-secondary-200 bg-secondary-50 flex gap-3 justify-end">
              <button
                type="button"
                class="btn-secondary"
                @click="handleClose"
                :disabled="isProcessing"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-primary"
                :disabled="!selectedAssetId || isProcessing"
                @click="handleConfirm"
              >
                <span v-if="isProcessing" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Assigning...
                </span>
                <span v-else>Assign Asset</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
