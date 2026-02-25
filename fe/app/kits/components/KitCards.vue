<script setup lang="ts">
import type { Kit } from '../types/kit.types'

interface Props {
  kits: Kit[]
  selectedIds: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  select: [id: string, selected: boolean]
  selectAll: [selected: boolean]
  view: [kit: Kit]
}>()

const allSelected = computed(() => {
  return props.kits.length > 0 && props.kits.every(kit => props.selectedIds.includes(kit.id))
})

const getStatusClass = (status: string) => {
  const classes = {
    'available': 'bg-success-100 text-success-700',
    'in-use': 'bg-primary-100 text-primary-700',
    'maintenance': 'bg-warning-100 text-warning-700',
    'archived': 'bg-secondary-100 text-secondary-700'
  }
  return classes[status as keyof typeof classes] || 'bg-secondary-100 text-secondary-700'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-3">
    <!-- Select All Bar -->
    <div v-if="kits.length > 0" class="flex items-center gap-3 px-1 py-2">
      <label class="flex items-center gap-2 text-sm text-secondary-600 cursor-pointer">
        <input
          type="checkbox"
          :checked="allSelected"
          :indeterminate="selectedIds.length > 0 && !allSelected"
          @change="emit('selectAll', ($event.target as HTMLInputElement).checked)"
          class="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
        />
        <span>Select all</span>
      </label>
      <span v-if="selectedIds.length > 0" class="text-sm text-primary-600">
        {{ selectedIds.length }} selected
      </span>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="kit in kits"
        :key="kit.id"
        class="bg-white rounded-lg border transition-all"
        :class="selectedIds.includes(kit.id) 
          ? 'border-primary-500 ring-1 ring-primary-500' 
          : 'border-secondary-200 hover:border-secondary-300'"
      >
        <!-- Card Header -->
        <div class="p-4 border-b border-secondary-100">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <input
                type="checkbox"
                :checked="selectedIds.includes(kit.id)"
                @change="emit('select', kit.id, ($event.target as HTMLInputElement).checked)"
                class="mt-1 w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <div class="min-w-0">
                <button
                  @click="emit('view', kit)"
                  class="text-left font-medium text-secondary-900 hover:text-primary-600 truncate block"
                >
                  {{ kit.template.name }}
                </button>
              </div>
            </div>
            <span
              class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full capitalize"
              :class="getStatusClass(kit.status)"
            >
              {{ kit.status.replace('-', ' ') }}
            </span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 space-y-3">
          <!-- Components & Inventory -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-secondary-500">
              {{ kit.template.template_items?.length || 0 }} component{{ kit.template.template_items?.length !== 1 ? 's' : '' }}
            </span>
            <span class="font-medium text-secondary-600">
              {{ kit.asset_items?.length || 0 }} item{{ kit.asset_items?.length !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-4 py-3 bg-secondary-50 rounded-b-lg flex items-center justify-between">
          <span class="text-xs text-secondary-500">
            Created {{ formatDate(kit.created_at) }}
          </span>
          <button
            @click="emit('view', kit)"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="kits.length === 0 && !loading" class="py-12">
      <slot name="empty">
        <div class="text-center text-secondary-500">
          No kits found
        </div>
      </slot>
    </div>
  </div>
</template>
