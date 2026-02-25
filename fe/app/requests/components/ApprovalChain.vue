<script setup lang="ts">
import type { ApprovalStep, BorrowStatus } from '../types/request.types'

interface Props {
  approvalChain: ApprovalStep[]
  currentStatus: BorrowStatus
}

const props = defineProps<Props>()

type StepStatus = 'PENDING' | 'CURRENT' | 'COMPLETED' | 'REJECTED'

interface StepConfig {
  bgClass: string
  textClass: string
  borderClass: string
  icon: string
}

const getStepStatusConfig = (step: ApprovalStep): StepConfig => {
  const configs: Record<StepStatus, StepConfig> = {
    PENDING: {
      bgClass: 'bg-secondary-100',
      textClass: 'text-secondary-400',
      borderClass: 'border-secondary-300',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    CURRENT: {
      bgClass: 'bg-warning-100',
      textClass: 'text-warning-700',
      borderClass: 'border-warning-400',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    COMPLETED: {
      bgClass: 'bg-success-100',
      textClass: 'text-success-700',
      borderClass: 'border-success-400',
      icon: 'M5 13l4 4L19 7'
    },
    REJECTED: {
      bgClass: 'bg-danger-100',
      textClass: 'text-danger-700',
      borderClass: 'border-danger-400',
      icon: 'M6 18L18 6M6 6l12 12'
    }
  }
  return configs[step.status as StepStatus] || configs.PENDING
}
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      Approval Flow
    </h3>

    <div class="relative">
      <!-- Progress line -->
      <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-secondary-200"></div>

      <ul class="space-y-4">
        <li
          v-for="(step, index) in approvalChain"
          :key="step.step_number"
          class="relative flex items-start gap-4"
        >
          <!-- Step indicator -->
          <div
            :class="[
              'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0',
              step.status === 'CURRENT' ? 'ring-2 ring-warning-200' : '',
              getStepStatusConfig(step).bgClass,
              getStepStatusConfig(step).borderClass
            ]"
          >
            <svg
              :class="['w-5 h-5', getStepStatusConfig(step).textClass]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getStepStatusConfig(step).icon"
              />
            </svg>
          </div>

          <!-- Step content -->
          <div class="flex-1 min-w-0 pb-4" :class="{ 'pb-0': index === approvalChain.length - 1 }">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-secondary-900">
                {{ step.label }}
              </span>
              <span
                v-if="step.status === 'CURRENT'"
                class="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded-full"
              >
                In Progress
              </span>
              <span
                v-else-if="step.status === 'COMPLETED'"
                class="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full"
              >
                Done
              </span>
              <span
                v-else-if="step.status === 'REJECTED'"
                class="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded-full"
              >
                {{ currentStatus === 'CANCELED' ? 'Canceled' : 'Rejected' }}
              </span>
            </div>

            <div class="text-sm text-secondary-500 mt-1">
              {{ step.role === 'EMPLOYEE' ? 'User' : step.role === 'TEAM_LEAD' ? 'Team Lead' : 'Admin' }} · {{ step.action }}
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
