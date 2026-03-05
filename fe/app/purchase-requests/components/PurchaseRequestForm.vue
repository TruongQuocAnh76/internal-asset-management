<script setup lang="ts">
import type { PurchaseRequestFormData } from '../types/purchase-request.types'
import { usePurchaseRequestForm } from '../composables/usePurchaseRequestForm'
import { useCategories } from '../../assets/composables/useCategories'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const {
  formData,
  isSaving,
  errors,
  successMessage,
  canSubmit,
  validateField,
  handleSubmit,
  resetForm,
} = usePurchaseRequestForm()

// Load categories
const categories = ref<{ id: string; name: string }[]>([])
const { getAllCategories } = useCategories()

onMounted(async () => {
  try {
    const { data } = await getAllCategories()
    if (data.value) {
      categories.value = (data.value as any[]).map((c: any) => ({ id: c.id, name: c.name }))
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
})

// Spec rows for key-value editor
const specRows = ref<{ key: string; value: string }[]>([])

const addSpecRow = () => {
  specRows.value.push({ key: '', value: '' })
}

const removeSpecRow = (index: number) => {
  specRows.value.splice(index, 1)
  syncSpecs()
}

const syncSpecs = () => {
  const specs: Record<string, string> = {}
  for (const row of specRows.value) {
    if (row.key.trim()) {
      specs[row.key.trim()] = row.value
    }
  }
  formData.value.specs = specs
}

const onSubmit = async () => {
  syncSpecs()
  const result = await handleSubmit()
  if (result) {
    emit('success')
  }
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- General error -->
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

      <!-- Request Details -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Request Details
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Category -->
          <div class="input-group">
            <label for="category_id" class="label">
              Category <span class="text-danger-500">*</span>
            </label>
            <select
              id="category_id"
              v-model="formData.category_id"
              @blur="validateField('category_id')"
              :class="{ '!border-danger-500': errors.category_id }"
              class="w-full"
            >
              <option value="" disabled>Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <p v-if="errors.category_id" class="error-message">{{ errors.category_id }}</p>
          </div>

          <!-- Quantity -->
          <div class="input-group">
            <label for="quantity" class="label">
              Quantity <span class="text-danger-500">*</span>
            </label>
            <input
              id="quantity"
              v-model.number="formData.quantity"
              type="number"
              min="1"
              placeholder="1"
              @blur="validateField('quantity')"
              :class="{ '!border-danger-500': errors.quantity }"
            />
            <p v-if="errors.quantity" class="error-message">{{ errors.quantity }}</p>
          </div>

          <!-- Estimated Cost -->
          <div class="input-group">
            <label for="estimatedCost" class="label">
              Estimated Cost <span class="text-danger-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>
              <input
                id="estimatedCost"
                v-model.number="formData.estimatedCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="!pl-8"
                @blur="validateField('estimatedCost')"
                :class="{ '!border-danger-500': errors.estimatedCost }"
              />
            </div>
            <p v-if="errors.estimatedCost" class="error-message">{{ errors.estimatedCost }}</p>
          </div>
        </div>

        <!-- Reason -->
        <div class="input-group mt-6">
          <label for="reason" class="label">
            Reason <span class="text-danger-500">*</span>
          </label>
          <textarea
            id="reason"
            v-model="formData.reason"
            rows="4"
            placeholder="Explain why this purchase is needed..."
            @blur="validateField('reason')"
            :class="{ '!border-danger-500': errors.reason }"
          ></textarea>
          <p v-if="errors.reason" class="error-message">{{ errors.reason }}</p>
          <p class="text-xs text-secondary-400 mt-1">Minimum 10 characters</p>
        </div>
      </div>

      <!-- Specifications -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-secondary-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Specifications
          </h2>
          <button
            type="button"
            @click="addSpecRow"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Spec
          </button>
        </div>

        <div v-if="specRows.length === 0" class="text-center py-6 text-secondary-400">
          <p class="text-sm">No specifications added yet</p>
          <p class="text-xs mt-1">Click "Add Spec" to describe requirements (e.g. RAM: 16GB)</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(row, index) in specRows"
            :key="index"
            class="flex items-center gap-3"
          >
            <input
              v-model="row.key"
              type="text"
              placeholder="Key (e.g. RAM)"
              class="flex-1"
              @input="syncSpecs"
            />
            <input
              v-model="row.value"
              type="text"
              placeholder="Value (e.g. 16GB)"
              class="flex-1"
              @input="syncSpecs"
            />
            <button
              type="button"
              @click="removeSpecRow(index)"
              class="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
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
          <span v-if="isSaving">Submitting...</span>
          <span v-else>Submit Request</span>
        </button>
      </div>
    </form>
  </div>
</template>
