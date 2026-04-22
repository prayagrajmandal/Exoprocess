"use client"

import { cn } from "@/lib/utils"

type GatePassMovementStatus = "Not Entered" | "Entered" | "Exited"

interface GatePassSignalProps {
  status: GatePassMovementStatus
}

function signalColor(isActive: boolean) {
  return isActive
    ? "bg-[#16A34A] shadow-[0_0_18px_rgba(22,163,74,0.35)]"
    : "bg-[#DC2626] shadow-[0_0_18px_rgba(220,38,38,0.18)]"
}

export function GatePassSignal({ status }: GatePassSignalProps) {
  const isEntryActive = status === "Entered" || status === "Exited"
  const isExitActive = status === "Exited"

  return (
    <div className="inline-flex items-center gap-2" title={status}>
      <span className={cn("h-3.5 w-3.5 rounded-full border border-white/80", signalColor(isEntryActive))} />
      <span className={cn("h-3.5 w-3.5 rounded-full border border-white/80", signalColor(isExitActive))} />
      <span className="sr-only">{status}</span>
    </div>
  )
}
