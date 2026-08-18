"use client"

import { useCallback, useRef, useState } from "react"
import { FileUp, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

const ACCEPT = ".md,.markdown,.txt,.pdf"

export function UploadDropzone({
  onUploaded,
}: {
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState("")
  const [error, setError] = useState("")

  const upload = useCallback(
    async (file: File) => {
      setBusy(true)
      setError("")
      setPhase(`正在上传 ${file.name}…`)
      try {
        const form = new FormData()
        form.append("file", file)
        const response = await fetch("/api/documents", {
          method: "POST",
          body: form,
        })
        const data = (await response.json()) as {
          error?: string
          batch?: string
          document?: { name?: string }
        }
        if (!response.ok) {
          throw new Error(data.error || "上传失败")
        }
        setPhase("正在索引，请稍候…")
        if (data.batch) {
          await pollStatus(data.batch)
        }
        onUploaded()
        setPhase("已完成解析")
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败")
      } finally {
        setBusy(false)
      }
    },
    [onUploaded]
  )

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file) void upload(file)
      }}
      className="rounded-2xl border border-dashed border-primary/30 bg-accent/40 p-6"
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">上传 PDF / Markdown</p>
          <p className="mt-1 text-xs text-muted-foreground">
            采用 Chunk 500 token + 100 overlap，Markdown 按标题切分。
          </p>
          {phase ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              {busy ? <LoaderCircle className="size-3 animate-spin" /> : null}
              {phase}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp data-icon="inline-start" />
          选择文件
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ""
        }}
      />
    </div>
  )
}

async function pollStatus(batch: string) {
  for (let i = 0; i < 30; i += 1) {
    const response = await fetch(`/api/documents/status?batch=${encodeURIComponent(batch)}`)
    if (!response.ok) return
    const data = (await response.json()) as {
      data?: Array<{ indexing_status?: string }>
    }
    const items = data.data || []
    const pending = items.some((item) =>
      ["waiting", "parsing", "cleaning", "splitting", "indexing"].includes(
        item.indexing_status || ""
      )
    )
    if (!pending) return
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}
