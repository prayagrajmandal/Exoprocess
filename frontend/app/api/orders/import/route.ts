import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

const backendUrl = getBackendUrl()

interface ApiSetup {
  provider: string
  baseUrl: string
  authType: string
  clientId: string
  clientSecret: string
  orderEndpoint: string
  syncMethod: string
  orderIdField: string
  customerField: string
  sourceField: string
  destinationField: string
  weightField: string
  volumeField: string
  status: "Draft" | "Connected"
}

interface ImportedOrder {
  id: string
  customer: string
  source: string
  destination: string
  weight: string
  volume: string
  status: string
  createdAt: string
  organization?: string
  orderDate?: string
  pickupDate?: string
  deliveryDate?: string
  notes?: string
  raw?: unknown
}

interface ImportResponse {
  ok: true
  source: "external-api" | "webhook-payload"
  count: number
  orders: ImportedOrder[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (!record) return []
  if (Array.isArray(record.orders)) return record.orders
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.results)) return record.results
  if (record.order) return [record.order]
  return []
}

function readString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key]
  if (value === null || value === undefined) return fallback
  return String(value).trim() || fallback
}

function formatWeight(value: unknown, weightUnit?: string): string {
  if (value === null || value === undefined || value === "") return ""
  const unit = weightUnit?.trim() || "kg"
  return `${value} ${unit}`.trim()
}

function formatVolume(value: unknown): string {
  if (value === null || value === undefined || value === "") return ""
  if (typeof value === "string" && value.trim()) return value.trim()
  return `${value}`
}

function normalizeStatus(value: string): string {
  if (!value) return "Pending"
  const lowered = value.toLowerCase()
  if (lowered === "planned") return "Planned"
  if (lowered === "dispatched") return "Dispatched"
  if (lowered === "pending") return "Pending"
  return lowered.charAt(0).toUpperCase() + lowered.slice(1)
}

function normalizeImportedOrder(record: Record<string, unknown>, setup: ApiSetup, index: number, fallbackOrganization = ""): ImportedOrder {
  const orderDate = readString(record, "orderDate")
  const createdAt = orderDate || readString(record, "createdAt") || new Date().toISOString().slice(0, 10)
  const weightUnit = readString(record, "weightUnit", "kg")

  return {
    id: readString(record, setup.orderIdField) || readString(record, "orderId") || readString(record, "id") || `EXT-${index + 1}`,
    customer: readString(record, setup.customerField) || readString(record, "customer"),
    source: readString(record, setup.sourceField) || readString(record, "source"),
    destination: readString(record, setup.destinationField) || readString(record, "destination"),
    weight: formatWeight(record[setup.weightField] ?? record.weight, weightUnit),
    volume: formatVolume(record[setup.volumeField] ?? record.volume) || "Standard CBM",
    status: normalizeStatus(readString(record, "status", "Pending")),
    createdAt,
    organization: readString(record, "organization", fallbackOrganization),
    orderDate,
    pickupDate: readString(record, "pickupDate"),
    deliveryDate: readString(record, "deliveryDate"),
    notes: readString(record, "notes"),
    raw: record,
  }
}

async function fetchApiSetup(): Promise<ApiSetup> {
  const response = await fetch(new URL("/api/api-setup", backendUrl), {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Unable to load API setup")
  }

  const data = (await response.json()) as { setup?: ApiSetup }
  if (!data.setup) {
    throw new Error("API setup is missing")
  }
  return data.setup
}

function buildExternalHeaders(setup: ApiSetup): Headers {
  const headers = new Headers({
    Accept: "application/json",
  })

  if (setup.authType === "Bearer Token" && setup.clientSecret) {
    headers.set("Authorization", `Bearer ${setup.clientSecret}`)
  } else if (setup.authType === "Basic Auth") {
    const credentials = Buffer.from(`${setup.clientId}:${setup.clientSecret}`).toString("base64")
    headers.set("Authorization", `Basic ${credentials}`)
  } else if (setup.authType === "API Key" && setup.clientSecret) {
    headers.set("x-api-key", setup.clientSecret)
  } else if (setup.authType === "OAuth 2.0 Client Credentials" && setup.clientSecret) {
    headers.set("Authorization", `Bearer ${setup.clientSecret}`)
  }

  return headers
}

function buildExternalUrl(setup: ApiSetup): URL {
  const baseUrl = setup.baseUrl.trim()
  const endpoint = setup.orderEndpoint.trim()

  if (!baseUrl || !endpoint) {
    throw new Error("Base URL or order endpoint is not configured in API Setup")
  }

  return new URL(endpoint, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`)
}

export async function GET() {
  try {
    const setup = await fetchApiSetup()
    const externalUrl = buildExternalUrl(setup)
    const response = await fetch(externalUrl, {
      method: "GET",
      headers: buildExternalHeaders(setup),
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `External system request failed with status ${response.status}`,
          url: externalUrl.toString(),
        },
        { status: response.status === 401 || response.status === 403 ? response.status : 502 }
      )
    }

    const payload = await response.json()
    const rows = asArray(payload)
    const orders = rows
      .map(asRecord)
      .filter((row): row is Record<string, unknown> => row !== null)
      .map((row, index) => normalizeImportedOrder(row, setup, index))

    return NextResponse.json<ImportResponse>({
      ok: true,
      source: "external-api",
      count: orders.length,
      orders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import orders from external system",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const setup = await fetchApiSetup()
    const body = await request.json()
    const record = asRecord(body)

    if (!record) {
      return NextResponse.json({ error: "JSON object body is required" }, { status: 400 })
    }

    const fallbackOrganization = readString(record, "organization")
    const rows = asArray(body)
    const orders = rows
      .map(asRecord)
      .filter((row): row is Record<string, unknown> => row !== null)
      .map((row, index) => normalizeImportedOrder(row, setup, index, fallbackOrganization))

    if (orders.length === 0) {
      return NextResponse.json(
        {
          error: "No order payload found. Send { \"order\": { ... } } or { \"orders\": [ ... ] }",
        },
        { status: 400 }
      )
    }

    const persistResponse = await fetch(new URL("/api/orders/import", backendUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orders }),
      cache: "no-store",
    })

    if (!persistResponse.ok) {
      const errorText = await persistResponse.text()
      return NextResponse.json(
        {
          error: errorText || "Failed to save imported orders",
        },
        { status: persistResponse.status }
      )
    }

    const persisted = (await persistResponse.json()) as { imported?: number; orders?: ImportedOrder[] }

    return NextResponse.json({
      ok: true,
      source: "webhook-payload",
      count: orders.length,
      imported: persisted.imported ?? orders.length,
      orders: persisted.orders ?? orders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to normalize import payload",
      },
      { status: 500 }
    )
  }
}
