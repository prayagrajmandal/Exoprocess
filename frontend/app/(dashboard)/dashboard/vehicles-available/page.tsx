"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { fleet } from "@/lib/mock-data"
import { AlertTriangle, ArrowLeft, Car, Truck } from "lucide-react"

export default function DashboardVehiclesAvailablePage() {
  const router = useRouter()

  const tableData = fleet.map((vehicle) => ({
    VehicleID: vehicle.id,
    Type: vehicle.type,
    Capacity: vehicle.capacity,
    CurrentLocation: vehicle.location,
    LastService: vehicle.lastService,
    Status: vehicle.status,
  }))

  const statusCounts = {
    total: fleet.length,
    available: fleet.filter((vehicle) => vehicle.status === "Available").length,
    onTrip: fleet.filter((vehicle) => vehicle.status === "On Trip" || vehicle.status === "Loading").length,
    maintenance: fleet.filter((vehicle) => vehicle.status === "Maintenance").length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Vehicles Available"
        description="See vehicle details from the dashboard card view"
        actions={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

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

      <DataTable
        columns={["VehicleID", "Type", "Capacity", "CurrentLocation", "LastService", "Status"]}
        data={tableData}
        actions={[
          { label: "View", onClick: () => {} },
        ]}
      />
    </div>
  )
}
