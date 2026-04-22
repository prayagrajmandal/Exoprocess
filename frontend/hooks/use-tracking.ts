"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface TrackingVehicle {
  id: string
  vehicleNo?: string | null
  driver: string
  route: string
  progress: number
  speed: number
  plannedSpeed: number
  etaMinutes: number
  haltMinutes: number
  status: string
  heading: string
  zone: string
  checkpoint: string
  routeDeviationKm: number
  lastUpdateSeconds: number
  latitude?: number | null
  longitude?: number | null
  lastSeen?: string
  vehicleType?: string | null
  organizationId?: string | null
}

export interface TrackingStats {
  total: number
  moving: number
  delayed: number
  stopped: number
  avgEtaMinutes: number
  latestUpdate: string
}

type TrackingCache = {
  vehicles: TrackingVehicle[]
  stats: TrackingStats
  source?: string
}

const TRACKING_CACHE_KEY = "tms-tracking-cache"
const DEFAULT_STATS: TrackingStats = {
  total: 0,
  moving: 0,
  delayed: 0,
  stopped: 0,
  avgEtaMinutes: 0,
  latestUpdate: "",
}

export function useTracking() {
  const initialCache = readClientCache<TrackingCache>(TRACKING_CACHE_KEY, {
    vehicles: [],
    stats: DEFAULT_STATS,
    source: "gps_data_m",
  })

  const [vehicles, setVehicles] = useState<TrackingVehicle[]>(initialCache.vehicles)
  const [stats, setStats] = useState<TrackingStats>(initialCache.stats)
  const [source, setSource] = useState(initialCache.source ?? "gps_data_m")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(initialCache.vehicles.length === 0)

  const syncTracking = useCallback(async () => {
    setIsLoading((current) => current || vehicles.length === 0)
    try {
      const response = await fetch("/api/tracking", { cache: "no-store" })
      if (!response.ok) {
        let message = `Tracking feed request failed (${response.status})`

        try {
          const payload = (await response.json()) as { error?: string; message?: string }
          message = payload.error ?? payload.message ?? message
        } catch {
          try {
            const text = await response.text()
            if (text) message = text
          } catch {
            // Ignore response parsing errors and fall back to the status message.
          }
        }

        setError(message)
        return
      }

      const data = (await response.json()) as Partial<TrackingCache>
      const nextVehicles = Array.isArray(data.vehicles) ? data.vehicles : []
      const nextStats = data.stats ?? {
        ...DEFAULT_STATS,
        total: nextVehicles.length,
        moving: nextVehicles.filter((vehicle) => vehicle.status === "Moving").length,
        delayed: nextVehicles.filter((vehicle) => vehicle.status === "Delayed").length,
        stopped: nextVehicles.filter((vehicle) => vehicle.status === "Stopped").length,
        avgEtaMinutes: nextVehicles.length > 0
          ? Math.round(nextVehicles.reduce((sum, vehicle) => sum + vehicle.etaMinutes, 0) / nextVehicles.length)
          : 0,
        latestUpdate: nextVehicles[0]?.lastSeen ?? "",
      }

      setVehicles(nextVehicles)
      setStats(nextStats)
      setSource(data.source ?? "gps_data_m")
      setError("")
      writeClientCache<TrackingCache>(TRACKING_CACHE_KEY, {
        vehicles: nextVehicles,
        stats: nextStats,
        source: data.source ?? "gps_data_m",
      })
    } catch (error) {
      console.error("Failed to fetch tracking feed:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch tracking feed")
    } finally {
      setIsLoading(false)
    }
  }, [vehicles.length])

  useEffect(() => {
    void syncTracking()
    const interval = window.setInterval(() => {
      void syncTracking()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [syncTracking])

  return { vehicles, stats, source, error, isLoading, refreshTracking: syncTracking }
}
