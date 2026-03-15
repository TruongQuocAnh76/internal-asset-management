<script setup lang="ts">
const { toasts, dismissToast } = useNotifications()

function formatTime(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="fixed right-4 bottom-4 z-[80] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 pointer-events-none">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-lg border border-secondary-200 bg-white p-3 shadow-lg"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">{{ toast.title }}</p>
            <p class="mt-1 text-sm text-secondary-800 break-words">{{ toast.message }}</p>
            <p class="mt-2 text-[11px] text-secondary-500">{{ formatTime(toast.created_at) }}</p>
          </div>
          <button
            type="button"
            class="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
            @click="dismissToast(toast.id)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
