"use client"

import { useCallback, useEffect, useState } from "react"
import { getUserDirectory, storeUserDirectory, type DemoUser, USER_DIRECTORY_EVENT_NAME } from "@/lib/auth"
import { fetchAdminBootstrap } from "@/lib/admin-bootstrap"
import { apiUrl } from "@/lib/api"

function getUserDirectoryErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Loading users timed out. Check that the FastAPI backend is running and that its database connection is reachable."
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return "Failed to load users from the database."
}

export function useUserDirectory() {
  const [users, setUsers] = useState<DemoUser[]>(() => getUserDirectory())
  const [isLoading, setIsLoading] = useState(() => getUserDirectory().length === 0)
  const [error, setError] = useState("")

  const syncUsers = useCallback(async () => {
    const cachedUsers = getUserDirectory()
    if (cachedUsers.length > 0) {
      setUsers(cachedUsers)
      setIsLoading(false)
    }
    try {
      setError("")
      const data = await fetchAdminBootstrap(60000)
      const nextUsers = data.users ?? []
      setUsers(nextUsers)
      storeUserDirectory(nextUsers, false)
    } catch (caughtError) {
      setUsers(cachedUsers)
      setError(getUserDirectoryErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncUsers()
    window.addEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)

    return () => {
      window.removeEventListener(USER_DIRECTORY_EVENT_NAME, syncUsers)
    }
  }, [syncUsers])

  const saveUsers = useCallback(async (nextUsers: DemoUser[]) => {
    const response = await fetch(apiUrl("/api/users"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: nextUsers }),
    })
    if (!response.ok) {
      throw new Error(`Failed to save users (${response.status})`)
    }
    const data = (await response.json()) as { users?: DemoUser[] }
    const savedUsers = data.users ?? nextUsers
    setUsers(savedUsers)
    storeUserDirectory(savedUsers, false)
  }, [])

  const saveUserAccess = useCallback(async (organization: string, userId: string, accessRoutes: DemoUser["accessRoutes"]) => {
    const response = await fetch(apiUrl("/api/users/access"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization, userId, accessRoutes }),
    })
    if (!response.ok) {
      throw new Error(`Failed to save user access (${response.status})`)
    }
    const data = (await response.json()) as { users?: DemoUser[] }
    const savedUsers = data.users ?? users
    setUsers(savedUsers)
    storeUserDirectory(savedUsers, false)
  }, [users])

  const saveUserEditAccess = useCallback(async (organization: string, userId: string, editRoutes: DemoUser["editRoutes"]) => {
    const response = await fetch(apiUrl("/api/users/edit-access"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization, userId, editRoutes }),
    })
    if (!response.ok) {
      throw new Error(`Failed to save user edit access (${response.status})`)
    }
    const data = (await response.json()) as { users?: DemoUser[] }
    const savedUsers = data.users ?? users
    setUsers(savedUsers)
    storeUserDirectory(savedUsers, false)
  }, [users])

  const resetUsers = useCallback(async () => {
    const response = await fetch(apiUrl("/api/users/reset"), {
      method: "POST",
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    const nextUsers = data.users ?? []
    setUsers(nextUsers)
    storeUserDirectory(nextUsers, false)
  }, [])

  const deleteUser = useCallback(async (organization: string, userId: string) => {
    const response = await fetch(apiUrl("/api/users"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organization, userId }),
    })
    const data = (await response.json()) as { users?: DemoUser[] }
    const nextUsers = data.users ?? []
    setUsers(nextUsers)
    storeUserDirectory(nextUsers, false)
  }, [])

  return {
    users,
    isLoading,
    error,
    saveUsers,
    saveUserAccess,
    saveUserEditAccess,
    resetUsers,
    deleteUser,
    refreshUsers: syncUsers,
  }
}
