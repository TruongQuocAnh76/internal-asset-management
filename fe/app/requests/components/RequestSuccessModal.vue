<script setup lang="ts">
interface Props {
  isOpen: boolean
  requestId: string
}

defineProps<Props>()

const emit = defineEmits<{
  'close': []
}>()

const router = useRouter()

const viewRequest = () => {
  emit('close')
}

const createAnother = () => {
  router.push('/requests/new')
  location.reload() // Reset form state
}

const goToList = () => {
  router.push('/requests')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <!-- Success Icon -->
            <div class="flex justify-center mb-4">
              <div class="relative">
                <div class="p-3 bg-success-100 rounded-full">
                  <svg
                    class="w-10 h-10 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <!-- Animated ring -->
                <div class="absolute inset-0 animate-ping opacity-25">
                  <div class="w-full h-full bg-success-400 rounded-full"></div>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="text-center mb-6">
              <h3 id="success-title" class="text-xl font-semibold text-secondary-900">
                Request Submitted!
              </h3>
              <p class="text-secondary-600 mt-2">
                Your borrow request has been submitted successfully.
              </p>
              
              <!-- Request ID -->
              <div class="mt-4 p-3 bg-secondary-50 rounded-lg">
                <p class="text-sm text-secondary-500">Request ID</p>
                <p class="font-mono font-semibold text-secondary-900">
                  {{ requestId.slice(0, 8).toUpperCase() }}
                </p>
              </div>

              <!-- Next steps -->
              <div class="mt-4 text-left bg-primary-50 rounded-lg p-4">
                <p class="text-sm font-medium text-primary-800 mb-2">What's next?</p>
                <ul class="text-sm text-primary-700 space-y-1">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Your Team Lead will review the request
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    You'll be notified when status changes
                  </li>
                </ul>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2">
              <button
                type="button"
                class="btn-primary w-full"
                @click="viewRequest"
              >
                View Request
              </button>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn-secondary flex-1"
                  @click="goToList"
                >
                  My Requests
                </button>
                <button
                  type="button"
                  class="btn-outline flex-1"
                  @click="createAnother"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
