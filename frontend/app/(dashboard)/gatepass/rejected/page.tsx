import { GatePassStatusPage } from "../_components/gate-pass-status-page"

export default function GatePassRejectedPage() {
  return (
    <GatePassStatusPage
      title="Rejected Gate Passes"
      description="Rejected gate pass records from the Gate Pass dashboard card"
      emptyMessage="No rejected gate passes found."
      status="Rejected"
    />
  )
}
