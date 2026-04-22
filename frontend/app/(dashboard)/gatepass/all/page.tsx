"use client"

import { useUiLanguage } from "@/lib/ui-language"
import { GatePassStatusPage } from "../_components/gate-pass-status-page"

export default function GatePassAllPage() {
  const { t } = useUiLanguage()

  return (
    <GatePassStatusPage
      title={t("gatePass.detail.totalTitle")}
      description={t("gatePass.detail.totalDescription")}
      emptyMessage={t("gatePass.detail.totalEmpty")}
    />
  )
}
