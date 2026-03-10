<script setup lang="ts">
import { useRequestForm } from '../composables/useRequestForm'
import PriorityBadge from './PriorityBadge.vue'
import RequestPreviewModal from './RequestPreviewModal.vue'
import DraftRestoreModal from './DraftRestoreModal.vue'
import RequestSuccessModal from './RequestSuccessModal.vue'
import type { RequestPriority, RequestType } from '../types/request.types'

const route = useRoute()
const router = useRouter()

const {
  formData,
  errors,
  isLoading,
  isSubmitting,
  showPreview,
  showDraftRestore,
  createdRequestId,
  assetCategories,
  availableAssets,
  selectedCategoryId,
  selectedAsset,
  isLoadingAssets,
  availableKits,
  selectedKit,
  isLoadingKits,
  selectedCategory,
  requesterInfo,
  canSubmit,
  init,
  validateField,
  onCategoryChange,
  onCategoryTypeChange,
  onAssetChange,
  onTypeChange,
  onKitChange,
  openPreview,
  closePreview,
  submitRequest,
  restoreDraft,
  discardDraft,
  loadAvailableAssets,
  loadAvailableKits
} = useRequestForm()

const priorities: { value: RequestPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Normal' },
  { value: 'HIGH', label: 'High' }
]

// Minimum date for due date picker (tomorrow)
const minDueDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

// Handle form submission
const handleSubmit = async () => {
  const result = await submitRequest()
  if (result) {
    // Success modal will show via createdRequestId
  }
}

// Handle preview confirm
const handlePreviewConfirm = async () => {
  await handleSubmit()
}

// Handle success modal close
const handleSuccessClose = () => {
  if (createdRequestId.value) {
    router.push(`/requests/${createdRequestId.value}`)
  }
}

// Handle cancel
const handleCancel = () => {
  router.push('/requests')
}

// Asset search with debounce
const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (formData.value.type === 'kit') {
      loadAvailableKits(searchQuery.value || undefined)
    } else if (formData.value.type === 'asset') {
      loadAvailableAssets(searchQuery.value || undefined)
    }
  }, 1000)
}

watch(searchQuery, () => {
  debouncedSearch()
})

// Initialize form with optional prefilled assetId from query params
onMounted(() => {
  const prefilledAssetId = route.query.assetId as string | undefined
  init(prefilledAssetId)
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Loading state -->
    <div v-if="isLoading" class="card flex items-center justify-center py-12">
      <div class="text-center">
        <svg
          class="animate-spin h-8 w-8 mx-auto text-primary-600"
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
        <p class="text-secondary-600 mt-3">Loading form...</p>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="openPreview" class="space-y-6">
      <!-- General error message -->
      <div
        v-if="errors.general"
        class="bg-danger-50 border border-danger-200 rounded-lg p-4"
        role="alert"
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-danger-700 font-medium">{{ errors.general }}</span>
        </div>
      </div>

      <!-- Requester Information (Auto-filled) -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Requester Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group">
            <label class="label">Name</label>
            <input
              type="text"
              :value="requesterInfo.name"
              disabled
              class="bg-secondary-50"
            />
          </div>
          <div class="input-group">
            <label class="label">Department</label>
            <input
              type="text"
              :value="requesterInfo.department"
              disabled
              class="bg-secondary-50"
            />
          </div>
        </div>
      </div>

      <!-- Request Type Toggle -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Request Type
        </h2>

        <div class="flex gap-3" role="radiogroup" aria-label="Request type">
          <label
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all text-center',
              formData.type === 'asset'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
            ]"
          >
            <input
              type="radio"
              value="asset"
              :checked="formData.type === 'asset'"
              @change="onTypeChange('asset')"
              class="sr-only"
            />
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span class="font-medium">Asset</span>
          </label>
          <label
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all text-center',
              formData.type === 'kit'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
            ]"
          >
            <input
              type="radio"
              value="kit"
              :checked="formData.type === 'kit'"
              @change="onTypeChange('kit')"
              class="sr-only"
            />
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="font-medium">Kit</span>
          </label>
          <label
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all text-center',
              formData.type === 'category'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
            ]"
          >
            <input
              type="radio"
              value="category"
              :checked="formData.type === 'category'"
              @change="onTypeChange('category')"
              class="sr-only"
            />
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span class="font-medium">Category</span>
          </label>
        </div>
      </div>

      <!-- Asset Selection (shown when type is 'asset') -->
      <div v-if="formData.type === 'asset'" class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary-600"
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
          Asset Selection
        </h2>

        <!-- Category filter -->
        <div class="input-group mb-4">
          <label for="category" class="label">Filter by Category</label>
          <select
            id="category"
            :value="selectedCategoryId"
            @change="onCategoryChange(($event.target as HTMLSelectElement).value)"
            class="w-full"
          >
            <option value="">All Categories</option>
            <option
              v-for="cat in assetCategories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Search -->
        <div class="input-group mb-4">
          <label for="asset-search" class="label">Search Assets</label>
          <input
            id="asset-search"
            type="text"
            v-model="searchQuery"
            placeholder="Search by name or code..."
            class="w-full"
          />
        </div>

        <!-- Asset selection -->
        <div class="input-group">
          <label for="asset" class="label">
            Select Asset <span class="text-danger-500">*</span>
          </label>
          <div v-if="isLoadingAssets" class="py-4 text-center text-secondary-500">
            <svg class="animate-spin h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading assets...
          </div>
          <div v-else-if="availableAssets.length === 0" class="py-4 text-center text-secondary-500">
            No available assets found
          </div>
          <div v-else class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            <label
              v-for="asset in availableAssets"
              :key="asset.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                formData.assetId === asset.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              ]"
            >
              <input
                type="radio"
                :value="asset.id"
                v-model="formData.assetId"
                @change="onAssetChange(asset.id)"
                class="sr-only"
              />
              <div class="flex-1">
                <p class="font-medium text-secondary-900">{{ asset.name }}</p>
                <p class="text-sm text-secondary-500">{{ asset.code }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  asset.status === 'READY' ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-700'
                ]"
              >
                {{ asset.status }}
              </span>
            </label>
          </div>
          <p v-if="errors.assetId" class="error-message mt-2">
            {{ errors.assetId }}
          </p>
        </div>
      </div>

      <!-- Kit Selection (shown when type is 'kit') -->
      <div v-if="formData.type === 'kit'" class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Kit Selection
        </h2>

        <!-- Search -->
        <div class="input-group mb-4">
          <label for="kit-search" class="label">Search Kits</label>
          <input
            id="kit-search"
            type="text"
            v-model="searchQuery"
            placeholder="Search by kit name..."
            class="w-full"
          />
        </div>

        <!-- Kit selection list -->
        <div class="input-group">
          <label class="label">
            Select Kit <span class="text-danger-500">*</span>
          </label>
          <div v-if="isLoadingKits" class="py-4 text-center text-secondary-500">
            <svg class="animate-spin h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading kits...
          </div>
          <div v-else-if="availableKits.length === 0" class="py-4 text-center text-secondary-500">
            No available kits found
          </div>
          <div v-else class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            <label
              v-for="kit in availableKits"
              :key="kit.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                formData.kitId === kit.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              ]"
            >
              <input
                type="radio"
                :value="kit.id"
                v-model="formData.kitId"
                @change="onKitChange(kit.id)"
                class="sr-only"
              />
              <div class="flex-1">
                <p class="font-medium text-secondary-900">{{ kit.template?.name || 'Unnamed Kit' }}</p>
                <p class="text-sm text-secondary-500">Kit #{{ kit.id.slice(0, 8).toUpperCase() }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  kit.status === 'READY' ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-700'
                ]"
              >
                {{ kit.status }}
              </span>
            </label>
          </div>
          <p v-if="(errors as any).kitId" class="error-message mt-2">
            {{ (errors as any).kitId }}
          </p>
        </div>
      </div>

      <!-- Category Selection (shown when type is 'category') -->
      <div v-if="formData.type === 'category'" class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-1 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Category Selection
        </h2>
        <p class="text-sm text-secondary-500 mb-4">Select a category and an admin will assign an available asset from it when fulfilling your request.</p>

        <div class="input-group">
          <label class="label">Select Category <span class="text-danger-500">*</span></label>
          <div v-if="assetCategories.length === 0" class="py-4 text-center text-secondary-500">
            No categories available
          </div>
          <div v-else class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            <label
              v-for="cat in assetCategories"
              :key="cat.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                formData.categoryId === cat.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              ]"
            >
              <input
                type="radio"
                :value="cat.id"
                v-model="formData.categoryId"
                @change="onCategoryTypeChange(cat.id)"
                class="sr-only"
              />
              <div class="flex-1">
                <p class="font-medium text-secondary-900">{{ cat.name }}</p>
                <p v-if="cat.code" class="text-sm text-secondary-500">{{ cat.code }}</p>
              </div>
              <svg
                v-if="formData.categoryId === cat.id"
                class="w-5 h-5 text-primary-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </label>
          </div>
          <p v-if="(errors as any).categoryId" class="error-message mt-2">
            {{ (errors as any).categoryId }}
          </p>
        </div>
      </div>
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Request Details
        </h2>

        <!-- Reason/Justification -->
        <div class="input-group">
          <label for="reason" class="label">
            Reason / Justification <span class="text-danger-500">*</span>
          </label>
          <textarea
            id="reason"
            v-model="formData.reason"
            rows="4"
            placeholder="Please explain why you need this asset..."
            @blur="validateField('reason')"
            :class="{ '!border-danger-500': errors.reason }"
            required
            aria-describedby="reason-hint reason-error"
          ></textarea>
          <div class="flex justify-between mt-1">
            <p id="reason-hint" class="text-sm text-secondary-500">
              Minimum 10 characters
            </p>
            <p
              :class="[
                'text-sm',
                formData.reason.length > 500 ? 'text-danger-600' : 'text-secondary-500'
              ]"
            >
              {{ formData.reason.length }} / 500
            </p>
          </div>
          <p v-if="errors.reason" id="reason-error" class="error-message">
            {{ errors.reason }}
          </p>
        </div>

        <!-- Priority -->
        <div class="input-group mt-4">
          <label class="label">Priority</label>
          <div class="flex flex-wrap gap-3" role="radiogroup" aria-label="Request priority">
            <label
              v-for="priority in priorities"
              :key="priority.value"
              :class="[
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all',
                formData.priority === priority.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              ]"
            >
              <input
                type="radio"
                :value="priority.value"
                v-model="formData.priority"
                class="sr-only"
              />
              <PriorityBadge :priority="priority.value" size="sm" />
            </label>
          </div>
          <p class="text-sm text-secondary-500 mt-2">
            High priority requests may receive faster processing
          </p>
        </div>

        <!-- Due Date -->
        <div class="input-group mt-4">
          <label for="due-date" class="label">Due Date <span class="text-red-500">*</span></label>
          <input
            id="due-date"
            type="date"
            v-model="formData.dueDate"
            :min="minDueDate"
            class="w-full"
            required
            @blur="validateField('dueDate')"
          />
          <p v-if="errors.dueDate" class="text-sm text-red-500 mt-1">{{ errors.dueDate }}</p>
          <p v-else class="text-sm text-secondary-500 mt-1">
            Expected return date for the borrowed asset.
          </p>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          class="btn-secondary order-2 sm:order-1"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary order-1 sm:order-2"
          :disabled="!canSubmit || isSubmitting"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
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
            Submitting...
          </span>
          <span v-else>Preview & Submit</span>
        </button>
      </div>

      <!-- Auto-save indicator -->
      <p class="text-center text-sm text-secondary-400">
        <svg
          class="inline-block w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
        Draft auto-saves as you type
      </p>
    </form>

    <!-- Preview Modal -->
    <RequestPreviewModal
      :is-open="showPreview"
      :form-data="formData"
      :requester-info="requesterInfo"
      :selected-asset="selectedAsset"
      :selected-kit="selectedKit"
      :selected-category="selectedCategory"
      :is-submitting="isSubmitting"
      @close="closePreview"
      @confirm="handlePreviewConfirm"
    />

    <!-- Draft Restore Modal -->
    <DraftRestoreModal
      :is-open="showDraftRestore"
      @restore="restoreDraft"
      @discard="discardDraft"
    />

    <!-- Success Modal -->
    <RequestSuccessModal
      :is-open="!!createdRequestId"
      :request-id="createdRequestId || ''"
      @close="handleSuccessClose"
    />
  </div>
</template>
