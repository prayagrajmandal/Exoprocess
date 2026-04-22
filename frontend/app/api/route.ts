import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    service: "tms-frontend",
    ok: true,
    message: "API proxy is available. Use /api/* routes for backend access.",
  })
}
