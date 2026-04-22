"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface MaintenanceEntry {
  id: string
  vehicleId: string
  vehicleNumber: string
  maintenanceType: string
  serviceDate: string
  nextDueDate: string
  cost: string
  workshop: string
  spareParts: string
  notes: string
}

const MAINTENANCE_CACHE_KEY = "tms-maintenance-cache"

export function useMaintenance() {
  const [entries, setEntries] = useState<MaintenanceEntry[]>(() => readClientCache<MaintenanceEntry[]>(MAINTENANCE_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<MaintenanceEntry[]>(MAINTENANCE_CACHE_KEY, []).length === 0)

  const refreshEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/maintenance", { cache: "no-store" })
      const data = (await response.json()) as { entries?: MaintenanceEntry[] }
      const nextEntries = data.entries ?? []
      setEntries(nextEntries)
      writeClientCache(MAINTENANCE_CACHE_KEY, nextEntries)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshEntries()
  }, [refreshEntries])

  const createEntry = useCallback(async (entry: {
    vehicleId: string
    vehicleNumber: string
    maintenanceType: string
    serviceDate: string
    nextDueDate: string
    serviceCost: number
    workshop: string
    spareParts: string
    notes: string
  }) => {
    const response = await fetch("/api/maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entry }),
    })
    const data = (await response.json()) as { entries?: MaintenanceEntry[] }
    const nextEntries = data.entries ?? []
    setEntries(nextEntries)
    writeClientCache(MAINTENANCE_CACHE_KEY, nextEntries)
  }, [])

  return { entries, isLoading, createEntry, refreshEntries }
}
