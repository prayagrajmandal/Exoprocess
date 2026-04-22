"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface Weighment {
  id: string
  vehicle: string
  type: string
  grossWeight: string
  tareWeight: string
  netWeight: string
  material: string
  time: string
  status: string
}

const WEIGHMENTS_CACHE_KEY = "tms-weighments-cache"

export function useWeighments() {
  const [weighments, setWeighments] = useState<Weighment[]>(() => readClientCache<Weighment[]>(WEIGHMENTS_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<Weighment[]>(WEIGHMENTS_CACHE_KEY, []).length === 0)

  const refreshWeighments = useCallback(async () => {
    try {
      const response = await fetch("/api/weighments", { cache: "no-store" })
      const data = (await response.json()) as { weighments?: Weighment[] }
      const nextWeighments = data.weighments ?? []
      setWeighments(nextWeighments)
      writeClientCache(WEIGHMENTS_CACHE_KEY, nextWeighments)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshWeighments()
  }, [refreshWeighments])

  const createWeighment = useCallback(async (weighment: {
    vehicleId: string
    type: string
    grossWeight: number
    tareWeight: number
    material: string
  }) => {
    const response = await fetch("/api/weighments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weighment }),
    })
    const data = (await response.json()) as { weighments?: Weighment[] }
    const nextWeighments = data.weighments ?? []
    setWeighments(nextWeighments)
    writeClientCache(WEIGHMENTS_CACHE_KEY, nextWeighments)
  }, [])

  return { weighments, isLoading, createWeighment, refreshWeighments }
}
