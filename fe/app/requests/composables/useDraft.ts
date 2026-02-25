import type { RequestFormData, RequestDraft } from '../types/request.types'

const DRAFT_KEY = 'borrow_request_draft'
const DRAFT_TTL_HOURS = 24

export const useDraft = () => {
  /**
   * Save form data as draft to localStorage
   */
  const saveDraft = (formData: RequestFormData) => {
    if (import.meta.server) return

    const now = new Date()
    const expiresAt = new Date(now.getTime() + DRAFT_TTL_HOURS * 60 * 60 * 1000)

    const draft: RequestDraft = {
      id: crypto.randomUUID(),
      form_data: {
        ...formData,
        attachments: [] // Can't store File objects in localStorage
      },
      saved_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    }

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch (err) {
      console.error('Failed to save draft:', err)
    }
  }

  /**
   * Get draft from localStorage if exists and not expired
   */
  const getDraft = (): RequestDraft | null => {
    if (import.meta.server) return null

    try {
      const stored = localStorage.getItem(DRAFT_KEY)
      if (!stored) return null

      const draft: RequestDraft = JSON.parse(stored)

      // Check if expired
      if (new Date(draft.expires_at) < new Date()) {
        clearDraft()
        return null
      }

      return draft
    } catch (err) {
      console.error('Failed to get draft:', err)
      return null
    }
  }

  /**
   * Check if a draft exists and is valid
   */
  const hasDraft = (): boolean => {
    return getDraft() !== null
  }

  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    if (import.meta.server) return

    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch (err) {
      console.error('Failed to clear draft:', err)
    }
  }

  /**
   * Get time since draft was saved
   */
  const getDraftAge = (): string | null => {
    const draft = getDraft()
    if (!draft) return null

    const savedAt = new Date(draft.saved_at)
    const now = new Date()
    const diffMs = now.getTime() - savedAt.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'more than a day ago'
  }

  return {
    saveDraft,
    getDraft,
    hasDraft,
    clearDraft,
    getDraftAge
  }
}
