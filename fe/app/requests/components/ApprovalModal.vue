<script setup lang="ts">
interface Props {
  isOpen: boolean
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null
  isProcessing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'confirm': [comment: string]
}>()

const comment = ref('')

const actionConfig = computed(() => {
  const configs = {
    APPROVE: {
      title: 'Approve Request',
      description: 'Are you sure you want to approve this request?',
      buttonLabel: 'Approve',
      buttonClass: 'bg-success-600 hover:bg-success-700',
      commentRequired: false,
      icon: 'M5 13l4 4L19 7',
      iconClass: 'bg-success-100 text-success-600'
    },
    REJECT: {
      title: 'Reject Request',
      description: 'Please provide a reason for rejecting this request.',
      buttonLabel: 'Reject',
      buttonClass: 'bg-danger-600 hover:bg-danger-700',
      commentRequired: true,
      icon: 'M6 18L18 6M6 6l12 12',
      iconClass: 'bg-danger-100 text-danger-600'
    },
    REQUEST_CHANGES: {
      title: 'Request Changes',
      description: 'Please specify what changes are needed.',
      buttonLabel: 'Request Changes',
      buttonClass: 'bg-warning-500 hover:bg-warning-600',
      commentRequired: true,
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      iconClass: 'bg-warning-100 text-warning-600'
    }
  }

  return props.action ? configs[props.action] : configs.APPROVE
})

const canSubmit = computed(() => {
  if (!actionConfig.value.commentRequired) return true
  return comment.value.trim().length > 0
})

const handleClose = () => {
  if (!props.isProcessing) {
    comment.value = ''
    emit('close')
  }
}

const handleConfirm = () => {
  if (!canSubmit.value) return
  emit('confirm', comment.value)
}

// Reset comment when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    comment.value = ''
  }
})
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
        @click.self="handleClose"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="action ? `${action}-title` : undefined"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen && action"
            class="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <!-- Header -->
            <div class="flex items-center gap-3 mb-4">
              <div :class="['p-2 rounded-lg', actionConfig.iconClass]">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="actionConfig.icon"
                  />
                </svg>
              </div>
              <div>
                <h3 :id="`${action}-title`" class="text-lg font-semibold text-secondary-900">
                  {{ actionConfig.title }}
                </h3>
              </div>
            </div>

            <!-- Description -->
            <p class="text-secondary-600 mb-4">
              {{ actionConfig.description }}
            </p>

            <!-- Comment input -->
            <div class="mb-6">
              <label for="approval-comment" class="label">
                Comment
                <span v-if="actionConfig.commentRequired" class="text-danger-500">*</span>
                <span v-else class="text-secondary-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="approval-comment"
                v-model="comment"
                rows="3"
                :placeholder="actionConfig.commentRequired ? 'Please provide a reason...' : 'Add a comment...'"
                class="w-full"
                :required="actionConfig.commentRequired"
              ></textarea>
              <p
                v-if="actionConfig.commentRequired && !comment.trim()"
                class="text-sm text-danger-600 mt-1"
              >
                A comment is required for this action
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                class="btn-secondary"
                @click="handleClose"
                :disabled="isProcessing"
              >
                Cancel
              </button>
              <button
                type="button"
                :class="['btn text-white', actionConfig.buttonClass]"
                @click="handleConfirm"
                :disabled="!canSubmit || isProcessing"
              >
                <span v-if="isProcessing" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
                <span v-else>{{ actionConfig.buttonLabel }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
