"use client"

import { useState } from "react"
import { Square, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ChatInput({
  disabled,
  isBusy,
  onSend,
  onStop,
}: {
  disabled?: boolean
  isBusy?: boolean
  onSend: (query: string) => void
  onStop: () => void
}) {
  const [value, setValue] = useState("")

  function submit() {
    const query = value.trim()
    if (!query || disabled || isBusy) return
    onSend(query)
    setValue("")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
      <Textarea
        value={value}
        disabled={disabled}
        placeholder="用自然语言问内部文档，例如：退款要几天？"
        className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="text-[11px] text-muted-foreground">
          Enter 发送 · Shift+Enter 换行 · 找不到就拒答，不编造
        </p>
        {isBusy ? (
          <Button type="button" size="sm" variant="outline" onClick={onStop}>
            <Square data-icon="inline-start" />
            停止
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={submit} disabled={disabled || !value.trim()}>
            <ArrowUp data-icon="inline-start" />
            发送
          </Button>
        )}
      </div>
    </div>
  )
}
