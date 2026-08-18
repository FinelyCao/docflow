import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { getDifyConfig } from "@/lib/env"
import {
  buildUploadData,
  difyFetch,
  jsonError,
  readDifyError,
  requireDatasetConfig,
} from "@/lib/dify-server"

export const runtime = "nodejs"

const ALLOWED_EXT = new Set([".md", ".txt", ".pdf", ".markdown"])

export async function POST() {
  try {
    const config = getDifyConfig()
    requireDatasetConfig(config)

    const samplesDir = path.join(process.cwd(), "samples")
    const files = (await readdir(samplesDir)).filter(
      (name) =>
        /^\d{2}-/.test(name) && ALLOWED_EXT.has(path.extname(name).toLowerCase())
    )

    const uploaded: Array<{ name: string; documentId?: string; batch?: string }> =
      []
    const failed: Array<{ name: string; error: string }> = []

    for (const name of files) {
      const bytes = await readFile(path.join(samplesDir, name))
      const file = new File([bytes], name, {
        type: name.endsWith(".pdf") ? "application/pdf" : "text/markdown",
      })
      const form = new FormData()
      form.append("file", file, name)
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
        failed.push({ name, error: error.message })
        continue
      }

      const data = (await response.json()) as {
        document?: { id?: string }
        batch?: string
      }
      uploaded.push({
        name,
        documentId: data.document?.id,
        batch: data.batch,
      })
    }

    return Response.json({ uploaded, failed, total: files.length })
  } catch (error) {
    return jsonError(error)
  }
}
