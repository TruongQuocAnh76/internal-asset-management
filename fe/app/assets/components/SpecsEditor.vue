<script setup lang="ts">
interface Props {
  modelValue: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [specs: Record<string, string>]
}>()

// Convert object to array for editing
const specRows = ref<{ key: string; value: string }[]>([])

// Initialize rows from modelValue
const initRows = () => {
  const entries = Object.entries(props.modelValue)
  if (entries.length > 0) {
    specRows.value = entries.map(([key, value]) => ({ key, value }))
  } else {
    specRows.value = []
  }
}

// Watch for external changes
watch(() => props.modelValue, () => {
  initRows()
}, { immediate: true, deep: true })

// Convert array back to object and emit
const emitUpdate = () => {
  const specs: Record<string, string> = {}
  for (const row of specRows.value) {
    if (row.key.trim()) {
      specs[row.key.trim()] = row.value
    }
  }
  emit('update:modelValue', specs)
}

const addRow = () => {
  specRows.value.push({ key: '', value: '' })
}

const removeRow = (index: number) => {
  specRows.value.splice(index, 1)
  emitUpdate()
}

const updateRow = (index: number, field: 'key' | 'value', value: string) => {
  specRows.value[index][field] = value
  emitUpdate()
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="label mb-0">Specifications</label>
      <button
        type="button"
        @click="addRow"
        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Row
      </button>
    </div>

    <div v-if="specRows.length === 0" class="text-sm text-secondary-500 bg-secondary-50 rounded-lg p-4 text-center">
      No specifications added. Click "Add Row" to add key-value pairs.
    </div>

    <div class="space-y-2">
      <div
        v-for="(row, index) in specRows"
        :key="index"
        class="flex items-center gap-3 bg-secondary-50 rounded-lg p-3"
      >
        <div class="flex-1">
          <input
            type="text"
            :value="row.key"
            @input="updateRow(index, 'key', ($event.target as HTMLInputElement).value)"
            placeholder="Key (e.g., RAM, CPU)"
            class="!bg-white !py-2 text-sm"
          />
        </div>
        <div class="flex-1">
          <input
            type="text"
            :value="row.value"
            @input="updateRow(index, 'value', ($event.target as HTMLInputElement).value)"
            placeholder="Value (e.g., 16GB, Intel i7)"
            class="!bg-white !py-2 text-sm"
          />
        </div>
        <button
          type="button"
          @click="removeRow(index)"
          class="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
          title="Remove row"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
