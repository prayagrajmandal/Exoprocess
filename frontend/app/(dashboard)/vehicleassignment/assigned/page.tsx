"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { useAuth } from "@/hooks/use-auth"
import { useVehicleAssignments } from "@/hooks/use-vehicle-assignments"
import { ArrowLeft } from "lucide-react"

export default function VehicleAssignmentAssignedPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { assignments, isLoading } = useVehicleAssignments()

  const scopedAssignments = session
    ? assignments.filter((assignment) => assignment.organization === session.organization)
    : assignments

  const assignedTableData = scopedAssignments.map((assignment) => ({
    DeliveryID: assignment.deliveryId,
    GatePassID: assignment.gatePassId,
    Customer: assignment.customer,
    Route: `${assignment.source} -> ${assignment.destination}`,
    Quantity: `${assignment.quantityKg.toLocaleString()} kg`,
    AssignedTruck: `${assignment.assignedVehicleId} (${assignment.assignedVehicleType})`,
    AssignedBy: assignment.assignedBy,
  }))

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading assigned deliveries...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Deliveries"
        description="All deliveries where a truck has already been assigned."
        actions={
          <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <DataTable
        columns={["DeliveryID", "GatePassID", "Customer", "Route", "Quantity", "AssignedTruck", "AssignedBy"]}
        data={assignedTableData}
      />
    </div>
  )
}
