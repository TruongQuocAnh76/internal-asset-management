<script setup lang="ts">
import type { PurchaseRequest } from '../../types/purchase-request.types'
import { usePurchaseRequests } from '../../composables/usePurchaseRequests'
import PurchaseRequestStatusBadge from '../../components/PurchaseRequestStatusBadge.vue'
import PurchaseRequestReceiveForm from '../../components/PurchaseRequestReceiveForm.vue'
import { useAuth } from '../../../auth/composables/useAuth'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const requestId = route.params.id as string

const { getPurchaseRequestById, tlApprove, bodApprove, reject } = usePurchaseRequests()
const { user } = useAuth()

const purchaseRequest = ref<PurchaseRequest | null>(null)
const isLoading = ref(true)
const isProcessing = ref(false)
const error = ref('')
const showReceiveForm = ref(false)

// Permissions
const canTlApprove = computed(() => {
  console.log(user.value.permissions); 
  return (
    purchaseRequest.value?.status === 'SUBMITTED' &&
    user.value?.permissions?.includes('purchase-requests:tl-approve')
  )
})

const canBodApprove = computed(() => {
  return (
    purchaseRequest.value?.status === 'TL_APPROVED' &&
    user.value?.permissions?.includes('purchase-requests:bod-approve')
  )
})

const canReject = computed(() => {
  const status = purchaseRequest.value?.status
  return (
    (status === 'SUBMITTED' || status === 'TL_APPROVED') &&
    user.value?.permissions?.includes('purchase-requests:reject')
  )
})

const canReceive = computed(() => {
  return (
    purchaseRequest.value?.status === 'BOD_APPROVED' &&
    user.value?.permissions?.includes('purchase-requests:receive')
  )
})

const hasAnyAction = computed(() => {
  return canTlApprove.value || canBodApprove.value || canReject.value || canReceive.value
})

const fetchPurchaseRequest = async () => {
  isLoading.value = true
  error.value = ''
  try {
    purchaseRequest.value = await getPurchaseRequestById(requestId)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to load purchase request'
  } finally {
    isLoading.value = false
  }
}

const handleTlApprove = async () => {
  if (!purchaseRequest.value) return
  isProcessing.value = true
  try {
    await tlApprove(purchaseRequest.value.id)
    await fetchPurchaseRequest()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to approve'
  } finally {
    isProcessing.value = false
  }
}

const handleBodApprove = async () => {
  if (!purchaseRequest.value) return
  isProcessing.value = true
  try {
    await bodApprove(purchaseRequest.value.id)
    await fetchPurchaseRequest()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to approve'
  } finally {
    isProcessing.value = false
  }
}

const handleReject = async () => {
  if (!purchaseRequest.value) return
  isProcessing.value = true
  try {
    await reject(purchaseRequest.value.id)
    await fetchPurchaseRequest()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to reject'
  } finally {
    isProcessing.value = false
  }
}

const handleReceiveSuccess = async () => {
  showReceiveForm.value = false
  await fetchPurchaseRequest()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
  }).format(amount)
}

const statusSteps = computed(() => {
  if (!purchaseRequest.value) return []

  const steps = [
    { label: 'Submitted', status: 'SUBMITTED' },
    { label: 'TL Approved', status: 'TL_APPROVED' },
    { label: 'BOD Approved', status: 'BOD_APPROVED' },
    { label: 'Received', status: 'RECEIVED' },
  ]

  const statusOrder = ['SUBMITTED', 'TL_APPROVED', 'BOD_APPROVED', 'RECEIVED']
  const currentIndex = statusOrder.indexOf(purchaseRequest.value.status)
  const isRejected = purchaseRequest.value.status === 'REJECTED'

  return steps.map((step, index) => ({
    ...step,
    completed: !isRejected && index <= currentIndex,
    current: !isRejected && index === currentIndex,
    rejected: isRejected && index === currentIndex + 1,
  }))
})

onMounted(fetchPurchaseRequest)
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading -->
      <div v-if="isLoading" class="space-y-6">
        <div class="animate-pulse">
          <div class="h-8 bg-secondary-200 rounded w-1/3 mb-4"></div>
          <div class="h-4 bg-secondary-100 rounded w-1/4"></div>
        </div>
        <div class="card animate-pulse">
          <div class="space-y-4">
            <div class="h-6 bg-secondary-200 rounded w-1/4"></div>
            <div class="grid grid-cols-2 gap-4">
              <div class="h-20 bg-secondary-100 rounded"></div>
              <div class="h-20 bg-secondary-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error && !purchaseRequest" class="card text-center py-12">
        <svg class="w-16 h-16 mx-auto text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900 mt-4">Failed to load purchase request</h2>
        <p class="text-secondary-500 mt-2">{{ error }}</p>
        <NuxtLink to="/purchase-requests" class="btn-primary mt-4 inline-block">
          Back to Purchase Requests
        </NuxtLink>
      </div>

      <!-- Detail -->
      <template v-else-if="purchaseRequest">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <NuxtLink
              to="/purchase-requests"
              class="p-2 rounded-lg hover:bg-secondary-200 transition-colors"
              aria-label="Back to purchase requests"
            >
              <svg class="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-bold text-secondary-900">Purchase Request</h1>
                <PurchaseRequestStatusBadge :status="purchaseRequest.status" />
              </div>
              <p class="text-secondary-500 mt-1">
                #{{ purchaseRequest.id.slice(0, 8).toUpperCase() }} · Submitted {{ formatDate(purchaseRequest.requested_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Status progress -->
        <div class="card mb-6">
          <div class="flex items-center justify-between">
            <template v-for="(step, index) in statusSteps" :key="step.status">
              <div class="flex flex-col items-center text-center flex-1">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all',
                    step.completed
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : step.rejected
                        ? 'bg-danger-600 border-danger-600 text-white'
                        : 'bg-white border-secondary-300 text-secondary-400'
                  ]"
                >
                  <svg v-if="step.completed && !step.current" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else-if="step.rejected" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span
                  :class="[
                    'text-xs mt-2 font-medium',
                    step.completed ? 'text-primary-700' : step.rejected ? 'text-danger-600' : 'text-secondary-400'
                  ]"
                >
                  {{ step.label }}
                </span>
              </div>
              <div
                v-if="index < statusSteps.length - 1"
                :class="[
                  'flex-1 h-0.5 mx-2 mt-[-1.25rem]',
                  statusSteps[index + 1]?.completed ? 'bg-primary-600' : 'bg-secondary-200'
                ]"
              ></div>
            </template>
          </div>

          <!-- Rejected banner -->
          <div v-if="purchaseRequest.status === 'REJECTED'" class="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
            <p class="text-sm text-danger-700 font-medium">This purchase request has been rejected.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Request details -->
            <div class="card">
              <h2 class="text-lg font-semibold text-secondary-900 mb-4">Request Details</h2>

              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt class="text-sm font-medium text-secondary-500">Requester</dt>
                  <dd class="mt-1">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-primary-700 font-medium">
                          {{ purchaseRequest.user.first_name[0] }}{{ purchaseRequest.user.last_name[0] }}
                        </span>
                      </div>
                      <div>
                        <p class="font-medium text-secondary-900">
                          {{ purchaseRequest.user.first_name }} {{ purchaseRequest.user.last_name }}
                        </p>
                        <p class="text-sm text-secondary-500">{{ purchaseRequest.user.email }}</p>
                      </div>
                    </div>
                  </dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-secondary-500">Category</dt>
                  <dd class="mt-1">
                    <p class="font-medium text-secondary-900">{{ purchaseRequest.category.name }}</p>
                    <p class="text-sm text-secondary-500">{{ purchaseRequest.category.code }}</p>
                  </dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-secondary-500">Estimated Cost</dt>
                  <dd class="mt-1 text-secondary-900 font-medium">{{ formatCurrency(purchaseRequest.estimated_cost) }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-secondary-500">Quantity</dt>
                  <dd class="mt-1 text-secondary-900 font-medium">{{ purchaseRequest.quantity }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-secondary-500">Submitted At</dt>
                  <dd class="mt-1 text-secondary-900">{{ formatDate(purchaseRequest.requested_at) }}</dd>
                </div>
              </dl>

              <!-- Reason -->
              <div v-if="purchaseRequest.reason" class="mt-6 pt-6 border-t border-secondary-200">
                <dt class="text-sm font-medium text-secondary-500 mb-2">Reason / Justification</dt>
                <dd class="text-secondary-700 whitespace-pre-wrap bg-secondary-50 rounded-lg p-4">
                  {{ purchaseRequest.reason }}
                </dd>
              </div>

              <!-- Specs -->
              <div v-if="purchaseRequest.specs && Object.keys(purchaseRequest.specs).length > 0" class="mt-6 pt-6 border-t border-secondary-200">
                <dt class="text-sm font-medium text-secondary-500 mb-3">Specifications</dt>
                <dd>
                  <div class="bg-secondary-50 rounded-lg overflow-hidden">
                    <div
                      v-for="(value, key) in purchaseRequest.specs"
                      :key="key"
                      class="flex items-center px-4 py-3 border-b border-secondary-100 last:border-b-0"
                    >
                      <span class="text-sm font-medium text-secondary-600 w-1/3">{{ key }}</span>
                      <span class="text-sm text-secondary-900">{{ value }}</span>
                    </div>
                  </div>
                </dd>
              </div>
            </div>

            <!-- Receive form (shown when admin clicks "Receive") -->
            <div v-if="showReceiveForm && purchaseRequest" class="card">
              <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Receive & Create Asset
              </h2>
              <PurchaseRequestReceiveForm
                :purchase-request="purchaseRequest"
                @success="handleReceiveSuccess"
                @cancel="showReceiveForm = false"
              />
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Actions -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Actions</h3>

              <div class="space-y-3">
                <!-- TL Approve -->
                <button
                  v-if="canTlApprove"
                  type="button"
                  class="w-full btn-primary"
                  :disabled="isProcessing"
                  @click="handleTlApprove"
                >
                  <span v-if="isProcessing">Processing...</span>
                  <span v-else>TL Approve</span>
                </button>

                <!-- BOD Approve -->
                <button
                  v-if="canBodApprove"
                  type="button"
                  class="w-full btn-primary"
                  :disabled="isProcessing"
                  @click="handleBodApprove"
                >
                  <span v-if="isProcessing">Processing...</span>
                  <span v-else>BOD Approve</span>
                </button>

                <!-- Reject -->
                <button
                  v-if="canReject"
                  type="button"
                  class="w-full bg-danger-600 hover:bg-danger-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  :disabled="isProcessing"
                  @click="handleReject"
                >
                  <span v-if="isProcessing">Processing...</span>
                  <span v-else>Reject</span>
                </button>

                <!-- Receive -->
                <button
                  v-if="canReceive && !showReceiveForm"
                  type="button"
                  class="w-full bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  :disabled="isProcessing"
                  @click="showReceiveForm = true"
                >
                  Receive Asset
                </button>

                <button
                  v-if="showReceiveForm"
                  type="button"
                  class="w-full btn-secondary"
                  @click="showReceiveForm = false"
                >
                  Cancel Receive
                </button>

                <p
                  v-if="!hasAnyAction"
                  class="text-sm text-secondary-500 text-center"
                >
                  No actions available
                </p>
              </div>
            </div>

            <!-- Status Info -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Status Information</h3>

              <div class="space-y-4">
                <div>
                  <p class="text-sm text-secondary-500">Current Status</p>
                  <div class="mt-1">
                    <PurchaseRequestStatusBadge :status="purchaseRequest.status" />
                  </div>
                </div>

                <div v-if="purchaseRequest.status === 'SUBMITTED'">
                  <p class="text-sm text-secondary-500">Waiting for</p>
                  <p class="font-medium text-secondary-900">Team Lead Approval</p>
                </div>

                <div v-if="purchaseRequest.status === 'TL_APPROVED'">
                  <p class="text-sm text-secondary-500">Waiting for</p>
                  <p class="font-medium text-secondary-900">BOD Approval</p>
                </div>

                <div v-if="purchaseRequest.status === 'BOD_APPROVED'">
                  <p class="text-sm text-secondary-500">Waiting for</p>
                  <p class="font-medium text-success-600">Asset to be Received</p>
                </div>

                <div v-if="purchaseRequest.status === 'RECEIVED'">
                  <p class="text-sm text-secondary-500">Status</p>
                  <p class="font-medium text-success-600">Asset has been received and created</p>
                </div>

                <div v-if="purchaseRequest.status === 'REJECTED'">
                  <p class="text-sm text-secondary-500">Status</p>
                  <p class="font-medium text-danger-600">This request has been rejected</p>
                </div>
              </div>
            </div>

            <!-- Quick Links -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Quick Links</h3>

              <div class="space-y-2">
                <NuxtLink
                  to="/purchase-requests"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 text-secondary-600 hover:text-secondary-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  All Purchase Requests
                </NuxtLink>

                <NuxtLink
                  to="/purchase-requests/new"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 text-secondary-600 hover:text-secondary-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Purchase Request
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
