<script setup lang="ts">
interface Props {
  modelValue: File[]
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxFiles: 5,
  maxSizeMB: 10,
  accept: 'image/*'
})

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const previews = ref<{ file: File; url: string }[]>([])
const error = ref<string | null>(null)
const isDragging = ref(false)

// Check if device has camera (mobile detection)
const isMobile = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
  // Reset input value to allow re-selecting same file
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  error.value = null

  // Filter by type
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      error.value = 'Only image files are allowed'
      return false
    }
    return true
  })

  // Check size
  const sizeLimit = props.maxSizeMB * 1024 * 1024
  const withinSize = validFiles.filter(file => {
    if (file.size > sizeLimit) {
      error.value = `Files must be smaller than ${props.maxSizeMB}MB`
      return false
    }
    return true
  })

  // Check max files
  const remaining = props.maxFiles - previews.value.length
  const toAdd = withinSize.slice(0, remaining)

  if (withinSize.length > remaining) {
    error.value = `Maximum ${props.maxFiles} files allowed`
  }

  // Create previews
  toAdd.forEach(file => {
    const url = URL.createObjectURL(file)
    previews.value.push({ file, url })
  })

  emitUpdate()
}

const removeFile = (index: number) => {
  URL.revokeObjectURL(previews.value[index].url)
  previews.value.splice(index, 1)
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', previews.value.map(p => p.file))
}

const openFilePicker = () => {
  fileInput.value?.click()
}

const openCamera = () => {
  cameraInput.value?.click()
}

// Cleanup URLs on unmount
onUnmounted(() => {
  previews.value.forEach(p => URL.revokeObjectURL(p.url))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Drop Zone -->
    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="relative border-2 border-dashed rounded-lg p-6 transition-colors text-center"
      :class="isDragging ? 'border-primary-500 bg-primary-50' : 'border-secondary-300 hover:border-secondary-400'"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
      
      <!-- Camera input for mobile -->
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="space-y-3">
        <svg class="w-10 h-10 mx-auto text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>

        <div>
          <p class="text-secondary-600">
            <span class="hidden sm:inline">Drag and drop images here, or</span>
            <span class="sm:hidden">Tap to</span>
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            @click="openFilePicker"
            class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Browse Files
          </button>

          <button
            v-if="isMobile"
            type="button"
            @click="openCamera"
            class="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>
        </div>

        <p class="text-xs text-secondary-500">
          Max {{ maxFiles }} files, up to {{ maxSizeMB }}MB each
        </p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="text-sm text-danger-600 flex items-center gap-2">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>

    <!-- Previews -->
    <div v-if="previews.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div
        v-for="(preview, index) in previews"
        :key="index"
        class="relative group aspect-square rounded-lg overflow-hidden bg-secondary-100"
      >
        <img
          :src="preview.url"
          :alt="`Upload ${index + 1}`"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            @click="removeFile(index)"
            class="p-2 bg-white rounded-full text-danger-600 hover:text-danger-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <!-- Mobile: Always show remove button -->
        <button
          type="button"
          @click="removeFile(index)"
          class="absolute top-1 right-1 p-1.5 bg-danger-600 rounded-full text-white sm:hidden"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
          {{ preview.file.name }}
        </div>
      </div>
    </div>
  </div>
</template>
