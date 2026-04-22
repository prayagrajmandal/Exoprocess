"use client"

import { useMemo, useState } from "react"
import { PageHeader, KpiCard, DataTable } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useMaintenance } from "@/hooks/use-maintenance"
import { useFleet } from "@/hooks/use-fleet"
import { canEditRoute, getRoleLabels } from "@/lib/auth"
import { ClipboardList, IndianRupee, Plus, Wrench } from "lucide-react"

const maintenanceTypeOptions = [
  "Routine Service",
  "Oil Change",
  "Tyre Change",
  "Brake Repair",
  "Engine Repair",
  "Accident Repair",
  "Cleaning & Wash",
  "Battery Replacement",
  "Other Repair",
]

const emptyForm = {
  vehicleId: "",
  maintenanceType: "",
  serviceDate: "",
  nextDueDate: "",
  serviceCost: "",
  workshopName: "",
  spareParts: "",
  notes: "",
}

export default function MaintenancePage() {
  const { session } = useAuth()
  const { entries, createEntry, isLoading } = useMaintenance()
  const { fleet } = useFleet()
  const canEditMaintenance = Boolean(session && canEditRoute(session, "/maintenance"))
  const [activeTab, setActiveTab] = useState<"records" | "add">("records")
  const [form, setForm] = useState(emptyForm)

  const roleLabel = session ? getRoleLabels(session.roles) : "User"
  const totalCost = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        const amount = Number(entry.cost.replace(/[^\d.]/g, ""))
        return sum + (Number.isNaN(amount) ? 0 : amount)
      }, 0),
    [entries]
  )

  const dueSoonCount = useMemo(
    () =>
      entries.filter((entry) => {
        if (entry.nextDueDate === "—") return false
        const dueDate = new Date(entry.nextDueDate)
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        return dueDate <= futureDate
      }).length,
    [entries]
  )

  const tableData = entries.map((entry) => ({
    MaintenanceID: entry.id,
    VehicleNumber: entry.vehicleNumber,
    MaintenanceType: entry.maintenanceType,
    ServiceDate: entry.serviceDate,
    NextDueDate: entry.nextDueDate,
    Cost: entry.cost,
    Workshop: entry.workshop,
    SpareParts: entry.spareParts || "—",
    Notes: entry.notes,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const vehicle = fleet.find((item) => item.id === form.vehicleId)
    if (!vehicle) return

    void createEntry({
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.registrationNumber || vehicle.id,
      maintenanceType: form.maintenanceType,
      serviceDate: form.serviceDate,
      nextDueDate: form.nextDueDate,
      serviceCost: Number(form.serviceCost || 0),
      workshop: form.workshopName,
      spareParts: form.spareParts,
      notes: form.notes || "Recorded by maintenance team",
    })

    setForm(emptyForm)
    setActiveTab("records")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Record and track vehicle maintenance history"
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setActiveTab("add")} disabled={!canEditMaintenance}>
            <Plus className="mr-2 h-4 w-4" /> Add Entry
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">{roleLabel} view</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every saved maintenance entry now persists to the database and reloads from the backend.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={activeTab === "records" ? "default" : "outline"} onClick={() => setActiveTab("records")}>
          <ClipboardList className="mr-2 h-4 w-4" /> Records
        </Button>
        <Button variant={activeTab === "add" ? "default" : "outline"} onClick={() => setActiveTab("add")} disabled={!canEditMaintenance}>
          <Wrench className="mr-2 h-4 w-4" /> Add Maintenance
        </Button>
      </div>

      {activeTab === "records" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Total Records" value={entries.length} icon={<ClipboardList className="h-5 w-5" />} />
            <KpiCard label="Total Cost" value={`Rs. ${totalCost.toLocaleString("en-IN")}`} icon={<IndianRupee className="h-5 w-5" />} />
            <KpiCard label="Due In 30 Days" value={dueSoonCount} icon={<Wrench className="h-5 w-5" />} />
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              Loading maintenance records...
            </div>
          ) : (
            <DataTable
              columns={["MaintenanceID", "VehicleNumber", "MaintenanceType", "ServiceDate", "NextDueDate", "Cost", "Workshop", "SpareParts", "Notes"]}
              data={tableData}
              renderers={{
                SpareParts: (value) =>
                  String(value || "—").includes("\n") ? (
                    <div className="max-w-[320px] whitespace-pre-line text-left text-sm text-card-foreground">
                      {String(value)}
                    </div>
                  ) : (
                    <div className="max-w-[320px] text-left text-sm text-card-foreground">{String(value || "—")}</div>
                  ),
              }}
            />
          )}
        </div>
      ) : canEditMaintenance ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Choose a vehicle</option>
                {fleet.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNumber || vehicle.id} ({vehicle.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Maintenance Type</label>
              <select
                value={form.maintenanceType}
                onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Select maintenance type</option>
                {maintenanceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Service Date</label>
                <input
                  type="date"
                  value={form.serviceDate}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Next Due Date</label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Service Cost</label>
                <input
                  type="number"
                  min={0}
                  value={form.serviceCost}
                  onChange={(e) => setForm({ ...form, serviceCost: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Workshop</label>
                <input
                  value={form.workshopName}
                  onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Spare Parts</label>
              <textarea
                value={form.spareParts}
                onChange={(e) => setForm({ ...form, spareParts: e.target.value })}
                rows={4}
                placeholder={"Example: Oil filter\nBrake pads\nAir filter"}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save Entry
              </Button>
              <Button type="button" variant="outline" onClick={() => setActiveTab("records")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          You have display access only for Maintenance. Edit access is required to add new maintenance entries.
        </div>
      )}
    </div>
  )
}
