import { getDifyConfig } from "@/lib/env"
import {
  difyFetch,
  jsonError,
  readDifyError,
  requireDatasetConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const config = getDifyConfig()
    requireDatasetConfig(config)
    const { id } = await context.params

    const response = await difyFetch(
      `/datasets/${config.datasetId}/documents/${id}`,
      { method: "DELETE", apiKey: config.datasetApiKey }
    )

    if (!response.ok && response.status !== 204) {
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
