import { getDifyConfig } from "@/lib/env"
import {
  difyFetch,
  jsonError,
  readDifyError,
  requireDatasetConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const config = getDifyConfig()
    requireDatasetConfig(config)
    const { id } = await context.params

    const response = await difyFetch(`/datasets/${config.datasetId}/retry`, {
      method: "POST",
      apiKey: config.datasetApiKey,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: [id] }),
    })

    if (!response.ok) {
      const error = await readDifyError(response)
      return Response.json(
        { error: error.message, code: error.code },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({ ok: true }))
    return Response.json(data)
  } catch (error) {
    return jsonError(error)
  }
}
