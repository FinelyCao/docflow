import { getDifyConfig } from "@/lib/env"
import {
  buildUploadData,
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

    const { searchParams } = new URL(req.url)
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "50"
    const keyword = searchParams.get("keyword") || ""

    const query = new URLSearchParams({ page, limit })
    if (keyword) query.set("keyword", keyword)

    const response = await difyFetch(
      `/datasets/${config.datasetId}/documents?${query.toString()}`,
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

export async function POST(req: Request) {
  try {
    const config = getDifyConfig()
    requireDatasetConfig(config)

    const incoming = await req.formData()
    const file = incoming.get("file")
    if (!(file instanceof File)) {
      return Response.json(
        { error: "请选择 PDF 或 Markdown 文件", code: "missing_file" },
        { status: 400 }
      )
    }

    const form = new FormData()
    form.append("file", file, file.name)
    form.append("data", buildUploadData())

    const response = await difyFetch(
      `/datasets/${config.datasetId}/document/create-by-file`,
      {
        method: "POST",
        apiKey: config.datasetApiKey,
        body: form,
      }
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
