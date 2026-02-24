<script setup lang="ts">
import type { BulkOperationResult } from '../types/kit.types'

interface Props {
  selectedCount: number
  isProcessing: boolean
  results?: BulkOperationResult[]
  showResults?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'archive': []
  'update-category': [category: string]
  'update-tags': [tags: string[], action: 'add' | 'replace']
  'export': []
  'deselect-all': []
  'close-results': []
}>()

const showCategoryModal = ref(false)
const showTagsModal = ref(false)
const categoryInput = ref('')
const tagsInput = ref('')
const tagAction = ref<'add' | 'replace'>('add')

const handleUpdateCategory = () => {
  if (categoryInput.value.trim()) {
    emit('update-category', categoryInput.value.trim())
    showCategoryModal.value = false
    categoryInput.value = ''
  }
}

const handleUpdateTags = () => {
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  if (tags.length > 0) {
    emit('update-tags', tags, tagAction.value)
    showTagsModal.value = false
    tagsInput.value = ''
    tagAction.value = 'add'
  }
}

const successCount = computed(() => props.results?.filter(r => r.success).length || 0)
const failureCount = computed(() => props.results?.filter(r => !r.success).length || 0)
</script>

<template>
  <div>
    <!-- Bulk Actions Bar -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="selectedCount > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-secondary-900 text-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">{{ selectedCount }}</span>
          <span class="text-secondary-300">selected</span>
        </div>

        <div class="h-6 w-px bg-secondary-700"></div>

        <div class="flex items-center gap-2">
          <button
            @click="emit('export')"
            :disabled="isProcessing"
            class="px-3 py-1.5 text-sm font-medium bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
          </button>

          <button
            @click="showCategoryModal = true"
            :disabled="isProcessing"
            class="px-3 py-1.5 text-sm font-medium bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Update Category
          </button>

          <button
            @click="showTagsModal = true"
            :disabled="isProcessing"
            class="px-3 py-1.5 text-sm font-medium bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            Update Tags
          </button>

          <button
            @click="emit('archive')"
            :disabled="isProcessing"
            class="px-3 py-1.5 text-sm font-medium bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>
        </div>

        <div class="h-6 w-px bg-secondary-700"></div>

        <button
          @click="emit('deselect-all')"
          class="text-secondary-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Processing Indicator -->
        <div v-if="isProcessing" class="flex items-center gap-2 ml-2">
          <svg class="animate-spin h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span class="text-sm">Processing...</span>
        </div>
      </div>
    </Transition>

    <!-- Category Update Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold text-secondary-900 mb-4">Update Category</h3>
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-2">New Category</label>
              <input
                v-model="categoryInput"
                type="text"
                placeholder="Enter category name"
                class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                @keyup.enter="handleUpdateCategory"
              />
            </div>
            <div class="flex justify-end gap-3">
              <button
                @click="showCategoryModal = false"
                class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleUpdateCategory"
                :disabled="!categoryInput.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Tags Update Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showTagsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold text-secondary-900 mb-4">Update Tags</h3>
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-2">Tags (comma-separated)</label>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="tag1, tag2, tag3"
                class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-2">Action</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="tagAction"
                    type="radio"
                    value="add"
                    class="text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-secondary-700">Add to existing</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="tagAction"
                    type="radio"
                    value="replace"
                    class="text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-secondary-700">Replace all</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button
                @click="showTagsModal = false"
                class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleUpdateTags"
                :disabled="!tagsInput.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Results Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showResults" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold text-secondary-900 mb-4">Operation Complete</h3>
            
            <div class="mb-6">
              <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-success-500"></div>
                  <span class="text-sm text-secondary-700">{{ successCount }} succeeded</span>
                </div>
                <div v-if="failureCount > 0" class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-danger-500"></div>
                  <span class="text-sm text-secondary-700">{{ failureCount }} failed</span>
                </div>
              </div>

              <div v-if="failureCount > 0" class="bg-danger-50 border border-danger-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p class="text-sm font-medium text-danger-800 mb-2">Failed items:</p>
                <ul class="space-y-1">
                  <li
                    v-for="result in results?.filter(r => !r.success)"
                    :key="result.kitId"
                    class="text-sm text-danger-700"
                  >
                    {{ result.kitId }}: {{ result.error }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                @click="emit('close-results')"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
