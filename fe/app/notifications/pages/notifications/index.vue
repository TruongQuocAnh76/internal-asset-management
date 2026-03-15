<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { notifications, loading, fetchRecent, markAsRead } = useNotifications()

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function prettyType(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

onMounted(() => {
  fetchRecent()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50 p-6">
    <div class="mx-auto max-w-4xl">
      <div class="mb-6 flex items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-secondary-900">Recent Notifications</h1>
        <button
          type="button"
          class="rounded-lg border border-secondary-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100"
          @click="fetchRecent"
        >
          Refresh
        </button>
      </div>

      <div v-if="loading" class="rounded-xl border border-secondary-200 bg-white p-8 text-center text-secondary-500">
        Loading notifications...
      </div>

      <div v-else-if="notifications.length === 0" class="rounded-xl border border-secondary-200 bg-white p-8 text-center text-secondary-500">
        No recent notifications.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-secondary-200 bg-white">
        <ul class="divide-y divide-secondary-100">
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="px-5 py-4"
            :class="notification.is_read ? 'bg-white' : 'bg-primary-50/40'"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  {{ prettyType(notification.type) }}
                </p>
                <p class="mt-1 text-sm text-secondary-800 break-words">{{ notification.content }}</p>
                <p class="mt-2 text-xs text-secondary-500">{{ formatDate(notification.created_at) }}</p>
              </div>

              <button
                v-if="!notification.is_read"
                type="button"
                class="rounded-md bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-200"
                @click="markAsRead(notification.id)"
              >
                Mark read
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
