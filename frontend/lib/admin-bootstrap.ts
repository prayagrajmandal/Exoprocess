"use client"

import { apiUrl } from "@/lib/api"
import type { DemoUser, NavAccessItem, OrganizationConfig } from "@/lib/auth"

export interface AdminBootstrapPayload {
  users?: DemoUser[]
  organizations?: OrganizationConfig[]
  permissions?: NavAccessItem[]
}

let bootstrapPromise: Promise<AdminBootstrapPayload> | null = null

async function fetchJsonWithTimeout<T>(path: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(apiUrl(path), {
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to load ${path} (${response.status})`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function fetchLegacyAdminData(timeoutMs: number): Promise<AdminBootstrapPayload> {
  const [usersData, organizationsData, permissionsData] = await Promise.all([
    fetchJsonWithTimeout<{ users?: DemoUser[] }>("/api/users", timeoutMs),
    fetchJsonWithTimeout<{ organizations?: OrganizationConfig[] }>("/api/organizations", timeoutMs),
    fetchJsonWithTimeout<{ permissions?: NavAccessItem[] }>("/api/permissions", timeoutMs),
  ])

  return {
    users: usersData.users ?? [],
    organizations: organizationsData.organizations ?? [],
    permissions: permissionsData.permissions ?? [],
  }
}

export async function fetchAdminBootstrap(timeoutMs = 60_000): Promise<AdminBootstrapPayload> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(apiUrl("/api/admin/bootstrap"), {
          cache: "no-store",
          signal: controller.signal,
        })

        if (response.status === 404) {
          return await fetchLegacyAdminData(timeoutMs)
        }

        if (!response.ok) {
          throw new Error(`Failed to load admin bootstrap (${response.status})`)
        }

        return (await response.json()) as AdminBootstrapPayload
      } finally {
        window.clearTimeout(timeoutId)
        bootstrapPromise = null
      }
    })()
  }

  return bootstrapPromise
}
