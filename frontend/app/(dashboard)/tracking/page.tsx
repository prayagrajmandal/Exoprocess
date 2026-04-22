"use client"

import { useEffect, useMemo, useState } from "react"
import { KpiCard, StatusBadge } from "@/components/tms-ui"
import { Clock3, Gauge, Navigation, Route, Signal, Siren, Truck } from "lucide-react"
import { useTracking, type TrackingVehicle } from "@/hooks/use-tracking"

type AlertSeverity = "High" | "Medium" | "Low"

function getVehicleLabel(vehicle: TrackingVehicle) {
  return vehicle.vehicleNo?.trim() || vehicle.id
}

function getGoogleMapsEmbedUrl(vehicle: TrackingVehicle) {
  if (typeof vehicle.latitude === "number" && typeof vehicle.longitude === "number") {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${vehicle.latitude},${vehicle.longitude}`)}&z=16&output=embed`
  }

  const query = getVehicleLabel(vehicle).trim()
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed` : ""
}

function formatEta(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours <= 0) return `${mins} min`
  return `${hours}h ${mins}m`
}

function formatLastUpdate(seconds: number) {
  if (seconds < 60) return `${seconds} sec ago`
  const mins = Math.floor(seconds / 60)
  return `${mins} min ago`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function progressPosition(progress: number) {
  return Math.min(92, Math.max(8, progress))
}

function getVehicleAlert(vehicle: TrackingVehicle) {
  const vehicleLabel = getVehicleLabel(vehicle)

  if (vehicle.routeDeviationKm >= 2.5) {
    return {
      title: "Route deviation detected",
      message: `${vehicleLabel} is ${vehicle.routeDeviationKm.toFixed(1)} km away from planned corridor.`,
      severity: "High" as AlertSeverity,
    }
  }

  if (vehicle.haltMinutes >= 20) {
    return {
      title: "Long halt time",
      message: `${vehicleLabel} has been stationary for ${vehicle.haltMinutes} minutes.`,
      severity: "Medium" as AlertSeverity,
    }
  }

  if (vehicle.speed > vehicle.plannedSpeed + 10) {
    return {
      title: "Over-speeding alert",
      message: `${vehicleLabel} is moving above planned speed by ${Math.round(vehicle.speed - vehicle.plannedSpeed)} km/h.`,
      severity: "Medium" as AlertSeverity,
    }
  }

  return {
    title: "Trip healthy",
    message: `${vehicleLabel} is tracking within expected route and ETA.`,
    severity: "Low" as AlertSeverity,
  }
}

export default function TrackingPage() {
  const { vehicles, stats, error } = useTracking()
  const [activeLayer, setActiveLayer] = useState<"vehicles" | "alerts" | "routes">("vehicles")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [searchVehicleNo, setSearchVehicleNo] = useState("")

  const visibleVehicles = useMemo(() => {
    const query = searchVehicleNo.trim().toLowerCase()
    if (!query) return vehicles

    return vehicles.filter((vehicle) => {
      const vehicleNo = (vehicle.vehicleNo ?? vehicle.id).toLowerCase()
      return (
        vehicleNo.includes(query) ||
        vehicle.id.toLowerCase().includes(query) ||
        vehicle.driver.toLowerCase().includes(query) ||
        vehicle.route.toLowerCase().includes(query)
      )
    })
  }, [searchVehicleNo, vehicles])

  useEffect(() => {
    if (visibleVehicles.length === 0) {
      setSelectedVehicleId("")
      return
    }

    if (!selectedVehicleId || !visibleVehicles.some((vehicle) => vehicle.id === selectedVehicleId)) {
      setSelectedVehicleId(visibleVehicles[0].id)
    }
  }, [selectedVehicleId, visibleVehicles])

  const selectedVehicle =
    visibleVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? visibleVehicles[0] ?? null

  const liveStats = useMemo(() => {
    if (visibleVehicles.length === 0) {
      return stats
    }

    return {
      total: visibleVehicles.length,
      moving: visibleVehicles.filter((vehicle) => vehicle.status === "Moving").length,
      delayed: visibleVehicles.filter((vehicle) => vehicle.status === "Delayed").length,
      stopped: visibleVehicles.filter((vehicle) => vehicle.status === "Stopped").length,
      avgEtaMinutes: Math.round(visibleVehicles.reduce((sum, vehicle) => sum + vehicle.etaMinutes, 0) / visibleVehicles.length),
      latestUpdate: visibleVehicles[0]?.lastSeen ?? "",
    }
  }, [stats, visibleVehicles])

  const alerts = useMemo(
    () =>
      visibleVehicles.map((vehicle) => ({
        vehicleId: getVehicleLabel(vehicle),
        driver: vehicle.driver,
        route: vehicle.route,
        ...getVehicleAlert(vehicle),
      })),
    [visibleVehicles]
  )

  const vehiclesWithCoordinates = useMemo(
    () => visibleVehicles.filter((vehicle) => typeof vehicle.latitude === "number" && typeof vehicle.longitude === "number"),
    [visibleVehicles]
  )

  const coordinateBounds = useMemo(() => {
    if (vehiclesWithCoordinates.length === 0) {
      return null
    }

    const latitudes = vehiclesWithCoordinates.map((vehicle) => vehicle.latitude ?? 0)
    const longitudes = vehiclesWithCoordinates.map((vehicle) => vehicle.longitude ?? 0)

    return {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes),
    }
  }, [vehiclesWithCoordinates])

  const markerPosition = (vehicle: TrackingVehicle, index: number) => {
    if (coordinateBounds && typeof vehicle.latitude === "number" && typeof vehicle.longitude === "number") {
      const lngRange = coordinateBounds.maxLng - coordinateBounds.minLng || 1
      const latRange = coordinateBounds.maxLat - coordinateBounds.minLat || 1
      const left = 10 + ((vehicle.longitude - coordinateBounds.minLng) / lngRange) * 80
      const top = 10 + (1 - (vehicle.latitude - coordinateBounds.minLat) / latRange) * 68

      return {
        left: `${clamp(left, 8, 92)}%`,
        top: `${clamp(top, 12, 82)}%`,
      }
    }

    return {
      left: `${progressPosition(vehicle.progress)}%`,
      top: `${18 + index * 15}%`,
    }
  }

  const hasVehicles = visibleVehicles.length > 0
  const mapEmbedUrl = selectedVehicle ? getGoogleMapsEmbedUrl(selectedVehicle) : ""

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Vehicles Tracked" value={liveStats.total} icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Vehicles Moving" value={liveStats.moving} icon={<Signal className="h-4 w-4" />} />
        <KpiCard label="Stopped Vehicles" value={liveStats.stopped} icon={<Clock3 className="h-4 w-4" />} />
        <KpiCard label="Average ETA" value={formatEta(liveStats.avgEtaMinutes)} icon={<Navigation className="h-4 w-4" />} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="font-semibold">Tracking feed issue:</span> {error}
        </div>
      ) : null}

      {!hasVehicles ? (
        <div className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-8 text-center shadow-[0_18px_40px_rgba(59,130,246,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
          <p className="text-lg font-semibold text-card-foreground">No GPS rows found in `gps_data_m` yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            When the GPS integration starts writing rows, this page will show the live vehicles automatically.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(239,246,255,0.9))] p-3 shadow-[0_14px_32px_rgba(59,130,246,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
            <div className="mb-3 rounded-xl border border-sky-100 bg-white/90 px-3 py-2.5 dark:border-border dark:bg-background">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Search Vehicle No
              </label>
              <input
                value={searchVehicleNo}
                onChange={(event) => setSearchVehicleNo(event.target.value)}
                placeholder="Type vehicle no, e.g. WB30AF2563"
                className="mt-1.5 w-full border-0 bg-transparent p-0 text-sm font-medium text-card-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-sky-50/80 p-1 dark:bg-muted">
              {(["vehicles", "alerts", "routes"] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    activeLayer === layer
                      ? "bg-white text-slate-900 shadow-sm dark:bg-card dark:text-card-foreground"
                      : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            <div className="mt-3 max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {activeLayer === "vehicles"
                ? visibleVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                        selectedVehicle?.id === vehicle.id
                          ? "border-primary bg-primary/5 shadow-[0_14px_30px_rgba(59,130,246,0.12)]"
                          : "border-sky-100 bg-white/90 hover:border-primary/30 hover:shadow-sm dark:border-border dark:bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-card-foreground">{getVehicleLabel(vehicle)}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{vehicle.driver}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{vehicle.route}</p>
                          {vehicle.lastSeen ? <p className="mt-1 text-[10px] text-muted-foreground">{vehicle.lastSeen}</p> : null}
                        </div>
                        <StatusBadge status={vehicle.status} />
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>GPS feed confidence</span>
                          <span>{Math.round(vehicle.progress)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-sky-100 dark:bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb)]"
                            style={{ width: `${vehicle.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="rounded-xl bg-sky-50/80 px-2.5 py-1.5 dark:bg-muted/40">
                          <p className="text-muted-foreground">Speed</p>
                          <p className="mt-0.5 font-semibold text-card-foreground">{vehicle.speed.toFixed(0)} km/h</p>
                        </div>
                        <div className="rounded-xl bg-sky-50/80 px-2.5 py-1.5 dark:bg-muted/40">
                          <p className="text-muted-foreground">ETA</p>
                          <p className="mt-0.5 font-semibold text-card-foreground">{formatEta(vehicle.etaMinutes)}</p>
                        </div>
                        <div className="rounded-xl bg-sky-50/80 px-2.5 py-1.5 dark:bg-muted/40">
                          <p className="text-muted-foreground">Update</p>
                          <p className="mt-0.5 font-semibold text-card-foreground">{formatLastUpdate(vehicle.lastUpdateSeconds)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                : activeLayer === "alerts"
                  ? alerts.map((alert) => (
                      <div key={alert.vehicleId} className="rounded-2xl border border-sky-100 bg-white/90 p-3.5 dark:border-border dark:bg-card">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-card-foreground">{alert.title}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {alert.vehicleId} • {alert.driver}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              alert.severity === "High"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                : alert.severity === "Medium"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] text-muted-foreground">{alert.message}</p>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">{alert.route}</p>
                      </div>
                    ))
                  : visibleVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="rounded-2xl border border-sky-100 bg-white/90 p-3.5 dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-card-foreground">{vehicle.route}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {getVehicleLabel(vehicle)} • {vehicle.checkpoint}
                            </p>
                          </div>
                          <Route className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="mt-2 text-[12px] text-muted-foreground">
                          Speed {vehicle.speed.toFixed(0)} km/h • Deviation {vehicle.routeDeviationKm.toFixed(1)} km
                        </div>
                      </div>
                    ))}
              {visibleVehicles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-white/70 px-4 py-6 text-center text-sm text-muted-foreground dark:border-border dark:bg-background">
                  No vehicle found for "{searchVehicleNo.trim()}".
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] shadow-[0_18px_45px_rgba(59,130,246,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
            <div className="relative h-[420px] overflow-hidden bg-[linear-gradient(180deg,rgba(224,242,254,0.58),rgba(219,234,254,0.34))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(30,41,59,0.9))]">
              {mapEmbedUrl ? (
                <iframe
                  key={mapEmbedUrl}
                  title={selectedVehicle ? `Google Maps for ${getVehicleLabel(selectedVehicle)}` : "Google Maps"}
                  src={mapEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)
                    `,
                    backgroundSize: "44px 44px",
                  }}
                />
              )}

              {vehicles.map((vehicle, index) => {
                const alert = getVehicleAlert(vehicle)
                const position = coordinateBounds
                  ? markerPosition(vehicle, index)
                  : {
                      left: `${progressPosition(vehicle.progress)}%`,
                      top: `${18 + index * 15}%`,
                    }

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`absolute z-10 transition-transform ${selectedVehicle?.id === vehicle.id ? "scale-110" : "hover:scale-105"}`}
                    title={`Show ${getVehicleLabel(vehicle)} in Google Maps`}
                    style={{ top: position.top, left: position.left }}
                  >
                    <div className="relative">
                      <span
                        className={`absolute inset-0 rounded-full blur-md ${
                          vehicle.status === "Moving"
                            ? "bg-emerald-400/30"
                            : vehicle.status === "Delayed"
                              ? "bg-amber-400/30"
                              : "bg-slate-400/25"
                        }`}
                      />
                      <div
                        className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-md ${
                          vehicle.status === "Moving"
                            ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : vehicle.status === "Delayed"
                              ? "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                              : "border-slate-300 bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        }`}
                      >
                        <Truck className="h-5 w-5" />
                      </div>
                      {alert.severity === "High" ? (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                          <Siren className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}

              <div className="absolute left-4 top-4 z-20 rounded-2xl border border-sky-100 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur dark:border-border dark:bg-slate-950/70">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live Map Feed</p>
                <p className="mt-1.5 text-[13px] font-semibold text-card-foreground">{selectedVehicle?.route ?? "No active vehicle"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {selectedVehicle ? `${selectedVehicle.zone} • ${selectedVehicle.checkpoint}` : "Waiting for GPS rows"}
                </p>
              </div>

              <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-sky-100 bg-white/92 p-3 shadow-lg backdrop-blur dark:border-border dark:bg-slate-950/85">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-card-foreground">
                        {selectedVehicle ? getVehicleLabel(selectedVehicle) : "No vehicle selected"}
                      </h4>
                      {selectedVehicle ? <StatusBadge status={selectedVehicle.status} /> : null}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {selectedVehicle
                        ? `${selectedVehicle.driver} • ${selectedVehicle.route}`
                        : "GPS data will appear here once rows are available."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-sky-50/80 px-2.5 py-2 text-[11px] dark:bg-muted/40">
                      <p className="text-muted-foreground">Speed</p>
                      <p className="mt-0.5 font-semibold text-card-foreground">{selectedVehicle ? `${selectedVehicle.speed.toFixed(0)} km/h` : "--"}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50/80 px-2.5 py-2 text-[11px] dark:bg-muted/40">
                      <p className="text-muted-foreground">Heading</p>
                      <p className="mt-0.5 font-semibold text-card-foreground">{selectedVehicle?.heading ?? "--"}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50/80 px-2.5 py-2 text-[11px] dark:bg-muted/40">
                      <p className="text-muted-foreground">ETA</p>
                      <p className="mt-0.5 font-semibold text-card-foreground">{selectedVehicle ? formatEta(selectedVehicle.etaMinutes) : "--"}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50/80 px-2.5 py-2 text-[11px] dark:bg-muted/40">
                      <p className="text-muted-foreground">Last update</p>
                      <p className="mt-0.5 font-semibold text-card-foreground">
                        {selectedVehicle ? formatLastUpdate(selectedVehicle.lastUpdateSeconds) : "--"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.88))] p-4 shadow-[0_14px_32px_rgba(59,130,246,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
              <div className="flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-primary" />
                <p className="text-[13px] font-semibold text-card-foreground">Live Tracking Operations</p>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-border dark:bg-background">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Route deviation</p>
                  <p className="mt-1.5 text-[15px] font-semibold text-card-foreground">{selectedVehicle ? `${selectedVehicle.routeDeviationKm.toFixed(1)} km` : "--"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Alert when truck leaves corridor.</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-border dark:bg-background">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Halt time</p>
                  <p className="mt-1.5 text-[15px] font-semibold text-card-foreground">{selectedVehicle ? `${selectedVehicle.haltMinutes} min` : "--"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Useful for detention and stop checks.</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-border dark:bg-background">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Checkpoint</p>
                  <p className="mt-1.5 text-[15px] font-semibold text-card-foreground">{selectedVehicle?.checkpoint ?? "--"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Last movement point.</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-border dark:bg-background">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned vs actual</p>
                  <p className="mt-1.5 text-[15px] font-semibold text-card-foreground">
                    {selectedVehicle ? `${selectedVehicle.speed.toFixed(0)}/${selectedVehicle.plannedSpeed.toFixed(0)} km/h` : "--"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Useful for speed compliance.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.9))] p-4 shadow-[0_14px_32px_rgba(99,102,241,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
              <div className="flex items-center gap-2">
                <Siren className="h-3.5 w-3.5 text-primary" />
                <p className="text-[13px] font-semibold text-card-foreground">GPS Feed Notes</p>
              </div>
              <div className="mt-3 space-y-2.5 text-[11px] text-muted-foreground">
                <div className="rounded-xl border border-sky-100 bg-white/80 p-2.5 dark:border-border dark:bg-background">
                  GPS device/provider sends lat-lng, speed, ignition, and timestamp to your backend every 10 to 30 seconds.
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-2.5 dark:border-border dark:bg-background">
                  Backend reads rows from `gps_data_m` and pushes updates to the UI using polling, WebSocket, or SSE.
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-2.5 dark:border-border dark:bg-background">
                  Tracking page computes ETA, route deviation, halt alerts, and trip status from those live points.
                </div>
                <div className="rounded-xl border border-sky-100 bg-white/80 p-2.5 dark:border-border dark:bg-background">
                  Completed trips move to history so operations can review route, stops, delay, and proof of delivery flow.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
