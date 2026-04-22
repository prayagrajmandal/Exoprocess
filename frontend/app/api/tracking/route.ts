import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const backendUrl = getBackendUrl()
const REQUEST_TIMEOUT_MS = 45_000

async function fetchWithTimeout(input: URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(new Error(`Upstream request timed out after ${timeoutMs}ms`)), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(request: Request) {
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL("/api/tracking", backendUrl)
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")

  try {
    const response = await fetchWithTimeout(
      targetUrl,
      {
        method: "GET",
        headers,
        redirect: "manual",
      },
      REQUEST_TIMEOUT_MS
    )

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")
    responseHeaders.delete("transfer-encoding")

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Backend proxy request failed",
        backendUrl,
        target: targetUrl.toString(),
      },
      { status: 502 }
    )
  }
}
