import { getDifyConfig } from "@/lib/env"
import {
  difyFetch,
  jsonError,
  readDifyError,
  requireChatConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const config = getDifyConfig()
    requireChatConfig(config)

    const body = (await req.json()) as { task_id?: string }
    if (!body.task_id) {
      return Response.json(
        { error: "缺少 task_id", code: "missing_task" },
        { status: 400 }
      )
    }

    const response = await difyFetch(
      `/chat-messages/${encodeURIComponent(body.task_id)}/stop`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: config.user }),
      }
    )

    if (!response.ok) {
      const error = await readDifyError(response)
      return Response.json(
        { error: error.message, code: error.code },
        { status: response.status }
      )
    }

    return Response.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
