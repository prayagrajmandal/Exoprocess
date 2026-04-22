"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface FleetVehicle {
  id: string
  registrationNumber?: string
  ownership?: string
  type: string
  capacity: string
  location: string
  lastService: string
  status: string
  organizationName?: string
}

const FLEET_CACHE_KEY = "tms-fleet-cache"

export function useFleet() {
  const [fleet, setFleet] = useState<FleetVehicle[]>(() => readClientCache<FleetVehicle[]>(FLEET_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<FleetVehicle[]>(FLEET_CACHE_KEY, []).length === 0)

  const syncFleet = useCallback(async () => {
    setIsLoading((current) => current || fleet.length === 0)
    try {
      const response = await fetch("/api/fleet", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      const nextFleet = data.fleet ?? []
      setFleet(nextFleet)
      writeClientCache(FLEET_CACHE_KEY, nextFleet)
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }, [fleet.length])

  useEffect(() => {
    void syncFleet()
  }, [syncFleet])

  const createVehicle = useCallback(async (vehicle: {
    vehicleId?: string
    vehicleType: string
    ownership: string
    vehicleNumber: string
    capacityTon: number
    organization?: string
  }) => {
    const response = await fetch("/api/fleet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle }),
    })
    if (!response.ok) throw new Error("Network error creating vehicle")
    const data = await response.json()
    const nextFleet = data.fleet ?? []
    setFleet(nextFleet)
    writeClientCache(FLEET_CACHE_KEY, nextFleet)
  }, [])

  const updateVehicle = useCallback(async (vehicle: {
    vehicleId: string
    vehicleType: string
    ownership: string
    vehicleNumber: string
    capacityTon: number
    organization?: string
  }) => {
    const response = await fetch("/api/fleet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle }),
    })
    if (!response.ok) throw new Error("Network error updating vehicle")
    const data = await response.json()
    const nextFleet = data.fleet ?? []
    setFleet(nextFleet)
    writeClientCache(FLEET_CACHE_KEY, nextFleet)
  }, [])

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const response = await fetch("/api/fleet", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicleId }),
    })
    if (!response.ok) throw new Error("Network error deleting vehicle")
    const data = await response.json()
    const nextFleet = data.fleet ?? []
    setFleet(nextFleet)
    writeClientCache(FLEET_CACHE_KEY, nextFleet)
  }, [])

  return { fleet, isLoading, refreshFleet: syncFleet, createVehicle, updateVehicle, deleteVehicle }
}
