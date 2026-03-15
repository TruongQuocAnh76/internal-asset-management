import type { Socket } from 'socket.io-client'
import type { NotificationItem, NotificationToast } from '../types/notification.types'

export const useNotifications = () => {
  const config = useRuntimeConfig()
  const { user } = useAuth()
  const { $notificationsSocket } = useNuxtApp()

  const notifications = useState<NotificationItem[]>('notifications_items', () => [])
  const toasts = useState<NotificationToast[]>('notifications_toasts', () => [])
  const loading = useState<boolean>('notifications_loading', () => false)
  const realtimeReady = useState<boolean>('notifications_realtime_ready', () => false)

  const unreadCount = computed(() =>
    notifications.value.reduce((acc, item) => acc + (item.is_read ? 0 : 1), 0),
  )

  const socket = () => $notificationsSocket as Socket

  const upsertNotification = (notification: NotificationItem) => {
    const existingIndex = notifications.value.findIndex((entry) => entry.id === notification.id)

    if (existingIndex === -1) {
      notifications.value = [notification, ...notifications.value]
      return
    }

    notifications.value.splice(existingIndex, 1, notification)
  }

  const pushToast = (notification: NotificationItem) => {
    const toast: NotificationToast = {
      id: `${notification.id}-${Date.now()}`,
      title: notification.type.replaceAll('_', ' '),
      message: notification.content,
      created_at: notification.created_at,
    }

    toasts.value = [...toasts.value, toast]

    setTimeout(() => {
      dismissToast(toast.id)
    }, 5000)
  }

  const dismissToast = (toastId: string) => {
    toasts.value = toasts.value.filter((entry) => entry.id !== toastId)
  }

  const fetchRecent = async () => {
    if (!user.value?.id) {
      notifications.value = []
      return notifications.value
    }

    loading.value = true
    try {
      const data = await $fetch<NotificationItem[]>('/notifications', {
        baseURL: config.public.backendUrl,
        credentials: 'include',
      })
      notifications.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const markAsRead = (notificationId: string) => {
    const found = notifications.value.find((entry) => entry.id === notificationId)
    if (found && !found.is_read) {
      found.is_read = true
      found.read_at = new Date().toISOString()
    }

    socket().emit('notification:markAsRead', notificationId)
  }

  const initRealtime = async () => {
    if (realtimeReady.value) {
      return
    }

    socket()

    socket().on('notification:sent', (notification: NotificationItem) => {
      upsertNotification(notification)
      pushToast(notification)
    })

    socket().on('notification:markedAsRead', (notificationId: string) => {
      const found = notifications.value.find((entry) => entry.id === notificationId)
      if (found) {
        found.is_read = true
        if (!found.read_at) {
          found.read_at = new Date().toISOString()
        }
      }
    })

    realtimeReady.value = true
    await fetchRecent()
  }

  return {
    notifications,
    toasts,
    loading,
    unreadCount,
    initRealtime,
    fetchRecent,
    markAsRead,
    dismissToast,
  }
}
