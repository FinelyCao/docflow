"use client"

import { ShieldAlert } from "lucide-react"

import { SUGGESTED_QUESTIONS } from "@/lib/suggested"

export function RefusalState({
  reason,
  onAsk,
}: {
  reason?: string
  onAsk?: (question: string) => void
}) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/70 p-4 text-sm">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-2">
          <p className="font-medium text-foreground">文档中未找到可靠依据</p>
          <p className="text-xs leading-5 text-muted-foreground">
            {reason ||
              "DocFlow 选择拒答，而不是用模型记忆补全内部事实。这比一本正经地胡说更安全。"}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onAsk?.(question)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                试试：{question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
