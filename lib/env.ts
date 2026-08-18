export type DifyConfig = {
  apiUrl: string
  apiKey: string
  datasetApiKey: string
  datasetId: string
  user: string
  refusalThreshold: number
  indexingTechnique: "high_quality" | "economy"
}

export function getDifyConfig(): DifyConfig {
  const apiUrl = (process.env.DIFY_API_URL || "http://127.0.0.1/v1").replace(
    /\/$/,
    ""
  )
  const apiKey = process.env.DIFY_API_KEY?.trim() || ""
  const datasetApiKey =
    process.env.DIFY_DATASET_API_KEY?.trim() || apiKey
  const datasetId = process.env.DIFY_DATASET_ID?.trim() || ""
  const user = process.env.DIFY_USER?.trim() || "docflow-demo"
  const refusalThreshold = Number(process.env.REFUSAL_SCORE_THRESHOLD || "0.6")
  const indexingTechnique =
    process.env.DIFY_INDEXING_TECHNIQUE === "economy"
      ? "economy"
      : "high_quality"

  return {
    apiUrl,
    apiKey,
    datasetApiKey,
    datasetId,
    user,
    refusalThreshold: Number.isFinite(refusalThreshold) ? refusalThreshold : 0.6,
    indexingTechnique,
  }
}

export function getChatProcessRule() {
  return {
    mode: "custom" as const,
    rules: {
      pre_processing_rules: [
        { id: "remove_extra_spaces", enabled: true },
        { id: "remove_urls_emails", enabled: false },
      ],
      segmentation: {
        separator: "\n## ",
        max_tokens: 500,
        chunk_overlap: 100,
      },
    },
  }
}
