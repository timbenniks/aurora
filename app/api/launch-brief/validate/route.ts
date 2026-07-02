import { NextResponse } from "next/server"

import {
  parseLaunchBriefJson,
  validateLaunchBrief,
} from "@/lib/aurora/validate-launch-brief"

type ValidateRequestBody = {
  json?: unknown
}

export async function POST(request: Request) {
  let body: ValidateRequestBody

  try {
    body = (await request.json()) as ValidateRequestBody
  } catch {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            code: "invalid_request",
            message: "Request body must be valid JSON.",
            path: "",
          },
        ],
        warnings: [],
      },
      { status: 400 }
    )
  }

  if (body.json === undefined) {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            code: "missing_json",
            message: 'Request body must include a "json" field.',
            path: "json",
          },
        ],
        warnings: [],
      },
      { status: 400 }
    )
  }

  const parsed = parseLaunchBriefJson(body.json)

  if (parsed.error) {
    return NextResponse.json({
      valid: false,
      errors: [parsed.error],
      warnings: [],
    })
  }

  const result = validateLaunchBrief(parsed.data)

  return NextResponse.json({
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    summary: result.summary,
  })
}
