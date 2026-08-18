export type ChatStatus =
  | "idle"
  | "retrieving"
  | "streaming"
  | "done"
  | "refused"
  | "error"

export type RetrieverResource = {
  position: number
  dataset_id?: string
  dataset_name?: string
  document_id?: string
  document_name: string
  segment_id?: string
  score: number
  content: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  status?: ChatStatus
  citations?: RetrieverResource[]
  refused?: boolean
  refusalReason?: string
  error?: string
  errorCode?: string
  firstTokenMs?: number
  createdAt: number
}

export type DifyStreamEvent = {
  event: string
  task_id?: string
  message_id?: string
  conversation_id?: string
  answer?: string
  code?: string
  message?: string
  status?: number
  metadata?: {
    retriever_resources?: RetrieverResource[]
  }
  data?: {
    node_type?: string
    title?: string
    text?: string
  }
}

const REFUSAL_PATTERNS =
  /文档中未提及|知识库中没有|知识库未|未找到相关|无法从(?:提供的|检索到的|已有)?(?:文档|资料)|没有在文档|我不知道|无法回答|超出知识库|文档未覆盖/

export function maxCitationScore(citations: RetrieverResource[] = []) {
  if (!citations.length) return 0
  return Math.max(...citations.map((item) => item.score || 0))
}

export function detectRefusal(
  answer: string,
  citations: RetrieverResource[] | undefined,
  threshold: number
) {
  const text = answer.trim()
  if (REFUSAL_PATTERNS.test(text)) {
    return { refused: true, reason: "模型根据检索结果选择拒答，避免编造。" }
  }
  if (citations && citations.length === 0 && text.length > 0) {
    return {
      refused: true,
      reason: "本次没有召回到文档片段，按产品策略拒答。",
    }
  }
  const score = maxCitationScore(citations)
  if (citations && citations.length > 0 && score < threshold) {
    return {
      refused: true,
      reason: `最高相似度 ${score.toFixed(2)} 低于阈值 ${threshold}，触发低置信兜底。`,
    }
  }
  return { refused: false, reason: "" }
}

export function parseSseBlock(block: string): DifyStreamEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("")
  if (!data || data === "[DONE]") return null
  try {
    return JSON.parse(data) as DifyStreamEvent
  } catch {
    return null
  }
}

export function extractAnswerDelta(event: DifyStreamEvent) {
  if (event.event === "message" || event.event === "agent_message") {
    return event.answer || ""
  }
  if (event.event === "text_chunk") {
    return event.data?.text || event.answer || ""
  }
  return ""
}

export function isKnowledgeNode(event: DifyStreamEvent) {
  const type = event.data?.node_type || ""
  const title = event.data?.title || ""
  return (
    type === "knowledge-retrieval" ||
    type.includes("knowledge") ||
    title.includes("知识")
  )
}

export function humanizeDifyError(status: number, body: string) {
  let parsed: { message?: string; code?: string } | null = null
  try {
    parsed = JSON.parse(body) as { message?: string; code?: string }
  } catch {
    parsed = null
  }
  const message = parsed?.message || body.slice(0, 180) || "未知错误"

  if (status === 401) {
    return {
      code: parsed?.code || "unauthorized",
      message: "Dify API Key 无效。请检查 .env.local 中的 DIFY_API_KEY。",
    }
  }
  if (status === 403) {
    return {
      code: parsed?.code || "forbidden",
      message: "没有权限访问该应用或知识库，请确认 API Key 类型与知识库 API 已开启。",
    }
  }
  if (status === 404) {
    return {
      code: parsed?.code || "not_found",
      message: "找不到 Dify 应用或知识库，请确认 DIFY_API_URL 与 DIFY_DATASET_ID。",
    }
  }
  if (status >= 500) {
    return {
      code: parsed?.code || "dify_error",
      message: `Dify 服务异常：${message}`,
    }
  }
  return { code: parsed?.code || "request_failed", message }
}

export function humanizeNetworkError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error)
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(text)) {
    return "无法连接本地 Dify。请确认 /Users/caofan/dify 的 docker compose 已启动，且 DIFY_API_URL=http://127.0.0.1/v1。"
  }
  return text || "请求失败"
}
