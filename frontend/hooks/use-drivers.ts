"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface Driver {
  id: string
  name: string
  phone: string
  license: string
  photo?: string
  tripsToday: number
  rating: number
  status: string
}

const DRIVERS_CACHE_KEY = "tms-drivers-cache"

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>(() => readClientCache<Driver[]>(DRIVERS_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<Driver[]>(DRIVERS_CACHE_KEY, []).length === 0)

  const syncDrivers = useCallback(async () => {
    setIsLoading((current) => current || drivers.length === 0)
    try {
      const response = await fetch("/api/drivers", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      const nextDrivers = data.drivers ?? []
      setDrivers(nextDrivers)
      writeClientCache(DRIVERS_CACHE_KEY, nextDrivers)
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }, [drivers.length])

  useEffect(() => {
    void syncDrivers()
  }, [syncDrivers])

  const createDriver = useCallback(async (driver: {
    name: string
    phone: string
    license: string
    photo?: string
    email?: string
    status?: string
    organization?: string
  }) => {
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driver }),
    })
    if (!response.ok) throw new Error("Network error creating driver")
    const data = await response.json()
    const nextDrivers = data.drivers ?? []
    setDrivers(nextDrivers)
    writeClientCache(DRIVERS_CACHE_KEY, nextDrivers)
  }, [])

  const updateDriver = useCallback(async (driver: {
    driverId: string
    name: string
    phone: string
    license: string
    photo?: string
    email?: string
    status?: string
    organization?: string
  }) => {
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driver }),
    })
    if (!response.ok) throw new Error("Network error updating driver")
    const data = await response.json()
    const nextDrivers = data.drivers ?? []
    setDrivers(nextDrivers)
    writeClientCache(DRIVERS_CACHE_KEY, nextDrivers)
  }, [])

  const deleteDriver = useCallback(async (driverId: string) => {
    const response = await fetch("/api/drivers", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverId }),
    })
    if (!response.ok) throw new Error("Network error deleting driver")
    const data = await response.json()
    const nextDrivers = data.drivers ?? []
    setDrivers(nextDrivers)
    writeClientCache(DRIVERS_CACHE_KEY, nextDrivers)
  }, [])

  return { drivers, isLoading, refreshDrivers: syncDrivers, createDriver, updateDriver, deleteDriver }
}
