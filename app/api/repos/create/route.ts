import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Use POST /api/workspaces/create-from-brief with a launch_brief body.",
      code: "deprecated_endpoint",
    },
    { status: 410 }
  )
}
