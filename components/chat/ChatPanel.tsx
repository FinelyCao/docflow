"use client"

import { useEffect, useRef } from "react"
import { BookOpenCheck } from "lucide-react"

import { ChatInput } from "@/components/chat/ChatInput"
import { MessageList } from "@/components/chat/MessageBubble"
import { SuggestedChips } from "@/components/chat/SuggestedChips"
import { AppHeader } from "@/components/layout/AppHeader"
import { SetupBanner } from "@/components/layout/SetupBanner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDifyChat } from "@/hooks/useDifyChat"

export function ChatPanel() {
  const { messages, status, isBusy, send, stop, retry, reset } = useDifyChat()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <AppHeader onReset={reset} />
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-4">
        <ScrollArea className="h-full min-h-0 flex-1 pr-3">
          {messages.length === 0 ? (
            <EmptyState onAsk={send} />
          ) : (
            <MessageList messages={messages} onAsk={send} onRetry={retry} />
          )}
          <div ref={endRef} />
        </ScrollArea>
        <div className="pt-4">
          <ChatInput isBusy={isBusy} onSend={send} onStop={stop} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAsk }: { onAsk: (query: string) => void }) {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <BookOpenCheck className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">问内部文档，不编造答案</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        DocFlow 面向 5-20 人团队：把散落的 PDF / Markdown 做成可追溯的知识库问答。
        每条回答都带引用来源；找不到就明确拒答。
      </p>
      <div className="mt-6 w-full max-w-xl text-left">
        <SetupBanner />
      </div>
      <div className="mt-6 w-full max-w-xl text-left">
        <SuggestedChips onSelect={onAsk} />
      </div>
    </div>
  )
}
