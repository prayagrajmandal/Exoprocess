"use client"

import { PageHeader, DataTable } from "@/components/tms-ui"
import { useFleet } from "@/hooks/use-fleet"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { canEditRoute } from "@/lib/auth"
import { Plus, Car, Truck, AlertTriangle, Loader2 } from "lucide-react"

export default function FleetPage() {
  const { session } = useAuth()
  const { fleet, isLoading } = useFleet()
  const canEditFleet = Boolean(session && canEditRoute(session, "/fleet"))

  const tableData = fleet.map(v => ({
    VehicleID: v.id,
    Type: v.type,
    Capacity: v.capacity,
    CurrentLocation: v.location,
    LastService: v.lastService,
    Status: v.status,
  }))

  const statusCounts = {
    total: fleet.length,
    available: fleet.filter(v => v.status === "Available").length,
    onTrip: fleet.filter(v => v.status === "On Trip" || v.status === "Loading").length,
    maintenance: fleet.filter(v => v.status === "Maintenance").length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet"
        description="Vehicle inventory and maintenance tracking"
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!canEditFleet}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      {!canEditFleet ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          You have display access only for Fleet. Edit access is required for vehicle changes.
        </div>
      ) : null}

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{statusCounts.total}</p>
              <p className="text-xs text-muted-foreground">Total Vehicles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Car className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{statusCounts.available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{statusCounts.onTrip}</p>
              <p className="text-xs text-muted-foreground">On Trip / Loading</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{statusCounts.maintenance}</p>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={["VehicleID", "Type", "Capacity", "CurrentLocation", "LastService", "Status"]}
          data={tableData}
          actions={[
            { label: "View", onClick: () => {} },
          ]}
        />
      )}
    </div>
  )
}
