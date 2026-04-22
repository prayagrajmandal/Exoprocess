const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"

function normalizeBackendUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return DEFAULT_BACKEND_URL

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `http://${trimmed}`
}

export function getBackendUrl(): string {
  return normalizeBackendUrl(process.env.BACKEND_URL)
}
