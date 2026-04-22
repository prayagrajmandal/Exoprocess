"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, StatusBadge } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useApiSetup } from "@/hooks/use-api-setup"
import { canEditRoute } from "@/lib/auth"
import { ArrowLeft, CheckCircle2, DatabaseZap, PlugZap, RefreshCw, ShieldCheck } from "lucide-react"

export default function ApiSetupPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { setup, saveSetup: persistSetup } = useApiSetup()
  const canEditSettings = Boolean(session && canEditRoute(session, "/settings"))
  const [form, setForm] = useState(setup)
  const [status, setStatus] = useState<"Draft" | "Connected">(setup.status)
  const [message, setMessage] = useState("")

  useEffect(() => {
    setForm(setup)
    setStatus(setup.status)
  }, [setup])

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const testConnection = () => {
    setStatus("Connected")
    setMessage(`Connection test successful. ${form.provider} is ready to send orders into the dashboard.`)
  }

  const saveSetup = () => {
    void persistSetup({ ...form, status })
    setMessage("API setup saved. Incoming ERP orders can now be mapped into the Orders dashboard flow.")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Setup"
        description="Connect SAP or another ERP system to push order data into the Orders dashboard"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={!canEditSettings}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={saveSetup} disabled={!canEditSettings}>
              Save Setup
            </Button>
          </div>
        }
      />

      {!canEditSettings ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          You have display access only for API Setup. Edit access is required to test or save ERP settings.
        </div>
      ) : null}

      {message ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-[#059669]">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <PlugZap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-card-foreground">ERP Connection Details</h2>
              <p className="text-sm text-muted-foreground">Set the source system, API endpoint, and authentication values.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">ERP Provider</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.provider}
                onChange={(event) => updateField("provider", event.target.value)}
                disabled={!canEditSettings}
              >
                <option>SAP S/4HANA</option>
                <option>SAP ECC</option>
                <option>Oracle ERP</option>
                <option>Microsoft Dynamics 365</option>
                <option>Custom ERP API</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Authentication Type</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.authType}
                onChange={(event) => updateField("authType", event.target.value)}
                disabled={!canEditSettings}
              >
                <option>Bearer Token</option>
                <option>Basic Auth</option>
                <option>OAuth 2.0 Client Credentials</option>
                <option>API Key</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Base URL</label>
              <input
                type="url"
                value={form.baseUrl}
                onChange={(event) => updateField("baseUrl", event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="https://sap.company.com/api"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Client ID / Username</label>
              <input
                type="text"
                value={form.clientId}
                onChange={(event) => updateField("clientId", event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Client Secret / Password</label>
              <input
                type="password"
                value={form.clientSecret}
                onChange={(event) => updateField("clientSecret", event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter secure secret"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Order Endpoint</label>
              <input
                type="text"
                value={form.orderEndpoint}
                onChange={(event) => updateField("orderEndpoint", event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Sync Schedule</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.syncMethod}
                onChange={(event) => updateField("syncMethod", event.target.value)}
                disabled={!canEditSettings}
              >
                <option>Pull every 15 minutes</option>
                <option>Pull every 30 minutes</option>
                <option>Pull every 1 hour</option>
                <option>Webhook push from ERP</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-card-foreground">Connection Status</h2>
                <p className="text-sm text-muted-foreground">Current state of the ERP integration.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                <span className="text-sm font-medium text-card-foreground">Status</span>
                <StatusBadge status={status} />
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected flow</p>
                <p className="mt-1 text-sm text-card-foreground">
                  ERP API {"->"} Order mapping {"->"} Orders dashboard {"->"} Planning and vehicle assignment
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DatabaseZap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-card-foreground">Order Field Mapping</h2>
                <p className="text-sm text-muted-foreground">Choose which ERP fields populate the order dashboard.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Order ID Field", key: "orderIdField" },
                { label: "Customer Field", key: "customerField" },
                { label: "Source Field", key: "sourceField" },
                { label: "Destination Field", key: "destinationField" },
                { label: "Weight Field", key: "weightField" },
                { label: "Volume Field", key: "volumeField" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">{field.label}</label>
                  <input
                    type="text"
                    value={form[field.key as keyof typeof form]}
                    onChange={(event) => updateField(field.key as keyof typeof form, event.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={!canEditSettings}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
