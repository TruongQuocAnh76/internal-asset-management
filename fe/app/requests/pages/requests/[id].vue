<script setup lang="ts">
import { useRequestDetail } from '../../composables/useRequestDetail'
import { useRequestHelpers } from '../../composables/useRequestHelpers'
import StatusBadge from '../../components/StatusBadge.vue'
import PriorityBadge from '../../components/PriorityBadge.vue'
import ApprovalChain from '../../components/ApprovalChain.vue'
import ApprovalModal from '../../components/ApprovalModal.vue'

const route = useRoute()
const requestId = route.params.id as string

const {
  request,
  isLoading,
  isProcessing,
  error,
  showApprovalModal,
  approvalAction,
  permissions,
  requestTitle,
  approvalChain,
  handleCancel,
  openApprovalModal,
  closeApprovalModal,
  handleApprove,
  handleReject,
  handleProvide,
  handleReturn
} = useRequestDetail(requestId)

const { formatDateTime } = useRequestHelpers()
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading state -->
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

      <!-- Error state -->
      <div v-else-if="error" class="card text-center py-12">
        <svg
          class="w-16 h-16 mx-auto text-danger-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900 mt-4">Failed to load request</h2>
        <p class="text-secondary-500 mt-2">{{ error }}</p>
        <NuxtLink to="/requests" class="btn-primary mt-4 inline-block">
          Back to Requests
        </NuxtLink>
      </div>

      <!-- Request detail -->
      <template v-else-if="request">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <NuxtLink
              to="/requests"
              class="p-2 rounded-lg hover:bg-secondary-200 transition-colors"
              aria-label="Back to requests"
            >
              <svg
                class="w-5 h-5 text-secondary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </NuxtLink>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-bold text-secondary-900">{{ requestTitle }}</h1>
                <StatusBadge :status="request.status" />
                <PriorityBadge :priority="request.priority" />
              </div>
              <p class="text-secondary-500 mt-1">
                Request #{{ request.id.slice(0, 8).toUpperCase() }} · Created {{ formatDateTime(request.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Request details card -->
            <div class="card">
              <h2 class="text-lg font-semibold text-secondary-900 mb-4">Request Details</h2>

              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Requester -->
                <div v-if="request.user">
                  <dt class="text-sm font-medium text-secondary-500">Requester</dt>
                  <dd class="mt-1">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-primary-700 font-medium">
                          {{ request.user.first_name[0] }}{{ request.user.last_name[0] }}
                        </span>
                      </div>
                      <div>
                        <p class="font-medium text-secondary-900">
                          {{ request.user.first_name }} {{ request.user.last_name }}
                        </p>
                        <p class="text-sm text-secondary-500">{{ request.user.department }}</p>
                      </div>
                    </div>
                  </dd>
                </div>

                <!-- Asset -->
                <div v-if="request.asset">
                  <dt class="text-sm font-medium text-secondary-500">Requested Asset</dt>
                  <dd class="mt-1">
                    <p class="font-medium text-secondary-900">{{ request.asset.name }}</p>
                    <p class="text-sm text-secondary-500">{{ request.asset.code }}</p>
                  </dd>
                </div>

                <!-- Requested at -->
                <div>
                  <dt class="text-sm font-medium text-secondary-500">Requested At</dt>
                  <dd class="mt-1 text-secondary-900">
                    {{ formatDateTime(request.requested_at) }}
                  </dd>
                </div>

                <!-- Created at -->
                <div>
                  <dt class="text-sm font-medium text-secondary-500">Created</dt>
                  <dd class="mt-1 text-secondary-900">
                    {{ formatDateTime(request.created_at) }}
                  </dd>
                </div>
              </dl>

              <!-- Reason -->
              <div v-if="request.reason" class="mt-6 pt-6 border-t border-secondary-200">
                <dt class="text-sm font-medium text-secondary-500 mb-2">Reason / Justification</dt>
                <dd class="text-secondary-700 whitespace-pre-wrap bg-secondary-50 rounded-lg p-4">
                  {{ request.reason }}
                </dd>
              </div>
            </div>

            <!-- Approval chain (hardcoded based on status) -->
            <ApprovalChain
              :approval-chain="approvalChain"
              :current-status="request.status"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Actions card -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Actions</h3>
              
              <div class="space-y-3">
                <!-- Cancel (user can cancel PENDING or APPROVED) -->
                <button
                  v-if="permissions.canCancel"
                  type="button"
                  class="w-full btn-secondary"
                  :disabled="isProcessing"
                  @click="handleCancel"
                >
                  Cancel Request
                </button>

                <!-- Approve PENDING (requires 'request:approve' permission) -->
                <button
                  v-if="permissions.canApprove"
                  type="button"
                  class="w-full btn-primary"
                  :disabled="isProcessing"
                  @click="handleApprove"
                >
                  Approve Request
                </button>

                <!-- Reject (requires 'request:approve' or 'request:provided' permission) -->
                <button
                  v-if="permissions.canReject"
                  type="button"
                  class="w-full bg-danger-600 hover:bg-danger-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  :disabled="isProcessing"
                  @click="handleReject"
                >
                  Reject Request
                </button>

                <!-- Provide APPROVED asset (requires 'request:provided' permission) -->
                <button
                  v-if="permissions.canProvide"
                  type="button"
                  class="w-full bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  :disabled="isProcessing"
                  @click="handleProvide"
                >
                  Provide Asset
                </button>

                <!-- User: Return PROVIDED/OVERDUE -->
                <button
                  v-if="permissions.canReturn"
                  type="button"
                  class="w-full btn-primary"
                  :disabled="isProcessing"
                  @click="handleReturn"
                >
                  Return Asset
                </button>

                <p v-if="!permissions.canCancel && !permissions.canApprove && !permissions.canReject && !permissions.canProvide && !permissions.canReturn" class="text-sm text-secondary-500 text-center">
                  No actions available
                </p>
              </div>
            </div>

            <!-- Status info card -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Status Information</h3>

              <div class="space-y-4">
                <div v-if="request.approved_at">
                  <p class="text-sm text-secondary-500">Approved</p>
                  <p class="font-medium text-secondary-900">{{ formatDateTime(request.approved_at) }}</p>
                </div>

                <div v-if="request.provided_at">
                  <p class="text-sm text-secondary-500">Provided</p>
                  <p class="font-medium text-secondary-900">{{ formatDateTime(request.provided_at) }}</p>
                </div>

                <div v-if="request.returned_at">
                  <p class="text-sm text-secondary-500">Returned</p>
                  <p class="font-medium text-secondary-900">{{ formatDateTime(request.returned_at) }}</p>
                </div>

                <div v-if="request.status === 'PENDING'">
                  <p class="text-sm text-secondary-500">Waiting for</p>
                  <p class="font-medium text-secondary-900">Approval</p>
                </div>

                <div v-if="request.status === 'APPROVED'">
                  <p class="text-sm text-secondary-500">Waiting for</p>
                  <p class="font-medium text-secondary-900">Asset to be Provided</p>
                </div>

                <div v-if="request.status === 'PROVIDED'">
                  <p class="text-sm text-secondary-500">Status</p>
                  <p class="font-medium text-success-600">Asset in use</p>
                </div>

                <div v-if="request.status === 'OVERDUE'">
                  <p class="text-sm text-secondary-500">Status</p>
                  <p class="font-medium text-danger-600">Overdue - Please return asset</p>
                </div>
              </div>
            </div>

            <!-- Quick links -->
            <div class="card">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4">Quick Links</h3>

              <div class="space-y-2">
                <NuxtLink
                  v-if="request.asset"
                  :to="`/assets/${request.asset.id}`"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 text-primary-600 hover:text-primary-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  View Asset
                </NuxtLink>

                <NuxtLink
                  to="/requests"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 text-secondary-600 hover:text-secondary-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  All My Requests
                </NuxtLink>

                <NuxtLink
                  to="/requests/new"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-50 text-secondary-600 hover:text-secondary-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Request
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Approval Modal -->
    <ApprovalModal
      :is-open="showApprovalModal"
      :action="approvalAction"
      :is-processing="isProcessing"
      @close="closeApprovalModal"
      @confirm="approvalAction === 'APPROVE' ? handleApprove() : handleReject()"
    />
  </div>
</template>
