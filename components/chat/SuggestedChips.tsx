"use client"

import { REFUSAL_EXAMPLES, SUGGESTED_QUESTIONS } from "@/lib/suggested"

export function SuggestedChips({
  onSelect,
}: {
  onSelect: (question: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          文档里有答案，可以这样问
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onSelect(question)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          也应该明确拒答
        </p>
        <div className="flex flex-wrap gap-2">
          {REFUSAL_EXAMPLES.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onSelect(question)}
              className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-amber-400 hover:text-foreground"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
