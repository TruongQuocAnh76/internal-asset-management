<script setup lang="ts">
import { useDraft } from '../composables/useDraft'

interface Props {
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'restore': []
  'discard': []
}>()

const { getDraftAge } = useDraft()

const draftAge = computed(() => getDraftAge())
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
        aria-labelledby="draft-title"
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
            v-if="isOpen"
            class="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <!-- Icon -->
            <div class="flex justify-center mb-4">
              <div class="p-3 bg-primary-100 rounded-full">
                <svg
                  class="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="text-center mb-6">
              <h3 id="draft-title" class="text-lg font-semibold text-secondary-900">
                Restore Draft?
              </h3>
              <p class="text-secondary-600 mt-2">
                You have an unsaved draft from {{ draftAge }}.
                Would you like to continue where you left off?
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                class="btn-secondary flex-1"
                @click="emit('discard')"
              >
                Start Fresh
              </button>
              <button
                type="button"
                class="btn-primary flex-1"
                @click="emit('restore')"
              >
                Restore Draft
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
