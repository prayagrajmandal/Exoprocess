"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { activeTrips, completedTrips } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"

const tabs = ["Active", "Completed"] as const

export default function DashboardActiveTripsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Active")

  const activeTableData = activeTrips.map((trip) => ({
    TripID: trip.id,
    Vehicle: trip.vehicle,
    Driver: trip.driver,
    Route: trip.route,
    ETA: trip.eta,
    Status: trip.status,
  }))

  const completedTableData = completedTrips.map((trip) => ({
    TripID: trip.id,
    Vehicle: trip.vehicle,
    Driver: trip.driver,
    Distance: trip.distance,
    CompletedAt: trip.completedAt,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Trips List"
        description="See all trip details from the dashboard card view"
        actions={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
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
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
              }`}
            >
              {tab === "Active" ? activeTrips.length : completedTrips.length}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "Active" ? (
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
