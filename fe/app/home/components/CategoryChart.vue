<script setup lang="ts">
import { Chart, type ChartConfiguration } from 'chart.js/auto'
import type { CategoryData } from '../types/dashboard.types'

interface Props {
  categories: CategoryData[]
  loading?: boolean
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const chartColors = [
  'rgba(99, 102, 241, 0.8)',   // primary
  'rgba(16, 185, 129, 0.8)',   // success
  'rgba(245, 158, 11, 0.8)',   // warning
  'rgba(239, 68, 68, 0.8)',    // danger
  'rgba(107, 114, 128, 0.8)',  // secondary
  'rgba(139, 92, 246, 0.8)',   // purple
  'rgba(236, 72, 153, 0.8)',   // pink
  'rgba(59, 130, 246, 0.8)',   // blue
]

const createChart = () => {
  if (!canvasRef.value || !props.categories?.length) return

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const config: ChartConfiguration = {
    type: 'pie',
    data: {
      labels: props.categories.map(c => c.category),
      datasets: [{
        data: props.categories.map(c => c.count),
        backgroundColor: chartColors.slice(0, props.categories.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  }

  chartInstance = new Chart(ctx, config)
}

watch(() => props.categories, () => {
  if (!props.loading) {
    nextTick(() => createChart())
  }
}, { deep: true })

onMounted(() => {
  if (!props.loading && props.categories?.length) {
    createChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        Assets by Category
      </h2>
    </div>
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-48 h-48 rounded-full bg-secondary-100 animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!categories?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No category data available</p>
      </div>

      <!-- Pie Chart -->
      <div v-else class="flex justify-center">
        <canvas ref="canvasRef" class="max-w-md"></canvas>
      </div>
    </div>
  </div>
</template>
