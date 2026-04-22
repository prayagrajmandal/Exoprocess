"use client"

import { useMemo, useState } from "react"
import { PageHeader, DataTable, KpiCard } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { usePayments } from "@/hooks/use-payments"
import { canEditRoute } from "@/lib/auth"
import { BanknoteArrowDown, CircleDollarSign, Clock3, CreditCard, Plus } from "lucide-react"

const paymentCategories = ["Driver", "Maintenance Team", "Helper", "Fuel Vendor", "Toll", "Other"]
const paymentStatuses = ["Pending", "Partially Paid", "Paid"]
const paymentMethods = ["Cash", "Bank Transfer", "UPI", "Cheque"]

const emptyForm = {
  payeeName: "",
  category: "Driver",
  amount: "",
  status: "Pending",
  paymentMethod: "Bank Transfer",
  dueDate: "",
  paidDate: "",
  referenceNumber: "",
  notes: "",
}

export default function PaymentsPage() {
  const { session } = useAuth()
  const { entries, isLoading, createEntry } = usePayments()
  const canEditPayments = Boolean(session && canEditRoute(session, "/payments"))
  const [statusFilter, setStatusFilter] = useState("All")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filteredEntries = useMemo(
    () => (statusFilter === "All" ? entries : entries.filter((entry) => entry.status === statusFilter)),
    [entries, statusFilter]
  )

  const paidCount = entries.filter((entry) => entry.status === "Paid").length
  const pendingCount = entries.filter((entry) => entry.status === "Pending").length
  const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.amount.replace(/[^\d.]/g, "") || 0), 0)

  const tableData = filteredEntries.map((entry) => ({
    PaymentID: entry.id,
    Payee: entry.payeeName,
    Category: entry.category,
    Amount: entry.amount,
    Method: entry.paymentMethod,
    Status: entry.status,
    DueDate: entry.dueDate,
    PaidDate: entry.paidDate,
    Reference: entry.referenceNumber || "-",
  }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await createEntry({
      payeeName: form.payeeName,
      category: form.category,
      amount: Number(form.amount || 0),
      status: form.status,
      paymentMethod: form.paymentMethod,
      dueDate: form.dueDate,
      paidDate: form.paidDate,
      referenceNumber: form.referenceNumber,
      notes: form.notes,
    })
    setForm(emptyForm)
    setShowCreateForm(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment"
        description="Track driver, maintenance, helper, and other TMS operational payments"
        actions={
          canEditPayments ? (
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowCreateForm((current) => !current)}>
              <Plus className="mr-2 h-4 w-4" />
              {showCreateForm ? "Close Form" : "Add Payment"}
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total Payments" value={entries.length} icon={<CreditCard className="h-5 w-5" />} />
        <KpiCard label="Paid Entries" value={paidCount} icon={<CircleDollarSign className="h-5 w-5 text-success" />} />
        <KpiCard label="Pending Entries" value={pendingCount} icon={<Clock3 className="h-5 w-5 text-warning" />} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {["All", ...paymentStatuses].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === status ? "bg-primary text-primary-foreground" : "border border-border bg-card text-card-foreground hover:bg-muted"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Total amount: <span className="text-foreground">Rs. {totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {showCreateForm && canEditPayments ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Payee Name</label>
                <input value={form.payeeName} onChange={(event) => setForm({ ...form, payeeName: event.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Category</label>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  {paymentCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Amount</label>
                <input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Status</label>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  {paymentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Payment Method</label>
                <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  {paymentMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Reference Number</label>
                <input value={form.referenceNumber} onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Paid Date</label>
                <input type="date" value={form.paidDate} onChange={(event) => setForm({ ...form, paidDate: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Notes</label>
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <BanknoteArrowDown className="mr-2 h-4 w-4" />
                Save Payment
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {!canEditPayments ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          You have display access only for Payment. Edit access is required to add payment entries.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading payment entries...
        </div>
      ) : (
        <DataTable
          columns={["PaymentID", "Payee", "Category", "Amount", "Method", "Status", "DueDate", "PaidDate", "Reference"]}
          data={tableData}
          renderers={{
            Amount: (value) => {
              return <span className="font-semibold text-foreground">{String(value)}</span>
            },
            Payee: (value, row) => {
              return (
                <div>
                  <p className="font-medium text-foreground">{String(value)}</p>
                  <p className="text-xs text-muted-foreground">{String(row.Category)}</p>
                </div>
              )
            },
          }}
        />
      )}
    </div>
  )
}
