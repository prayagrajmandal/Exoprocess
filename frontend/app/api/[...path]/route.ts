import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

const backendUrl = getBackendUrl()
const REQUEST_TIMEOUT_MS = 45_000
const RETRY_DELAY_MS = 350

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isIdempotentMethod(method: string): boolean {
  return method === "GET" || method === "HEAD"
}

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

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(`/api/${path.join("/")}`, backendUrl)
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  let requestBody: ArrayBuffer | undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    requestBody = await request.arrayBuffer()
    init.body = requestBody
  }

  try {
    let response = await fetchWithTimeout(targetUrl, init, REQUEST_TIMEOUT_MS)

    if (!response.ok && isIdempotentMethod(request.method) && response.status >= 500) {
      await delay(RETRY_DELAY_MS)
      response = await fetchWithTimeout(
        targetUrl,
        {
          ...init,
          body: requestBody,
        },
        REQUEST_TIMEOUT_MS
      )
    }

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

export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}
