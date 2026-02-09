<script setup lang="ts">
interface Tab {
  id: string
  label: string
  icon?: string
  count?: number
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="w-full">
    <!-- Mobile: Scrollable tabs -->
    <div class="sm:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide">
      <div class="flex space-x-1 border-b border-secondary-200 min-w-max">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeTab === tab.id 
            ? 'text-primary-600' 
            : 'text-secondary-500 hover:text-secondary-700'"
        >
          <span class="flex items-center gap-2">
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.count !== undefined"
              class="px-1.5 py-0.5 text-xs rounded-full"
              :class="activeTab === tab.id 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-secondary-100 text-secondary-600'"
            >
              {{ tab.count }}
            </span>
          </span>
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
          />
        </button>
      </div>
    </div>

    <!-- Desktop: Standard tabs -->
    <div class="hidden sm:block border-b border-secondary-200">
      <div class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="relative py-4 text-sm font-medium transition-colors"
          :class="activeTab === tab.id 
            ? 'text-primary-600' 
            : 'text-secondary-500 hover:text-secondary-700'"
        >
          <span class="flex items-center gap-2">
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.count !== undefined"
              class="px-2 py-0.5 text-xs rounded-full"
              :class="activeTab === tab.id 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-secondary-100 text-secondary-600'"
            >
              {{ tab.count }}
            </span>
          </span>
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
