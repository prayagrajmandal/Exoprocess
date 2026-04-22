"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"
import { type VehicleAssignment } from "@/lib/vehicle-assignments"

const VEHICLE_ASSIGNMENTS_CACHE_KEY = "tms-vehicle-assignments-cache"

export function useVehicleAssignments() {
  const [assignments, setAssignments] = useState<VehicleAssignment[]>(() => readClientCache<VehicleAssignment[]>(VEHICLE_ASSIGNMENTS_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<VehicleAssignment[]>(VEHICLE_ASSIGNMENTS_CACHE_KEY, []).length === 0)

  const syncAssignments = useCallback(async () => {
    try {
      const response = await fetch("/api/vehicle-assignments", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`)
      }
      const data = (await response.json()) as { assignments?: VehicleAssignment[] }
      const nextAssignments = data.assignments ?? []
      setAssignments(nextAssignments)
      writeClientCache(VEHICLE_ASSIGNMENTS_CACHE_KEY, nextAssignments)
    } catch (error) {
      console.error("Error syncing assignments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncAssignments()
  }, [syncAssignments])

  const saveAssignments = useCallback(async (nextAssignments: VehicleAssignment[]) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/vehicle-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignments: nextAssignments }),
      })
      if (!response.ok) {
        throw new Error(`Failed to save assignments: ${response.statusText}`)
      }
      const data = (await response.json()) as { assignments?: VehicleAssignment[] }
      const savedAssignments = data.assignments ?? []
      setAssignments(savedAssignments)
      writeClientCache(VEHICLE_ASSIGNMENTS_CACHE_KEY, savedAssignments)
    } catch (error) {
      console.error("Error saving assignments:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    assignments,
    isLoading,
    saveAssignments,
    refreshAssignments: syncAssignments,
  }
}
