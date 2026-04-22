"use client"

import { useState } from "react"
import { PageHeader, DataTable, StatusBadge } from "@/components/tms-ui"
import { useDrivers, type Driver } from "@/hooks/use-drivers"
import { useAuth } from "@/hooks/use-auth"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { canEditRoute } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Plus, X, Star, Phone, CreditCard, TrendingUp, Loader2, Truck, CheckCircle } from "lucide-react"

const ASSISTANT_PREFIX = "[Assistant] "

function getDriverInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function isAssistantRecord(driver: Driver) {
  return driver.name.startsWith(ASSISTANT_PREFIX)
}

function getDisplayName(name: string) {
  return name.startsWith(ASSISTANT_PREFIX) ? name.slice(ASSISTANT_PREFIX.length) : name
}

function toStoredName(name: string, entityType: "driver" | "assistant") {
  const trimmed = name.trim()
  return entityType === "assistant" ? `${ASSISTANT_PREFIX}${trimmed}` : trimmed
}

async function fileToOptimizedDataUrl(file: File) {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Image could not be loaded"))
      img.src = imageUrl
    })

    const maxSize = 240
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Canvas is not supported")
    }

    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL("image/jpeg", 0.8)
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export default function DriversPage() {
  const { session } = useAuth()
  const { drivers, isLoading, createDriver, updateDriver, deleteDriver } = useDrivers()
  const canEditDrivers = Boolean(
    session && (
      canEditRoute(session, "/drivers")
      || session.roles.includes("head-office")
      || session.roles.includes("admin")
    )
  )
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [driverIdToDelete, setDriverIdToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"driver-display" | "assistant-display" | "driver-input" | "assistant-input">("driver-display")
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [editingEntityType, setEditingEntityType] = useState<"driver" | "assistant">("driver")
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({
    name: "",
    phone: "",
    license: "",
    photo: "",
    email: "",
    status: "in-active",
  })
  const activeEntityType = activeTab.startsWith("assistant") ? "assistant" : "driver"
  const visibleDrivers = drivers.filter((driver) => isAssistantRecord(driver) === (activeEntityType === "assistant"))

  const tableData = visibleDrivers.map(d => ({
    DriverID: d.id,
    Name: getDisplayName(d.name),
    Phone: d.phone,
    License: d.license,
    TripsToday: d.tripsToday,
    Rating: d.rating,
    Status: d.status,
    Photo: d.photo,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage driver roster and assignments"
      />

      <div className="flex w-fit gap-1 rounded-lg border border-border bg-card p-1 shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "driver-display"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("driver-display")}
        >
          <Truck className="h-4 w-4" />
          Driver Display
        </button>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "assistant-display"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setActiveTab("assistant-display")}
        >
          <Truck className="h-4 w-4" />
          Assistant Display
        </button>
        <button
          disabled={!canEditDrivers}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            activeTab === "driver-input"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => {
            if (canEditDrivers) {
              setEditingEntityType("driver")
              setEditingDriverId(null)
              setFormError("")
              setActiveTab("driver-input")
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </button>
        <button
          disabled={!canEditDrivers}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            activeTab === "assistant-input"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => {
            if (canEditDrivers) {
              setEditingEntityType("assistant")
              setEditingDriverId(null)
              setFormError("")
              setActiveTab("assistant-input")
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Add Assistant
        </button>
      </div>

      {(activeTab === "driver-display" || activeTab === "assistant-display") && isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card shadow-sm dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {(activeTab === "driver-display" || activeTab === "assistant-display") && !isLoading ? (
        <DataTable
          columns={["DriverID", "Name", "Phone", "License", "TripsToday", "Rating", "Status", "Photo"]}
          data={tableData}
          renderers={{
            Photo: (value, row) => (
              <HoverCard openDelay={120} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <div className="cursor-pointer">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={typeof value === "string" ? value : ""} alt={`${String(row.Name)} photo`} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getDriverInitials(String(row.Name))}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-56 border-border bg-card p-3 dark:border-blue-400/25 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-xl border border-border bg-background">
                      <img
                        src={typeof value === "string" ? value : ""}
                        alt={`${String(row.Name)} preview`}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-card-foreground">{String(row.Name)}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ),
          }}
          actions={[
            { label: "View", onClick: (row) => setSelectedDriver(visibleDrivers.find(d => d.id === row.DriverID) || null) },
            ...(canEditDrivers
              ? [
                  {
                    label: "Edit",
                    onClick: (row: Record<string, unknown>) => {
                      const driver = visibleDrivers.find((d) => d.id === row.DriverID)
                      if (!driver) {
                        return
                      }

                      setEditingDriverId(driver.id)
                      setEditingEntityType(isAssistantRecord(driver) ? "assistant" : "driver")
                      setForm({
                        name: getDisplayName(driver.name),
                        phone: driver.phone,
                        license: driver.license,
                        photo: driver.photo ?? "",
                        email: "",
                        status: driver.status.toLowerCase(),
                      })
                      setActiveTab(isAssistantRecord(driver) ? "assistant-input" : "driver-input")
                    },
                  },
                  {
                    label: "Delete",
                    variant: "destructive" as const,
                    onClick: (row: Record<string, unknown>) => {
                      setDriverIdToDelete(String(row.DriverID))
                    },
                  },
                ]
              : []),
          ]}
        />
      ) : null}

      <DeleteConfirmDialog
        open={Boolean(driverIdToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setDriverIdToDelete(null)
          }
        }}
        itemLabel={driverIdToDelete ? `driver ${driverIdToDelete}` : "this driver"}
        onConfirm={async () => {
          if (!driverIdToDelete) {
            return
          }
          await deleteDriver(driverIdToDelete)
          setDriverIdToDelete(null)
        }}
      />

      {(activeTab === "driver-input" || activeTab === "assistant-input") && !canEditDrivers ? (
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          You have display access only for Drivers and Assistants. Edit access is required to add, update, or delete records.
        </div>
      ) : null}

      {(activeTab === "driver-input" || activeTab === "assistant-input") && canEditDrivers ? (
        <div className="mx-auto max-w-2xl">
          {showSuccess ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-[#059669]">
              <CheckCircle className="h-5 w-5" />
              {editingDriverId
                ? `${editingEntityType === "assistant" ? "Assistant" : "Driver"} details updated successfully!`
                : `${activeEntityType === "assistant" ? "Assistant" : "Driver"} details submitted successfully!`}
              <button onClick={() => setShowSuccess(false)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {formError ? (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-card-foreground">
              {editingDriverId
                ? `Edit ${editingEntityType === "assistant" ? "Assistant" : "Driver"} ${editingDriverId}`
                : `Add ${activeEntityType === "assistant" ? "Assistant" : "Driver"} Details`}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {editingDriverId
                ? `Update the selected ${editingEntityType === "assistant" ? "assistant" : "driver"} details.`
                : `Fill in the details below to register a new ${activeEntityType === "assistant" ? "assistant" : "driver"}.`}
            </p>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const isEditing = Boolean(editingDriverId)
                setFormError("")
                setIsSaving(true)

                try {
                  if (editingDriverId) {
                    await updateDriver({
                      driverId: editingDriverId,
                      name: toStoredName(form.name, editingEntityType),
                      phone: form.phone,
                      license: form.license,
                      photo: form.photo,
                      email: form.email,
                      status: form.status,
                      organization: session?.organization,
                    })
                  } else {
                    await createDriver({
                      name: toStoredName(form.name, activeEntityType),
                      phone: form.phone,
                      license: form.license,
                      photo: form.photo,
                      email: form.email,
                      status: form.status,
                      organization: session?.organization,
                    })
                  }

                  setForm({
                    name: "",
                    phone: "",
                    license: "",
                    photo: "",
                    email: "",
                    status: "in-active",
                  })
                  setEditingDriverId(null)
                  setShowSuccess(true)
                  setTimeout(() => setShowSuccess(false), 3000)
                  if (isEditing) {
                    setActiveTab(editingEntityType === "assistant" ? "assistant-display" : "driver-display")
                  }
                } catch {
                  setFormError("Driver photo could not be saved. Please try a smaller image and save again.")
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  {activeEntityType === "assistant" ? "Assistant Name" : "Driver Name"}
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">License Number</label>
                <input
                  value={form.license}
                  onChange={(e) => setForm({ ...form, license: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-card-foreground">Photo</label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-border">
                    <AvatarImage src={form.photo} alt={form.name ? `${form.name} photo` : "Driver photo"} />
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {getDriverInitials(form.name || "Driver")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) {
                        return
                      }

                      setFormError("")

                      try {
                        const photo = await fileToOptimizedDataUrl(file)
                        setForm((current) => ({
                          ...current,
                          photo,
                        }))
                      } catch {
                        setFormError("This image could not be processed. Please choose another image.")
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use a small square photo for best results. The image is resized before saving.</p>
                {form.photo ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => setForm({ ...form, photo: "" })}
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="in-active">In-Active</option>
                  <option value="on break">On Break</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
                  {isSaving ? "Saving..." : editingDriverId ? "Save Changes" : `Save ${activeEntityType === "assistant" ? "Assistant" : "Driver"}`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => {
                    setEditingDriverId(null)
                    setEditingEntityType(activeEntityType)
                    setFormError("")
                    setForm({
                      name: "",
                      phone: "",
                      license: "",
                      photo: "",
                      email: "",
                      status: "in-active",
                    })
                    setActiveTab(activeEntityType === "assistant" ? "assistant-display" : "driver-display")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Driver Profile Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSelectedDriver(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">
                {isAssistantRecord(selectedDriver) ? "Assistant Profile" : "Driver Profile"}
              </h2>
              <button onClick={() => setSelectedDriver(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={selectedDriver.photo} alt={`${selectedDriver.name} photo`} />
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {getDriverInitials(getDisplayName(selectedDriver.name))}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-card-foreground">{getDisplayName(selectedDriver.name)}</h3>
                <p className="text-sm text-muted-foreground">{selectedDriver.id}</p>
                <StatusBadge status={selectedDriver.status} />
              </div>
            </div>

            {/* Info Grid */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">License</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.license.substring(0, 12)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Star className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.rating} / 5.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Trips Today</p>
                  <p className="text-sm font-medium text-card-foreground">{selectedDriver.tripsToday}</p>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance (Last 30 Days)</p>
              <div className="flex items-end gap-1.5">
                {[65, 72, 58, 80, 90, 85, 78, 92, 88, 95, 82, 76].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/70"
                    style={{ height: `${val * 0.6}px` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>4 weeks ago</span>
                <span>This week</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedDriver(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
