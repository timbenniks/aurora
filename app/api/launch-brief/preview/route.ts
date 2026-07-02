import { NextResponse } from "next/server"

import { exampleLaunchBrief } from "@/lib/aurora/example-launch-brief"
import { generateAllFiles, generateIssueBodies, getDefaultLabels } from "@/lib/aurora/generate-files"
import {
  parseLaunchBriefJson,
  validateLaunchBrief,
} from "@/lib/aurora/validate-launch-brief"

type PreviewRequestBody = {
  json?: unknown
}

export async function POST(request: Request) {
  let body: PreviewRequestBody

  try {
    body = (await request.json()) as PreviewRequestBody
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  const parsed = parseLaunchBriefJson(body.json ?? exampleLaunchBrief)
  if (parsed.error) {
    return NextResponse.json(
      { valid: false, errors: [parsed.error], warnings: [] },
      { status: 400 }
    )
  }

  const validation = validateLaunchBrief(parsed.data)
  if (!validation.valid || !validation.normalized) {
    return NextResponse.json({
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary,
    })
  }

  const brief = validation.normalized

  return NextResponse.json({
    valid: true,
    errors: [],
    warnings: validation.warnings,
    summary: validation.summary,
    files: generateAllFiles(brief),
    issues: generateIssueBodies(brief),
    labels: getDefaultLabels(),
    milestones: brief.milestones,
  })
}
