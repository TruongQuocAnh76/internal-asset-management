<script setup lang="ts">
interface Props {
  modelValue: {
    start: string
    end: string
  }
  label?: string
  required?: boolean
  disabled?: boolean
  minDate?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Date Range',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: { start: string; end: string }]
  'change': [value: { start: string; end: string }]
}>()

const startDate = computed({
  get: () => props.modelValue.start,
  set: (value) => {
    const newValue = { ...props.modelValue, start: value }
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
})

const endDate = computed({
  get: () => props.modelValue.end,
  set: (value) => {
    const newValue = { ...props.modelValue, end: value }
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
})

// Calculate min date for end date picker
const minEndDate = computed(() => {
  return startDate.value || props.minDate || ''
})

// Format date for display
const formatDateLabel = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Calculate duration
const duration = computed(() => {
  if (!startDate.value || !endDate.value) return null
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
})
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="label">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Start Date -->
      <div class="flex-1">
        <label for="start-date" class="sr-only">Start Date</label>
        <div class="relative">
          <input
            id="start-date"
            v-model="startDate"
            type="date"
            :min="minDate"
            :disabled="disabled"
            :required="required"
            class="w-full pl-10"
            :class="{ '!border-danger-500': error }"
            aria-describedby="date-range-error"
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <span class="text-xs text-secondary-500 mt-1">Start date</span>
      </div>

      <!-- Arrow indicator -->
      <div class="hidden sm:flex items-center justify-center pt-1">
        <svg
          class="w-5 h-5 text-secondary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </div>

      <!-- End Date -->
      <div class="flex-1">
        <label for="end-date" class="sr-only">End Date</label>
        <div class="relative">
          <input
            id="end-date"
            v-model="endDate"
            type="date"
            :min="minEndDate"
            :disabled="disabled"
            :required="required"
            class="w-full pl-10"
            :class="{ '!border-danger-500': error }"
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <span class="text-xs text-secondary-500 mt-1">End date</span>
      </div>
    </div>

    <!-- Duration indicator -->
    <div v-if="duration" class="flex items-center gap-2 text-sm text-secondary-600">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Duration: {{ duration }}</span>
    </div>

    <!-- Error message -->
    <p v-if="error" id="date-range-error" class="error-message">
      {{ error }}
    </p>
  </div>
</template>
