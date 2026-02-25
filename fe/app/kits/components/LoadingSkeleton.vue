<script setup lang="ts">
interface Props {
  variant?: 'table' | 'card' | 'detail' | 'kpi'
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'table',
  rows: 5
})
</script>

<template>
  <!-- Table Skeleton -->
  <div v-if="variant === 'table'" class="animate-pulse">
    <!-- Table Header -->
    <div class="hidden sm:grid grid-cols-6 gap-4 px-4 py-3 bg-secondary-50 border-b border-secondary-200 rounded-t-lg">
      <div class="h-4 bg-secondary-200 rounded w-3/4" />
      <div class="h-4 bg-secondary-200 rounded w-1/2" />
      <div class="h-4 bg-secondary-200 rounded w-2/3" />
      <div class="h-4 bg-secondary-200 rounded w-1/2" />
      <div class="h-4 bg-secondary-200 rounded w-3/4" />
      <div class="h-4 bg-secondary-200 rounded w-1/4" />
    </div>
    
    <!-- Table Rows -->
    <div 
      v-for="i in rows" 
      :key="i"
      class="grid grid-cols-1 sm:grid-cols-6 gap-4 px-4 py-4 border-b border-secondary-100"
    >
      <!-- Mobile: Card style -->
      <div class="sm:hidden space-y-3">
        <div class="flex justify-between items-start">
          <div class="h-5 bg-secondary-200 rounded w-1/2" />
          <div class="h-5 bg-secondary-200 rounded w-16" />
        </div>
        <div class="h-4 bg-secondary-100 rounded w-3/4" />
        <div class="flex gap-2">
          <div class="h-6 bg-secondary-100 rounded-full w-16" />
          <div class="h-6 bg-secondary-100 rounded-full w-20" />
        </div>
      </div>
      
      <!-- Desktop: Row style -->
      <div class="hidden sm:block h-4 bg-secondary-200 rounded w-3/4" />
      <div class="hidden sm:block h-4 bg-secondary-100 rounded w-1/2" />
      <div class="hidden sm:block h-4 bg-secondary-100 rounded w-2/3" />
      <div class="hidden sm:block h-6 bg-secondary-100 rounded-full w-16" />
      <div class="hidden sm:block h-4 bg-secondary-100 rounded w-3/4" />
      <div class="hidden sm:flex gap-2 justify-end">
        <div class="h-8 w-8 bg-secondary-100 rounded" />
        <div class="h-8 w-8 bg-secondary-100 rounded" />
      </div>
    </div>
  </div>

  <!-- Card Skeleton -->
  <div v-else-if="variant === 'card'" class="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div 
      v-for="i in rows" 
      :key="i"
      class="bg-white rounded-lg border border-secondary-200 p-4 space-y-3"
    >
      <div class="flex justify-between items-start">
        <div class="h-5 bg-secondary-200 rounded w-1/2" />
        <div class="h-5 bg-secondary-100 rounded-full w-16" />
      </div>
      <div class="h-4 bg-secondary-100 rounded w-3/4" />
      <div class="h-4 bg-secondary-100 rounded w-1/2" />
      <div class="pt-3 border-t border-secondary-100 flex justify-between items-center">
        <div class="flex gap-2">
          <div class="h-6 bg-secondary-100 rounded-full w-12" />
          <div class="h-6 bg-secondary-100 rounded-full w-16" />
        </div>
        <div class="h-8 w-8 bg-secondary-100 rounded" />
      </div>
    </div>
  </div>

  <!-- Detail Skeleton -->
  <div v-else-if="variant === 'detail'" class="animate-pulse space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-2">
        <div class="h-8 bg-secondary-200 rounded w-48" />
        <div class="h-4 bg-secondary-100 rounded w-32" />
      </div>
      <div class="flex gap-2">
        <div class="h-10 bg-secondary-100 rounded w-24" />
        <div class="h-10 bg-secondary-200 rounded w-28" />
      </div>
    </div>
    
    <!-- Info Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-lg border border-secondary-200 p-4">
        <div class="h-4 bg-secondary-100 rounded w-1/2 mb-2" />
        <div class="h-6 bg-secondary-200 rounded w-3/4" />
      </div>
    </div>
    
    <!-- Content -->
    <div class="bg-white rounded-lg border border-secondary-200 p-4 space-y-4">
      <div class="h-5 bg-secondary-200 rounded w-32" />
      <div v-for="i in 3" :key="i" class="flex items-center gap-4 py-3 border-b border-secondary-100 last:border-0">
        <div class="h-12 w-12 bg-secondary-100 rounded" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-secondary-200 rounded w-1/3" />
          <div class="h-3 bg-secondary-100 rounded w-1/2" />
        </div>
        <div class="h-8 w-8 bg-secondary-100 rounded" />
      </div>
    </div>
  </div>

  <!-- KPI Skeleton -->
  <div v-else-if="variant === 'kpi'" class="animate-pulse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    <div 
      v-for="i in 4" 
      :key="i"
      class="bg-white rounded-lg border border-secondary-200 p-4 space-y-2"
    >
      <div class="h-4 bg-secondary-100 rounded w-2/3" />
      <div class="h-8 bg-secondary-200 rounded w-1/2" />
      <div class="h-3 bg-secondary-100 rounded w-3/4" />
    </div>
  </div>
</template>
