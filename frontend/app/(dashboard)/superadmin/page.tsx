"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { apiUrl } from "@/lib/api"
import { useOrganizations } from "@/hooks/use-organizations"
import { usePermissionOptions } from "@/hooks/use-permission-options"
import { useUserDirectory } from "@/hooks/use-user-directory"
import { countUsersForOrganization, type AccessRoute, type OrganizationConfig } from "@/lib/auth"
import { Lock, LockOpen, Plus, RotateCcw } from "lucide-react"
import { toast } from "sonner"

async function uploadOrganizationLogo(organizationName: string, file: File) {
  const formData = new FormData()
  formData.append("organizationName", organizationName)
  formData.append("file", file)

  const response = await fetch(apiUrl("/api/clogo/upload"), {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload organization logo (${response.status})`)
  }

  return (await response.json()) as { organizationName?: string; logoData?: string; filename?: string }
}

async function fetchOrganizationLogo(organizationName: string) {
  const response = await fetch(apiUrl(`/api/clogo/${encodeURIComponent(organizationName)}`))
  if (response.status === 404) {
    return ""
  }

  if (!response.ok) {
    throw new Error(`Failed to load organization logo (${response.status})`)
  }

  const data = (await response.json()) as { logoData?: string }
  return data.logoData ?? ""
}

async function deleteOrganizationLogo(organizationName: string) {
  const response = await fetch(apiUrl(`/api/clogo/${encodeURIComponent(organizationName)}`), {
    method: "DELETE",
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete organization logo (${response.status})`)
  }
}

export default function SuperAdminPage() {
  const { organizations, isLoading, error: organizationError, isUsingFallbackData: isUsingFallbackOrganizations, saveOrganizations, saveOrganization: saveOrganizationRecord, resetOrganizations, deleteOrganization } = useOrganizations()
  const { permissionOptions, isLoading: isLoadingPermissionOptions } = usePermissionOptions()
  const { users, saveUsers } = useUserDirectory()
  const [selectedOrganization, setSelectedOrganization] = useState("")
  const [selectedAmountOrganization, setSelectedAmountOrganization] = useState("")
  const [selectedAccessOrganization, setSelectedAccessOrganization] = useState("")
  const [editableOrganizationAccessRoutes, setEditableOrganizationAccessRoutes] = useState<AccessRoute[]>([])
  const [isSavingOrganizationAccess, setIsSavingOrganizationAccess] = useState(false)
  const [amountCalculationMode, setAmountCalculationMode] = useState<"total" | "id-base" | "truck-base">("total")
  const [amountForm, setAmountForm] = useState("")
  const logoFileInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState({
    maxUsers: "",
    address: "",
    phone: "",
    country: "",
    email: "",
    pan: "",
    amount: "",
    currency: "",
    logoUrl: "",
    employeeBusCount: "",
    employeeCarCount: "",
    officerCarCount: "",
  })
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false)
  const [isDeleteOrganizationDialogOpen, setIsDeleteOrganizationDialogOpen] = useState(false)
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    maxUsers: "",
    address: "",
    phone: "",
    country: "",
    email: "",
    pan: "",
    amount: "",
    currency: "",
    logoUrl: "",
    employeeBusCount: "",
    employeeCarCount: "",
    officerCarCount: "",
  })

  const organizationStats = useMemo(
    () =>
      organizations.map((organization) => ({
        ...organization,
        currentUsers: countUsersForOrganization(users, organization.name),
        truckCount: organization.truckCount ?? 0,
      })),
    [organizations, users]
  )

  const selectedAmountOrganizationData = useMemo(
    () => organizationStats.find((organization) => organization.name === selectedAmountOrganization) ?? null,
    [organizationStats, selectedAmountOrganization]
  )

  useEffect(() => {
    if (!selectedAccessOrganization) {
      setEditableOrganizationAccessRoutes([])
      return
    }

    const organization = organizations.find((item) => item.name === selectedAccessOrganization)
    setEditableOrganizationAccessRoutes(organization?.appPermissions ?? [])
  }, [organizations, selectedAccessOrganization])

  useEffect(() => {
    if (!selectedAmountOrganization) {
      setAmountForm("")
      setAmountCalculationMode("total")
      return
    }

    setAmountCalculationMode("total")
    setAmountForm(String(selectedAmountOrganizationData?.amount ?? 0))
  }, [selectedAmountOrganization, selectedAmountOrganizationData])

  const selectedOrganizationDisplayName =
    selectedOrganization.trim().toLowerCase() === "pro"
      ? "PRO Organization"
      : selectedOrganization.trim().toLowerCase() === "platform"
        ? "Platform Organization"
      : selectedOrganization || "Organization Details"

  useEffect(() => {
    if (organizations.length === 0) {
      setSelectedOrganization("")
      return
    }

    if (!selectedOrganization) {
      setForm({
        maxUsers: "",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
        amount: "",
        currency: "",
        logoUrl: "",
        employeeBusCount: "",
        employeeCarCount: "",
        officerCarCount: "",
      })
      return
    }

    const currentOrganization = organizations.find((organization) => organization.name === selectedOrganization)
    if (!currentOrganization) {
      setSelectedOrganization("")
      setForm({
        maxUsers: "",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
        amount: "",
        currency: "",
        logoUrl: "",
        employeeBusCount: "",
        employeeCarCount: "",
        officerCarCount: "",
      })
      return
    }

    setForm({
      maxUsers: String(currentOrganization.maxUsers),
      address: currentOrganization.address,
      phone: currentOrganization.phone,
      country: currentOrganization.country,
      email: currentOrganization.email,
      pan: currentOrganization.pan,
      amount: String(currentOrganization.amount ?? 0),
      currency: currentOrganization.currency ?? "",
      logoUrl: currentOrganization.logoUrl ?? "",
      employeeBusCount: String(currentOrganization.employeeBusCount),
      employeeCarCount: String(currentOrganization.employeeCarCount),
      officerCarCount: String(currentOrganization.officerCarCount),
    })
  }, [organizations, selectedOrganization])

  const saveOrganization = async () => {
    const normalizedName = selectedOrganization.trim()
    const maxUsers = Number(form.maxUsers)

    if (!normalizedName || maxUsers < 1) {
      toast.error("Please enter a valid organization and user limit.")
      return
    }

    try {
      const existing = organizations.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase())
      await saveOrganizationRecord({
        name: normalizedName,
        maxUsers,
        address: form.address.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        email: form.email.trim(),
        pan: form.pan.trim(),
        amount: Math.max(0, Number(form.amount) || 0),
        currency: form.currency.trim(),
        logoUrl: form.logoUrl.trim(),
        employeeBusCount: Math.max(0, Number(form.employeeBusCount) || 0),
        employeeCarCount: Math.max(0, Number(form.employeeCarCount) || 0),
        officerCarCount: Math.max(0, Number(form.officerCarCount) || 0),
        isBlocked: existing?.isBlocked ?? false,
        appPermissions: existing?.appPermissions ?? permissionOptions.map((option) => option.route),
      })
      toast.success(`${normalizedName} details saved successfully.`)
    } catch {
      toast.error(`Failed to save ${normalizedName} details.`)
    }
  }

  const handleOrganizationSelect = (value: string) => {
    if (selectedOrganization === value) {
      setSelectedOrganization("")
      setForm({
        maxUsers: "",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
        amount: "",
        currency: "",
        logoUrl: "",
        employeeBusCount: "",
        employeeCarCount: "",
        officerCarCount: "",
      })
      return
    }

    setSelectedOrganization(value)

    const organization = organizations.find((item) => item.name === value)
    if (!organization) {
      return
    }

    setForm({
      maxUsers: String(organization.maxUsers),
      address: organization.address,
      phone: organization.phone,
      country: organization.country,
      email: organization.email,
      pan: organization.pan,
      amount: String(organization.amount ?? 0),
      currency: organization.currency ?? "",
      logoUrl: organization.logoUrl ?? "",
      employeeBusCount: String(organization.employeeBusCount),
      employeeCarCount: String(organization.employeeCarCount),
      officerCarCount: String(organization.officerCarCount),
    })
  }

  const saveOrganizationAmount = async () => {
    if (!selectedAmountOrganization) {
      return
    }

    const currentOrganization = organizations.find((organization) => organization.name === selectedAmountOrganization)
    if (!currentOrganization) {
      return
    }

    const baseCount =
      amountCalculationMode === "id-base"
        ? (selectedAmountOrganizationData?.currentUsers ?? 0)
        : amountCalculationMode === "truck-base"
          ? (selectedAmountOrganizationData?.truckCount ?? 0)
          : 1
    const rate = Math.max(0, Number(amountForm) || 0)
    const nextAmount = amountCalculationMode === "total" ? rate : rate * baseCount

    try {
      await saveOrganizationRecord({
        ...currentOrganization,
        amount: nextAmount,
      })
      toast.success(`${selectedAmountOrganization} amount saved successfully.`)
      setSelectedAmountOrganization("")
    } catch {
      toast.error(`Failed to save amount for ${selectedAmountOrganization}.`)
    }
  }

  const createOrganization = async () => {
    const normalizedName = newOrganization.name.trim()
    const maxUsers = Number(newOrganization.maxUsers)

    if (!normalizedName || maxUsers < 1) {
      toast.error("Please enter a valid organization name and user limit.")
      return
    }

    const alreadyExists = organizations.some(
      (organization) => organization.name.toLowerCase() === normalizedName.toLowerCase()
    )

    if (alreadyExists) {
      toast.error("An organization with this name already exists.")
      return
    }

    const createdOrganization: OrganizationConfig = {
      name: normalizedName,
      maxUsers,
      address: newOrganization.address.trim(),
      phone: newOrganization.phone.trim(),
      country: newOrganization.country.trim(),
      email: newOrganization.email.trim(),
      pan: newOrganization.pan.trim(),
      amount: Math.max(0, Number(newOrganization.amount) || 0),
      currency: newOrganization.currency.trim(),
      logoUrl: newOrganization.logoUrl.trim(),
      employeeBusCount: Math.max(0, Number(newOrganization.employeeBusCount) || 0),
      employeeCarCount: Math.max(0, Number(newOrganization.employeeCarCount) || 0),
      officerCarCount: Math.max(0, Number(newOrganization.officerCarCount) || 0),
      isBlocked: false,
      appPermissions: permissionOptions.map((option) => option.route),
    }
    try {
      await saveOrganizations([...organizations, createdOrganization])
      setSelectedOrganization(normalizedName)
      setForm({
        maxUsers: String(maxUsers),
        address: createdOrganization.address,
        phone: createdOrganization.phone,
        country: createdOrganization.country,
        email: createdOrganization.email,
        pan: createdOrganization.pan,
        amount: String(createdOrganization.amount),
        currency: createdOrganization.currency,
        logoUrl: createdOrganization.logoUrl ?? "",
        employeeBusCount: String(createdOrganization.employeeBusCount),
        employeeCarCount: String(createdOrganization.employeeCarCount),
        officerCarCount: String(createdOrganization.officerCarCount),
      })
      setNewOrganization({
        name: "",
        maxUsers: "",
        address: "",
        phone: "",
        country: "",
        email: "",
        pan: "",
        amount: "",
        currency: "",
        logoUrl: "",
        employeeBusCount: "",
        employeeCarCount: "",
        officerCarCount: "",
      })
      setIsCreateOrgDialogOpen(false)
      toast.success(`${normalizedName} created successfully.`)
    } catch {
      toast.error(`Failed to create ${normalizedName}.`)
    }
  }

  const trimUsersToLimit = (organizationName: string, maxUsers: number) => {
    const scopedUsers = users.filter((user) => user.organization === organizationName)
    if (scopedUsers.length <= maxUsers) {
      return
    }

    const protectedUsers = scopedUsers.filter((user) => user.roles.includes("admin"))
    const regularUsers = scopedUsers.filter((user) => !user.roles.includes("admin"))
    const allowedRegularCount = Math.max(maxUsers - protectedUsers.length, 0)
    const keptUserIds = new Set([
      ...protectedUsers.map((user) => user.userId),
      ...regularUsers.slice(0, allowedRegularCount).map((user) => user.userId),
    ])

    saveUsers(
      users.filter((user) => user.organization !== organizationName || keptUserIds.has(user.userId))
    )
  }

  const toggleOrganizationAccess = (route: AccessRoute, isChecked: boolean) => {
    setEditableOrganizationAccessRoutes((currentRoutes) => {
      if (isChecked) {
        return currentRoutes.includes(route) ? currentRoutes : [...currentRoutes, route]
      }

      return currentRoutes.filter((item) => item !== route)
    })
  }

  const saveOrganizationAccess = async () => {
    if (!selectedAccessOrganization) {
      return
    }

    const organization = organizations.find((item) => item.name === selectedAccessOrganization)
    if (!organization) {
      return
    }

    try {
      setIsSavingOrganizationAccess(true)
      await saveOrganizationRecord({
        ...organization,
        appPermissions: editableOrganizationAccessRoutes,
      })
      toast.success(`${selectedAccessOrganization} app permission saved. Assign the same menus to users from Admin Users to make them visible.`)
      setSelectedAccessOrganization("")
    } catch {
      toast.error(`Failed to save app permission for ${selectedAccessOrganization}.`)
    } finally {
      setIsSavingOrganizationAccess(false)
    }
  }

  const toggleOrganizationBlock = async (organizationName: string, shouldBlock: boolean) => {
    if (organizationName === "Platform") {
      return
    }

    const nextOrganizations = organizations.map((organization) =>
      organization.name === organizationName
        ? {
            ...organization,
            isBlocked: shouldBlock,
          }
        : organization
    )

    try {
      await saveOrganizations(nextOrganizations)
      toast.success(
        shouldBlock
          ? `${organizationName} blocked successfully.`
          : `${organizationName} unblocked successfully.`
      )
    } catch {
      toast.error(
        shouldBlock
          ? `Failed to block ${organizationName}.`
          : `Failed to unblock ${organizationName}.`
      )
    }
  }

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Loading organizations...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Assign organization quota and control how many users each organization can have"
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsCreateOrgDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Org
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization and set its starting user quota.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Organization Name</label>
                    <input
                      value={newOrganization.name}
                      onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                      placeholder="Enter organization name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Total Users Allowed</label>
                    <input
                      type="number"
                      min={1}
                      value={newOrganization.maxUsers}
                      onChange={(e) => setNewOrganization({ ...newOrganization, maxUsers: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Company Email</label>
                    <input
                      type="email"
                      value={newOrganization.email}
                      onChange={(e) => setNewOrganization({ ...newOrganization, email: e.target.value })}
                      placeholder="Enter company email"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Phone Number</label>
                    <input
                      value={newOrganization.phone}
                      onChange={(e) => setNewOrganization({ ...newOrganization, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Country</label>
                    <input
                      value={newOrganization.country}
                      onChange={(e) => setNewOrganization({ ...newOrganization, country: e.target.value })}
                      placeholder="Enter country"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">PAN</label>
                    <input
                      value={newOrganization.pan}
                      onChange={(e) => setNewOrganization({ ...newOrganization, pan: e.target.value })}
                      placeholder="Enter PAN"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Company Logo URL</label>
                    <input
                      value={newOrganization.logoUrl}
                      onChange={(e) => setNewOrganization({ ...newOrganization, logoUrl: e.target.value })}
                      placeholder="Paste organization logo URL"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Employee Buses</label>
                      <input
                        type="number"
                        min={0}
                        value={newOrganization.employeeBusCount}
                        onChange={(e) => setNewOrganization({ ...newOrganization, employeeBusCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Employee Cars</label>
                      <input
                        type="number"
                        min={0}
                        value={newOrganization.employeeCarCount}
                        onChange={(e) => setNewOrganization({ ...newOrganization, employeeCarCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Officer Cars</label>
                      <input
                        type="number"
                        min={0}
                        value={newOrganization.officerCarCount}
                        onChange={(e) => setNewOrganization({ ...newOrganization, officerCarCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Address</label>
                    <textarea
                      value={newOrganization.address}
                      onChange={(e) => setNewOrganization({ ...newOrganization, address: e.target.value })}
                      placeholder="Enter company address"
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOrgDialogOpen(false)
                      setNewOrganization({
                        name: "",
                        maxUsers: "",
                        address: "",
                        phone: "",
                        country: "",
                        email: "",
                        pan: "",
                        amount: "",
                        currency: "",
                        logoUrl: "",
                        employeeBusCount: "",
                        employeeCarCount: "",
                        officerCarCount: "",
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => void createOrganization()}
                    disabled={!newOrganization.name.trim() || Number(newOrganization.maxUsers) < 1}
                  >
                    Create Organization
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => {
                resetOrganizations()
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Organizations
            </Button>
          </div>
        }
      />

      {isUsingFallbackOrganizations ? (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          Database data is currently unavailable. The organization list below is fallback/local data and may not match your real DB values.
          {organizationError ? ` ${organizationError}` : ""}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-base font-semibold text-card-foreground">Organizations</p>
          <p className="mt-1 text-sm text-muted-foreground">Use the View button to open the full organization details in a popup.</p>
        </div>

        <div className="mb-3 hidden grid-cols-[minmax(140px,1.15fr)_minmax(120px,0.75fr)_minmax(110px,0.7fr)_minmax(120px,0.8fr)_minmax(150px,0.95fr)_minmax(120px,0.75fr)_150px_110px] gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <p>Organization</p>
          <p>Users</p>
          <p>Trucks</p>
          <p>Amount</p>
          <p>Country</p>
          <p>App Permission</p>
          <p className="text-right">Action</p>
        </div>

        <div className="space-y-3">
          {organizationStats.map((organization) => {
            return (
              <div key={organization.name} className="rounded-xl border border-border bg-muted/20">
                <div className="grid gap-3 rounded-xl p-4 md:grid-cols-[minmax(140px,1.15fr)_minmax(120px,0.75fr)_minmax(110px,0.7fr)_minmax(120px,0.8fr)_minmax(150px,0.95fr)_minmax(120px,0.75fr)_150px_110px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {organization.isBlocked ? (
                        <Lock className="h-4 w-4 text-destructive" aria-label="Blocked organization" />
                      ) : (
                        <LockOpen className="h-4 w-4 text-emerald-700" aria-label="Active organization" />
                      )}
                      <p className="truncate text-sm font-semibold text-card-foreground">{organization.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground md:hidden">
                      {organization.currentUsers} of {organization.maxUsers} users assigned
                      {" "}· {organization.truckCount} trucks
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {organization.currentUsers} / {organization.maxUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {organization.truckCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAmountOrganization(organization.name)}
                    className="text-left text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {String(organization.amount ?? 0)}
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {organization.country || "Not set"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {organization.currentUsers} / {organization.maxUsers}
                  </p>
                  <div className="flex items-center md:justify-start">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAccessOrganization(organization.name)}
                    >
                      App Permission
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void handleOrganizationSelect(organization.name)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog
        open={Boolean(selectedAccessOrganization)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAccessOrganization("")
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>App Access</DialogTitle>
            <DialogDescription>
              Enable which apps this organization is allowed to use. Users still need the same menus assigned in Admin Users before the app appears for them.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
            Organization app access is a top-level permission only. It does not automatically grant the menu to every user in that organization.
          </div>

          {isLoadingPermissionOptions ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              Loading app access options...
            </div>
          ) : permissionOptions.length === 0 ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              No app access options were loaded. Refresh the page and try again.
            </div>
          ) : (
            <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {permissionOptions.map((option) => (
                <div key={option.route} className="flex items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  <span>{option.label}</span>
                  <Switch
                    checked={editableOrganizationAccessRoutes.includes(option.route)}
                    onCheckedChange={(checked) => toggleOrganizationAccess(option.route, checked === true)}
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAccessOrganization("")}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => void saveOrganizationAccess()}
              disabled={isSavingOrganizationAccess || isLoadingPermissionOptions || permissionOptions.length === 0}
            >
              {isSavingOrganizationAccess ? "Saving..." : "Save App Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedAmountOrganization)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAmountOrganization("")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Amount</DialogTitle>
            <DialogDescription>
              Update the amount coming for this organization.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">Calculation Mode</label>
            <select
              value={amountCalculationMode}
              onChange={(e) => setAmountCalculationMode(e.target.value as "total" | "id-base" | "truck-base")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="total">Total Amount</option>
              <option value="id-base">ID Base</option>
              <option value="truck-base">Truck Base</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-card-foreground">
              {amountCalculationMode === "total"
                ? "Total Amount"
                : amountCalculationMode === "id-base"
                  ? "Amount per ID"
                  : "Amount per Truck"}
            </label>
            <input
              type="number"
              min={0}
              value={amountForm}
              onChange={(e) => setAmountForm(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-card-foreground">Preview</p>
            <p className="mt-1">
              {amountCalculationMode === "total"
                ? `Saving total amount: ${Math.max(0, Number(amountForm) || 0)}`
                : amountCalculationMode === "id-base"
                  ? `Rate ${Math.max(0, Number(amountForm) || 0)} × ${selectedAmountOrganizationData?.currentUsers ?? 0} IDs = ${Math.max(0, Number(amountForm) || 0) * (selectedAmountOrganizationData?.currentUsers ?? 0)}`
                  : `Rate ${Math.max(0, Number(amountForm) || 0)} × ${selectedAmountOrganizationData?.truckCount ?? 0} trucks = ${Math.max(0, Number(amountForm) || 0) * (selectedAmountOrganizationData?.truckCount ?? 0)}`}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAmountOrganization("")}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveOrganizationAmount()}>
              Save Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedOrganization)} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrganization("")
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedOrganizationDisplayName}</DialogTitle>
            <DialogDescription>
              Review and manage the full organization details from this popup.
            </DialogDescription>
          </DialogHeader>

          {selectedOrganization ? (() => {
            const organization = organizationStats.find((item) => item.name === selectedOrganization)
            if (!organization) {
              return null
            }

            return (
              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-4">
                  {organization.name === "Platform" ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-sm text-card-foreground">
                        Super Admin can edit Platform organization fields here. Block, unblock, and delete remain disabled for Platform.
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Selected Organization</label>
                    <div className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground">
                      {selectedOrganization}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Total Users Allowed</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxUsers}
                      onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Company Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Phone Number</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Country</label>
                      <input
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">PAN</label>
                    <input
                      value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Company Logo URL</label>
                    <input
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3">
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) {
                            return
                          }

                          const previousLogoUrl = form.logoUrl
                          const previewUrl = URL.createObjectURL(file)
                          setForm((current) => ({
                            ...current,
                            logoUrl: previewUrl,
                          }))

                          try {
                            const result = await uploadOrganizationLogo(selectedOrganization.trim(), file)
                            setForm((current) => ({
                              ...current,
                              logoUrl: result.logoData ?? previewUrl,
                            }))
                          } catch {
                            setForm((current) => ({
                              ...current,
                              logoUrl: previousLogoUrl,
                            }))
                            toast.error("The logo could not be uploaded. Please choose another image.")
                          } finally {
                            URL.revokeObjectURL(previewUrl)
                            event.target.value = ""
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoFileInputRef.current?.click()}
                      >
                        Search Path
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const previousLogoUrl = form.logoUrl
                          setForm({ ...form, logoUrl: "" })
                          try {
                            if (selectedOrganization.trim()) {
                              await deleteOrganizationLogo(selectedOrganization.trim())
                            }
                          } catch {
                            setForm({ ...form, logoUrl: previousLogoUrl })
                            toast.error("The logo could not be removed.")
                          }
                        }}
                        disabled={!form.logoUrl.trim()}
                      >
                        Clear
                      </Button>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                          {form.logoUrl.trim() ? (
                            <img src={form.logoUrl.trim()} alt={`${selectedOrganization} logo preview`} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">No Logo</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-card-foreground">Logo Preview</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {form.logoUrl.trim() ? "Logo selected" : "Choose an image to preview it here"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Employee Buses</label>
                      <input
                        type="number"
                        min={0}
                        value={form.employeeBusCount}
                        onChange={(e) => setForm({ ...form, employeeBusCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Employee Cars</label>
                      <input
                        type="number"
                        min={0}
                        value={form.employeeCarCount}
                        onChange={(e) => setForm({ ...form, employeeCarCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-card-foreground">Officer Cars</label>
                      <input
                        type="number"
                        min={0}
                        value={form.officerCarCount}
                        onChange={(e) => setForm({ ...form, officerCarCount: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  {organization.currentUsers > organization.maxUsers ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                      <p className="text-sm text-destructive">
                        This organization is above its limit. Reduce users automatically to match the quota.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => trimUsersToLimit(organization.name, organization.maxUsers)}
                      >
                        Apply Limit Now
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void saveOrganization()}>
                      Save
                    </Button>
                    {organization.name !== "Platform" ? (
                      <Button
                        variant="secondary"
                        className="bg-amber-100 text-amber-900 hover:bg-amber-200"
                        disabled={organization.isBlocked}
                        onClick={() => {
                          if (window.confirm(`Block organization ${organization.name}?`)) {
                            void toggleOrganizationBlock(organization.name, true)
                          }
                        }}
                      >
                        Block
                      </Button>
                    ) : null}
                    {organization.name !== "Platform" ? (
                      <Button
                        variant="outline"
                        className="border-emerald-700 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 hover:text-white"
                        disabled={!organization.isBlocked}
                        onClick={() => {
                          if (window.confirm(`Unblock organization ${organization.name}?`)) {
                            void toggleOrganizationBlock(organization.name, false)
                          }
                        }}
                      >
                        Unblock
                      </Button>
                    ) : null}
                    {organization.name !== "Platform" ? (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setIsDeleteOrganizationDialogOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-card-foreground">How it works</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {organization.currentUsers > organization.maxUsers
                      ? `This organization currently has ${organization.currentUsers} users, which is above the allowed limit of ${organization.maxUsers}. That count includes the organization admin.`
                      : `This organization currently has ${organization.currentUsers} users out of ${organization.maxUsers} allowed. That count includes the organization admin, and the org admin cannot create more users than the allowed limit.`}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Trucks: {organization.truckCount}</p>
                  <p>Phone: {organization.phone || "Not set"}</p>
                  <p>Country: {organization.country || "Not set"}</p>
                  <p>PAN: {organization.pan || "Not set"}</p>
                    <p>Employee buses: {organization.employeeBusCount}</p>
                    <p>Employee cars: {organization.employeeCarCount}</p>
                    <p>Officer cars: {organization.officerCarCount}</p>
                    <p>Status: {organization.isBlocked ? "Blocked" : "Active"}</p>
                  </div>
                </div>
              </div>
            )
          })() : null}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteOrganizationDialogOpen}
        onOpenChange={setIsDeleteOrganizationDialogOpen}
        itemLabel={selectedOrganization ? `organization ${selectedOrganization}` : "this organization"}
        onConfirm={async () => {
          const organizationName = selectedOrganization
          if (!organizationName) {
            return
          }

          try {
            await deleteOrganization(organizationName)
            setSelectedOrganization("")
            setIsDeleteOrganizationDialogOpen(false)
            toast.success(`${organizationName} deleted successfully.`)
          } catch {
            toast.error(`Failed to delete ${organizationName}.`)
          }
        }}
      />
    </div>
  )
}
