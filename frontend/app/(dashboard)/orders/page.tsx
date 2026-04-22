"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, StatusBadge } from "@/components/tms-ui"
import { useOrders, type Order } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Plus, Filter, X, MapPin, Navigation, PlugZap, Loader2 } from "lucide-react"

// ─── Inline custom table (bypasses DataTable's renderCell limitation) ─────────
const COLUMNS = [
  { key: "id",          label: "ORDER ID"      },
  { key: "customer",    label: "CUSTOMER NAME" },
  { key: "source",      label: "SOURCE"        },
  { key: "destination", label: "DESTINATION"   },
  { key: "weight",      label: "WEIGHT"        },
  { key: "volume",      label: "VOLUME"        },
  { key: "status",      label: "STATUS"        },
  { key: "createdAt",   label: "CREATED AT"    },
  { key: "geotrack",    label: "GEOTRACK"      },
]

interface OrdersTableProps {
  rows: Order[]
  onGeoTrack: (o: Order) => void
}

function OrdersTable({ rows, onGeoTrack }: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/90">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => (
            <tr
              key={o.id}
              className={`cursor-pointer border-b border-border transition-all duration-200 last:border-0 hover:z-10 hover:scale-[1.01] hover:bg-gradient-to-r hover:from-sky-100/90 hover:via-blue-50 hover:to-cyan-100/85 hover:shadow-[0_16px_36px_rgba(59,130,246,0.18)] dark:border-blue-400/10 dark:hover:bg-gradient-to-r dark:hover:from-slate-800 dark:hover:via-blue-950/85 dark:hover:to-slate-900 dark:hover:shadow-[0_18px_42px_rgba(15,23,42,0.48)] ${
                i % 2 === 0 ? "bg-card dark:bg-transparent" : "bg-muted/10 dark:bg-white/[0.03]"
              }`}
            >
              <td className="px-4 py-3 font-medium text-foreground">{o.id}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.source}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.destination}</td>

              <td className="px-4 py-3 text-muted-foreground">{o.weight}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.volume}</td>

              {/* ── Status badge ── */}
              <td className="px-4 py-3">
                <StatusBadge status={o.status} />
              </td>

              <td className="px-4 py-3 text-muted-foreground">{o.createdAt}</td>

              <td className="px-4 py-3">
                <button
                  onClick={() => onGeoTrack(o)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm active:scale-95"
                >
                  <MapPin className="h-3 w-3" />
                  View
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter()
  const { orders, isLoading } = useOrders()
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [geoOrder, setGeoOrder]           = useState<Order | null>(null)

  const filteredOrders = statusFilter === "All"
    ? orders
    : orders.filter(o => o.status === statusFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage and track all transport orders"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/settings/api-setup")}>
              <PlugZap className="mr-2 h-4 w-4" /> API Setup
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </div>
        }
      />

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
        </div>
        {["All", "Pending", "Planned", "Dispatched"].map(s => (
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

      {/* Custom table — full control over every cell */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <OrdersTable
          rows={filteredOrders}
          onGeoTrack={setGeoOrder}
        />
      )}

      {/* ── GeoTrack Map Modal ─────────────────────────────────────────────── */}
      {geoOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setGeoOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Navigation className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">GeoTrack — {geoOrder.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {geoOrder.source} → {geoOrder.destination}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGeoOrder(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Route strip */}
            <div className="flex items-center gap-4 border-b border-border bg-white/60 px-5 py-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium">{geoOrder.source}</span>
              </div>
              <div className="h-px flex-1 border-t border-dashed border-border" />
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium">{geoOrder.destination}</span>
              </div>
            </div>

            {/* Embedded map */}
            <div className="h-80 w-full bg-muted">
              <iframe
                key={geoOrder.id}
                title={`Map – ${geoOrder.destination}`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(geoOrder.destination)}&output=embed`}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Customer:{" "}
                <span className="font-medium text-foreground">{geoOrder.customer}</span>
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setGeoOrder(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(geoOrder.destination)}`,
                      "_blank"
                    )
                  }
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  Open in Maps
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
