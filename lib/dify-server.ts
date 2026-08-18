import {
  getChatProcessRule,
  getDifyConfig,
  type DifyConfig,
} from "@/lib/env"
import { humanizeDifyError, humanizeNetworkError } from "@/lib/dify"

export function requireChatConfig(config: DifyConfig) {
  if (!config.apiKey) {
    throw Object.assign(new Error("尚未配置 DIFY_API_KEY。"), {
      status: 503,
      code: "not_configured",
    })
  }
}

export function requireDatasetConfig(config: DifyConfig) {
  if (!config.datasetApiKey) {
    throw Object.assign(new Error("尚未配置 DIFY_DATASET_API_KEY。"), {
      status: 503,
      code: "not_configured",
    })
  }
  if (!config.datasetId) {
    throw Object.assign(new Error("尚未配置 DIFY_DATASET_ID。"), {
      status: 503,
      code: "not_configured",
    })
  }
}

export async function difyFetch(
  path: string,
  init: RequestInit & { apiKey?: string } = {}
) {
  const config = getDifyConfig()
  const { apiKey = config.apiKey, ...rest } = init
  const url = `${config.apiUrl}${path.startsWith("/") ? path : `/${path}`}`

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(rest.headers || {}),
      },
    })
    return response
  } catch (error) {
    throw Object.assign(new Error(humanizeNetworkError(error)), {
      status: 502,
      code: "dify_unreachable",
    })
  }
}

export async function readDifyError(response: Response) {
  const body = await response.text()
  return humanizeDifyError(response.status, body)
}

export function jsonError(error: unknown, fallbackStatus = 500) {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: number }).status) || fallbackStatus
      : fallbackStatus
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "internal_error"
  const message = error instanceof Error ? error.message : "服务器内部错误"
  return Response.json({ error: message, code }, { status })
}

export function buildUploadData() {
  const config = getDifyConfig()
  return JSON.stringify({
    indexing_technique: config.indexingTechnique,
    doc_form: "text_model",
    doc_language: "Chinese",
    process_rule: getChatProcessRule(),
  })
}
