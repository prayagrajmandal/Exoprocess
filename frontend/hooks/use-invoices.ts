"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface Invoice {
  id: string
  tripId: string
  customer: string
  amount: number
  status: string
  createdAt: string
}

const INVOICES_CACHE_KEY = "tms-invoices-cache"

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => readClientCache<Invoice[]>(INVOICES_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<Invoice[]>(INVOICES_CACHE_KEY, []).length === 0)

  const syncInvoices = useCallback(async () => {
    setIsLoading((current) => current || invoices.length === 0)
    try {
      const response = await fetch("/api/invoices", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      const nextInvoices = data.invoices ?? []
      setInvoices(nextInvoices)
      writeClientCache(INVOICES_CACHE_KEY, nextInvoices)
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }, [invoices.length])

  useEffect(() => {
    void syncInvoices()
  }, [syncInvoices])

  return { invoices, isLoading, refreshInvoices: syncInvoices }
}
