"use client"

import { useEffect, useState } from "react"
import { Bus, Car, Briefcase, CalendarClock, CircleAlert, Layers3, Truck } from "lucide-react"
import { DataTable, KpiCard, PageHeader } from "@/components/tms-ui"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useOrganizations } from "@/hooks/use-organizations"
import { canEditRoute } from "@/lib/auth"

type TransportFilter = "all" | "bus" | "employee-car" | "officer-car" | "pickup-truck"
type TransportDetailType = Exclude<TransportFilter, "all">

type TransportDetail = {
  id: string
  type: TransportDetailType
  vehicleNumber: string
  route: string
  assignmentMode: "single" | "multiple"
  employees: string[]
  employeeGroup: string
  officerName: string
  officerAddress: string
  status: "Active" | "Draft"
}

const TRANSPORT_STORAGE_KEY = "employee-transport-details"

const emptyTransportForm = {
  type: "bus" as TransportDetailType,
  vehicleNumber: "",
  route: "",
  assignmentMode: "single" as "single" | "multiple",
  employeeNames: [] as string[],
  employeeNameInput: "",
  employeeGroup: "",
  officerName: "",
  officerAddress: "",
  status: "Active" as "Active" | "Draft",
}

function getTransportTypeLabel(type: TransportDetailType) {
  if (type === "bus") return "Employee Bus"
  if (type === "employee-car") return "Employee Car"
  if (type === "officer-car") return "Officer Car"
  return "Pickup Truck"
}

function formatAssignment(detail: TransportDetail) {
  if (detail.type === "officer-car") {
    return detail.officerName || "Pending Officer"
  }

  if (detail.type === "bus") {
    return detail.employeeGroup || (detail.employees.length > 0 ? detail.employees.join(", ") : "Pending Group")
  }

  if (detail.type === "pickup-truck") {
    return detail.employeeGroup || (detail.employees.length > 0 ? detail.employees.join(", ") : "Pending Team")
  }

  if (detail.employees.length === 0) {
    return "Pending Employee"
  }

  return detail.employees.join(", ")
}

function normalizeTransportDetail(detail: Partial<TransportDetail> & Pick<TransportDetail, "id" | "type" | "vehicleNumber" | "route" | "status">): TransportDetail {
  return {
    id: detail.id,
    type: detail.type,
    vehicleNumber: detail.vehicleNumber ?? "",
    route: detail.route ?? "",
    assignmentMode: detail.assignmentMode ?? "single",
    employees: detail.employees ?? [],
    employeeGroup: detail.employeeGroup ?? "",
    officerName: detail.officerName ?? "",
    officerAddress: detail.officerAddress ?? "",
    status: detail.status ?? "Draft",
  }
}

export default function EmployeeTransportPage() {
  const { session } = useAuth()
  const { organizations, isLoading } = useOrganizations()
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false)
  const [selectedTransportFilter, setSelectedTransportFilter] = useState<TransportFilter>("all")
  const [transportDetails, setTransportDetails] = useState<TransportDetail[]>([])
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null)
  const [transportForm, setTransportForm] = useState(emptyTransportForm)
  const organization = organizations.find((item) => item.name === session?.organization)
  const canEditEmployeeTransport = Boolean(session && canEditRoute(session, "/employee-transport"))

  const employeeBusCount = organization?.employeeBusCount ?? 0
  const employeeCarCount = organization?.employeeCarCount ?? 0
  const officerCarCount = organization?.officerCarCount ?? 0
  const pickupTruckCount = 0
  const totalTransportUnits = employeeBusCount + employeeCarCount + officerCarCount + pickupTruckCount

  useEffect(() => {
    if (typeof window === "undefined" || !session?.organization) {
      return
    }

    try {
      const rawValue = window.localStorage.getItem(TRANSPORT_STORAGE_KEY)
      const parsed = rawValue ? JSON.parse(rawValue) as Record<string, TransportDetail[]> : {}
      setTransportDetails((parsed[session.organization] ?? []).map((detail) => normalizeTransportDetail(detail)))
    } catch {
      setTransportDetails([])
    }
  }, [session?.organization])

  const persistTransportDetails = (nextDetails: TransportDetail[]) => {
    if (typeof window === "undefined" || !session?.organization) {
      return
    }

    const rawValue = window.localStorage.getItem(TRANSPORT_STORAGE_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) as Record<string, TransportDetail[]> : {}
    parsed[session.organization] = nextDetails
    window.localStorage.setItem(TRANSPORT_STORAGE_KEY, JSON.stringify(parsed))
    setTransportDetails(nextDetails)
  }

  const transportRows = [
    {
      TransportType: "Employee Bus",
      IntendedUsers: "Employees",
      VehicleCount: employeeBusCount,
      Coverage: employeeBusCount > 0 ? "Shift Route" : "Not Configured",
      Status: employeeBusCount > 0 ? "Active" : "Draft",
    },
    {
      TransportType: "Employee Car",
      IntendedUsers: "Employees",
      VehicleCount: employeeCarCount,
      Coverage: employeeCarCount > 0 ? "Pickup / Drop" : "Not Configured",
      Status: employeeCarCount > 0 ? "Active" : "Draft",
    },
    {
      TransportType: "Officer Car",
      IntendedUsers: "Officers",
      VehicleCount: officerCarCount,
      Coverage: officerCarCount > 0 ? "Executive Travel" : "Not Configured",
      Status: officerCarCount > 0 ? "Active" : "Draft",
    },
    {
      TransportType: "Pickup Truck",
      IntendedUsers: "Support Team",
      VehicleCount: pickupTruckCount,
      Coverage: pickupTruckCount > 0 ? "Utility Movement" : "Not Configured",
      Status: pickupTruckCount > 0 ? "Active" : "Draft",
    },
  ]

  const filteredTransportRows = transportRows.filter((row) => {
    if (selectedTransportFilter === "all") {
      return true
    }

    if (selectedTransportFilter === "bus") {
      return row.TransportType === "Employee Bus"
    }

    if (selectedTransportFilter === "employee-car") {
      return row.TransportType === "Employee Car"
    }

    if (selectedTransportFilter === "officer-car") {
      return row.TransportType === "Officer Car"
    }

    return row.TransportType === "Pickup Truck"
  })

  const detailRows = transportDetails.map((detail) => ({
    DetailID: detail.id,
    TransportType: getTransportTypeLabel(detail.type),
    VehicleNumber: detail.vehicleNumber,
    Route: detail.route,
    Assignment: formatAssignment(detail),
    OfficerAddress: detail.officerAddress || "N/A",
    Status: detail.status,
  }))

  const filteredDetailRows = detailRows.filter((detail) => {
    if (selectedTransportFilter === "all") {
      return true
    }

    return detail.TransportType === getTransportTypeLabel(selectedTransportFilter)
  })

  const shiftRows = [
    {
      Shift: "Morning Shift",
      PreferredMode: employeeBusCount > 0 ? "Bus" : employeeCarCount > 0 ? "Car" : "Pending Setup",
      SupportVehicles: employeeBusCount + employeeCarCount,
      LastUpdated: "From organization setup",
      Status: employeeBusCount + employeeCarCount > 0 ? "Active" : "Draft",
    },
    {
      Shift: "General Office",
      PreferredMode: officerCarCount > 0 ? "Officer Car" : employeeCarCount > 0 ? "Car" : "Pending Setup",
      SupportVehicles: officerCarCount + employeeCarCount,
      LastUpdated: "From organization setup",
      Status: officerCarCount + employeeCarCount > 0 ? "Active" : "Draft",
    },
  ]

  const routeMapRows = transportDetails.map((detail) => ({
    VehicleType: getTransportTypeLabel(detail.type),
    AssignedUnit: detail.vehicleNumber || "Not Assigned",
    Route: detail.route || "Pending Route",
    AssignedTo: formatAssignment(detail),
    OfficerAddress: detail.officerAddress || "N/A",
    Status: detail.status,
  }))

  const resetTransportForm = () => {
    setEditingTransportId(null)
    setTransportForm(emptyTransportForm)
  }

  const saveTransportDetail = () => {
    const vehicleNumber = transportForm.vehicleNumber.trim()
    const route = transportForm.route.trim()
    const employees = transportForm.assignmentMode === "single"
      ? transportForm.employeeNames.slice(0, 1)
      : transportForm.employeeNames
    const employeeGroup = transportForm.employeeGroup.trim()
    const officerName = transportForm.officerName.trim()
    const officerAddress = transportForm.officerAddress.trim()

    const hasValidAssignment =
      transportForm.type === "officer-car"
        ? officerName.length > 0
        : employees.length > 0 || employeeGroup.length > 0

    if (!vehicleNumber || !route || !hasValidAssignment) {
      return
    }

    const nextRecord: TransportDetail = {
      id: editingTransportId ?? `${transportForm.type}-${Date.now()}`,
      type: transportForm.type,
      vehicleNumber,
      route,
      assignmentMode: transportForm.assignmentMode,
      employees,
      employeeGroup,
      officerName,
      officerAddress,
      status: transportForm.status,
    }

    const nextDetails = editingTransportId
      ? transportDetails.map((detail) => (detail.id === editingTransportId ? nextRecord : detail))
      : [...transportDetails, nextRecord]

    persistTransportDetails(nextDetails)
    resetTransportForm()
  }

  const deleteTransportDetail = (detailId: string) => {
    persistTransportDetails(transportDetails.filter((detail) => detail.id !== detailId))
    if (editingTransportId === detailId) {
      resetTransportForm()
    }
  }

  const editTransportDetail = (detailId: string) => {
    const detail = transportDetails.find((item) => item.id === detailId)
    if (!detail) {
      return
    }

    setEditingTransportId(detail.id)
    setTransportForm({
      type: detail.type,
      vehicleNumber: detail.vehicleNumber,
      route: detail.route,
      assignmentMode: detail.assignmentMode,
      employeeNames: detail.employees,
      employeeNameInput: "",
      employeeGroup: detail.employeeGroup,
      officerName: detail.officerName,
      officerAddress: detail.officerAddress,
      status: detail.status,
    })
  }

  const addEmployeeName = () => {
    const nextName = transportForm.employeeNameInput.trim()
    if (!nextName) {
      return
    }

    setTransportForm((current) => {
      const nextNames = current.assignmentMode === "single"
        ? [nextName]
        : [...current.employeeNames, nextName]

      return {
        ...current,
        employeeNames: nextNames,
        employeeNameInput: "",
      }
    })
  }

  const removeEmployeeName = (nameToRemove: string) => {
    setTransportForm((current) => ({
      ...current,
      employeeNames: current.employeeNames.filter((name) => name !== nameToRemove),
    }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Transport"
        description="Track employee buses and employee/officer cars for the selected organization"
      />

      {!canEditEmployeeTransport ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Display access only. Super Admin can update transport counts from the organization setup screen.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            setSelectedTransportFilter("all")
            setIsTransportDialogOpen(true)
          }}
          className="text-left transition-transform duration-200 hover:scale-[1.01]"
        >
          <KpiCard label="Total Transport Units" value={totalTransportUnits} icon={<CalendarClock className="h-4 w-4" />} />
        </button>
        <KpiCard label="Employee Buses" value={employeeBusCount} icon={<Bus className="h-4 w-4" />} />
        <KpiCard label="Employee Cars" value={employeeCarCount} icon={<Car className="h-4 w-4" />} />
        <KpiCard label="Officer Cars" value={officerCarCount} icon={<Briefcase className="h-4 w-4" />} />
        <KpiCard label="Pickup Truck" value={pickupTruckCount} icon={<Truck className="h-4 w-4" />} />
      </div>

      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Total Transport Units</DialogTitle>
            <DialogDescription>
              Choose one of the available transport types for this organization and view the matching list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <button
              type="button"
              onClick={() => setSelectedTransportFilter("all")}
              className={`rounded-2xl border p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm transition ${selectedTransportFilter === "all" ? "border-primary bg-primary/5" : "border-sky-100/90 bg-white/90 dark:border-border dark:bg-card"}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Layers3 className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-card-foreground">All</p>
              <p className="mt-1 text-sm text-muted-foreground">View the complete transport mix together.</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTransportFilter("bus")}
              className={`rounded-2xl border p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm transition ${selectedTransportFilter === "bus" ? "border-primary bg-primary/5" : "border-sky-100/90 bg-white/90 dark:border-border dark:bg-card"}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Bus className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-card-foreground">Bus</p>
              <p className="mt-1 text-sm text-muted-foreground">Best for group employee movement.</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTransportFilter("employee-car")}
              className={`rounded-2xl border p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm transition ${selectedTransportFilter === "employee-car" ? "border-primary bg-primary/5" : "border-sky-100/90 bg-white/90 dark:border-border dark:bg-card"}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Car className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-card-foreground">Employee Car</p>
              <p className="mt-1 text-sm text-muted-foreground">Useful for flexible employee pickup and drop.</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTransportFilter("officer-car")}
              className={`rounded-2xl border p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm transition ${selectedTransportFilter === "officer-car" ? "border-primary bg-primary/5" : "border-sky-100/90 bg-white/90 dark:border-border dark:bg-card"}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Briefcase className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-card-foreground">Officer Car</p>
              <p className="mt-1 text-sm text-muted-foreground">Reserved for officer and executive travel.</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTransportFilter("pickup-truck")}
              className={`rounded-2xl border p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm transition ${selectedTransportFilter === "pickup-truck" ? "border-primary bg-primary/5" : "border-sky-100/90 bg-white/90 dark:border-border dark:bg-card"}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Truck className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-card-foreground">Pickup Truck</p>
              <p className="mt-1 text-sm text-muted-foreground">Use when light transport support is needed.</p>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-card-foreground">
              {selectedTransportFilter === "all"
                ? "All Transport List"
                : selectedTransportFilter === "bus"
                ? "Bus List"
                : selectedTransportFilter === "employee-car"
                ? "Employee Car List"
                : selectedTransportFilter === "officer-car"
                ? "Officer Car List"
                : "Pickup Truck List"}
            </p>
            <DataTable
              columns={["TransportType", "IntendedUsers", "VehicleCount", "Coverage", "Status"]}
              data={filteredTransportRows}
            />
            <DataTable
              columns={["TransportType", "VehicleNumber", "Route", "Assignment", "OfficerAddress", "Status"]}
              data={filteredDetailRows}
            />
          </div>
        </DialogContent>
      </Dialog>

      {!organization && !isLoading ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm">
          No organization transport setup was found for this user. Configure it from Super Admin.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <DataTable
            columns={["TransportType", "IntendedUsers", "VehicleCount", "Coverage", "Status"]}
            data={transportRows}
          />

          <div className="rounded-2xl border border-sky-100/90 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-border dark:bg-card dark:shadow-sm">
            <p className="text-base font-semibold text-card-foreground">Employee Transport Details</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add or edit bus, employee car, officer car, or pickup truck details directly in this app.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Transport Type</label>
                <select
                  value={transportForm.type}
                  onChange={(event) => setTransportForm((current) => ({ ...current, type: event.target.value as TransportDetailType }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="bus">Employee Bus</option>
                  <option value="employee-car">Employee Car</option>
                  <option value="officer-car">Officer Car</option>
                  <option value="pickup-truck">Pickup Truck</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Vehicle Number</label>
                <input
                  value={transportForm.vehicleNumber}
                  onChange={(event) => setTransportForm((current) => ({ ...current, vehicleNumber: event.target.value }))}
                  placeholder="Enter vehicle number"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Route</label>
                <input
                  value={transportForm.route}
                  onChange={(event) => setTransportForm((current) => ({ ...current, route: event.target.value }))}
                  placeholder="Enter route name"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Status</label>
                <select
                  value={transportForm.status}
                  onChange={(event) => setTransportForm((current) => ({ ...current, status: event.target.value as "Active" | "Draft" }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              {transportForm.type !== "officer-car" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Employee Assignment</label>
                    <select
                      value={transportForm.assignmentMode}
                      onChange={(event) => setTransportForm((current) => ({ ...current, assignmentMode: event.target.value as "single" | "multiple" }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="single">One Employee</option>
                      <option value="multiple">Multiple Employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      {transportForm.type === "bus" ? "Employee Group" : transportForm.type === "pickup-truck" ? "Assigned Team" : "Employee Group / Team"}
                    </label>
                    <input
                      value={transportForm.employeeGroup}
                      onChange={(event) => setTransportForm((current) => ({ ...current, employeeGroup: event.target.value }))}
                      placeholder={transportForm.type === "bus" ? "Morning shift employees" : "Enter team or group"}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                      {transportForm.assignmentMode === "single" ? "Employee Name" : "Employee Names"}
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          value={transportForm.employeeNameInput}
                          onChange={(event) => setTransportForm((current) => ({ ...current, employeeNameInput: event.target.value }))}
                          placeholder={transportForm.assignmentMode === "single" ? "Enter one employee name" : "Add employee name one by one"}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <Button type="button" variant="outline" onClick={addEmployeeName}>
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {transportForm.employeeNames.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No employee added yet.</span>
                        ) : (
                          transportForm.employeeNames.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => removeEmployeeName(name)}
                              className="rounded-full border border-border bg-background px-3 py-1 text-sm text-card-foreground transition hover:border-destructive/40 hover:text-destructive"
                            >
                              {name} x
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Officer Name</label>
                    <input
                      value={transportForm.officerName}
                      onChange={(event) => setTransportForm((current) => ({ ...current, officerName: event.target.value }))}
                      placeholder="Enter officer name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Officer Address</label>
                    <input
                      value={transportForm.officerAddress}
                      onChange={(event) => setTransportForm((current) => ({ ...current, officerAddress: event.target.value }))}
                      placeholder="Enter officer address"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={saveTransportDetail} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingTransportId ? "Update Transport Detail" : "Add Transport Detail"}
              </Button>
              {editingTransportId ? (
                <Button variant="outline" onClick={resetTransportForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>

            <div className="mt-4">
              <DataTable
                columns={["TransportType", "VehicleNumber", "Route", "Assignment", "OfficerAddress", "Status"]}
                data={detailRows}
                actions={
                  canEditEmployeeTransport
                    ? [
                        {
                          label: "Edit",
                          onClick: (row) => editTransportDetail(String(row.DetailID ?? "")),
                        },
                        {
                          label: "Delete",
                          variant: "destructive",
                          onClick: (row) => deleteTransportDetail(String(row.DetailID ?? "")),
                        },
                      ]
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-sky-100/90 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-border dark:bg-card dark:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <CircleAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-card-foreground">Employee Transport Route Map</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Route and employee assignment overview for bus, employee car, officer car, and pickup truck.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization</p>
                <p className="mt-1 text-sm font-medium text-card-foreground">{session?.organization ?? "Unknown"}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mapped Units</p>
                <p className="mt-1 text-sm font-medium text-card-foreground">{routeMapRows.length} transport categories</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignment Rule</p>
              <p className="mt-1 text-sm font-medium text-card-foreground">
                Each transport unit can be assigned to a route or employee group.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100/90 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-border dark:bg-card dark:shadow-sm">
            <p className="text-sm font-semibold text-card-foreground">Assigned Route List</p>
            <div className="mt-3">
              <DataTable
                columns={["VehicleType", "AssignedUnit", "Route", "AssignedTo", "OfficerAddress", "Status"]}
                data={routeMapRows}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-card-foreground">Shift Coverage</h2>
        <DataTable
          columns={["Shift", "PreferredMode", "SupportVehicles", "LastUpdated", "Status"]}
          data={shiftRows}
        />
      </div>
    </div>
  )
}
