"use client"

import { useCallback, useEffect, useState } from "react"
import { readClientCache, writeClientCache } from "@/lib/client-cache"

export interface AppSettings {
  companyName: string
  contactEmail: string
  googleMapsKey: string
  gpsProvider: string
}

const defaultSettings: AppSettings = {
  companyName: "NextGen Logistics Pvt. Ltd.",
  contactEmail: "ops@nextgenlogistics.in",
  googleMapsKey: "",
  gpsProvider: "JioGPS",
}

const SETTINGS_CACHE_KEY = "tms-settings-cache"

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => readClientCache<AppSettings>(SETTINGS_CACHE_KEY, defaultSettings))
  const [isLoading, setIsLoading] = useState(() => {
    const cachedSettings = readClientCache<AppSettings>(SETTINGS_CACHE_KEY, defaultSettings)
    return cachedSettings === defaultSettings
  })

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" })
      const data = (await response.json()) as { settings?: AppSettings }
      const nextSettings = data.settings ?? defaultSettings
      setSettings(nextSettings)
      writeClientCache(SETTINGS_CACHE_KEY, nextSettings)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  const saveSettings = useCallback(async (nextSettings: AppSettings) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ settings: nextSettings }),
    })
    const data = (await response.json()) as { settings?: AppSettings }
    const savedSettings = data.settings ?? defaultSettings
    setSettings(savedSettings)
    writeClientCache(SETTINGS_CACHE_KEY, savedSettings)
  }, [])

  return { settings, isLoading, saveSettings, refreshSettings }
}
