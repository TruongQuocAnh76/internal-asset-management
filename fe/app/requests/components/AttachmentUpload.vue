<script setup lang="ts">
import { useRequestHelpers } from '../composables/useRequestHelpers'

interface Props {
  files: File[]
  maxFiles?: number
  maxSizeMb?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxFiles: 5,
  maxSizeMb: 10,
  acceptedTypes: () => ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']
})

const emit = defineEmits<{
  'update:files': [files: File[]]
  'add': [files: File[]]
  'remove': [index: number]
}>()

const { formatFileSize } = useRequestHelpers()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref<string | null>(null)

const acceptString = computed(() => props.acceptedTypes.join(','))

const canAddMore = computed(() => props.files.length < props.maxFiles)

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  if (props.disabled) return
  
  const files = e.dataTransfer?.files
  if (files) {
    processFiles(files)
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    processFiles(target.files)
    target.value = '' // Reset for same file selection
  }
}

const processFiles = (fileList: FileList) => {
  error.value = null
  const newFiles: File[] = []
  const maxSizeBytes = props.maxSizeMb * 1024 * 1024

  for (const file of Array.from(fileList)) {
    // Check max files
    if (props.files.length + newFiles.length >= props.maxFiles) {
      error.value = `Maximum ${props.maxFiles} files allowed`
      break
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      error.value = `File "${file.name}" exceeds ${props.maxSizeMb}MB limit`
      continue
    }

    newFiles.push(file)
  }

  if (newFiles.length > 0) {
    emit('add', newFiles)
    emit('update:files', [...props.files, ...newFiles])
  }
}

const removeFile = (index: number) => {
  emit('remove', index)
  const newFiles = [...props.files]
  newFiles.splice(index, 1)
  emit('update:files', newFiles)
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const getFileIcon = (file: File): string => {
  const type = file.type
  if (type.startsWith('image/')) return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  if (type === 'application/pdf') return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
}
</script>

<template>
  <div class="space-y-3">
    <label class="label">
      Attachments
      <span class="text-secondary-400 font-normal">(optional)</span>
    </label>

    <!-- Drop zone -->
    <div
      v-if="canAddMore"
      :class="[
        'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
        isDragging ? 'border-primary-500 bg-primary-50' : 'border-secondary-300 hover:border-primary-400',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="!disabled && openFileDialog()"
      role="button"
      tabindex="0"
      :aria-disabled="disabled"
      aria-label="Upload files"
      @keydown.enter="!disabled && openFileDialog()"
      @keydown.space.prevent="!disabled && openFileDialog()"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptString"
        multiple
        class="hidden"
        :disabled="disabled"
        @change="handleFileSelect"
        aria-hidden="true"
      />

      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-secondary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div class="mt-2 text-sm text-secondary-600">
          <span class="font-medium text-primary-600">Click to upload</span>
          <span class="hidden sm:inline"> or drag and drop</span>
        </div>
        <p class="text-xs text-secondary-500 mt-1">
          Images, PDF, DOC up to {{ maxSizeMb }}MB (max {{ maxFiles }} files)
        </p>
        
        <!-- Mobile camera hint -->
        <p class="text-xs text-secondary-400 mt-2 sm:hidden">
          📷 Tap to use camera on mobile
        </p>
      </div>
    </div>

    <!-- File list -->
    <ul v-if="files.length > 0" class="space-y-2" role="list" aria-label="Uploaded files">
      <li
        v-for="(file, index) in files"
        :key="`${file.name}-${index}`"
        class="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex-shrink-0 p-2 bg-white rounded-lg">
            <svg
              class="w-5 h-5 text-secondary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getFileIcon(file)"
              />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-secondary-900 truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-secondary-500">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          class="flex-shrink-0 p-1.5 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          :disabled="disabled"
          @click="removeFile(index)"
          :aria-label="`Remove ${file.name}`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </li>
    </ul>

    <!-- File count -->
    <p v-if="files.length > 0" class="text-sm text-secondary-500">
      {{ files.length }} / {{ maxFiles }} files uploaded
    </p>

    <!-- Error message -->
    <p v-if="error" class="error-message" role="alert">
      {{ error }}
    </p>
  </div>
</template>
