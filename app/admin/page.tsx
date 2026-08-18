"use client"

import { useCallback, useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

import { DocumentList, type KnowledgeDocument } from "@/components/admin/DocumentList"
import { UploadDropzone } from "@/components/admin/UploadDropzone"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Health = {
  datasetConfigured: boolean
  configured: boolean
  reachable: boolean
  difyUrl: string
  error?: string
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState("")
  const [health, setHealth] = useState<Health | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/documents")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "读取文档失败")
      }
      setDocuments(data.data || [])
      setMessage("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取文档失败")
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => null)

    fetch("/api/documents")
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "读取文档失败")
        }
        setDocuments(data.data || [])
        setMessage("")
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "读取文档失败")
        setDocuments([])
      })
      .finally(() => setLoading(false))
  }, [])

  async function seed() {
    setSeeding(true)
    setMessage("正在导入 samples/ 中的星河科技样本文档…")
    try {
      const response = await fetch("/api/documents/seed", { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "导入失败")
      const failed = data.failed?.length || 0
      setMessage(
        `已导入 ${data.uploaded?.length || 0} 份样本${failed ? `，失败 ${failed} 份` : ""}。`
      )
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败")
    } finally {
      setSeeding(false)
    }
  }

  async function onDelete(id: string) {
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || "删除失败")
      return
    }
    await refresh()
  }

  async function onRetry(id: string) {
    const response = await fetch(`/api/documents/${id}/retry`, { method: "POST" })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || "重新索引失败")
      return
    }
    await refresh()
  }

  return (
    <div className="min-h-svh">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">文档库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            文档进入本地 Dify 知识库后，问答页才能引用原文片段。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>接入本地 Dify</CardTitle>
            <CardDescription>
              源码在 /Users/caofan/dify，Nginx 入口默认 http://127.0.0.1 。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <ol className="list-decimal space-y-1 pl-4">
              <li>打开 http://127.0.0.1 登录 Dify Console。</li>
              <li>创建知识库「小帆科技公司内部文档」，索引方式建议高质量（需已配 Embedding 模型）。</li>
              <li>创建聊天助手，打开「引用和归属」，绑定该知识库。</li>
              <li>
                系统提示词使用 <code className="rounded bg-muted px-1">samples/dify-prompt.md</code>。
              </li>
              <li>
                把应用 API Key 与知识库 Dataset ID 写入{" "}
                <code className="rounded bg-muted px-1">.env.local</code> 后重启{" "}
                <code className="rounded bg-muted px-1">npm run dev</code>。
              </li>
            </ol>
            <p className="text-xs">
              当前：应用 Key {health?.configured ? "已配置" : "未配置"} · 知识库{" "}
              {health?.datasetConfigured ? "已配置" : "未配置"} · Dify{" "}
              {health?.reachable ? "可达" : health?.error || "未连通"} · {health?.difyUrl}
            </p>
          </CardContent>
        </Card>

        <UploadDropzone onUploaded={refresh} />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            仓库内已准备 9 份星河科技样本 FAQ，可一键导入做演示。
          </p>
          <Button size="sm" onClick={seed} disabled={seeding}>
            <Sparkles data-icon="inline-start" />
            导入样本文档
          </Button>
        </div>

        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}

        <DocumentList
          documents={documents}
          loading={loading}
          onRefresh={refresh}
          onDelete={onDelete}
          onRetry={onRetry}
        />
      </main>
    </div>
  )
}
