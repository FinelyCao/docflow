import { getDifyConfig } from "@/lib/env"
import {
  difyFetch,
  jsonError,
  readDifyError,
  requireDatasetConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const config = getDifyConfig()
    requireDatasetConfig(config)

    const batch = new URL(req.url).searchParams.get("batch")
    if (!batch) {
      return Response.json(
        { error: "缺少 batch", code: "missing_batch" },
        { status: 400 }
      )
    }

    const response = await difyFetch(
      `/datasets/${config.datasetId}/documents/${encodeURIComponent(batch)}/indexing-status`,
      { apiKey: config.datasetApiKey }
    )

    if (!response.ok) {
      const error = await readDifyError(response)
      return Response.json(
        { error: error.message, code: error.code },
        { status: response.status }
      )
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    return jsonError(error)
  }
}
