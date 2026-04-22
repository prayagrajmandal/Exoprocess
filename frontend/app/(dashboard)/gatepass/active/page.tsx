import { GatePassStatusPage } from "../_components/gate-pass-status-page"

export default function GatePassActivePage() {
  return (
    <GatePassStatusPage
      title="Entered Gate Passes"
      description="Gate passes that have completed entry"
      emptyMessage="No entered gate passes found."
      movementStatus="Entered"
    />
  )
}
