"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TmsBrandLogo } from "@/components/tms-brand-logo"
import { cn } from "@/lib/utils"
import { type AuthSession, type AccessRoute, getEffectiveAccessRoutes, getRoleLabels } from "@/lib/auth"
import {
  Home,
  Box,
  CreditCard,
  Route,
  Truck,
  Map,
  User,
  Car,
  Bus,
  Shield,
  Wallet,
  Settings,
  Menu,
  Weight,
  Users,
  Wrench,
  MapPinned,
  UserCog,
  Crown,
  Moon,
  Sun,
  FileBarChart,
} from "lucide-react"

const navItems = [
  { label: "Super Admin", icon: Crown, route: "/superadmin", superAdminOnly: true, iconClassName: "bg-amber-500/12 text-amber-600 border-amber-200/70 dark:text-amber-300 dark:border-amber-400/20" },
  { label: "Admin Users", icon: UserCog, route: "/admin", adminOnly: true, iconClassName: "bg-cyan-500/12 text-cyan-700 border-cyan-200/70 dark:text-cyan-300 dark:border-cyan-400/20" },
  { label: "Dashboard", icon: Home, route: "/dashboard", iconClassName: "bg-blue-500/12 text-blue-700 border-blue-200/70 dark:text-blue-300 dark:border-blue-400/20" },
  { label: "Reports", icon: FileBarChart, route: "/reports", iconClassName: "bg-emerald-500/12 text-emerald-700 border-emerald-200/70 dark:text-emerald-300 dark:border-emerald-400/20" },
  { label: "Orders", icon: Box, route: "/orders", iconClassName: "bg-violet-500/12 text-violet-700 border-violet-200/70 dark:text-violet-300 dark:border-violet-400/20" },
  { label: "Payment", icon: CreditCard, route: "/payments", iconClassName: "bg-cyan-500/12 text-cyan-700 border-cyan-200/70 dark:text-cyan-300 dark:border-cyan-400/20" },
  { label: "Order Landing Page", icon: Box, route: "/orderlanding", superAdminOnly: true, iconClassName: "bg-fuchsia-500/12 text-fuchsia-700 border-fuchsia-200/70 dark:text-fuchsia-300 dark:border-fuchsia-400/20" },
  { label: "Planning", icon: Route, route: "/planning", superAdminOnly: true, iconClassName: "bg-sky-500/12 text-sky-700 border-sky-200/70 dark:text-sky-300 dark:border-sky-400/20" },
  { label: "Vehicle Assignment", icon: Truck, route: "/vehicleassignment", iconClassName: "bg-indigo-500/12 text-indigo-700 border-indigo-200/70 dark:text-indigo-300 dark:border-indigo-400/20" },
  { label: "Trips", icon: Route, route: "/trips", iconClassName: "bg-emerald-500/12 text-emerald-700 border-emerald-200/70 dark:text-emerald-300 dark:border-emerald-400/20" },
  { label: "Tracking", icon: Map, route: "/tracking", iconClassName: "bg-teal-500/12 text-teal-700 border-teal-200/70 dark:text-teal-300 dark:border-teal-400/20" },
  { label: "Route Map", icon: MapPinned, route: "/routemap", iconClassName: "bg-lime-500/12 text-lime-700 border-lime-200/70 dark:text-lime-300 dark:border-lime-400/20" },
  { label: "Drivers", icon: User, route: "/drivers", iconClassName: "bg-rose-500/12 text-rose-700 border-rose-200/70 dark:text-rose-300 dark:border-rose-400/20" },
  { label: "Fleet", icon: Car, route: "/fleet", iconClassName: "bg-orange-500/12 text-orange-700 border-orange-200/70 dark:text-orange-300 dark:border-orange-400/20" },
  { label: "Employee Transport", icon: Bus, route: "/employee-transport", iconClassName: "bg-cyan-500/12 text-cyan-700 border-cyan-200/70 dark:text-cyan-300 dark:border-cyan-400/20" },
  { label: "Vehicle", icon: Users, route: "/vehicledriver", superAdminOnly: true, iconClassName: "bg-pink-500/12 text-pink-700 border-pink-200/70 dark:text-pink-300 dark:border-pink-400/20" },
  { label: "Maintenance", icon: Wrench, route: "/maintenance", iconClassName: "bg-red-500/12 text-red-700 border-red-200/70 dark:text-red-300 dark:border-red-400/20" },
  { label: "Truck Scale", icon: Weight, route: "/trackscale", iconClassName: "bg-yellow-500/12 text-yellow-700 border-yellow-200/70 dark:text-yellow-300 dark:border-yellow-400/20" },
  { label: "Gate Pass", icon: Shield, route: "/gatepass", iconClassName: "bg-green-500/12 text-green-700 border-green-200/70 dark:text-green-300 dark:border-green-400/20" },
  { label: "Billing", icon: Wallet, route: "/billing", iconClassName: "bg-purple-500/12 text-purple-700 border-purple-200/70 dark:text-purple-300 dark:border-purple-400/20" },
  { label: "Settings", icon: Settings, route: "/settings", iconClassName: "bg-slate-500/12 text-slate-700 border-slate-200/70 dark:text-slate-300 dark:border-slate-400/20" },
]

export function AppSidebar({
  session,
  collapsed,
  onCollapsedChange,
  darkMode,
  onDarkModeChange,
}: {
  session: AuthSession
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  darkMode: boolean
  onDarkModeChange: (darkMode: boolean) => void
}) {
  const pathname = usePathname()
  const effectiveAccessRoutes = getEffectiveAccessRoutes(session)
  const handleSidebarMouseEnter = () => {
    if (window.innerWidth >= 1024 && collapsed) {
      onCollapsedChange(false)
    }
  }

  const handleSidebarMouseLeave = () => {
    if (window.innerWidth >= 1024 && !collapsed) {
      onCollapsedChange(true)
    }
  }

  const visibleNavItems = navItems.filter((item) => {
    if (item.superAdminOnly) {
      return session.roles.includes("super-admin") && effectiveAccessRoutes.includes(item.route as AccessRoute)
    }
    if (item.adminOnly) {
      return session.roles.includes("admin") && effectiveAccessRoutes.includes(item.route as AccessRoute)
    }

    return effectiveAccessRoutes.includes(item.route as AccessRoute)
  })

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="fixed top-4 left-4 z-50 flex items-center justify-center rounded-lg bg-sidebar p-2 text-sidebar-foreground lg:hidden"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto overflow-x-visible border-r border-sidebar-border/70 bg-sidebar/92 text-sidebar-foreground shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 dark:shadow-none",
          collapsed ? "w-[72px]" : "w-[280px]",
          "max-lg:-translate-x-full max-lg:data-[open=true]:translate-x-0"
        )}
        data-open={collapsed ? undefined : "true"}
      >
        {/* Logo */}
        <div className="group relative flex min-h-[76px] items-center gap-3 px-4 py-4" title={collapsed ? "EXO PG" : undefined} aria-label="EXO PG">
          {collapsed ? (
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
              <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,rgba(59,130,246,0.95),rgba(99,102,241,0.75),rgba(249,115,22,0.75))]" />
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200/70 bg-[linear-gradient(145deg,#ffffff_0%,#eff6ff_48%,#f8fafc_100%)] shadow-inner dark:border-white/10 dark:bg-[linear-gradient(145deg,#0f172a_0%,#111827_48%,#0f172a_100%)]">
                <svg viewBox="0 0 48 48" className="h-6 w-6">
                  <defs>
                    <linearGradient id="collapsed-logo-mark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="55%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M15 31V17h18"
                    fill="none"
                    stroke="url(#collapsed-logo-mark)"
                    strokeWidth="3.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 23h14.5c2.8 0 4.8 1 5.8 3.1l2.4 4.9H15V23Z"
                    fill="none"
                    stroke="url(#collapsed-logo-mark)"
                    strokeWidth="3.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M25 15V9"
                    fill="none"
                    stroke="url(#collapsed-logo-mark)"
                    strokeWidth="3.1"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="34.5" r="2.2" fill="#94a3b8" className="dark:fill-slate-200" />
                  <circle cx="33" cy="34.5" r="2.2" fill="#94a3b8" className="dark:fill-slate-200" />
                </svg>
              </div>
            </div>
          ) : (
            <TmsBrandLogo compact className="w-full max-w-[168px]" />
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-sidebar-foreground/45">Workspace</span>
              <span className="text-xs text-sidebar-foreground/70">{getRoleLabels(session.roles)}</span>
            </div>
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 translate-x-[-6px] whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
              <span className="absolute right-full top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-blue-200 bg-blue-600 shadow-md shadow-red-950/20" />
              <span className="relative block rounded-md border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-950/30">
                NextGen
              </span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-visible px-3 py-3">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.route || pathname.startsWith(item.route + "/")
            return (
              <Link
                key={item.route}
                href={item.route}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_30px_rgba(26,115,232,0.20)]"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/75 hover:text-sidebar-accent-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity",
                    isActive ? "bg-white/80 opacity-100" : "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                    isActive
                      ? "border-white/20 bg-white/15 text-white"
                      : item.iconClassName
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                </span>
                {!collapsed && <span>{item.label}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 translate-x-[-6px] whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                    <span className="absolute right-full top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-blue-200 bg-blue-600 shadow-md shadow-red-950/20" />
                    <span className="relative block rounded-md border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-950/30">
                      {item.label}
                    </span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar actions */}
        <div className="border-t border-sidebar-border/70 p-3">
          <button
            onClick={() => onDarkModeChange(!darkMode)}
            title={collapsed ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
            aria-label={darkMode ? "Light Mode" : "Dark Mode"}
            className="group relative mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent/75 hover:text-sidebar-accent-foreground"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              {darkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            </span>
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 translate-x-[-6px] whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                <span className="absolute right-full top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-blue-200 bg-blue-600 shadow-md shadow-red-950/20" />
                <span className="relative block rounded-md border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-950/30">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
