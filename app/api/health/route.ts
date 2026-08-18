import { getDifyConfig } from "@/lib/env"
import { difyFetch } from "@/lib/dify-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const config = getDifyConfig()
  const configured = Boolean(config.apiKey)
  const datasetConfigured = Boolean(config.datasetApiKey && config.datasetId)

  let reachable = false
  let appName = ""
  let error = ""

  if (configured) {
    try {
      const response = await difyFetch("/info")
      reachable = response.ok
      if (response.ok) {
        const data = (await response.json()) as { name?: string }
        appName = data.name || ""
      } else if (response.status === 401) {
        error = "DIFY_API_KEY 无效"
      } else {
        error = `Dify 返回 ${response.status}`
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "无法连接 Dify"
    }
  }

  return Response.json({
    configured,
    datasetConfigured,
    reachable,
    appName,
    difyUrl: config.apiUrl,
    hasAppKey: Boolean(config.apiKey),
    hasDatasetKey: Boolean(config.datasetApiKey),
    hasDatasetId: Boolean(config.datasetId),
    refusalThreshold: config.refusalThreshold,
    error: error || undefined,
  })
}
