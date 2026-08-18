"use client"

import { RefreshCw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type KnowledgeDocument = {
  id: string
  name: string
  indexing_status?: string
  display_status?: string
  word_count?: number
  tokens?: number
  error?: string | null
  created_at?: number
}

const STATUS_LABEL: Record<string, string> = {
  waiting: "排队中",
  parsing: "解析中",
  cleaning: "清洗中",
  splitting: "切分中",
  indexing: "正在索引",
  completed: "已就绪",
  error: "失败",
  paused: "已暂停",
}

function statusVariant(status?: string) {
  if (status === "completed") return "secondary" as const
  if (status === "error") return "destructive" as const
  return "outline" as const
}

export function DocumentList({
  documents,
  loading,
  onRefresh,
  onDelete,
  onRetry,
}: {
  documents: KnowledgeDocument[]
  loading?: boolean
  onRefresh: () => void
  onDelete: (id: string) => void
  onRetry: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>知识库文档</CardTitle>
          <CardDescription>
            删除后会从 Dify 知识库移除对应切片。索引失败可重新索引。
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw data-icon="inline-start" />
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.length === 0 ? (
          <p className="rounded-xl bg-muted/70 px-3 py-6 text-center text-sm text-muted-foreground">
            {loading ? "正在读取文档列表…" : "还没有文档。先上传样本，或一键导入 samples/。"}
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-2 rounded-xl border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <Badge variant={statusVariant(doc.indexing_status)}>
                    {STATUS_LABEL[doc.indexing_status || ""] ||
                      doc.display_status ||
                      doc.indexing_status ||
                      "未知"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doc.word_count ? `${doc.word_count} 字` : "字数未知"}
                  {doc.error ? ` · ${doc.error}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {doc.indexing_status === "error" || doc.indexing_status === "paused" ? (
                  <Button size="sm" variant="outline" onClick={() => onRetry(doc.id)}>
                    重新索引
                  </Button>
                ) : null}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`确定删除「${doc.name}」？`)) onDelete(doc.id)
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
