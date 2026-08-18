"use client"

import { useState } from "react"
import { ChevronDown, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { RetrieverResource } from "@/lib/dify"
import { cn } from "@/lib/utils"

function scoreLabel(score: number) {
  if (score >= 0.8) return "高相关"
  if (score >= 0.6) return "可用"
  return "低置信"
}

export function CitationCard({
  citations,
}: {
  citations: RetrieverResource[]
}) {
  if (!citations.length) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        引用来源
      </p>
      {citations.map((item, index) => (
        <CitationItem key={`${item.document_id}-${item.segment_id}-${index}`} citation={item} />
      ))}
    </div>
  )
}

function CitationItem({ citation }: { citation: RetrieverResource }) {
  const [open, setOpen] = useState(false)
  const low = (citation.score || 0) < 0.6

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className={cn(
        "w-full rounded-xl border bg-background/80 p-3 text-left transition-colors hover:bg-muted/60",
        low ? "border-amber-300/80" : "border-border"
      )}
    >
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {citation.document_name}
            </span>
            {citation.position ? (
              <span className="text-[11px] text-muted-foreground">
                第 {citation.position} 段
              </span>
            ) : null}
            <Badge variant={low ? "destructive" : "secondary"}>
              {scoreLabel(citation.score)} · {(citation.score * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className={cn("mt-1 text-xs leading-5 text-muted-foreground", !open && "line-clamp-2")}>
            {citation.content}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </div>
    </button>
  )
}
