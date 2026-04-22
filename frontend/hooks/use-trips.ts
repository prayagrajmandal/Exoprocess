"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface ActiveTrip {
  id: string
  vehicle: string
  driver: string
  route: string
  eta: string
  status: string
}

export interface CompletedTrip {
  id: string
  vehicle: string
  driver: string
  distance: string
  completedAt: string
}

const TRIPS_CACHE_KEY = "tms-trips-cache"

type TripsCache = {
  activeTrips: ActiveTrip[]
  completedTrips: CompletedTrip[]
}

export function useTrips() {
  const [cachedTrips] = useState<TripsCache>(() => readClientCache<TripsCache>(TRIPS_CACHE_KEY, { activeTrips: [], completedTrips: [] }))
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>(cachedTrips.activeTrips)
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>(cachedTrips.completedTrips)
  const [isLoading, setIsLoading] = useState(cachedTrips.activeTrips.length === 0 && cachedTrips.completedTrips.length === 0)

  const syncTrips = useCallback(async () => {
    setIsLoading((current) => current || (activeTrips.length === 0 && completedTrips.length === 0))
    try {
      const response = await fetch("/api/trips", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      const nextActiveTrips = data.activeTrips ?? []
      const nextCompletedTrips = data.completedTrips ?? []
      setActiveTrips(nextActiveTrips)
      setCompletedTrips(nextCompletedTrips)
      writeClientCache(TRIPS_CACHE_KEY, {
        activeTrips: nextActiveTrips,
        completedTrips: nextCompletedTrips,
      })
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }, [activeTrips.length, completedTrips.length])

  useEffect(() => {
    void syncTrips()
  }, [syncTrips])

  return { activeTrips, completedTrips, isLoading, refreshTrips: syncTrips }
}
