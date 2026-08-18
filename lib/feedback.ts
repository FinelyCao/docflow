export type FeedbackRating = "up" | "down"

export type FeedbackRecord = {
  messageId: string
  rating: FeedbackRating
  question: string
  answer: string
  refused?: boolean
  createdAt: number
}

const STORAGE_KEY = "docflow-feedback"

export function loadFeedback(): FeedbackRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FeedbackRecord[]
  } catch {
    return []
  }
}

export function saveFeedback(record: FeedbackRecord) {
  const all = loadFeedback().filter((item) => item.messageId !== record.messageId)
  all.unshift(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 200)))
}

export function getFeedback(messageId: string) {
  return loadFeedback().find((item) => item.messageId === messageId)
}
