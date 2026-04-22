"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface PaymentEntry {
  id: string
  payeeName: string
  category: string
  amount: string
  status: string
  paymentMethod: string
  dueDate: string
  paidDate: string
  referenceNumber: string
  notes: string
}

const PAYMENTS_CACHE_KEY = "tms-payments-cache"

export function usePayments() {
  const [entries, setEntries] = useState<PaymentEntry[]>(() => readClientCache<PaymentEntry[]>(PAYMENTS_CACHE_KEY, []))
  const [isLoading, setIsLoading] = useState(() => readClientCache<PaymentEntry[]>(PAYMENTS_CACHE_KEY, []).length === 0)

  const refreshEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/payments", { cache: "no-store" })
      const data = (await response.json()) as { entries?: PaymentEntry[] }
      const nextEntries = data.entries ?? []
      setEntries(nextEntries)
      writeClientCache(PAYMENTS_CACHE_KEY, nextEntries)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshEntries()
  }, [refreshEntries])

  const createEntry = useCallback(async (entry: {
    payeeName: string
    category: string
    amount: number
    status: string
    paymentMethod: string
    dueDate: string
    paidDate: string
    referenceNumber: string
    notes: string
  }) => {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entry }),
    })
    const data = (await response.json()) as { entries?: PaymentEntry[] }
    const nextEntries = data.entries ?? []
    setEntries(nextEntries)
    writeClientCache(PAYMENTS_CACHE_KEY, nextEntries)
  }, [])

  return { entries, isLoading, createEntry, refreshEntries }
}
