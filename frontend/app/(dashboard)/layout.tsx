"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { TmsBrandLogo } from "@/components/tms-brand-logo"
import { useAuth } from "@/hooks/use-auth"
import { useOrganizations } from "@/hooks/use-organizations"
import { UiLanguageProvider, useUiLanguage, type LanguageCode } from "@/lib/ui-language"
import { canAccessRoute, getDefaultRouteForSession } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UiLanguageProvider>
      <DashboardShell>{children}</DashboardShell>
    </UiLanguageProvider>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, isLoading, logout } = useAuth()
  const { organizations } = useOrganizations()
  const { language, setLanguage, t } = useUiLanguage()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [truckProgress, setTruckProgress] = useState(0)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("dashboard-theme")

    if (storedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
      document.body.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    document.body.classList.toggle("dark", darkMode)
    window.localStorage.setItem("dashboard-theme", darkMode ? "dark" : "light")
  }, [darkMode])

  useEffect(() => {
    let frameId = 0
    let startAt = 0
    const duration = 3800

    const animateTruck = (timestamp: number) => {
      if (startAt === 0) {
        startAt = timestamp
      }

      const elapsed = (timestamp - startAt) % duration
      setTruckProgress(elapsed / duration)
      frameId = window.requestAnimationFrame(animateTruck)
    }

    frameId = window.requestAnimationFrame(animateTruck)

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!session) {
      router.replace("/login")
      return
    }

    if (!canAccessRoute(session, pathname)) {
      router.replace(getDefaultRouteForSession(session))
    }
  }, [isLoading, pathname, router, session])

  if (isLoading || !session || !canAccessRoute(session, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          {t("layout.loadingWorkspace")}
        </div>
      </div>
    )
  }

  const truckTravel = 186
  const truckOpacity = truckProgress < 0.08
    ? truckProgress / 0.08
    : truckProgress > 0.92
      ? Math.max(0, (1 - truckProgress) / 0.08)
      : 1
  const smokePrimary = darkMode ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.68)"
  const smokeSecondary = darkMode ? "rgba(226,232,240,0.68)" : "rgba(30,41,59,0.56)"
  const smokeTertiary = darkMode ? "rgba(203,213,225,0.56)" : "rgba(15,23,42,0.42)"
  const headlightFill = darkMode ? "#fef3c7" : "#f8fafc"
  const headlightGlow = darkMode ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0)"
  const organization = organizations.find((item) => item.name.toLowerCase() === session.organization.toLowerCase())
  const organizationLogoUrl = organization?.logoUrl?.trim()

  return (
    <div
      className={cn(
        "flex min-h-screen text-foreground",
        darkMode
          ? "bg-background"
          : "bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.9),transparent_24%),radial-gradient(circle_at_top_right,rgba(224,231,255,0.75),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f6faff_42%,#eef6ff_100%)]",
        darkMode && "dark"
      )}
    >
      <AppSidebar
        session={session}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col p-4 pt-16 lg:px-8 lg:pb-8 lg:pt-6">
          <div className="mb-4">
            <div className="hidden lg:flex lg:items-start lg:justify-between">
              <div>
                <p className="bg-[linear-gradient(90deg,#0f172a_0%,#1d4ed8_52%,#0f172a_100%)] bg-clip-text text-xl font-extrabold uppercase tracking-[0.24em] text-transparent dark:bg-[linear-gradient(90deg,#e2e8f0_0%,#7dd3fc_52%,#e2e8f0_100%)]">
                  Transport Management System
                </p>
                <div className="relative mt-2 h-10 w-64 overflow-visible">
                  <div className="absolute bottom-0 left-0 h-[4px] w-56 rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0.24),rgba(37,99,235,0.85),rgba(249,115,22,0.45))] dark:bg-[linear-gradient(90deg,rgba(125,211,252,0.18),rgba(56,189,248,0.85),rgba(251,146,60,0.4))]" />
                <div
                  className="absolute bottom-[4px] left-0 will-change-transform"
                  style={{
                    transform: `translateX(${truckProgress * truckTravel}px)`,
                    opacity: truckOpacity,
                  }}
                >
                  <svg
                    viewBox="0 0 220 48"
                    className="h-8 w-[144px] drop-shadow-[0_6px_16px_rgba(37,99,235,0.35)]"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="peterbilt-truck" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="70%" stopColor="#1d4ed8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                      <linearGradient id="truck-headlight-beam" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="rgba(255,248,196,0.9)" />
                        <stop offset="26%" stopColor="rgba(255,240,138,0.42)" />
                        <stop offset="100%" stopColor="rgba(255,240,138,0)" />
                      </linearGradient>
                      <radialGradient id="truck-headlight-lamp" cx="50%" cy="50%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="55%" stopColor="#fff7c2" />
                        <stop offset="100%" stopColor="#facc15" />
                      </radialGradient>
                    </defs>
                    {darkMode ? (
                      <>
                        <ellipse cx="189.4" cy="26.1" rx="7.2" ry="4.1" fill="rgba(250,204,21,0.26)" />
                        <path d="M186.8 23.4L219 20.1L219 31.9L186.8 28.6Q189.5 26 186.8 23.4Z" fill="url(#truck-headlight-beam)" />
                        <path d="M186.8 24.6L212 22.8L212 29.2L186.8 27.4Q188.4 26 186.8 24.6Z" fill="rgba(255,255,255,0.22)" />
                      </>
                    ) : null}
                    <rect x="128" y="9" width="4" height="11" rx="1.5" fill="#1e293b" opacity="0.85" />
                    <g>
                      <circle cx="130" cy="7.5" r="4.6" fill={smokePrimary}>
                        <animate attributeName="cy" values="8;2;-5" dur="1.9s" repeatCount="indefinite" />
                        <animate attributeName="cx" values="130;130;130" dur="1.9s" repeatCount="indefinite" />
                        <animate attributeName="r" values="4.6;5.8;7.2" dur="1.9s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;0.78;0" dur="1.9s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="133.5" cy="10.2" r="3.8" fill={smokeSecondary}>
                        <animate attributeName="cy" values="10.5;4.8;-1.5" dur="1.9s" begin="0.42s" repeatCount="indefinite" />
                        <animate attributeName="cx" values="133.5;133.5;133.5" dur="1.9s" begin="0.42s" repeatCount="indefinite" />
                        <animate attributeName="r" values="3.8;5;6.4" dur="1.9s" begin="0.42s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;0.62;0" dur="1.9s" begin="0.42s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="127" cy="11.8" r="3.4" fill={smokeTertiary}>
                        <animate attributeName="cy" values="12;6.2;0.5" dur="1.9s" begin="0.86s" repeatCount="indefinite" />
                        <animate attributeName="cx" values="127;127;127" dur="1.9s" begin="0.86s" repeatCount="indefinite" />
                        <animate attributeName="r" values="3.4;4.5;5.8" dur="1.9s" begin="0.86s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;0.5;0" dur="1.9s" begin="0.86s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="131.2" cy="13.2" r="2.8" fill={smokeSecondary}>
                        <animate attributeName="cy" values="13.2;8.2;3.2" dur="1.9s" begin="1.14s" repeatCount="indefinite" />
                        <animate attributeName="cx" values="131.2;131.2;131.2" dur="1.9s" begin="1.14s" repeatCount="indefinite" />
                        <animate attributeName="r" values="2.8;3.8;4.8" dur="1.9s" begin="1.14s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;0.44;0" dur="1.9s" begin="1.14s" repeatCount="indefinite" />
                      </circle>
                    </g>
                    <rect x="48" y="18" width="78" height="16" rx="4" fill="url(#peterbilt-truck)" opacity="0.96" />
                    <rect x="56" y="21.5" width="62" height="5" rx="2.5" fill="#bfdbfe" opacity="0.55" />
                    <path
                      d="M128 34V18.5C128 15.5 130.4 13 133.4 13H153C157.2 13 160.4 14.3 163.1 17.7L170 26H182.5C185 26 187 28 187 30.5V34H180.6C179.9 29.9 176.3 27 171.9 27C167.6 27 163.9 29.9 163.2 34H151.8C151 29.9 147.4 27 143 27C138.7 27 135.1 29.9 134.4 34H128Z"
                      fill="url(#peterbilt-truck)"
                    />
                    <path d="M136 16H151.5C154.1 16 156.2 16.9 158.2 19.2L163.3 25H136V16Z" fill="#dbeafe" />
                    <rect x="183.8" y="23.9" width="3.4" height="4.6" rx="1" fill="#0f172a" opacity="0.22" />
                    {darkMode ? <circle cx="185.6" cy="26.1" r="6.2" fill={headlightGlow} /> : null}
                    <circle cx="185.6" cy="26.1" r="2.45" fill={darkMode ? "url(#truck-headlight-lamp)" : headlightFill} opacity={darkMode ? 1 : 0.85} />
                    <rect x="170.5" y="27.5" width="8.5" height="2.4" rx="1.2" fill="#1e293b" opacity="0.65" />
                    <rect x="50" y="24.5" width="5" height="3" rx="1.5" fill="#475569" />
                    <rect x="118" y="24.5" width="5" height="3" rx="1.5" fill="#475569" />
                    <circle cx="66" cy="36" r="5" fill="#1e293b" />
                    <circle cx="66" cy="36" r="2.1" fill="#cbd5e1" />
                    <circle cx="108" cy="36" r="5" fill="#1e293b" />
                    <circle cx="108" cy="36" r="2.1" fill="#cbd5e1" />
                    <circle cx="143" cy="36" r="5.2" fill="#1e293b" />
                    <circle cx="143" cy="36" r="2.2" fill="#cbd5e1" />
                    <circle cx="172" cy="36" r="5.2" fill="#1e293b" />
                    <circle cx="172" cy="36" r="2.2" fill="#cbd5e1" />
                  </svg>
                </div>
              </div>
              </div>
              <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-transparent">
                {organizationLogoUrl && (
                  <img
                    src={organizationLogoUrl}
                    alt={`${session.organization} logo`}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={cn(
              "mb-6 grid gap-3 rounded-3xl border px-5 py-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center",
              darkMode
                ? "border-blue-400/25 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950"
                : "border-sky-200/75 bg-[linear-gradient(90deg,rgba(255,255,255,0.9),rgba(239,246,255,0.94),rgba(224,231,255,0.88))] shadow-[0_18px_40px_rgba(59,130,246,0.08)] backdrop-blur-sm"
            )}
          >
            <div className="text-left lg:self-end">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Signed In As</p>
              <p className="mt-1 text-base font-semibold text-card-foreground">{session.name}</p>
            </div>
            <div className="text-center lg:self-end">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Organization</p>
              <div className="mt-1 flex items-center justify-center gap-3">
                <p className="text-2xl font-bold tracking-[0.04em] text-card-foreground">{session.organization}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm">
                <select
                  className="bg-transparent text-sm font-medium text-foreground outline-none"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as LanguageCode)}
                >
                  <option value="en">{t("language.english")}</option>
                  <option value="hi">{t("language.hindi")}</option>
                  <option value="bn">{t("language.bengali")}</option>
                </select>
              </label>
              <Button
                variant="outline"
                className="rounded-2xl border-border bg-background font-semibold text-foreground shadow-sm hover:bg-muted"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("layout.logout")}
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="space-y-6">
            {children}
            </div>
            <p className="mt-auto py-3 text-center text-xs font-medium tracking-wide text-muted-foreground">
              Powered by EXO-pg
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
