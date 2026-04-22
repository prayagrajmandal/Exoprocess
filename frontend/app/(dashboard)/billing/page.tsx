"use client"

import { useState } from "react"
import { PageHeader, DataTable, KpiCard } from "@/components/tms-ui"
import { useInvoices } from "@/hooks/use-invoices"
import { Button } from "@/components/ui/button"
import { Download, Wallet, Clock, AlertTriangle, CheckCircle2, Filter, Loader2 } from "lucide-react"

export default function BillingPage() {
  const { invoices, isLoading } = useInvoices()
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const filteredInvoices = statusFilter === "All"
    ? invoices
    : invoices.filter(inv => inv.status === statusFilter)

  const tableData = filteredInvoices.map(inv => ({
    InvoiceID: inv.id,
    TripID: inv.tripId,
    Customer: inv.customer,
    Amount: inv.amount,
    Status: inv.status,
    CreatedAt: inv.createdAt,
  }))

  const totalPaid = invoices.filter(i => i.status === "Paid").length
  const totalPending = invoices.filter(i => i.status === "Pending").length
  const totalOverdue = invoices.filter(i => i.status === "Overdue").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices and payment tracking"
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Paid Invoices"
          value={totalPaid}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
        />
        <KpiCard
          label="Pending Invoices"
          value={totalPending}
          icon={<Clock className="h-5 w-5 text-warning" />}
        />
        <KpiCard
          label="Overdue Invoices"
          value={totalOverdue}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
        </div>
        {["All", "Paid", "Pending", "Overdue"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground border border-border hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={["InvoiceID", "TripID", "Customer", "Amount", "Status", "CreatedAt"]}
          data={tableData}
          actions={[
            { label: "View", onClick: () => {} },
          ]}
        />
      )}
    </div>
  )
}
