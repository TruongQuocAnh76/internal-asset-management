<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'center' | 'bottom' // bottom for mobile action sheets
  preventClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  position: 'center',
  preventClose: false
})

const emit = defineEmits<{
  close: []
}>()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[90vw]'
  }
  return sizes[props.size]
})

const positionClasses = computed(() => {
  if (props.position === 'bottom') {
    return 'items-end sm:items-center'
  }
  return 'items-center'
})

const panelClasses = computed(() => {
  if (props.position === 'bottom') {
    return 'w-full rounded-t-2xl sm:rounded-xl animate-slide-up sm:animate-scale-in'
  }
  return 'w-full rounded-xl animate-scale-in'
})

const close = () => {
  if (!props.preventClose) {
    emit('close')
  }
}

// Handle escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open && !props.preventClose) {
      emit('close')
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})

// Lock body scroll when open
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex justify-center p-4 sm:p-6"
        :class="positionClasses"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="close"
        />

        <!-- Modal Panel -->
        <div
          class="relative bg-white shadow-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
          :class="[sizeClasses, panelClasses]"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-secondary-200">
            <div v-if="title" class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-secondary-900 truncate">
                {{ title }}
              </h3>
              <p v-if="description" class="mt-1 text-sm text-secondary-500">
                {{ description }}
              </p>
            </div>
            <slot v-else name="header" />
            
            <button
              v-if="!preventClose"
              @click="close"
              class="ml-4 p-1.5 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-4 sm:px-6 py-4 border-t border-secondary-200 bg-secondary-50/50">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
