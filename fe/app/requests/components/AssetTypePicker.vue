<script setup lang="ts">
import type { AssetType, RequestAsset } from '../types/request.types'

interface Props {
  assetTypes: AssetType[]
  availableAssets: RequestAsset[]
  selectedTypeId: string
  selectedAssetId: string
  isLoadingAssets: boolean
  availabilityHint: string
  error?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedTypeId': [id: string]
  'update:selectedAssetId': [id: string]
  'search': [query: string]
}>()

const searchQuery = ref('')
const showAssetDropdown = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const handleTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  emit('update:selectedTypeId', target.value)
  emit('update:selectedAssetId', '')
  searchQuery.value = ''
}

const handleAssetSearch = (e: Event) => {
  const target = e.target as HTMLInputElement
  searchQuery.value = target.value

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300)
}

const selectAsset = (asset: RequestAsset) => {
  emit('update:selectedAssetId', asset.id)
  searchQuery.value = `${asset.name} (${asset.code})`
  showAssetDropdown.value = false
}

const clearAssetSelection = () => {
  emit('update:selectedAssetId', '')
  searchQuery.value = ''
}

// Close dropdown when clicking outside
const dropdownRef = ref<HTMLDivElement | null>(null)
onMounted(() => {
  document.addEventListener('click', (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      showAssetDropdown.value = false
    }
  })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Asset Type Selection -->
    <div class="input-group">
      <label for="asset-type" class="label">
        Asset Type <span class="text-danger-500">*</span>
      </label>
      <select
        id="asset-type"
        :value="selectedTypeId"
        @change="handleTypeChange"
        class="w-full"
        :class="{ '!border-danger-500': error }"
        required
        aria-describedby="asset-type-hint asset-type-error"
      >
        <option value="" disabled>Select asset type</option>
        <option
          v-for="type in assetTypes"
          :key="type.id"
          :value="type.id"
        >
          {{ type.name }}
        </option>
      </select>
      
      <!-- Availability hint -->
      <p
        v-if="availabilityHint && selectedTypeId"
        id="asset-type-hint"
        :class="[
          'text-sm mt-1',
          availabilityHint.includes('No') ? 'text-danger-600' : 'text-success-600'
        ]"
      >
        <span class="inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ availabilityHint }}
        </span>
      </p>

      <p v-if="error" id="asset-type-error" class="error-message">{{ error }}</p>
    </div>

    <!-- Specific Asset Selection (Optional) -->
    <div v-if="selectedTypeId" class="input-group" ref="dropdownRef">
      <label for="specific-asset" class="label">
        Specific Asset
        <span class="text-secondary-400 font-normal">(optional)</span>
      </label>
      <p class="text-sm text-secondary-500 mb-2">
        Leave empty to let Admin assign any available asset of this type
      </p>

      <div class="relative">
        <div class="relative">
          <input
            id="specific-asset"
            type="text"
            :value="searchQuery"
            @input="handleAssetSearch"
            @focus="showAssetDropdown = true"
            placeholder="Search by name or code..."
            class="w-full pl-10 pr-10"
            autocomplete="off"
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
          
          <!-- Clear button -->
          <button
            v-if="selectedAssetId"
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
            @click="clearAssetSelection"
            aria-label="Clear selection"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Dropdown results -->
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="showAssetDropdown && selectedTypeId"
            class="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-secondary-200 max-h-60 overflow-auto"
          >
            <!-- Loading state -->
            <div v-if="isLoadingAssets" class="p-4 text-center">
              <svg
                class="animate-spin h-5 w-5 mx-auto text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
              >
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p class="text-sm text-secondary-500 mt-2">Loading assets...</p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="availableAssets.length === 0"
              class="p-4 text-center text-secondary-500"
            >
              <svg
                class="w-8 h-8 mx-auto text-secondary-400"
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
              <p class="text-sm mt-2">No available assets found</p>
            </div>

            <!-- Asset list -->
            <ul v-else role="listbox" aria-label="Available assets">
              <li
                v-for="asset in availableAssets"
                :key="asset.id"
                role="option"
                :aria-selected="asset.id === selectedAssetId"
                :class="[
                  'px-4 py-3 cursor-pointer transition-colors',
                  asset.id === selectedAssetId
                    ? 'bg-primary-50 text-primary-900'
                    : 'hover:bg-secondary-50'
                ]"
                @click="selectAsset(asset)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-secondary-900">{{ asset.name }}</p>
                    <p class="text-sm text-secondary-500">{{ asset.code }}</p>
                  </div>
                  <span
                    v-if="asset.id === selectedAssetId"
                    class="text-primary-600"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
