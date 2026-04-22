"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { KpiCard, DataTable } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { CheckCircle2, Clock, Loader2, Shield } from "lucide-react"

import { useGatePasses, type GatePass } from "@/hooks/use-gatepasses"
import { useUiLanguage } from "@/lib/ui-language"
import { canEditRoute } from "@/lib/auth"
import { GatePassSignal } from "./_components/gate-pass-signal"

function normalizeMovementStatus(status?: string | null): "Not Entered" | "Entered" | "Exited" {
  if (status === "Entered" || status === "Exited") {
    return status
  }

  return "Not Entered"
}

export default function GatePassPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { t } = useUiLanguage()
  
  const { gatePasses: liveGatePasses, isLoading, updateGatePassMovement } = useGatePasses()
  const [records, setRecords] = useState<GatePass[]>([])
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    setRecords(liveGatePasses)
  }, [liveGatePasses])

  const canManageGatePasses = Boolean(session && canEditRoute(session, "/gatepass"))
  const totalCount = records.length
  const enteredCount = records.filter((item) => normalizeMovementStatus(item.movementStatus) === "Entered").length
  const exitCount = records.filter((item) => normalizeMovementStatus(item.movementStatus) === "Exited").length

  const tableData = records
    .filter((gp) => gp.approvalStatus === "Pending" && normalizeMovementStatus(gp.movementStatus) !== "Exited")
    .map(gp => ({
      GatePassID: gp.id,
      OrderNo: gp.orderNo || "",
      DeliveryNo: gp.deliveryNo || "",
      Vehicle: gp.vehicle,
      Driver: gp.driver,
      DriverLicense: gp.driverLicense,
      Depo: gp.depo,
      ChallanPdfUrl: gp.challanPdfUrl,
      ChallanNo: gp.challanNo || "",
      RequestedBy: gp.requestedBy,
      ApprovalStatus: gp.approvalStatus,
      MovementStatus: normalizeMovementStatus(gp.movementStatus),
      Time: gp.time,
    }))

  const handleMovementUpdate = async (gatePassId: string, action: "Entry" | "Exit") => {
    const nextMovementStatus = action === "Entry" ? "Entered" : "Exited"
    const previousRecords = records

    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === gatePassId ? { ...record, movementStatus: nextMovementStatus } : record
      )
    )

    try {
      await updateGatePassMovement(gatePassId, action)
      setFeedback(t(action === "Entry" ? "gatePass.feedback.in" : "gatePass.feedback.out", { id: gatePassId }))
    } catch {
      setRecords(previousRecords)
      setFeedback(t("gatePass.feedback.failed", { id: gatePassId }))
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
        <h1 className="text-base font-semibold tracking-tight text-card-foreground sm:text-lg">{t("gatePass.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{t("gatePass.description")}</p>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-[#059669]">
          {feedback}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => router.push("/gatepass/all")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label={t("gatePass.total")}
            value={totalCount}
            icon={<Shield className="h-4 w-4" />}
            className="cursor-pointer border-sky-200 p-2.5 hover:border-sky-300 [&_p:first-child]:text-xs [&_p:last-child]:mt-1.5 [&_p:last-child]:text-xl [&_div.rounded-xl]:p-1.5"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/gatepass/approved")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label={t("gatePass.in")}
            value={enteredCount}
            icon={<CheckCircle2 className="h-4 w-4" />}
            className="cursor-pointer border-sky-200 p-2.5 hover:border-sky-300 [&_p:first-child]:text-xs [&_p:last-child]:mt-1.5 [&_p:last-child]:text-xl [&_div.rounded-xl]:p-1.5"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/gatepass/pending")}
          className="rounded-xl text-left transition-transform hover:-translate-y-0.5"
        >
          <KpiCard
            label={t("gatePass.out")}
            value={exitCount}
            icon={<Clock className="h-4 w-4" />}
            className="cursor-pointer border-sky-200 p-2.5 hover:border-sky-300 [&_p:first-child]:text-xs [&_p:last-child]:mt-1.5 [&_p:last-child]:text-xl [&_div.rounded-xl]:p-1.5"
          />
        </button>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tableData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          {t("gatePass.noPending")}
        </div>
      ) : (
        <DataTable
          compact
          columns={["GatePassID", "OrderNo", "DeliveryNo", "Vehicle", "Driver", "DriverLicense", "Depo", "ChallanView", "RequestedBy", "ApprovalStatus", "Time"]}
          columnLabels={{
            GatePassID: t("gatePass.columns.gatePassId"),
            OrderNo: t("gatePass.columns.orderNo"),
            DeliveryNo: t("gatePass.columns.deliveryNo"),
            Vehicle: t("gatePass.columns.vehicle"),
            Driver: t("gatePass.columns.driver"),
            DriverLicense: t("gatePass.columns.driverLicense"),
            Depo: t("gatePass.columns.depo"),
            ChallanView: t("gatePass.columns.challanView"),
            RequestedBy: t("gatePass.columns.requestedBy"),
            ApprovalStatus: t("gatePass.columns.approvalStatus"),
            Time: t("gatePass.columns.time"),
          }}
          data={tableData}
          renderers={{
            ChallanView: (_, row) => {
              const gatePassId = String(row.GatePassID || "")

              return (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => router.push(`/gatepass/challan/${encodeURIComponent(gatePassId)}`)}
                  >
                    {row.ChallanNo ? String(row.ChallanNo) : (row as any).challanNo ? String((row as any).challanNo) : t("gatePass.view")}
                  </Button>
                  {!String(row.ChallanPdfUrl || "") ? (
                    <span className="text-xs text-muted-foreground">{t("gatePass.noPdf")}</span>
                  ) : null}
                </div>
              )
            },
            ApprovalStatus: (_, row) => (
              <GatePassSignal status={String(row.MovementStatus) as "Not Entered" | "Entered" | "Exited"} />
            ),
          }}
          actions={
            canManageGatePasses
              ? [
                  {
                    label: t("gatePass.in"),
                    onClick: (row) => {
                      void handleMovementUpdate(String(row.GatePassID), "Entry")
                    },
                    disabled: (row) => String(row.MovementStatus) !== "Not Entered",
                  },
                  {
                    label: t("gatePass.out"),
                    onClick: (row) => {
                      void handleMovementUpdate(String(row.GatePassID), "Exit")
                    },
                    variant: "success" as const,
                    disabled: (row) => {
                      const movementStatus = String(row.MovementStatus)
                      return movementStatus === "Not Entered" || movementStatus === "Exited"
                    },
                  },
                ]
              : undefined
          }
          />
      )}

    </div>
  )
}
