"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react"

import { PageHeader, StatusBadge } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useGatePasses } from "@/hooks/use-gatepasses"
import { useUiLanguage } from "@/lib/ui-language"

function normalizeMovementStatus(status?: string | null): "Not Entered" | "Entered" | "Exited" {
  if (status === "Entered" || status === "Exited") {
    return status
  }

  return "Not Entered"
}

function withPdfOnePage(url: string) {
  const cleanUrl = url.split("#")[0]
  return `${cleanUrl}#page=1&zoom=100&toolbar=0&navpanes=0&scrollbar=0`
}

export default function GatePassChallanPage() {
  const router = useRouter()
  const params = useParams<{ gatePassId: string }>()
  const { gatePasses, isLoading } = useGatePasses()
  const { t } = useUiLanguage()

  const gatePassId = Array.isArray(params?.gatePassId) ? params.gatePassId[0] : params?.gatePassId
  const gatePass = useMemo(
    () => gatePasses.find((item) => item.id === gatePassId),
    [gatePasses, gatePassId]
  )

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-4">
      <PageHeader
        title="Challan View Pad"
        description="Preview the challan PDF in a full-page viewer."
        actions={
          <Button variant="outline" onClick={() => router.push("/gatepass")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("gatePass.detail.back")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : gatePass ? (
        <div className="flex min-h-[180vh] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-card-foreground">{gatePass.id}</p>
                <p className="text-xs text-muted-foreground">
                  {gatePass.vehicle} • {gatePass.driver} • {normalizeMovementStatus(gatePass.movementStatus)}
                </p>
              </div>
              <StatusBadge status={gatePass.approvalStatus} />
            </div>
            {gatePass.challanPdfUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(withPdfOnePage(gatePass.challanPdfUrl), "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open PDF
              </Button>
            ) : null}
          </div>

          {gatePass.challanPdfUrl ? (
            <iframe
              key={gatePass.challanPdfUrl}
              title={`Challan PDF ${gatePass.id}`}
              className="min-h-[calc(200vh-10rem)] w-full flex-1 border-0 bg-muted"
              src={withPdfOnePage(gatePass.challanPdfUrl)}
            />
          ) : (
            <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground" />
              <p className="text-base font-medium text-card-foreground">No challan PDF attached</p>
              <p className="max-w-md text-sm text-muted-foreground">
                This gate pass does not have a challan document yet. Add the PDF URL when creating or updating the gate pass.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Challan record not found.
        </div>
      )}
    </div>
  )
}
