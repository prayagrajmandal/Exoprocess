"use client"

import { useEffect, useState } from "react"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { PageHeader } from "@/components/tms-ui"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useOrganizations } from "@/hooks/use-organizations"
import { usePermissionOptions } from "@/hooks/use-permission-options"
import { useUserDirectory } from "@/hooks/use-user-directory"
import { canEditRoute, countUsersForOrganization, getDefaultAccessForRoles, getDefaultEditRoutesForRoles, roleLabels, type AccessRoute, type DemoUser, type UserRole } from "@/lib/auth"
import { PencilLine, Plus, RotateCcw, ShieldCheck, SquareStack, Users } from "lucide-react"
import { toast } from "sonner"

const assignableRoles: UserRole[] = ["admin", "head-office", "gate", "maintenance", "vehicle-assignment"]

function getAccessRoutesForRole(role: UserRole, routes: AccessRoute[]) {
  if (role === "admin") {
    return Array.from(new Set<AccessRoute>(["/admin", ...routes.filter((route) => route !== "/admin")]))
  }

  return routes.filter((route) => route !== "/admin")
}

export default function AdminUsersPage() {
  const { session } = useAuth()
  const { users, isLoading, error, saveUsers, saveUserAccess, saveUserEditAccess, resetUsers, deleteUser } = useUserDirectory()
  const { organizations } = useOrganizations()
  const { permissionOptions, isLoading: isLoadingPermissionOptions } = usePermissionOptions()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAppAccessDialogOpen, setIsAppAccessDialogOpen] = useState(false)
  const [isEditAccessDialogOpen, setIsEditAccessDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [isSavingSelectedUser, setIsSavingSelectedUser] = useState(false)
  const [isSavingAccessRoutes, setIsSavingAccessRoutes] = useState(false)
  const [isSavingEditRoutes, setIsSavingEditRoutes] = useState(false)
  const [newUser, setNewUser] = useState({
    userId: "",
    name: "",
    email: "",
    department: "",
    role: "maintenance" as UserRole,
  })
  const [editableUser, setEditableUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "maintenance" as UserRole,
  })
  const [editableAccessRoutes, setEditableAccessRoutes] = useState<AccessRoute[]>([])
  const [editableEditRoutes, setEditableEditRoutes] = useState<AccessRoute[]>([])

  const scopedUsers = session ? users.filter((user) => user.organization === session.organization) : users
  const [selectedUserId, setSelectedUserId] = useState("")
  const canEditAdmin = Boolean(session && canEditRoute(session, "/admin"))

  useEffect(() => {
    if (scopedUsers.length === 0) {
      setSelectedUserId("")
      return
    }

    if (!scopedUsers.some((user) => user.userId === selectedUserId)) {
      setSelectedUserId(scopedUsers[0].userId)
    }
  }, [scopedUsers, selectedUserId])

  const selectedUser = scopedUsers.find((user) => user.userId === selectedUserId) ?? scopedUsers[0] ?? null

  useEffect(() => {
    if (selectedUser) {
      const selectedRole = selectedUser.roles[0] ?? "maintenance"
      setEditableUser({
        name: selectedUser.name,
        email: selectedUser.email,
        department: selectedUser.department,
        role: selectedRole,
      })
      setEditableAccessRoutes(getAccessRoutesForRole(selectedRole, selectedUser.accessRoutes))
      setEditableEditRoutes(getAccessRoutesForRole(selectedRole, selectedUser.editRoutes ?? []))
    }
  }, [selectedUser])
  const organizationLimit = session
    ? organizations.find((organization) => organization.name.toLowerCase() === session.organization.toLowerCase()) ?? null
    : null
  const selectedUserOrganization = selectedUser
    ? organizations.find((organization) => organization.name.toLowerCase() === selectedUser.organization.toLowerCase()) ?? null
    : null
  const selectedOrganizationAppPermissions = new Set(selectedUserOrganization?.appPermissions ?? [])
  const currentUserCount = session ? countUsersForOrganization(users, session.organization) : 0
  const canCreateMoreUsers = session ? currentUserCount < (organizationLimit?.maxUsers ?? 0) : false
  const organizationName = session?.organization ?? "Unknown"
  const isCreateFormValid = newUser.userId.trim().length === 5
    && newUser.name.trim().length > 0
    && newUser.email.trim().length > 0
    && newUser.department.trim().length > 0

  const updateSelectedUser = async (updater: (user: DemoUser) => DemoUser) => {
    if (!selectedUser) {
      return
    }

    await saveUsers(
      users.map((user) =>
        user.userId === selectedUser.userId && user.organization === selectedUser.organization ? updater(user) : user
      )
    )
  }

  const createUser = async () => {
    if (!session) {
      return
    }

    const userId = newUser.userId.trim().toLowerCase()
    const name = newUser.name.trim()
    const email = newUser.email.trim().toLowerCase()
    const department = newUser.department.trim()
    const role = newUser.role

    if (userId.length !== 5 || !name || !email || !department || !canCreateMoreUsers) {
      toast.error("Please fill all user details correctly before creating the ID.")
      return
    }

    if (
      users.some(
        (user) =>
          user.organization.toLowerCase() === session.organization.toLowerCase() &&
          user.userId.toLowerCase() === userId
      )
    ) {
      toast.error(`User ID ${userId} already exists in ${session.organization}.`)
      return
    }

    const createdUser: DemoUser = {
      userId,
      name,
      password: "1234",
      email,
      department,
      roles: [role],
      accessRoutes: getDefaultAccessForRoles([role]),
      editRoutes: getDefaultEditRoutesForRoles([role]),
      organization: session.organization,
    }

    try {
      await saveUsers([...users, createdUser])
      setNewUser({ userId: "", name: "", email: "", department: "", role: "maintenance" })
      setSelectedUserId(createdUser.userId)
      setIsCreateDialogOpen(false)
      toast.success(`${createdUser.userId} created successfully in ${session.organization}.`)
    } catch {
      toast.error(`Failed to create ${createdUser.userId}. The user was not saved.`)
    }
  }

  const toggleAccess = (route: AccessRoute, isChecked: boolean) => {
    setEditableAccessRoutes((currentRoutes) => {
      if (isChecked) {
        return currentRoutes.includes(route) ? currentRoutes : [...currentRoutes, route]
      }

      return currentRoutes.filter((item) => item !== route)
    })
  }

  const toggleEditAccess = (route: AccessRoute, isChecked: boolean) => {
    setEditableEditRoutes((currentRoutes) => {
      if (isChecked) {
        return currentRoutes.includes(route) ? currentRoutes : [...currentRoutes, route]
      }

      return currentRoutes.filter((item) => item !== route)
    })
  }

  const saveSelectedUser = async () => {
    if (!selectedUser) {
      return
    }

    const nextName = editableUser.name.trim()
    const nextEmail = editableUser.email.trim()
    const nextDepartment = editableUser.department.trim()

    if (!nextName || !nextEmail || !nextDepartment) {
      toast.error("Name, email, and department are required.")
      return
    }

    const nextAccessRoutes = getAccessRoutesForRole(editableUser.role, editableAccessRoutes)

    try {
      setIsSavingSelectedUser(true)
      await updateSelectedUser((user) => ({
        ...user,
        name: nextName,
        email: nextEmail,
        department: nextDepartment,
        roles: [editableUser.role],
        accessRoutes: nextAccessRoutes,
        editRoutes: getAccessRoutesForRole(editableUser.role, editableEditRoutes),
      }))
      toast.success("Data was saved.")
    } catch {
      toast.error(`Failed to save changes for ${selectedUser.userId}.`)
    } finally {
      setIsSavingSelectedUser(false)
    }
  }

  const saveSelectedAccessRoutes = async () => {
    if (!selectedUser) {
      return
    }

    const nextAccessRoutes = getAccessRoutesForRole(editableUser.role, editableAccessRoutes)

    try {
      setIsSavingAccessRoutes(true)
      await saveUserAccess(selectedUser.organization, selectedUser.userId, nextAccessRoutes)
      toast.success("Menu access saved.")
      setIsAppAccessDialogOpen(false)
    } catch {
      toast.error(`Failed to save menu access for ${selectedUser.userId}.`)
    } finally {
      setIsSavingAccessRoutes(false)
    }
  }

  const saveSelectedEditRoutes = async () => {
    if (!selectedUser) {
      return
    }

    const nextEditRoutes = getAccessRoutesForRole(editableUser.role, editableEditRoutes)

    try {
      setIsSavingEditRoutes(true)
      await saveUserEditAccess(selectedUser.organization, selectedUser.userId, nextEditRoutes)
      toast.success("Edit access saved.")
      setIsEditAccessDialogOpen(false)
    } catch {
      toast.error(`Failed to save edit access for ${selectedUser.userId}.`)
    } finally {
      setIsSavingEditRoutes(false)
    }
  }

  const handleRoleChange = (role: UserRole) => {
    setEditableUser((current) => ({ ...current, role }))
    setEditableAccessRoutes(getAccessRoutesForRole(role, getDefaultAccessForRoles([role])))
    setEditableEditRoutes(getDefaultEditRoutesForRoles([role]))
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading users...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-card p-6 text-sm text-destructive shadow-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin User Management"
        description="Create users inside your organization quota, then assign page access"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm("Resetting will replace your current users with the default role users. Do you want to continue?")) {
                void resetUsers()
              }
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Default Roles
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">Admin-only page</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization: {session?.organization ?? "Unknown"}.
          {" "}You can manage only users from this organization and cannot go above the allowed user count.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateMoreUsers || !canEditAdmin}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create User In {organizationName}
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User In {organizationName}</DialogTitle>
                <DialogDescription>
                  Add a new user under this organization. The default password will be `1234`.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">New User ID</label>
                  <input
                    value={newUser.userId}
                    onChange={(e) => setNewUser({ ...newUser, userId: e.target.value.slice(0, 5) })}
                    placeholder="5 chars"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">New User Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Mail ID</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Department</label>
                  <input
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Enter department"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Organization</label>
                  <input
                    value={organizationName}
                    readOnly
                    className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewUser({ userId: "", name: "", email: "", department: "", role: "maintenance" })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => void createUser()}
                  disabled={!canCreateMoreUsers || !isCreateFormValid || !canEditAdmin}
                >
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <p className="text-sm text-muted-foreground">
            {`${currentUserCount} / ${organizationLimit?.maxUsers ?? 0} users used in this organization. Password for new users is \`1234\`.`}
          </p>
          {!canCreateMoreUsers ? (
            <p className="text-sm font-medium text-destructive">
              {`User limit reached for ${session?.organization}. Increase the quota from Super Admin or remove/reset a user first.`}
            </p>
          ) : null}
        </div>
      </div>

      {selectedUser ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">User ID</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {scopedUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.userId} - {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-card-foreground">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">Login ID: {selectedUser.userId}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {selectedUser.password}
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
                    <p className="font-medium text-card-foreground">{selectedUser.organization}</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                    <input
                      value={editableUser.name}
                      onChange={(e) => setEditableUser({ ...editableUser, name: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-card-foreground"
                    />
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Mail ID</p>
                    <input
                      value={editableUser.email}
                      onChange={(e) => setEditableUser({ ...editableUser, email: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-card-foreground"
                    />
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                    <input
                      value={editableUser.department}
                      onChange={(e) => setEditableUser({ ...editableUser, department: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-card-foreground"
                    />
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Current Role</p>
                    <select
                      value={editableUser.role}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-card-foreground"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Access</p>
                    <p className="font-medium text-card-foreground">{editableAccessRoutes.length} pages assigned</p>
                  </div>
                </div>
                <Button onClick={() => void saveSelectedUser()} disabled={!canEditAdmin || isSavingSelectedUser}>
                  {isSavingSelectedUser ? "Saving..." : "Save User Changes"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!canEditAdmin}
                  onClick={() => {
                    if (!selectedUser) return
                    setIsDeleteUserDialogOpen(true)
                  }}
                >
                  Delete User
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (canEditAdmin) {
                      setIsAppAccessDialogOpen(true)
                    }
                  }}
                  className="rounded-xl border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                  disabled={!canEditAdmin}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">App Access</p>
                      <p className="mt-1 text-sm text-muted-foreground">Assign multiple menu access for this user.</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <SquareStack className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-2xl font-bold text-card-foreground">{editableAccessRoutes.length}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">menus selected</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (canEditAdmin) {
                      setIsEditAccessDialogOpen(true)
                    }
                  }}
                  className="rounded-xl border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                  disabled={!canEditAdmin}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Edit Access</p>
                      <p className="mt-1 text-sm text-muted-foreground">Choose which menus this user can edit.</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <PencilLine className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-2xl font-bold text-card-foreground">{editableEditRoutes.length}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">edit options enabled</p>
                </button>
              </div>

              {!isLoadingPermissionOptions && editableUser.role !== "admin" && permissionOptions.length === 0 ? (
                <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
                  No permission rows were loaded from the database.
                </div>
              ) : null}
              {!canEditAdmin ? (
                <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
                  This user has display access only. Edit access is required to create users or change permissions.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={isAppAccessDialogOpen} onOpenChange={setIsAppAccessDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>App Access</DialogTitle>
            <DialogDescription>
              Assign multiple menu access for {selectedUser?.name ?? "this user"}.
            </DialogDescription>
          </DialogHeader>

          {isLoadingPermissionOptions ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              Loading app access options...
            </div>
          ) : permissionOptions.length === 0 ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              No app access options were loaded. Refresh the page and try again.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
                User access can only be enabled for apps already allowed to the organization from Super Admin.
              </div>
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {permissionOptions.map((option) => (
                <div key={option.route} className="flex items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  <div>
                    <span>{option.label}</span>
                    {!selectedOrganizationAppPermissions.has(option.route) ? (
                      <p className="mt-1 text-xs text-muted-foreground">Enable this app in Super Admin first.</p>
                    ) : null}
                  </div>
                  <Switch
                    checked={editableAccessRoutes.includes(option.route)}
                    onCheckedChange={(checked) => toggleAccess(option.route, checked === true)}
                    disabled={!canEditAdmin || !selectedOrganizationAppPermissions.has(option.route)}
                  />
                </div>
              ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAppAccessDialogOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => void saveSelectedAccessRoutes()}
              disabled={!canEditAdmin || isSavingAccessRoutes}
            >
              {isSavingAccessRoutes ? "Saving..." : "Save Menu Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteUserDialogOpen}
        onOpenChange={setIsDeleteUserDialogOpen}
        itemLabel={selectedUser ? `user ${selectedUser.userId}` : "this user"}
        onConfirm={async () => {
          if (!selectedUser) {
            return
          }
          await deleteUser(selectedUser.organization, selectedUser.userId)
          setSelectedUserId("")
          setIsDeleteUserDialogOpen(false)
        }}
      />

      <Dialog open={isEditAccessDialogOpen} onOpenChange={setIsEditAccessDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Access</DialogTitle>
            <DialogDescription>
              Select the menus that {selectedUser?.name ?? "this user"} can edit.
            </DialogDescription>
          </DialogHeader>

          {isLoadingPermissionOptions ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              Loading edit access options...
            </div>
          ) : permissionOptions.length === 0 ? (
            <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
              No edit access options were loaded. Refresh the page and try again.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground">
                Edit access can only be enabled for apps already allowed to the organization from Super Admin.
              </div>
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {permissionOptions.map((option) => (
                <div key={option.route} className="flex items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
                  <div>
                    <span>{option.label}</span>
                    {!selectedOrganizationAppPermissions.has(option.route) ? (
                      <p className="mt-1 text-xs text-muted-foreground">Enable this app in Super Admin first.</p>
                    ) : null}
                  </div>
                  <Switch
                    checked={editableEditRoutes.includes(option.route)}
                    onCheckedChange={(checked) => toggleEditAccess(option.route, checked === true)}
                    disabled={!canEditAdmin || !selectedOrganizationAppPermissions.has(option.route)}
                  />
                </div>
              ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAccessDialogOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => void saveSelectedEditRoutes()}
              disabled={!canEditAdmin || isSavingEditRoutes}
            >
              {isSavingEditRoutes ? "Saving..." : "Save Edit Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Users className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Organization Quota</p>
          <p className="mt-1 text-sm text-muted-foreground">The user limit includes the admin user inside the same organization.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Multiple Access</p>
          <p className="mt-1 text-sm text-muted-foreground">Check more than one option to combine menu access for one user.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <RotateCcw className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Quick Reset</p>
          <p className="mt-1 text-sm text-muted-foreground">Reset restores the default page access for admin, head office, gate, and maintenance users.</p>
        </div>
      </div>
    </div>
  )
}
