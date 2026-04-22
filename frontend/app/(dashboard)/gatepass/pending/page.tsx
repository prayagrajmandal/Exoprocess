"use client"

import { useUiLanguage } from "@/lib/ui-language"
import { GatePassStatusPage } from "../_components/gate-pass-status-page"

export default function GatePassPendingPage() {
  const { t } = useUiLanguage()

  return (
    <GatePassStatusPage
      title={t("gatePass.detail.exitedTitle")}
      description={t("gatePass.detail.exitedDescription")}
      emptyMessage={t("gatePass.detail.exitedEmpty")}
      movementStatus="Exited"
    />
  )
}
