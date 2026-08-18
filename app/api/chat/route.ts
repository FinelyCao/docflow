import { getDifyConfig } from "@/lib/env"
import {
  difyFetch,
  jsonError,
  readDifyError,
  requireChatConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const config = getDifyConfig()
    requireChatConfig(config)

    const body = (await req.json()) as {
      query?: string
      conversation_id?: string
    }
    const query = body.query?.trim()
    if (!query) {
      return Response.json(
        { error: "请输入问题", code: "empty_query" },
        { status: 400 }
      )
    }

    const response = await difyFetch("/chat-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        inputs: {},
        response_mode: "streaming",
        conversation_id: body.conversation_id || "",
        user: config.user,
      }),
    })

    if (!response.ok || !response.body) {
      const error = await readDifyError(response)
      return Response.json(
        { error: error.message, code: error.code },
        { status: response.status }
      )
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    return jsonError(error)
  }
}
