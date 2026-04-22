"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { DataTable, PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useGatePasses } from "@/hooks/use-gatepasses"
import { useUiLanguage } from "@/lib/ui-language"
import { GatePassSignal } from "./gate-pass-signal"

function normalizeMovementStatus(status?: string | null): "Not Entered" | "Entered" | "Exited" {
  if (status === "Entered" || status === "Exited") {
    return status
  }

  return "Not Entered"
}

interface GatePassStatusPageProps {
  title: string
  description: string
  emptyMessage: string
  status?: "Approved" | "Pending" | "Rejected"
  movementStatus?: "Not Entered" | "Entered" | "Exited"
}

export function GatePassStatusPage({ title, description, emptyMessage, status, movementStatus }: GatePassStatusPageProps) {
  const router = useRouter()
  const { gatePasses, isLoading } = useGatePasses()
  const { t } = useUiLanguage()

  const filteredGatePasses = gatePasses
    .filter(
      (gatePass) =>
        (!status || gatePass.approvalStatus === status)
        && (!movementStatus || normalizeMovementStatus(gatePass.movementStatus) === movementStatus)
    )
    .map((gatePass) => ({
      GatePassID: gatePass.id,
      OrderNo: gatePass.orderNo || "",
      DeliveryNo: gatePass.deliveryNo || "",
      Vehicle: gatePass.vehicle,
      Driver: gatePass.driver,
      DriverLicense: gatePass.driverLicense,
      Depo: gatePass.depo,
      ChallanPdfUrl: gatePass.challanPdfUrl,
      ChallanNo: gatePass.challanNo || "",
      RequestedBy: gatePass.requestedBy,
      ApprovalStatus: gatePass.approvalStatus,
      MovementStatus: normalizeMovementStatus(gatePass.movementStatus),
      Time: gatePass.time,
    }))

  return (
    <div className="space-y-3">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="outline" onClick={() => router.push("/gatepass")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("gatePass.detail.back")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGatePasses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          {emptyMessage}
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
          data={filteredGatePasses}
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
        />
      )}
    </div>
  )
}
