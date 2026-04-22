"use client"

import { useState } from "react"
import { PageHeader, DataTable, StatusBadge } from "@/components/tms-ui"
import { useTrips } from "@/hooks/use-trips"
import { Loader2 } from "lucide-react"

const tabs = ["Active", "Completed"] as const

export default function TripsPage() {
  const { activeTrips, completedTrips, isLoading } = useTrips()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Active")

  const activeTableData = activeTrips.map(t => ({
    TripID: t.id,
    Vehicle: t.vehicle,
    Driver: t.driver,
    Route: t.route,
    ETA: t.eta,
    Status: t.status,
  }))

  const completedTableData = completedTrips.map(t => ({
    TripID: t.id,
    Vehicle: t.vehicle,
    Driver: t.driver,
    Distance: t.distance,
    CompletedAt: t.completedAt,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description="View and manage all active and completed trips"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
            }`}>
              {tab === "Active" ? activeTrips.length : completedTrips.length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "Active" ? (
        <DataTable
          columns={["TripID", "Vehicle", "Driver", "Route", "ETA", "Status"]}
          data={activeTableData}
          actions={[
            { label: "Track", onClick: () => {} },
          ]}
        />
      ) : (
        <DataTable
          columns={["TripID", "Vehicle", "Driver", "Distance", "CompletedAt"]}
          data={completedTableData}
          actions={[
            { label: "View", onClick: () => {} },
          ]}
        />
      )}
    </div>
  )
}
