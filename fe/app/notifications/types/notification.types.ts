export type NotificationType =
  | 'BORROW_REQUEST'
  | 'ASSET_ALLOCATION'
  | 'MAINTENANCE'
  | 'CHAT_MESSAGE'
  | 'PURCHASE_REQUEST'
  | 'CATEGORY'
  | 'GENERAL'

export interface NotificationItem {
  id: string
  user_id: string
  content: string
  is_read: boolean
  read_at: string | null
  type: NotificationType
  created_at: string
}

export interface NotificationToast {
  id: string
  title: string
  message: string
  created_at: string
}
