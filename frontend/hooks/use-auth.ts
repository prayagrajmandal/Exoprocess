"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AUTH_EVENT_NAME,
  USER_DIRECTORY_EVENT_NAME,
  clearStoredSessionToken,
  clearStoredSessionSnapshot,
  decodeLocalSessionToken,
  encodeLocalSessionToken,
  getStoredSessionSnapshot,
  getUserDirectory,
  getStoredSessionToken,
  getDefaultEditRoutesForRoles,
  normalizeAccessRoutes,
  normalizeRoles,
  storeSessionSnapshot,
  storeSessionToken,
  type AuthSession,
} from "@/lib/auth"
import { apiUrl } from "@/lib/api"

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncSession = useCallback(async () => {
    const token = getStoredSessionToken()
    if (!token) {
      setSession(null)
      setIsLoading(false)
      return
    }

    const localSession = decodeLocalSessionToken(token)
    if (localSession) {
      const latestUser = getUserDirectory().find(
        (user) =>
          user.organization.toLowerCase() === localSession.organization.toLowerCase() &&
          user.userId.toLowerCase() === localSession.userId.toLowerCase()
      )

      const nextSession = latestUser
        ? {
            userId: latestUser.userId,
            name: latestUser.name,
            roles: normalizeRoles(latestUser.roles),
            accessRoutes: normalizeAccessRoutes(latestUser.accessRoutes, latestUser.roles),
            editRoutes: Array.from(
              new Set([...getDefaultEditRoutesForRoles(normalizeRoles(latestUser.roles)), ...(latestUser.editRoutes?.filter(Boolean) ?? [])])
            ),
            organization: latestUser.organization,
          }
        : localSession

      const nextToken = encodeLocalSessionToken(nextSession)
      if (nextToken !== token) {
        storeSessionToken(nextToken)
      }

      setSession(nextSession)
      setIsLoading(false)
      return
    }

    const cachedSession = getStoredSessionSnapshot(token)
    if (cachedSession) {
      setSession(cachedSession)
      setIsLoading(false)
    }

    const response = await fetch(apiUrl(`/api/auth/session?token=${encodeURIComponent(token)}`), {
      cache: "no-store",
    })

    if (!response.ok) {
      clearStoredSessionToken()
      clearStoredSessionSnapshot()
      setSession(null)
      setIsLoading(false)
      return
    }

    const data = (await response.json()) as { session?: AuthSession | null }
    if (data.session) {
      storeSessionSnapshot(token, data.session)
    } else {
      clearStoredSessionSnapshot()
    }
    setSession(data.session ?? null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncSession()
    window.addEventListener(AUTH_EVENT_NAME, syncSession)
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncSession)

    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, syncSession)
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncSession)
    }
  }, [syncSession])

  const logout = useCallback(() => {
    const token = getStoredSessionToken()
    clearStoredSessionToken()
    clearStoredSessionSnapshot()
    setSession(null)
    setIsLoading(false)

    if (token) {
      void fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
    }
  }, [])

  return {
    session,
    isLoading,
    logout,
    refreshSession: syncSession,
  }
}
