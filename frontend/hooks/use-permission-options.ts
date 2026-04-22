"use client"

import { useCallback, useEffect, useState } from "react"
import { apiUrl } from "@/lib/api"
import { fetchAdminBootstrap } from "@/lib/admin-bootstrap"
import { accessOptions, type NavAccessItem } from "@/lib/auth"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

const PERMISSION_OPTIONS_CACHE_KEY = "tms-permission-options-cache"

function mergePermissionOptions(options: NavAccessItem[]) {
  const merged = new Map<string, NavAccessItem>()

  for (const option of accessOptions) {
    merged.set(option.route, option)
  }

  for (const option of options) {
    merged.set(option.route, option)
  }

  return Array.from(merged.values()).sort((left, right) => left.label.localeCompare(right.label))
}

export function usePermissionOptions() {
  const [permissionOptions, setPermissionOptions] = useState<NavAccessItem[]>(() =>
    mergePermissionOptions(readClientCache<NavAccessItem[]>(PERMISSION_OPTIONS_CACHE_KEY, []))
  )
  const [isLoading, setIsLoading] = useState(() => readClientCache<NavAccessItem[]>(PERMISSION_OPTIONS_CACHE_KEY, []).length === 0)

  const loadPermissionOptions = useCallback(async () => {
    const cachedOptions = readClientCache<NavAccessItem[]>(PERMISSION_OPTIONS_CACHE_KEY, [])
    if (cachedOptions.length > 0) {
      setPermissionOptions(mergePermissionOptions(cachedOptions))
      setIsLoading(false)
    }
    try {
      const data = await fetchAdminBootstrap(60000)
      const nextOptions = data.permissions ?? []
      setPermissionOptions(mergePermissionOptions(nextOptions))
      writeClientCache(PERMISSION_OPTIONS_CACHE_KEY, nextOptions)
    } catch {
      setPermissionOptions(mergePermissionOptions(cachedOptions))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPermissionOptions()
  }, [loadPermissionOptions])

  return {
    permissionOptions,
    isLoading,
    refreshPermissionOptions: loadPermissionOptions,
  }
}
