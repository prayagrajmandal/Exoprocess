"use client"

import { useRouter } from "next/navigation"
import { PageHeader, KpiCard } from "@/components/tms-ui"
import { kpiData, monthlyTripsData, fleetUtilData } from "@/lib/mock-data"
import { Truck, Box, Car, MapPin, TrendingUp, BarChart3, Sparkles, ArrowUpRight } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"

const averageTrips = Math.round(monthlyTripsData.reduce((sum, item) => sum + item.trips, 0) / monthlyTripsData.length)
const highestTripsMonth = monthlyTripsData.reduce((best, item) => (item.trips > best.trips ? item : best), monthlyTripsData[0])
const highestFleetUtil = fleetUtilData.reduce((best, item) => (item.utilization > best.utilization ? item : best), fleetUtilData[0])
const averageFleetUtil = Math.round(
  fleetUtilData.reduce((sum, item) => sum + item.utilization, 0) / fleetUtilData.length
)

function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
  light = false,
}: {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; color?: string }>
  label?: string
  valueSuffix?: string
  light?: boolean
}) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0]

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md",
        light
          ? "border border-sky-200 bg-white/95 text-slate-900"
          : "border border-white/10 bg-slate-950/95 text-white"
      )}
    >
      <p className={cn("text-sm font-semibold", light ? "text-slate-900" : "text-white")}>{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color ?? "var(--primary)" }}
        />
        <p className={cn("text-sm", light ? "text-slate-600" : "text-slate-300")}>{item.name}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-blue-400">
        {item.value}
        {valueSuffix}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your transport operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/active-trips")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Active Trips"
            value={kpiData.activeTrips}
            icon={<Truck className="h-5 w-5" />}
            trend={{ value: "12% vs last week", positive: true }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/pending-orders")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Pending Orders"
            value={kpiData.pendingOrders}
            icon={<Box className="h-5 w-5" />}
            trend={{ value: "5% vs last week", positive: false }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/vehicles-available")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label="Vehicles Available"
            value={kpiData.vehiclesAvailable}
            icon={<Car className="h-5 w-5" />}
            trend={{ value: "3 more than yesterday", positive: true }}
            className="cursor-pointer border-sky-200 hover:border-sky-300"
          />
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trips Completed Monthly */}
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_32%)] opacity-80" />
          <div className="relative mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">Trips Completed (Monthly)</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Avg {averageTrips} trips per month, peak in {highestTripsMonth.month}
              </p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                +18% momentum
              </span>
            </div>
          </div>
          <div className="relative h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTripsData}>
                <defs>
                  <linearGradient id="tripsLineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  cursor={{ stroke: "rgba(96, 165, 250, 0.45)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={<ChartTooltip valueSuffix="" light={!isDark} />}
                />
                <Line
                  type="monotone"
                  dataKey="trips"
                  name="Trips completed"
                  stroke="url(#tripsLineStroke)"
                  strokeWidth={3}
                  dot={{ fill: "#60a5fa", stroke: "var(--card)", strokeWidth: 2, r: 4.5 }}
                  activeDot={{ r: 7, fill: "#93c5fd", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="relative mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
            <span className="text-muted-foreground">Best month</span>
            <span className="inline-flex items-center gap-1 font-semibold text-card-foreground">
              {highestTripsMonth.month} · {highestTripsMonth.trips}
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </span>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_32%)] opacity-80" />
          <div className="relative mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">Fleet Utilization %</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Average utilization is {averageFleetUtil}% across all vehicle types
              </p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Leader: {highestFleetUtil.type}
            </div>
          </div>
          <div className="relative h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetUtilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
                  content={<ChartTooltip valueSuffix="%" light={!isDark} />}
                />
                <Bar dataKey="utilization" name="Utilization" radius={[10, 10, 0, 0]}>
                  {fleetUtilData.map((entry) => (
                    <Cell
                      key={entry.type}
                      fill={entry.utilization === highestFleetUtil.utilization ? "#60a5fa" : "#3b82f6"}
                      fillOpacity={entry.utilization === highestFleetUtil.utilization ? 1 : 0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="relative mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
            <span className="text-muted-foreground">Highest utilization</span>
            <span className="inline-flex items-center gap-1 font-semibold text-card-foreground">
              {highestFleetUtil.type} · {highestFleetUtil.utilization}%
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </span>
          </div>
        </div>
      </div>

      {/* Live Vehicles Map placeholder */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Live Vehicle Positions</h3>
        </div>
        <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-lg bg-muted">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }} />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Live GPS Tracking</p>
              <p className="mt-1 text-sm text-muted-foreground">47 vehicles currently tracked across routes</p>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                In Transit: 32
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Stopped: 10
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Delayed: 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
