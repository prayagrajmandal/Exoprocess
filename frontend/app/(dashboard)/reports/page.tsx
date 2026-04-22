"use client"

import { useMemo } from "react"
import { PageHeader, KpiCard, DataTable, StatusBadge } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useGatePasses } from "@/hooks/use-gatepasses"
import { useFleet } from "@/hooks/use-fleet"
import { useOrders } from "@/hooks/use-orders"
import { useTrips } from "@/hooks/use-trips"
import { BarChart3, ClipboardList, FileBarChart, Printer, Route, Shield, Truck } from "lucide-react"

function clampPercent(value: number) {
  return Math.max(4, Math.min(100, value))
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export default function ReportsPage() {
  const { orders, isLoading: ordersLoading } = useOrders()
  const { activeTrips, completedTrips, isLoading: tripsLoading } = useTrips()
  const { fleet, isLoading: fleetLoading } = useFleet()
  const { gatePasses, isLoading: gatePassesLoading } = useGatePasses()

  const loading = ordersLoading || tripsLoading || fleetLoading || gatePassesLoading

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === "Pending").length
    const plannedOrders = orders.filter((order) => order.status === "Planned").length
    const dispatchedOrders = orders.filter((order) => order.status === "Dispatched").length
    const availableVehicles = fleet.filter((vehicle) => String(vehicle.status).toLowerCase().includes("available")).length
    const maintenanceVehicles = fleet.filter((vehicle) => String(vehicle.status).toLowerCase().includes("maintenance")).length
    const onTripVehicles = fleet.filter((vehicle) => String(vehicle.status).toLowerCase().includes("trip")).length
    const enteredGatePasses = gatePasses.filter((gatePass) => gatePass.movementStatus === "Entered").length
    const exitedGatePasses = gatePasses.filter((gatePass) => gatePass.movementStatus === "Exited").length
    const pendingGatePasses = gatePasses.filter((gatePass) => gatePass.approvalStatus === "Pending").length

    return {
      totalOrders: orders.length,
      pendingOrders,
      plannedOrders,
      dispatchedOrders,
      activeTrips: activeTrips.length,
      completedTrips: completedTrips.length,
      fleetTotal: fleet.length,
      availableVehicles,
      maintenanceVehicles,
      onTripVehicles,
      gatePassTotal: gatePasses.length,
      pendingGatePasses,
      enteredGatePasses,
      exitedGatePasses,
    }
  }, [activeTrips.length, completedTrips.length, fleet, gatePasses, orders])

  const orderStatusBars = useMemo(
    () => [
      { label: "Pending Orders", value: metrics.pendingOrders, total: Math.max(metrics.totalOrders, 1), tone: "bg-amber-500" },
      { label: "Planned Orders", value: metrics.plannedOrders, total: Math.max(metrics.totalOrders, 1), tone: "bg-sky-500" },
      { label: "Dispatched Orders", value: metrics.dispatchedOrders, total: Math.max(metrics.totalOrders, 1), tone: "bg-emerald-500" },
    ],
    [metrics]
  )

  const gatePassBars = useMemo(
    () => [
      { label: "Pending Gate Passes", value: metrics.pendingGatePasses, total: Math.max(metrics.gatePassTotal, 1), tone: "bg-amber-500" },
      { label: "Entered", value: metrics.enteredGatePasses, total: Math.max(metrics.gatePassTotal, 1), tone: "bg-emerald-500" },
      { label: "Exited", value: metrics.exitedGatePasses, total: Math.max(metrics.gatePassTotal, 1), tone: "bg-rose-500" },
    ],
    [metrics]
  )

  const recentOrders = orders.slice(0, 5).map((order) => ({
    OrderID: order.id,
    Customer: order.customer,
    Source: order.source,
    Destination: order.destination,
    Weight: order.weight,
    Status: order.status,
  }))

  const recentTrips = [...activeTrips, ...completedTrips].slice(0, 5).map((trip) => ({
    TripID: trip.id,
    Vehicle: trip.vehicle,
    Driver: trip.driver,
    Route: "route" in trip ? trip.route : trip.distance,
    ETA: "eta" in trip ? trip.eta : trip.completedAt,
    Status: "status" in trip ? trip.status : "Completed",
  }))

  const recentGatePasses = gatePasses.slice(0, 5).map((gatePass) => ({
    GatePassID: gatePass.id,
    OrderNo: gatePass.orderNo || "",
    DeliveryNo: gatePass.deliveryNo || "",
    Vehicle: gatePass.vehicle,
    Driver: gatePass.driver,
    Status: gatePass.approvalStatus,
  }))

  return (
    <div className="space-y-3">
      <PageHeader
        title="Reports"
        description="A quick operational report view for orders, trips, fleet, and gate passes."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-28 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <FileBarChart className="h-6 w-6 animate-pulse text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="Total Orders" value={formatCount(metrics.totalOrders)} icon={<ClipboardList className="h-4 w-4" />} />
            <KpiCard label="Active Trips" value={formatCount(metrics.activeTrips)} icon={<Route className="h-4 w-4" />} />
            <KpiCard label="Fleet Units" value={formatCount(metrics.fleetTotal)} icon={<Truck className="h-4 w-4" />} />
            <KpiCard label="Gate Passes" value={formatCount(metrics.gatePassTotal)} icon={<Shield className="h-4 w-4" />} />
            <KpiCard label="Completed Trips" value={formatCount(metrics.completedTrips)} icon={<BarChart3 className="h-4 w-4" />} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">Orders Snapshot</h2>
                  <p className="text-xs text-muted-foreground">Current order workflow distribution.</p>
                </div>
                <StatusBadge status="Draft" />
              </div>
              <div className="mt-4 space-y-3">
                {orderStatusBars.map((item) => {
                  const percent = clampPercent((item.value / item.total) * 100)
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-card-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-sky-100 dark:bg-muted">
                        <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">Gate Pass Snapshot</h2>
                  <p className="text-xs text-muted-foreground">Movement and approval flow summary.</p>
                </div>
                <StatusBadge status="Connected" />
              </div>
              <div className="mt-4 space-y-3">
                {gatePassBars.map((item) => {
                  const percent = clampPercent((item.value / item.total) * 100)
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-card-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-sky-100 dark:bg-muted">
                        <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <ClipboardList className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-card-foreground">Recent Orders</p>
              </div>
              <DataTable
                compact
                columns={["OrderID", "Customer", "Source", "Destination", "Weight", "Status"]}
                data={recentOrders}
              />
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-card-foreground">Recent Gate Passes</p>
              </div>
              <DataTable
                compact
                columns={["GatePassID", "OrderNo", "DeliveryNo", "Vehicle", "Driver", "Status"]}
                data={recentGatePasses}
              />
            </section>
          </div>

          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Route className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-card-foreground">Recent Trips</p>
            </div>
            <DataTable compact columns={["TripID", "Vehicle", "Driver", "Route", "ETA", "Status"]} data={recentTrips} />
          </section>
        </>
      )}
    </div>
  )
}
