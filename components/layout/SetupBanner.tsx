"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Health = {
  configured: boolean
  datasetConfigured: boolean
  reachable: boolean
  appName?: string
  difyUrl: string
  error?: string
}

export function SetupBanner() {
  const [health, setHealth] = useState<Health | null>(null)

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() =>
        setHealth({
          configured: false,
          datasetConfigured: false,
          reachable: false,
          difyUrl: "http://127.0.0.1/v1",
          error: "无法读取本地配置",
        })
      )
  }, [])

  if (!health) return null

  if (health.configured && health.reachable) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-accent/60 px-3 py-2 text-xs text-accent-foreground">
        <CheckCircle2 className="size-3.5 shrink-0" />
        已连接本地 Dify{health.appName ? ` · ${health.appName}` : ""} ·{" "}
        {health.difyUrl}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">还差一步才能真正问答</p>
          <p className="text-xs leading-5 text-amber-900/80">
            {health.error ||
              "请在 Dify 创建知识库应用，把 API Key 写入 docflow/.env.local。"}{" "}
            本地实例：{health.difyUrl}
          </p>
          <Link
            href="/admin"
            className={cn(buttonVariants({ size: "xs", variant: "outline" }), "mt-1")}
          >
            去文档库查看接入说明
          </Link>
        </div>
      </div>
    </div>
  )
}
