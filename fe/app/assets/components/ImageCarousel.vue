<script setup lang="ts">
interface Props {
  images: string[]
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Asset image',
})

const config = useRuntimeConfig()
const currentIndex = ref(0)

const goToSlide = (index: number) => {
  currentIndex.value = index
}

const goToPrevious = () => {
  currentIndex.value = currentIndex.value === 0 ? props.images.length - 1 : currentIndex.value - 1
}

const goToNext = () => {
  currentIndex.value = currentIndex.value === props.images.length - 1 ? 0 : currentIndex.value + 1
}
</script>

<template>
  <div v-if="images && images.length > 0" class="relative bg-secondary-100 rounded-xl overflow-hidden">
    <!-- Main Image -->
    <div class="relative aspect-video">
      <img
        :src="`${config.public.backendUrl}/storage/files/${images[currentIndex]}`"
        :alt="`${alt} ${currentIndex + 1}`"
        class="w-full h-full object-cover"
      />
      
      <!-- Navigation Arrows -->
      <template v-if="images.length > 1">
        <button
          @click="goToPrevious"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Previous image"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          @click="goToNext"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Next image"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </template>
      
      <!-- Image Counter -->
      <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
    
    <!-- Thumbnail Navigation -->
    <div v-if="images.length > 1" class="flex gap-2 p-3 overflow-x-auto">
      <button
        v-for="(image, index) in images"
        :key="index"
        @click="goToSlide(index)"
        :class="[
          'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
          currentIndex === index
            ? 'border-primary-500 ring-2 ring-primary-200'
            : 'border-transparent hover:border-secondary-300'
        ]"
      >
        <img
          :src="`${config.public.backendUrl}/storage/files/${image}`"
          :alt="`${alt} thumbnail ${index + 1}`"
          class="w-full h-full object-cover"
        />
      </button>
    </div>
  </div>
  
  <!-- Placeholder when no images -->
  <div v-else class="aspect-video bg-secondary-100 rounded-xl flex items-center justify-center">
    <div class="text-center text-secondary-400">
      <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-sm">No images available</p>
    </div>
  </div>
</template>
