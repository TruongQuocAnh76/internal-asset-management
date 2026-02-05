<script setup lang="ts">
interface Props {
  modelValue: string
  isSubmitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const comment = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSubmit = () => {
  if (comment.value.trim()) {
    emit('submit')
  }
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
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Add Comment
    </h3>

    <form @submit.prevent="handleSubmit">
      <div class="space-y-3">
        <textarea
          v-model="comment"
          rows="3"
          placeholder="Add a comment to this request..."
          class="w-full"
          :disabled="isSubmitting"
        ></textarea>

        <div class="flex justify-end">
          <button
            type="submit"
            class="btn-primary"
            :disabled="!comment.trim() || isSubmitting"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
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
              Posting...
            </span>
            <span v-else>Post Comment</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
