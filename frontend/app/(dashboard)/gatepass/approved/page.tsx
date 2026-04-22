"use client"

import { useUiLanguage } from "@/lib/ui-language"
import { GatePassStatusPage } from "../_components/gate-pass-status-page"

export default function GatePassApprovedPage() {
  const { t } = useUiLanguage()

  return (
    <GatePassStatusPage
      title={t("gatePass.detail.enteredTitle")}
      description={t("gatePass.detail.enteredDescription")}
      emptyMessage={t("gatePass.detail.enteredEmpty")}
      movementStatus="Entered"
    />
  )
}
