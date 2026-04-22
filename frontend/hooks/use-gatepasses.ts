"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface GatePass {
  id: string
  orderNo?: string
  deliveryNo?: string
  vehicle: string
  depo: string
  driver: string
  driverLicense: string
  purpose: string
  requestedBy: string
  approvalStatus: string
  challanPdfUrl: string
  challanNo?: string
  movementStatus: "Not Entered" | "Entered" | "Exited"
  entryTime?: string | null
  exitTime?: string | null
  time: string
}

const GATE_PASSES_CACHE_KEY = "tms-gatepasses-cache"

export function useGatePasses() {
  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => readClientCache<GatePass[]>(GATE_PASSES_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<GatePass[]>(GATE_PASSES_CACHE_KEY, []).length === 0)

  const syncGatePasses = useCallback(async () => {
    setIsLoading((current) => current || gatePasses.length === 0)
    try {
      const response = await fetch("/api/gatepasses", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      const nextGatePasses = data.gatePasses ?? []
      setGatePasses(nextGatePasses)
      writeClientCache(GATE_PASSES_CACHE_KEY, nextGatePasses)
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }, [gatePasses.length])

  useEffect(() => {
    void syncGatePasses()
  }, [syncGatePasses])

  const createGatePass = useCallback(async (gatePass: {
    vehicleId: string
    driverId: string
    purpose: string
    requestedBy: string
    expectedReturn: string
    approvalStatus: string
    challanPdfUrl: string
  }) => {
    const response = await fetch("/api/gatepasses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gatePass }),
    })
    if (!response.ok) throw new Error("Network error creating gate pass")
    const data = await response.json()
    const nextGatePasses = data.gatePasses ?? []
    setGatePasses(nextGatePasses)
    writeClientCache(GATE_PASSES_CACHE_KEY, nextGatePasses)
  }, [])

  const updateGatePassStatus = useCallback(async (id: string, status: "Approved" | "Rejected") => {
    const response = await fetch("/api/gatepasses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statusUpdate: {
          id,
          status,
        },
      }),
    })
    if (!response.ok) throw new Error("Network error updating gate pass")
    const data = await response.json()
    const nextGatePasses = data.gatePasses ?? []
    setGatePasses(nextGatePasses)
    writeClientCache(GATE_PASSES_CACHE_KEY, nextGatePasses)
  }, [])

  const updateGatePassMovement = useCallback(async (id: string, action: "Entry" | "Exit") => {
    const response = await fetch("/api/gatepasses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        movementUpdate: {
          id,
          action,
        },
      }),
    })
    if (!response.ok) throw new Error("Network error updating gate pass movement")
    const data = await response.json()
    const nextGatePasses = data.gatePasses ?? []
    setGatePasses(nextGatePasses)
    writeClientCache(GATE_PASSES_CACHE_KEY, nextGatePasses)
  }, [])

  return { gatePasses, isLoading, refreshGatePasses: syncGatePasses, createGatePass, updateGatePassStatus, updateGatePassMovement }
}
