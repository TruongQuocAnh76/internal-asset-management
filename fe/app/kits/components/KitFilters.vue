<script setup lang="ts">
import type { GetKitsParams } from '../types/kit.types'

interface Props {
  modelValue: GetKitsParams
  categories?: { name: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: GetKitsParams]
  'apply': []
}>()

const localFilters = ref<GetKitsParams>({ ...props.modelValue })
const debounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const updateFilter = (key: keyof GetKitsParams, value: any, immediate = true) => {
  localFilters.value = { ...localFilters.value, [key]: value }

  if (immediate) {
    emit('update:modelValue', localFilters.value)
    emit('apply')
  } else {
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    debounceTimeout.value = setTimeout(() => {
      emit('update:modelValue', localFilters.value)
      emit('apply')
    }, 500)
  }
}

watch(() => props.modelValue, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })

onUnmounted(() => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <div>
      <label class="block text-sm font-medium text-secondary-700 mb-2">Search</label>
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-secondary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          :value="localFilters.search"
          @input="updateFilter('search', ($event.target as HTMLInputElement).value, false)"
          placeholder="Search by kit name..."
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 placeholder-secondary-400"
        />
      </div>
    </div>
  </div>
</template>
