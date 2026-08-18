"use client"

import { useEffect, useState } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getFeedback,
  saveFeedback,
  type FeedbackRating,
} from "@/lib/feedback"

export function FeedbackButtons({
  messageId,
  question,
  answer,
  refused,
}: {
  messageId: string
  question: string
  answer: string
  refused?: boolean
}) {
  const [rating, setRating] = useState<FeedbackRating | null>(null)

  useEffect(() => {
    const next = getFeedback(messageId)?.rating || null
    queueMicrotask(() => setRating(next))
  }, [messageId])

  function onRate(next: FeedbackRating) {
    const value = rating === next ? null : next
    setRating(value)
    if (value) {
      saveFeedback({
        messageId,
        rating: value,
        question,
        answer,
        refused,
        createdAt: Date.now(),
      })
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <span className="mr-1 text-[11px] text-muted-foreground">这个回答有用吗</span>
      <Button
        type="button"
        size="icon-xs"
        variant={rating === "up" ? "secondary" : "ghost"}
        onClick={() => onRate("up")}
        aria-label="有用"
      >
        <ThumbsUp className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        variant={rating === "down" ? "secondary" : "ghost"}
        onClick={() => onRate("down")}
        aria-label="没用"
      >
        <ThumbsDown className="size-3.5" />
      </Button>
    </div>
  )
}
