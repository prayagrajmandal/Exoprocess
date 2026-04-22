"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, PageHeader } from "@/components/tms-ui"
import { useOrders } from "@/hooks/use-orders"
import { ArrowLeft } from "lucide-react"

export default function VehicleAssignmentDeliveriesPage() {
  const router = useRouter()
  const { orders, isLoading } = useOrders()

  const deliveryTableData = orders.map((order) => ({
    DeliveryID: order.id,
    Customer: order.customer,
    Route: `${order.source} -> ${order.destination}`,
    Quantity: order.weight,
    Status: order.status,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Total Deliveries"
        description="All delivery records from the Vehicle Assignment dashboard card."
        actions={
          <Button variant="outline" onClick={() => router.push("/vehicleassignment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading deliveries...
        </div>
      ) : (
        <DataTable
          columns={["DeliveryID", "Customer", "Route", "Quantity", "Status"]}
          data={deliveryTableData}
        />
      )}
    </div>
  )
}
