"use client"

import { ReactNode, isValidElement } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.96),rgba(238,242,255,0.92))] px-5 py-4 shadow-[0_18px_45px_rgba(59,130,246,0.08)] backdrop-blur-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 dark:shadow-none sm:flex-row sm:items-center sm:justify-between">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_32%)] dark:hidden" />
      <div>
        <h1 className="relative text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="relative mt-1 text-sm text-slate-600 sm:text-[15px] dark:text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="relative flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: string; positive: boolean }
  className?: string
}

export function KpiCard({ label, value, icon, trend, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(239,246,255,0.96),rgba(238,242,255,0.94))] p-3 shadow-[0_18px_42px_rgba(59,130,246,0.1)] backdrop-blur-sm dark:border-blue-400/40 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-slate-800 dark:shadow-none",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.14),transparent_28%)] opacity-80" />
      <div className="flex items-center justify-between">
        <p className="relative text-[15px] font-bold text-card-foreground dark:text-white">{label}</p>
        {icon && (
          <div className="relative rounded-lg border border-sky-200/80 bg-[linear-gradient(135deg,#eff6ff,#ecfeff)] p-1.5 text-primary shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <p className="relative mt-2 text-[2.1rem] font-extrabold tracking-tight text-card-foreground dark:text-white">{value}</p>
      {trend && (
        <p className={cn("relative mt-2 text-xs font-semibold", trend.positive ? "text-success" : "text-destructive")}>
          {trend.positive ? "+" : ""}{trend.value}
        </p>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    "Pending": "bg-warning/10 text-[#D97706] border-warning/20",
    "Planned": "bg-primary/10 text-primary border-primary/20",
    "Dispatched": "bg-success/10 text-[#059669] border-success/20",
    "In Transit": "bg-primary/10 text-primary border-primary/20",
    "Loading": "bg-warning/10 text-[#D97706] border-warning/20",
    "Unloading": "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
    "Available": "bg-success/10 text-[#059669] border-success/20",
    "Active": "bg-primary/10 text-primary border-primary/20",
    "In-Active": "bg-secondary text-secondary-foreground border-border",
    "On Trip": "bg-primary/10 text-primary border-primary/20",
    "On Break": "bg-warning/10 text-[#D97706] border-warning/20",
    "Maintenance": "bg-destructive/10 text-destructive border-destructive/20",
    "Approved": "bg-success/10 text-[#059669] border-success/20",
    "Rejected": "bg-destructive/10 text-destructive border-destructive/20",
    "Completed": "bg-success/10 text-[#059669] border-success/20",
    "In Progress": "bg-primary/10 text-primary border-primary/20",
    "Paid": "bg-success/10 text-[#059669] border-success/20",
    "Partially Paid": "bg-primary/10 text-primary border-primary/20",
    "Overdue": "bg-destructive/10 text-destructive border-destructive/20",
    "Draft": "bg-warning/10 text-[#D97706] border-warning/20",
    "Connected": "bg-success/10 text-[#059669] border-success/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorMap[status] || "bg-secondary text-secondary-foreground border-border",
        className
      )}
    >
      {status}
    </span>
  )
}

interface DataTableProps {
  columns: string[]
  data: Record<string, unknown>[]
  columnLabels?: Record<string, string>
  compact?: boolean
  actions?: {
    label: string | ((row: Record<string, unknown>) => string)
    onClick: (row: Record<string, unknown>) => void
    variant?: "default" | "destructive" | "success"
    disabled?: boolean | ((row: Record<string, unknown>) => boolean)
  }[]
  renderers?: Record<string, (value: unknown, row: Record<string, unknown>) => ReactNode>
}

export function DataTable({ columns, data, columnLabels, compact, actions, renderers }: DataTableProps) {
  const cellPaddingClass = compact ? "px-2 py-2" : "px-4 py-3"
  const headerPaddingClass = compact ? "px-2 py-2 text-[11px]" : "px-4 py-3 text-xs"
  const rowTextClass = compact ? "text-xs" : "text-sm"

  return (
    <div className="overflow-x-auto rounded-2xl border border-sky-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.96))] shadow-[0_18px_45px_rgba(59,130,246,0.08)] backdrop-blur-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 dark:shadow-sm">
      <table className={cn("w-full text-left", rowTextClass)}>
        <thead>
          <tr className="border-b border-sky-200/70 bg-[linear-gradient(90deg,rgba(224,242,254,0.9),rgba(238,242,255,0.86))] dark:border-blue-400/15 dark:bg-[linear-gradient(90deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94),rgba(23,37,84,0.92))]">
            {columns.map((col) => (
              <th
                key={col}
                className={cn(
                  "whitespace-nowrap font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground",
                  headerPaddingClass,
                  renderers?.[col] && "text-center"
                )}
              >
                {columnLabels?.[col] ?? col}
              </th>
            ))}
            {actions && (
              <th className={cn("whitespace-nowrap text-center font-semibold uppercase tracking-wider text-muted-foreground", headerPaddingClass)}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-100/80 dark:divide-blue-400/10">
          {data.map((row, i) => (
            <tr
              key={i}
              className="relative transition-all duration-200 hover:z-10 hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(59,130,246,0.18)] hover:bg-[linear-gradient(90deg,rgba(219,234,254,0.9),rgba(191,219,254,0.58),rgba(224,231,255,0.8))] dark:hover:shadow-[0_18px_42px_rgba(15,23,42,0.48)] dark:hover:bg-[linear-gradient(90deg,rgba(30,41,59,0.98),rgba(37,99,235,0.24),rgba(23,37,84,0.96))]"
            >
              {columns.map((col) => {
                const key = col.replace(/\s+/g, "")
                const value = row[key] ?? row[col] ?? row[col.toLowerCase()] ?? ""
                const isStatus = key.toLowerCase().includes("status") || key === "ApprovalStatus"
                const renderedValue = renderers?.[col]?.(value, row)
                const isCustomRendered = renderedValue !== undefined && renderedValue !== null

                return (
                  <td
                    key={col}
                    className={cn(
                      "whitespace-nowrap text-card-foreground",
                      cellPaddingClass,
                      isCustomRendered && "px-0"
                    )}
                  >
                    {isCustomRendered ? (
                      <div className="flex w-full items-center justify-center">
                        {renderedValue}
                      </div>
                    ) : isValidElement(value) ? (
                      value
                    ) : isStatus ? (
                      <StatusBadge status={String(value)} />
                    ) : (
                      String(value)
                    )}
                  </td>
                )
              })}
              {actions && (
                <td className={cn("whitespace-nowrap text-center", cellPaddingClass)}>
                  <div className="flex items-center justify-center gap-2">
                    {actions.map((action) => {
                      const isDisabled = typeof action.disabled === "function" ? action.disabled(row) : action.disabled ?? false

                      const label = typeof action.label === "function" ? action.label(row) : action.label

                      return (
                        <button
                          key={typeof action.label === "string" ? action.label : Math.random()}
                          onClick={() => action.onClick(row)}
                          disabled={isDisabled}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            action.variant === "destructive"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : action.variant === "success"
                              ? "bg-success/10 text-[#059669] hover:bg-success/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
