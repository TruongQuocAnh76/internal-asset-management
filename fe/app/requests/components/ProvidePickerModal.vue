<script setup lang="ts">
import type { RequestAsset, RequestKit } from '../types/request.types'
import { useRequests } from '../composables/useRequests'

interface Props {
  isOpen: boolean
  categoryId: string
  isProcessing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'select-asset': [assetId: string]
  'select-kit': [kitId: string]
}>()

const { getAvailableAssets, getAvailableKits } = useRequests()

type Tab = 'asset' | 'kit'
const activeTab = ref<Tab>('asset')

// Asset tab state
const assets = ref<RequestAsset[]>([])
const assetSearch = ref('')
const assetLoading = ref(false)
const assetError = ref<string | null>(null)
const selectedAssetId = ref<string | null>(null)

// Kit tab state
const kits = ref<RequestKit[]>([])
const kitSearch = ref('')
const kitLoading = ref(false)
const kitError = ref<string | null>(null)
const selectedKitId = ref<string | null>(null)

const loadAssets = async () => {
  assetLoading.value = true
  assetError.value = null
  try {
    const { data } = await getAvailableAssets(props.categoryId, assetSearch.value)
    if (data.value) assets.value = data.value
  } catch (err: any) {
    assetError.value = err.message || 'Failed to load assets'
  } finally {
    assetLoading.value = false
  }
}

const loadKits = async () => {
  kitLoading.value = true
  kitError.value = null
  try {
    const { data } = await getAvailableKits(kitSearch.value)
    if (data.value) kits.value = data.value
  } catch (err: any) {
    kitError.value = err.message || 'Failed to load kits'
  } finally {
    kitLoading.value = false
  }
}

const handleAssetSearch = (e: Event) => {
  assetSearch.value = (e.target as HTMLInputElement).value
  loadAssets()
}

const handleKitSearch = (e: Event) => {
  kitSearch.value = (e.target as HTMLInputElement).value
  loadKits()
}

const canConfirm = computed(() =>
  activeTab.value === 'asset' ? !!selectedAssetId.value : !!selectedKitId.value
)

const handleConfirm = () => {
  if (activeTab.value === 'asset' && selectedAssetId.value) {
    emit('select-asset', selectedAssetId.value)
  } else if (activeTab.value === 'kit' && selectedKitId.value) {
    emit('select-kit', selectedKitId.value)
  }
}

const handleClose = () => {
  if (!props.isProcessing) emit('close')
}

const reset = () => {
  selectedAssetId.value = null
  selectedKitId.value = null
  assetSearch.value = ''
  kitSearch.value = ''
  activeTab.value = 'asset'
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    reset()
    loadAssets()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'kit' && kits.value.length === 0) {
    loadKits()
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="provide-picker-title"
        @click.self="handleClose"
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
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 id="provide-picker-title" class="text-lg font-semibold text-secondary-900">
                    Provide Asset or Kit
                  </h3>
                  <p class="text-sm text-secondary-500">
                    Choose an available asset or kit to fulfill this request
                  </p>
                </div>
                <button
                  type="button"
                  class="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100"
                  :disabled="isProcessing"
                  aria-label="Close"
                  @click="handleClose"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Tabs -->
              <div class="flex gap-1 bg-secondary-100 p-1 rounded-lg">
                <button
                  type="button"
                  :class="[
                    'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all',
                    activeTab === 'asset'
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-500 hover:text-secondary-700'
                  ]"
                  @click="activeTab = 'asset'"
                >
                  Asset
                </button>
                <button
                  type="button"
                  :class="[
                    'flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all',
                    activeTab === 'kit'
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-500 hover:text-secondary-700'
                  ]"
                  @click="activeTab = 'kit'"
                >
                  Kit
                </button>
              </div>

              <!-- Search -->
              <div class="mt-3 relative">
                <input
                  v-if="activeTab === 'asset'"
                  type="text"
                  :value="assetSearch"
                  placeholder="Search assets..."
                  class="w-full pl-10"
                  @input="handleAssetSearch"
                />
                <input
                  v-else
                  type="text"
                  :value="kitSearch"
                  placeholder="Search kits..."
                  class="w-full pl-10"
                  @input="handleKitSearch"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4">

              <!-- Asset tab -->
              <template v-if="activeTab === 'asset'">
                <div v-if="assetLoading" class="animate-pulse space-y-3">
                  <div v-for="i in 4" :key="i" class="flex items-center gap-4 p-3">
                    <div class="h-10 w-10 bg-secondary-200 rounded-lg shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-secondary-200 rounded w-1/3"></div>
                      <div class="h-3 bg-secondary-100 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div v-else-if="assetError" class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="mt-2 text-secondary-600">{{ assetError }}</p>
                  <button type="button" class="mt-4 btn-secondary" @click="loadAssets">Try Again</button>
                </div>

                <div v-else-if="assets.length === 0" class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p class="mt-2 text-secondary-600">No available assets found</p>
                  <p class="text-sm text-secondary-500 mt-1">Try the Kit tab instead</p>
                </div>

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
                    @click="selectedAssetId = asset.id"
                  >
                    <div class="flex items-center gap-3">
                      <div :class="['p-2 rounded-lg', asset.id === selectedAssetId ? 'bg-primary-100' : 'bg-secondary-100']">
                        <svg :class="['w-5 h-5', asset.id === selectedAssetId ? 'text-primary-600' : 'text-secondary-500']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-secondary-900">{{ asset.name }}</p>
                        <p class="text-sm text-secondary-500">{{ asset.code }}</p>
                      </div>
                      <svg v-if="asset.id === selectedAssetId" class="w-6 h-6 text-primary-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </li>
                </ul>
              </template>

              <!-- Kit tab -->
              <template v-else>
                <div v-if="kitLoading" class="animate-pulse space-y-3">
                  <div v-for="i in 4" :key="i" class="flex items-center gap-4 p-3">
                    <div class="h-10 w-10 bg-secondary-200 rounded-lg shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-secondary-200 rounded w-1/3"></div>
                      <div class="h-3 bg-secondary-100 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div v-else-if="kitError" class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="mt-2 text-secondary-600">{{ kitError }}</p>
                  <button type="button" class="mt-4 btn-secondary" @click="loadKits">Try Again</button>
                </div>

                <div v-else-if="kits.length === 0" class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p class="mt-2 text-secondary-600">No available kits found</p>
                </div>

                <ul v-else class="space-y-2" role="listbox" aria-label="Available kits">
                  <li
                    v-for="kit in kits"
                    :key="kit.id"
                    role="option"
                    :aria-selected="kit.id === selectedKitId"
                    :class="[
                      'p-3 rounded-lg border-2 cursor-pointer transition-all',
                      kit.id === selectedKitId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                    ]"
                    @click="selectedKitId = kit.id"
                  >
                    <div class="flex items-center gap-3">
                      <div :class="['p-2 rounded-lg', kit.id === selectedKitId ? 'bg-primary-100' : 'bg-secondary-100']">
                        <svg :class="['w-5 h-5', kit.id === selectedKitId ? 'text-primary-600' : 'text-secondary-500']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-secondary-900">{{ kit.template?.name || 'Kit' }}</p>
                        <p class="text-sm text-secondary-500">Kit #{{ kit.id.slice(0, 8).toUpperCase() }}</p>
                      </div>
                      <svg v-if="kit.id === selectedKitId" class="w-6 h-6 text-primary-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </li>
                </ul>
              </template>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3">
              <button
                type="button"
                class="btn-secondary"
                :disabled="isProcessing"
                @click="handleClose"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-primary"
                :disabled="!canConfirm || isProcessing"
                @click="handleConfirm"
              >
                <span v-if="isProcessing" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
                <span v-else>
                  Confirm {{ activeTab === 'asset' ? 'Asset' : 'Kit' }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
