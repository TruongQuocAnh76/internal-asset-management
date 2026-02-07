import type { BorrowStatus, RequestPriority, StatusConfig, PriorityConfig } from '../types/request.types'

export const useRequestHelpers = () => {
  // Status configuration
  const statusConfig: Record<BorrowStatus, StatusConfig> = {
    PENDING: {
      label: 'Pending',
      color: 'warning',
      bgClass: 'bg-warning-100',
      textClass: 'text-warning-700',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    APPROVED: {
      label: 'Approved',
      color: 'success',
      bgClass: 'bg-success-100',
      textClass: 'text-success-700',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    REJECTED: {
      label: 'Rejected',
      color: 'danger',
      bgClass: 'bg-danger-100',
      textClass: 'text-danger-700',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    PROVIDED: {
      label: 'Fulfilled',
      color: 'success',
      bgClass: 'bg-success-100',
      textClass: 'text-success-700',
      icon: 'M5 13l4 4L19 7'
    },
    OVERDUE: {
      label: 'Overdue',
      color: 'danger',
      bgClass: 'bg-danger-100',
      textClass: 'text-danger-700',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    CANCELED: {
      label: 'Cancelled',
      color: 'secondary',
      bgClass: 'bg-secondary-100',
      textClass: 'text-secondary-700',
      icon: 'M6 18L18 6M6 6l12 12'
    },
    RETURNED: {
      label: 'Returned',
      color: 'primary',
      bgClass: 'bg-primary-100',
      textClass: 'text-primary-700',
      icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
    }
  }

  // Priority configuration
  const priorityConfig: Record<RequestPriority, PriorityConfig> = {
    LOW: {
      label: 'Low',
      color: 'secondary',
      bgClass: 'bg-secondary-100',
      textClass: 'text-secondary-700'
    },
    MEDIUM: {
      label: 'Normal',
      color: 'primary',
      bgClass: 'bg-primary-100',
      textClass: 'text-primary-700'
    },
    HIGH: {
      label: 'High',
      color: 'danger',
      bgClass: 'bg-danger-100',
      textClass: 'text-danger-700'
    }
  }

  const getStatusConfig = (status: BorrowStatus): StatusConfig => {
    return statusConfig[status] || statusConfig.PENDING
  }

  const getPriorityConfig = (priority: RequestPriority): PriorityConfig => {
    return priorityConfig[priority] || priorityConfig.MEDIUM
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate)
    const end = formatDate(endDate)
    return `${start} - ${end}`
  }

  const getRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return formatDate(dateStr)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    statusConfig,
    priorityConfig,
    getStatusConfig,
    getPriorityConfig,
    formatDate,
    formatDateTime,
    formatDateRange,
    getRelativeTime,
    formatFileSize
  }
}
