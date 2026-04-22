"use client"

import { useCallback, useEffect, useState } from "react"
import { getOrganizations, storeOrganizations, ORGANIZATION_EVENT_NAME, type OrganizationConfig } from "@/lib/auth"
import { fetchAdminBootstrap } from "@/lib/admin-bootstrap"
import { apiUrl } from "@/lib/api"

function getOrganizationFetchErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Loading organizations timed out. Check that the FastAPI backend is running and that its database connection is reachable."
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return "Failed to load organizations from the database."
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationConfig[]>(() => getOrganizations())
  const [isLoading, setIsLoading] = useState(() => getOrganizations().length === 0)
  const [error, setError] = useState("")
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false)

  const syncOrganizations = useCallback(async () => {
    const cachedOrganizations = getOrganizations()
    if (cachedOrganizations.length > 0) {
      setOrganizations(cachedOrganizations)
      setIsLoading(false)
    }
    try {
      setError("")
      const data = await fetchAdminBootstrap(60000)
      const nextOrganizations = data.organizations ?? []
      setOrganizations(nextOrganizations)
      storeOrganizations(nextOrganizations, false)
      setIsUsingFallbackData(false)
    } catch (caughtError) {
      setOrganizations(cachedOrganizations)
      setIsUsingFallbackData(cachedOrganizations.length > 0)
      setError(getOrganizationFetchErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncOrganizations()
    window.addEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)

    return () => {
      window.removeEventListener(ORGANIZATION_EVENT_NAME, syncOrganizations)
    }
  }, [syncOrganizations])

  const saveOrganizations = useCallback(async (nextOrganizations: OrganizationConfig[]) => {
    const response = await fetch(apiUrl("/api/organizations"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizations: nextOrganizations }),
    })
    if (!response.ok) {
      throw new Error(`Failed to save organizations (${response.status})`)
    }
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    const savedOrganizations = data.organizations ?? nextOrganizations
    setOrganizations(savedOrganizations)
    storeOrganizations(savedOrganizations, false)
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  const saveOrganization = useCallback(async (organization: OrganizationConfig) => {
    let response = await fetch(apiUrl("/api/organizations/save"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization }),
    })
    if (response.status === 404) {
      const currentOrganizations = organizations.length > 0 ? organizations : getOrganizations()
      const nextOrganizations = currentOrganizations.some(
        (item) => item.name.toLowerCase() === organization.name.toLowerCase()
      )
        ? currentOrganizations.map((item) =>
            item.name.toLowerCase() === organization.name.toLowerCase() ? organization : item
          )
        : [...currentOrganizations, organization]

      response = await fetch(apiUrl("/api/organizations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizations: nextOrganizations }),
      })
    }
    if (!response.ok) {
      throw new Error(`Failed to save organization (${response.status})`)
    }
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    const savedOrganizations = data.organizations ?? []
    setOrganizations(savedOrganizations)
    storeOrganizations(savedOrganizations, false)
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
    void syncOrganizations()
  }, [organizations, syncOrganizations])

  const resetOrganizations = useCallback(async () => {
    const response = await fetch(apiUrl("/api/organizations/reset"), {
      method: "POST",
    })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    const nextOrganizations = data.organizations ?? []
    setOrganizations(nextOrganizations)
    storeOrganizations(nextOrganizations, false)
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  const deleteOrganization = useCallback(async (organizationName: string) => {
    const response = await fetch(apiUrl("/api/organizations"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationName }),
    })
    const data = (await response.json()) as { organizations?: OrganizationConfig[] }
    const nextOrganizations = data.organizations ?? []
    setOrganizations(nextOrganizations)
    storeOrganizations(nextOrganizations, false)
    window.dispatchEvent(new Event(ORGANIZATION_EVENT_NAME))
  }, [])

  return {
    organizations,
    isLoading,
    error,
    isUsingFallbackData,
    saveOrganizations,
    saveOrganization,
    resetOrganizations,
    deleteOrganization,
    refreshOrganizations: syncOrganizations,
  }
}
