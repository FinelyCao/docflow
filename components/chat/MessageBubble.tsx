"use client"

import { Bot, RefreshCw } from "lucide-react"

import { CitationCard } from "@/components/chat/CitationCard"
import { FeedbackButtons } from "@/components/chat/FeedbackButtons"
import { RefusalState } from "@/components/chat/RefusalState"
import { StreamingText } from "@/components/chat/StreamingText"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ChatMessage } from "@/lib/dify"
import { cn } from "@/lib/utils"

export function MessageBubble({
  message,
  question,
  onAsk,
  onRetry,
}: {
  message: ChatMessage
  question?: string
  onAsk?: (query: string) => void
  onRetry?: () => void
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-6 text-primary-foreground shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  const retrieving = message.status === "retrieving"
  const streaming = message.status === "streaming"

  return (
    <div className="flex max-w-[92%] gap-3">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Bot className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
        {retrieving ? (
          <div className="space-y-2">
            <p className="text-xs text-primary">正在查阅知识库文档…</p>
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        ) : message.refused ? null : (
          <StreamingText text={message.content} isStreaming={streaming} />
        )}

        {message.firstTokenMs && message.status !== "retrieving" ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            首 Token {message.firstTokenMs}ms
          </p>
        ) : null}

        {message.refused ? (
          <RefusalState reason={message.refusalReason} onAsk={onAsk} />
        ) : null}

        {!message.refused && message.citations?.length ? (
          <CitationCard citations={message.citations} />
        ) : null}

        {message.status === "error" ? (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">回答中断了</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {message.errorCode ? `${message.errorCode} · ` : ""}
              {message.error}
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
              <RefreshCw data-icon="inline-start" />
              重试
            </Button>
          </div>
        ) : null}

        {message.status === "done" || message.status === "refused" ? (
          <FeedbackButtons
            messageId={message.id}
            question={question || ""}
            answer={message.content}
            refused={message.refused}
          />
        ) : null}
      </div>
    </div>
  )
}

export function MessageList({
  messages,
  className,
  onAsk,
  onRetry,
}: {
  messages: ChatMessage[]
  className?: string
  onAsk?: (query: string) => void
  onRetry?: () => void
}) {
  return (
    <div className={cn("space-y-5", className)}>
      {messages.map((message, index) => {
        const question =
          message.role === "assistant"
            ? [...messages.slice(0, index)].reverse().find((item) => item.role === "user")
                ?.content
            : undefined
        return (
          <MessageBubble
            key={message.id}
            message={message}
            question={question}
            onAsk={onAsk}
            onRetry={onRetry}
          />
        )
      })}
    </div>
  )
}
