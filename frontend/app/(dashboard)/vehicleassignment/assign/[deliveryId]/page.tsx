"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/tms-ui"
import { useAuth } from "@/hooks/use-auth"
import { useDrivers } from "@/hooks/use-drivers"
import { useOrders } from "@/hooks/use-orders"
import { useVehicleAssignments } from "@/hooks/use-vehicle-assignments"
import { canEditRoute } from "@/lib/auth"
import {
  TRUCK_SIZE_OPTIONS,
  getAvailableVehiclesForTruckSize,
  getRecommendedTruckSize,
  parseCapacityKg,
} from "@/lib/vehicle-assignments"
import { ArrowLeft, Building2, Plus, Trash2 } from "lucide-react"

const readOnlyFieldClassName =
  "w-full rounded-lg border border-sky-300 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-950 shadow-sm focus:outline-none"
const ASSISTANT_PREFIX = "[Assistant] "

function parseWeightToKg(weight: string) {
  const digits = weight.replace(/,/g, "").match(/\d+/)
  return digits ? Number(digits[0]) : 0
}

function getSelectedTruckSize(savedTruckSize: string | undefined, fallbackTruckSize: string) {
  return savedTruckSize && TRUCK_SIZE_OPTIONS.includes(savedTruckSize as (typeof TRUCK_SIZE_OPTIONS)[number])
    ? savedTruckSize
    : fallbackTruckSize
}

function isAssistantName(name: string) {
  return name.startsWith(ASSISTANT_PREFIX)
}

function getDisplayName(name: string) {
  return isAssistantName(name) ? name.slice(ASSISTANT_PREFIX.length) : name
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(query: string, ...values: string[]) {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => normalizeSearchValue(value).startsWith(normalizedQuery))
}

export default function VehicleAssignmentFormPage() {
  const params = useParams<{ deliveryId: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const { drivers } = useDrivers()
  const { orders, isLoading: isOrdersLoading } = useOrders()
  const { assignments, isLoading: isAssignmentsLoading, saveAssignments } = useVehicleAssignments()
  const [feedback, setFeedback] = useState<{ message: string; type: "error" | "success" } | null>(null)

  const deliveryId = decodeURIComponent(params.deliveryId)
  const order = orders.find((item) => item.id === deliveryId)
  const existingAssignments = assignments.filter((assignment) => assignment.deliveryId === deliveryId)

  const [formData, setFormData] = useState(() => ({
    deliveryId: order?.id ?? "",
    customer: order?.customer ?? "",
    source: order?.source ?? "",
    destination: order?.destination ?? "",
    totalQuantityKg: parseWeightToKg(order?.weight ?? ""),
    loadType: existingAssignments[0]?.loadType ?? "Material / product",
    recommendedTruckSize: getSelectedTruckSize(
      existingAssignments[0]?.recommendedTruckSize,
      getRecommendedTruckSize(parseWeightToKg(order?.weight ?? "") || 1)
    ),
    notes: existingAssignments[0]?.notes ?? "",
    challanNumber: existingAssignments[0]?.challanNumber ?? "",
  }))

  const [truckAssignments, setTruckAssignments] = useState<any[]>(() => {
    if (existingAssignments.length > 0) {
      return existingAssignments.map((a) => ({
        id: a.id,
        vehicleQuery: a.assignedVehicleId ?? "",
        driverQuery: a.assignedDriverName ?? "",
        assistantQuery: a.assignedAssistantName ?? "",
        quantityKg: String(a.quantityKg),
      }))
    }
    return [{ vehicleQuery: "", driverQuery: "", assistantQuery: "", quantityKg: String(parseWeightToKg(order?.weight ?? "")) }]
  })

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!order || isAssignmentsLoading || isOrdersLoading || isInitialized) {
      return
    }

    const totalWeight = parseWeightToKg(order.weight)
    setFormData({
      deliveryId: order.id,
      customer: order.customer,
      source: order.source,
      destination: order.destination,
      totalQuantityKg: totalWeight,
      loadType: existingAssignments[0]?.loadType ?? "Material / product",
      recommendedTruckSize: getSelectedTruckSize(
        existingAssignments[0]?.recommendedTruckSize,
        getRecommendedTruckSize(totalWeight || 1)
      ),
      notes: existingAssignments[0]?.notes ?? "",
      challanNumber: existingAssignments[0]?.challanNumber ?? "",
    })

    if (existingAssignments.length > 0) {
      setTruckAssignments(existingAssignments.map((a) => ({
        id: a.id,
        vehicleQuery: a.assignedVehicleId ?? "",
        driverQuery: a.assignedDriverName ?? "",
        assistantQuery: a.assignedAssistantName ?? "",
        quantityKg: String(a.quantityKg),
      })))
    } else {
      setTruckAssignments([{
        vehicleQuery: "",
        driverQuery: "",
        assistantQuery: "",
        quantityKg: String(totalWeight)
      }])
    }
    setIsInitialized(true)
  }, [existingAssignments.length, order, isAssignmentsLoading, isOrdersLoading, isInitialized])

  const canAssignVehicle = Boolean(session && canEditRoute(session, "/vehicleassignment"))
  
  const availableDrivers = useMemo(
    () => drivers.filter((driver) => !isAssistantName(driver.name)),
    [drivers]
  )
  const availableAssistants = useMemo(
    () => drivers.filter((driver) => isAssistantName(driver.name)),
    [drivers]
  )

  const addTruckAssignment = () => {
    setTruckAssignments([...truckAssignments, { vehicleQuery: "", driverQuery: "", assistantQuery: "", quantityKg: "0" }])
  }

  const removeTruckAssignment = (index: number) => {
    const next = [...truckAssignments]
    next.splice(index, 1)
    setTruckAssignments(next)
  }

  const updateTruckAssignment = (index: number, updates: any) => {
    const next = [...truckAssignments]
    next[index] = { ...next[index], ...updates }
    setTruckAssignments(next)
  }

  const resolveVehicle = (query: string) => {
    if (!query) return null
    return getAvailableVehiclesForTruckSize(formData.totalQuantityKg, formData.recommendedTruckSize as any).find((vehicle) =>
      normalizeSearchValue(vehicle.id) === normalizeSearchValue(query)
      || normalizeSearchValue(`${vehicle.id} - ${vehicle.type}`) === normalizeSearchValue(query)
      || normalizeSearchValue(`${vehicle.id} ${vehicle.type} ${vehicle.capacity}`).startsWith(normalizeSearchValue(query))
    ) ?? null
  }

  const resolveDriver = (query: string) => {
    if (!query) return null
    return availableDrivers.find((driver) =>
      normalizeSearchValue(driver.id) === normalizeSearchValue(query)
      || normalizeSearchValue(getDisplayName(driver.name)) === normalizeSearchValue(query)
      || matchesSearch(query, driver.id, getDisplayName(driver.name))
    ) ?? null
  }

  const resolveAssistant = (query: string) => {
    if (!query) return null
    return availableAssistants.find((assistant) =>
      normalizeSearchValue(assistant.id) === normalizeSearchValue(query)
      || normalizeSearchValue(getDisplayName(assistant.name)) === normalizeSearchValue(query)
      || matchesSearch(query, assistant.id, getDisplayName(assistant.name))
    ) ?? null
  }

  const handleAssignVehicle = async () => {
    if (!session || !canAssignVehicle || !order) {
      return
    }

    const processedAssignments = truckAssignments.map((item) => {
      const v = resolveVehicle(item.vehicleQuery)
      const d = resolveDriver(item.driverQuery)
      const a = resolveAssistant(item.assistantQuery)
      return { ...item, v, d, a, quantity: Number(item.quantityKg || 0) }
    })

    const invalid = processedAssignments.some(a => !a.v || !a.d || a.quantity <= 0)
    if (invalid) {
      setFeedback({
        message: "Please complete truck, driver, and quantity details for all trucks.",
        type: "error"
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const overCapacity = processedAssignments.some(a => a.v && parseCapacityKg(a.v.capacity) < a.quantity)
    if (overCapacity) {
      setFeedback({
        message: "One or more trucks have capacity lower than assigned quantity.",
        type: "error"
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const nextAssignments = processedAssignments.map((a, index) => {
      const nextAssignmentId = a.id ?? `VA-${100 + assignments.length + index + 1}`
      const nextGatePassId = `GP-${900 + assignments.length + index + 1}`
      return {
        id: nextAssignmentId,
        gatePassId: nextGatePassId,
        gatePassStatus: "Pending",
        deliveryId: formData.deliveryId.trim().toUpperCase(),
        customer: formData.customer.trim(),
        source: formData.source.trim(),
        destination: formData.destination.trim(),
        quantityKg: a.quantity,
        loadType: formData.loadType.trim(),
        recommendedTruckSize: formData.recommendedTruckSize.trim(),
        assignedVehicleId: a.v?.id ?? "",
        assignedVehicleType: a.v?.type ?? "",
        assignedVehicleCapacity: a.v?.capacity ?? "",
        assignedDriverId: a.d?.id ?? "",
        assignedDriverName: a.d ? getDisplayName(a.d.name) : "",
        assignedAssistantId: a.a?.id ?? null,
        assignedAssistantName: a.a ? getDisplayName(a.a.name) : null,
        assignedBy: session.name,
        assignedByUserId: session.userId,
        organization: session.organization,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        notes: formData.notes.trim() || "Shared with Gate Pass and Head Office for dispatch visibility.",
        challanNumber: formData.challanNumber?.trim() || "",
      }
    })

    try {
      await saveAssignments(nextAssignments)
      router.push("/vehicleassignment")
    } catch (err: any) {
      setFeedback({
        message: err.message || "Failed to save assignments. Please try again.",
        type: "error"
      })
    }
  }

  if (isOrdersLoading || isAssignmentsLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading delivery details...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vehicle Assignment"
          description="Delivery not found."
          actions={
            <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
      </div>
    )
  }

  const currentTotalAssigned = truckAssignments.reduce((sum, a) => sum + Number(a.quantityKg || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Assignment"
        description="Assign truck by delivery details"
        actions={
          <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {feedback ? (
        <div 
          className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
            feedback.type === "error" 
              ? "border-destructive/20 bg-destructive/10 text-destructive" 
              : "border-success/20 bg-success/10 text-success"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {!canAssignVehicle ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          You have display access only for Vehicle Assignment. Edit access is required to assign or reassign trucks.
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Assign Truck By Delivery Details</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Delivery ID</label>
            <input value={formData.deliveryId} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Customer</label>
            <input value={formData.customer} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Source</label>
            <input value={formData.source} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Destination</label>
            <input value={formData.destination} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Total Quantity (kg)</label>
            <input value={formData.totalQuantityKg} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Delivery Type</label>
            <input value={formData.loadType} readOnly className={readOnlyFieldClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Suggested Truck Size</label>
            <select
              value={formData.recommendedTruckSize}
              onChange={(e) => setFormData({ ...formData, recommendedTruckSize: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TRUCK_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {canAssignVehicle && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-md font-semibold text-card-foreground">Assigned Trucks</h3>
              <Button onClick={addTruckAssignment} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <Plus className="mr-1 h-4 w-4" /> Add Another Truck
              </Button>
            </div>

            {truckAssignments.map((assignment, index) => {
              const selectedVehicle = resolveVehicle(assignment.vehicleQuery)
              const selectedDriver = resolveDriver(assignment.driverQuery)
              const selectedAssistant = resolveAssistant(assignment.assistantQuery)
              const suggestedVehicles = getAvailableVehiclesForTruckSize(formData.totalQuantityKg, formData.recommendedTruckSize as any)
              
              const otherAssignedIds = truckAssignments
                .filter((_, i) => i !== index)
                .map(a => resolveVehicle(a.vehicleQuery)?.id)
                .filter(Boolean)

              const filteredVehicles = suggestedVehicles.filter(v => 
                !otherAssignedIds.includes(v.id) || v.id === assignment.vehicleQuery
              )
              const filteredDrivers = availableDrivers.filter(d => 
                matchesSearch(assignment.driverQuery, d.id, getDisplayName(d.name))
              )
              const filteredAssistants = availableAssistants.filter(a => 
                matchesSearch(assignment.assistantQuery, a.id, getDisplayName(a.name))
              )

              return (
                <div key={index} className="relative rounded-lg border border-border p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Truck #{index + 1}</span>
                    {truckAssignments.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeTruckAssignment(index)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-card-foreground">Assign Truck</label>
                      <select
                        value={assignment.vehicleQuery}
                        onChange={(e) => updateTruckAssignment(index, { vehicleQuery: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Truck</option>
                        {filteredVehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.id} ({v.type} - {v.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-card-foreground">Assign Driver</label>
                      <select
                        value={assignment.driverQuery}
                        onChange={(e) => updateTruckAssignment(index, { driverQuery: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Driver</option>
                        {filteredDrivers.map((d) => (
                          <option key={d.id} value={getDisplayName(d.name)}>{getDisplayName(d.name)} ({d.id})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-card-foreground">Assign Assistant</label>
                      <select
                        value={assignment.assistantQuery}
                        onChange={(e) => updateTruckAssignment(index, { assistantQuery: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Assistant</option>
                        {filteredAssistants.map((a) => (
                          <option key={a.id} value={getDisplayName(a.name)}>{getDisplayName(a.name)} ({a.id})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-card-foreground">Quantity for this truck (kg)</label>
                      <input
                        type="number"
                        value={assignment.quantityKg}
                        onChange={(e) => updateTruckAssignment(index, { quantityKg: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {selectedVehicle && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-sky-700 bg-sky-50 p-2 rounded-md border border-sky-100">
                      <p><span className="font-semibold">Truck Type:</span> {selectedVehicle.type}</p>
                      <p><span className="font-semibold">Max Capacity:</span> {selectedVehicle.capacity}</p>
                      <p><span className="font-semibold">Driver:</span> {selectedDriver ? getDisplayName(selectedDriver.name) : "N/A"}</p>
                      <p><span className="font-semibold">Location:</span> {selectedVehicle.location}</p>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 border border-sky-200">
              <div className="text-sm">
                <p className="font-semibold text-sky-900">Total Assigned: {currentTotalAssigned} kg</p>
                <p className="text-xs text-sky-700">Order Quantity: {formData.totalQuantityKg} kg</p>
              </div>
              {currentTotalAssigned !== formData.totalQuantityKg && (
                <p className="text-xs font-medium text-amber-600">
                  {currentTotalAssigned > formData.totalQuantityKg 
                    ? `Over-assigned by ${currentTotalAssigned - formData.totalQuantityKg} kg`
                    : `Remaining to assign: ${formData.totalQuantityKg - currentTotalAssigned} kg`}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Original Challan No</label>
                <input
                  type="text"
                  value={formData.challanNumber || ""}
                  onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                  placeholder="Enter original document number"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Notes For Gate Pass / HO</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add dispatch note, special handling, or gate instruction"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8" 
                onClick={handleAssignVehicle}
                disabled={isAssignmentsLoading}
              >
                {isAssignmentsLoading ? "Saving Assignments..." : "Assign All Trucks"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
