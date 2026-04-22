"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader, StatusBadge } from "@/components/tms-ui"
import { orders } from "@/lib/mock-data"
import { ArrowLeft, Filter, MapPin, Navigation, X } from "lucide-react"

type Order = typeof orders[0]

const columns = [
  { key: "id", label: "ORDER ID" },
  { key: "customer", label: "CUSTOMER NAME" },
  { key: "source", label: "SOURCE" },
  { key: "destination", label: "DESTINATION" },
  { key: "geotrack", label: "GEOTRACK" },
  { key: "weight", label: "WEIGHT" },
  { key: "volume", label: "VOLUME" },
  { key: "status", label: "STATUS" },
  { key: "createdAt", label: "CREATED AT" },
]

export default function DashboardPendingOrdersPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("Pending")
  const [geoOrder, setGeoOrder] = useState<Order | null>(null)

  const filteredOrders = statusFilter === "All"
    ? orders
    : orders.filter((order) => order.status === statusFilter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Pending Orders"
        description="See order details from the dashboard card view"
        actions={
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
        </div>
        {["All", "Pending", "Planned", "Dispatched"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-card-foreground hover:bg-muted"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/90">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr
                key={order.id}
                className={`cursor-pointer border-b border-border transition-all duration-200 last:border-0 hover:z-10 hover:scale-[1.01] hover:bg-gradient-to-r hover:from-sky-100/90 hover:via-blue-50 hover:to-cyan-100/85 hover:shadow-[0_16px_36px_rgba(59,130,246,0.18)] dark:border-blue-400/10 dark:hover:bg-gradient-to-r dark:hover:from-slate-800 dark:hover:via-blue-950/85 dark:hover:to-slate-900 dark:hover:shadow-[0_18px_42px_rgba(15,23,42,0.48)] ${
                  index % 2 === 0 ? "bg-card dark:bg-transparent" : "bg-muted/10 dark:bg-white/[0.03]"
                }`}
              >
                <td className="px-4 py-3 font-medium text-foreground">{order.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.source}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.destination}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setGeoOrder(order)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm"
                  >
                    <MapPin className="h-3 w-3" />
                    View
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.weight}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.volume}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {geoOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setGeoOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Navigation className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">GeoTrack - {geoOrder.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {geoOrder.source} {"->"} {geoOrder.destination}
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

            <div className="h-80 w-full bg-muted">
              <iframe
                key={geoOrder.id}
                title={`Map - ${geoOrder.destination}`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(geoOrder.destination)}&output=embed`}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Customer: <span className="font-medium text-foreground">{geoOrder.customer}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => setGeoOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
