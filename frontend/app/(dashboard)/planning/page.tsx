"use client"

import { useState } from "react"
import { PageHeader, DataTable } from "@/components/tms-ui"
import { unplannedOrders, availableFleet } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"

export default function PlanningPage() {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [planned, setPlanned] = useState(false)

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleVehicle = (id: string) => {
    setSelectedVehicles(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport Planning"
        description="Plan trips by assigning orders to available fleet"
      />

      {planned && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm font-medium text-[#059669]">
            AI has successfully planned {selectedOrders.size} orders across {selectedVehicles.size} vehicles. Trip creation is pending dispatcher approval.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Unplanned Orders */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Unplanned Orders</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/90">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OrderID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-blue-400/10">
                {unplannedOrders.map(o => (
                  <tr
                    key={o.id}
                    className={`cursor-pointer transition-all duration-200 hover:z-10 hover:scale-[1.01] hover:bg-gradient-to-r hover:from-sky-100/90 hover:via-blue-50 hover:to-cyan-100/85 hover:shadow-[0_16px_36px_rgba(59,130,246,0.18)] dark:hover:bg-gradient-to-r dark:hover:from-slate-800 dark:hover:via-blue-950/85 dark:hover:to-slate-900 dark:hover:shadow-[0_18px_42px_rgba(15,23,42,0.48)] ${selectedOrders.has(o.id) ? "bg-primary/10 dark:bg-blue-500/15" : "hover:bg-muted/30"}`}
                    onClick={() => toggleOrder(o.id)}
                  >
                    <td className="px-4 py-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                        selectedOrders.has(o.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedOrders.has(o.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{o.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.customer}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.source} → {o.destination}</td>
                    <td className="px-4 py-3 text-card-foreground">{o.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Fleet */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Available Fleet</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/90">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">VehicleID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-blue-400/10">
                {availableFleet.map(v => (
                  <tr
                    key={v.id}
                    className={`cursor-pointer transition-all duration-200 hover:z-10 hover:scale-[1.01] hover:bg-gradient-to-r hover:from-sky-100/90 hover:via-blue-50 hover:to-cyan-100/85 hover:shadow-[0_16px_36px_rgba(59,130,246,0.18)] dark:hover:bg-gradient-to-r dark:hover:from-slate-800 dark:hover:via-blue-950/85 dark:hover:to-slate-900 dark:hover:shadow-[0_18px_42px_rgba(15,23,42,0.48)] ${selectedVehicles.has(v.id) ? "bg-primary/10 dark:bg-blue-500/15" : "hover:bg-muted/30"}`}
                    onClick={() => toggleVehicle(v.id)}
                  >
                    <td className="px-4 py-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                        selectedVehicles.has(v.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedVehicles.has(v.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{v.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.type}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.capacity}</td>
                    <td className="px-4 py-3 text-card-foreground">{v.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="text-sm text-muted-foreground">
          {selectedOrders.size} orders and {selectedVehicles.size} vehicles selected
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={selectedOrders.size === 0 || selectedVehicles.size === 0}
          onClick={() => setPlanned(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Auto-Plan (AI)
        </Button>
      </div>
    </div>
  )
}
