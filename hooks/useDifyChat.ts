"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  detectRefusal,
  extractAnswerDelta,
  isKnowledgeNode,
  parseSseBlock,
  type ChatMessage,
  type ChatStatus,
  type RetrieverResource,
} from "@/lib/dify"

const SESSION_KEY = "docflow-session"
const REFUSAL_THRESHOLD = 0.6

type SessionSnapshot = {
  conversationId: string | null
  messages: ChatMessage[]
}

function createId() {
  return crypto.randomUUID()
}

export function useDifyChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const taskIdRef = useRef<string | null>(null)
  const conversationRef = useRef<string | null>(null)
  const lastQueryRef = useRef("")
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    conversationRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    queueMicrotask(() => {
      if (raw) {
        try {
          const snapshot = JSON.parse(raw) as SessionSnapshot
          setMessages(snapshot.messages || [])
          setConversationId(snapshot.conversationId)
        } catch {
          // ignore broken session cache
        }
      }
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const snapshot: SessionSnapshot = { conversationId, messages }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
  }, [conversationId, messages, hydrated])

  const updateAssistant = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      )
    },
    []
  )

  const stop = useCallback(async () => {
    abortRef.current?.abort()
    const taskId = taskIdRef.current
    if (taskId) {
      try {
        await fetch("/api/chat/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId }),
        })
      } catch {
        // 停止失败不阻断 UI
      }
    }
    setStatus((current) => (current === "streaming" || current === "retrieving" ? "done" : current))
  }, [])

  const send = useCallback(
    async (query: string, options?: { replaceAssistantId?: string }) => {
      const text = query.trim()
      if (!text) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      lastQueryRef.current = text
      setError(null)
      setStatus("retrieving")

      const assistantId = options?.replaceAssistantId || createId()
      const startedAt = performance.now()
      let firstTokenMs: number | undefined
      let content = ""
      let citations: RetrieverResource[] | undefined
      let buffer = ""

      if (!options?.replaceAssistantId) {
        const userMessage: ChatMessage = {
          id: createId(),
          role: "user",
          content: text,
          createdAt: Date.now(),
        }
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: "",
          status: "retrieving",
          createdAt: Date.now(),
        }
        setMessages((prev) => [...prev, userMessage, assistantMessage])
      } else {
        updateAssistant(assistantId, {
          content: "",
          status: "retrieving",
          error: undefined,
          errorCode: undefined,
          citations: [],
          refused: false,
          refusalReason: "",
          firstTokenMs: undefined,
        })
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: text,
            conversation_id: conversationRef.current || "",
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string
            code?: string
          }
          throw Object.assign(
            new Error(payload.error || `请求失败（${response.status}）`),
            { code: payload.code || String(response.status) }
          )
        }

        if (!response.body) {
          throw new Error("Dify 没有返回流式响应")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split("\n\n")
          buffer = chunks.pop() || ""

          for (const block of chunks) {
            const event = parseSseBlock(block)
            if (!event) continue
            if (event.task_id) taskIdRef.current = event.task_id
            if (event.conversation_id) {
              conversationRef.current = event.conversation_id
              setConversationId(event.conversation_id)
            }

            if (event.event === "error") {
              throw Object.assign(new Error(event.message || "Dify 生成失败"), {
                code: event.code || "dify_stream_error",
              })
            }

            if (event.event === "node_started" && isKnowledgeNode(event)) {
              setStatus("retrieving")
              updateAssistant(assistantId, { status: "retrieving" })
            }

            if (event.event === "message_replace") {
              content = event.answer || content
            } else {
              content += extractAnswerDelta(event)
            }

            if (extractAnswerDelta(event) || event.event === "message_replace") {
              if (firstTokenMs === undefined) {
                firstTokenMs = Math.round(performance.now() - startedAt)
              }
              setStatus("streaming")
              updateAssistant(assistantId, {
                content,
                status: "streaming",
                firstTokenMs,
              })
            }

            if (event.event === "message_end") {
              citations = event.metadata?.retriever_resources
            }
          }
        }

        const decision = detectRefusal(content, citations, REFUSAL_THRESHOLD)
        const nextStatus: ChatStatus = decision.refused ? "refused" : "done"
        updateAssistant(assistantId, {
          content,
          citations,
          status: nextStatus,
          refused: decision.refused,
          refusalReason: decision.reason,
          firstTokenMs,
        })
        setStatus(nextStatus)
      } catch (err) {
        if (controller.signal.aborted) {
          updateAssistant(assistantId, {
            content: content || "已停止生成。",
            status: "done",
            citations,
          })
          setStatus("done")
          return
        }
        const message = err instanceof Error ? err.message : "请求失败"
        const code =
          typeof err === "object" && err && "code" in err
            ? String((err as { code: string }).code)
            : "error"
        setError(message)
        setStatus("error")
        updateAssistant(assistantId, {
          content: content,
          status: "error",
          error: message,
          errorCode: code,
          citations,
        })
      } finally {
        taskIdRef.current = null
      }
    },
    [updateAssistant]
  )

  const retry = useCallback(() => {
    const lastAssistant = [...messagesRef.current]
      .reverse()
      .find((item) => item.role === "assistant")
    const lastUser = [...messagesRef.current]
      .reverse()
      .find((item) => item.role === "user")
    if (!lastUser) return
    void send(lastUser.content, {
      replaceAssistantId: lastAssistant?.id,
    })
  }, [send])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    conversationRef.current = null
    setStatus("idle")
    setError(null)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return {
    messages,
    status,
    error,
    conversationId,
    isBusy: status === "retrieving" || status === "streaming",
    send,
    stop,
    retry,
    reset,
  }
}
