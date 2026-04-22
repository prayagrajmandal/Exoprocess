"use client"

export function readClientCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

export function writeClientCache<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}
