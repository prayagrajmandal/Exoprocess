"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface Order {
  id: string
  customer: string
  source: string
  destination: string
  weight: string
  volume: string
  status: string
  createdAt: string
}

const ORDERS_CACHE_KEY = "tms-orders-cache"

function getOrderTimestamp(order: Order) {
  const parsed = Date.parse(order.createdAt)
  return Number.isNaN(parsed) ? 0 : parsed
}

function sortOrdersNewestFirst(items: Order[]) {
  return [...items].sort((a, b) => {
    const timeDiff = getOrderTimestamp(b) - getOrderTimestamp(a)
    if (timeDiff !== 0) return timeDiff
    return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: "base" })
  })
}

export function useOrders() {
  const initialCachedOrders = readClientCache<Order[]>(ORDERS_CACHE_KEY, [])
  const [orders, setOrders] = useState<Order[]>(() => sortOrdersNewestFirst(initialCachedOrders))
  const [isLoading, setIsLoading] = useState(() => initialCachedOrders.length === 0)
  const hasLoadedOnceRef = useRef(initialCachedOrders.length > 0)

  const syncOrders = useCallback(async () => {
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true)
    }

    try {
      const response = await fetch("/api/orders", { cache: "no-store" })
      if (!response.ok) {
        return
      }

      const data = await response.json()
      const nextOrders = sortOrdersNewestFirst(data.orders ?? [])
      setOrders(nextOrders)
      writeClientCache(ORDERS_CACHE_KEY, nextOrders)
    } catch {
      return
    } finally {
      hasLoadedOnceRef.current = true
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncOrders()
    const interval = window.setInterval(() => {
      void syncOrders()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [syncOrders])

  return { orders, isLoading, refreshOrders: syncOrders }
}
