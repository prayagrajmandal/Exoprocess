"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface TransportRoute {
  id: string
  routeName: string
  start: string
  end: string
  distanceKm: number
  estTime: string
  vehicleType: string
  viaPoints: string
  color: string
}

const ROUTE_MAPS_CACHE_KEY = "tms-route-maps-cache"

export function useRouteMaps() {
  const [routes, setRoutes] = useState<TransportRoute[]>(() => readClientCache<TransportRoute[]>(ROUTE_MAPS_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<TransportRoute[]>(ROUTE_MAPS_CACHE_KEY, []).length === 0)

  const refreshRoutes = useCallback(async () => {
    try {
      const response = await fetch("/api/routes-map", { cache: "no-store" })
      const data = (await response.json()) as { routes?: TransportRoute[] }
      const nextRoutes = data.routes ?? []
      setRoutes(nextRoutes)
      writeClientCache(ROUTE_MAPS_CACHE_KEY, nextRoutes)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshRoutes()
  }, [refreshRoutes])

  const createRoute = useCallback(async (route: Omit<TransportRoute, "id" | "color">) => {
    const response = await fetch("/api/routes-map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route }),
    })
    const data = (await response.json()) as { routes?: TransportRoute[] }
    const nextRoutes = data.routes ?? []
    setRoutes(nextRoutes)
    writeClientCache(ROUTE_MAPS_CACHE_KEY, nextRoutes)
  }, [])

  return { routes, isLoading, createRoute, refreshRoutes }
}
