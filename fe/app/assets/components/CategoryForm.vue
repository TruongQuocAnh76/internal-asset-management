<script setup lang="ts">
import { useCategoryForm } from '../composables/useCategoryForm'

interface Props {
  mode: 'create' | 'edit'
  categoryId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'success': []
  'cancel': []
}>()

const {
  formData,
  isLoading,
  isSaving,
  errors,
  successMessage,
  canSubmit,
  validateField,
  handleSubmit,
} = useCategoryForm(props.mode, props.categoryId)

const onSubmit = async () => {
  const result = await handleSubmit()
  if (result) {
    if (props.mode === 'create') {
      await navigateTo('/categories')
    }
    emit('success')
  }
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <!-- General error message -->
      <div v-if="errors.general" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-danger-700 font-medium">{{ errors.general }}</span>
        </div>
      </div>

      <!-- Success message -->
      <div v-if="successMessage" class="bg-success-50 border border-success-200 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-success-700 font-medium">{{ successMessage }}</span>
        </div>
      </div>

      <!-- Category Information -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Category Information
        </h2>

        <div class="grid grid-cols-1 gap-6">
          <!-- Category Name -->
          <div class="input-group">
            <label for="name" class="label">
              Category Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Enter category name"
              @blur="validateField('name')"
              :class="{ '!border-danger-500': errors.name }"
            />
            <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
          </div>
        </div>
      </div>

      <!-- Default Depreciation Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Default Depreciation Settings
        </h2>
        <p class="text-sm text-secondary-500 mb-6">
          These defaults will be suggested when creating new assets in this category.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Depreciation Method -->
          <div class="input-group">
            <label for="default_depreciation_method" class="label">Depreciation Method</label>
            <select
              id="default_depreciation_method"
              v-model="formData.default_depreciation_method"
              class="w-full"
            >
              <option :value="null">None</option>
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="DECLINING_BALANCE">Declining Balance</option>
            </select>
          </div>

          <!-- Salvage Value (Straight Line only) -->
          <div v-if="formData.default_depreciation_method === 'STRAIGHT_LINE'" class="input-group">
            <label for="salvage_value" class="label">Default Salvage Value</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>
              <input
                id="salvage_value"
                v-model.number="formData.salvage_value"
                type="number"
                min="0"
                placeholder="0"
                class="!pl-8"
              />
            </div>
          </div>

          <!-- Default Life Months (Straight Line only) -->
          <div v-if="formData.default_depreciation_method === 'STRAIGHT_LINE'" class="input-group">
            <label for="default_life_months" class="label">Default Useful Life (months)</label>
            <input
              id="default_life_months"
              v-model.number="formData.default_life_months"
              type="number"
              min="1"
              placeholder="e.g. 60"
            />
          </div>

          <!-- Decline Balance Rate -->
          <div v-if="formData.default_depreciation_method === 'DECLINING_BALANCE'" class="input-group">
            <label for="decline_balance_rate" class="label">Decline Balance Rate (%)</label>
            <div class="relative">
              <input
                id="decline_balance_rate"
                v-model.number="formData.decline_balance_rate"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 20"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          @click="onCancel"
          class="btn-secondary"
          :disabled="isSaving"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary flex items-center gap-2"
          :disabled="!canSubmit || isSaving"
        >
          <svg v-if="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="isSaving">
            {{ mode === 'create' ? 'Creating...' : 'Saving...' }}
          </span>
          <span v-else>
            {{ mode === 'create' ? 'Create Category' : 'Save Changes' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
