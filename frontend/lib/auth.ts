export type UserRole = "super-admin" | "admin" | "head-office" | "gate" | "maintenance" | "vehicle-assignment"

export type AccessRoute =
  | "/dashboard"
  | "/orders"
  | "/payments"
  | "/orderlanding"
  | "/planning"
  | "/vehicleassignment"
  | "/trips"
  | "/tracking"
  | "/routemap"
  | "/drivers"
  | "/fleet"
  | "/employee-transport"
  | "/vehicledriver"
  | "/maintenance"
  | "/trackscale"
  | "/gatepass"
  | "/billing"
  | "/reports"
  | "/settings"
  | "/admin"
  | "/superadmin"

export interface NavAccessItem {
  label: string
  route: AccessRoute
}

export interface OrganizationConfig {
  name: string
  maxUsers: number
  address: string
  phone: string
  country: string
  email: string
  pan: string
  employeeBusCount: number
  employeeCarCount: number
  officerCarCount: number
  amount: number
  currency: string
  logoUrl?: string
  truckCount?: number
  isBlocked: boolean
  appPermissions: AccessRoute[]
}

export const accessOptions: NavAccessItem[] = [
  { label: "Dashboard", route: "/dashboard" },
  { label: "Orders", route: "/orders" },
  { label: "Payment", route: "/payments" },
  { label: "Order Landing Page", route: "/orderlanding" },
  { label: "Planning", route: "/planning" },
  { label: "Vehicle Assignment", route: "/vehicleassignment" },
  { label: "Trips", route: "/trips" },
  { label: "Tracking", route: "/tracking" },
  { label: "Route Map", route: "/routemap" },
  { label: "Drivers", route: "/drivers" },
  { label: "Fleet", route: "/fleet" },
  { label: "Employee Transport", route: "/employee-transport" },
  { label: "Vehicle", route: "/vehicledriver" },
  { label: "Maintenance", route: "/maintenance" },
  { label: "Truck Scale", route: "/trackscale" },
  { label: "Gate Pass", route: "/gatepass" },
  { label: "Billing", route: "/billing" },
  { label: "Reports", route: "/reports" },
]

export interface AuthSession {
  userId: string
  name: string
  roles: UserRole[]
  accessRoutes: AccessRoute[]
  editRoutes: AccessRoute[]
  organization: string
}

export interface DemoUser extends AuthSession {
  password: string
  email: string
  department: string
}

type LegacyUser = {
  userId: string
  name: string
  password: string
  email?: string
  department?: string
  role?: UserRole
  roles?: UserRole[]
  accessRoutes?: AccessRoute[]
  editRoutes?: AccessRoute[]
  organization?: string
}

type LegacySession = {
  userId: string
  name: string
  role?: UserRole
  roles?: UserRole[]
  accessRoutes?: AccessRoute[]
  editRoutes?: AccessRoute[]
  organization?: string
}

export const AUTH_STORAGE_KEY = "vehicle-management-session"
export const AUTH_SESSION_SNAPSHOT_STORAGE_KEY = "vehicle-management-session-snapshot"
export const AUTH_EVENT_NAME = "vehicle-management-auth-change"
export const USER_DIRECTORY_STORAGE_KEY = "vehicle-management-users"
export const USER_DIRECTORY_EVENT_NAME = "vehicle-management-users-change"
export const ORGANIZATION_STORAGE_KEY = "vehicle-management-organizations"
export const ORGANIZATION_EVENT_NAME = "vehicle-management-organizations-change"

type SessionSnapshot = {
  token: string
  session: AuthSession
}

export const roleLabels: Record<UserRole, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "head-office": "Head Office",
  gate: "Gate Pass",
  maintenance: "Maintenance",
  "vehicle-assignment": "Vehicle Assignment",
}

const adminWorkspaceRoutes: AccessRoute[] = ["/admin"]
const superAdminWorkspaceRoutes: AccessRoute[] = ["/superadmin", "/reports"]
const organizationScopedRoutes = new Set<AccessRoute>(accessOptions.map((item) => item.route))

const roleDefaultAccess: Record<UserRole, AccessRoute[]> = {
  "super-admin": superAdminWorkspaceRoutes,
  admin: [...adminWorkspaceRoutes, "/reports"],
  "head-office": accessOptions.map((item) => item.route),
  gate: ["/gatepass", "/vehicleassignment"],
  maintenance: ["/maintenance"],
  "vehicle-assignment": ["/vehicleassignment"],
}

const roleDefaultEditAccess: Record<UserRole, AccessRoute[]> = {
  "super-admin": superAdminWorkspaceRoutes,
  admin: ["/admin"],
  "head-office": [],
  gate: [],
  maintenance: ["/maintenance"],
  "vehicle-assignment": [],
}

export const defaultOrganizations: OrganizationConfig[] = [
  {
    name: "Platform",
    maxUsers: 1,
    address: "",
    phone: "",
    country: "",
    email: "",
    pan: "",
    employeeBusCount: 0,
    employeeCarCount: 0,
    officerCarCount: 0,
    amount: 0,
    currency: "",
    logoUrl: "",
    truckCount: 0,
    isBlocked: false,
    appPermissions: accessOptions.map((item) => item.route),
  },
  {
    name: "Pro",
    maxUsers: 5,
    address: "",
    phone: "",
    country: "India",
    email: "",
    pan: "",
    employeeBusCount: 0,
    employeeCarCount: 0,
    officerCarCount: 0,
    amount: 0,
    currency: "",
    logoUrl: "",
    isBlocked: false,
    appPermissions: accessOptions.map((item) => item.route),
  },
]

function normalizeOrganization(organization: Partial<OrganizationConfig> & Pick<OrganizationConfig, "name" | "maxUsers">): OrganizationConfig {
  return {
    name: organization.name,
    maxUsers: organization.maxUsers,
    address: organization.address ?? "",
    phone: organization.phone ?? "",
    country: organization.country ?? "",
    email: organization.email ?? "",
    pan: organization.pan ?? "",
    employeeBusCount: Math.max(0, Number(organization.employeeBusCount ?? 0)),
    employeeCarCount: Math.max(0, Number(organization.employeeCarCount ?? 0)),
    officerCarCount: Math.max(0, Number(organization.officerCarCount ?? 0)),
    amount: Math.max(0, Number(organization.amount ?? 0)),
    currency: organization.currency ?? "",
    logoUrl: organization.logoUrl ?? "",
    truckCount: Math.max(0, Number(organization.truckCount ?? 0)),
    isBlocked: organization.isBlocked ?? false,
    appPermissions: Array.from(new Set((organization.appPermissions ?? accessOptions.map((item) => item.route)).filter(Boolean))),
  }
}

export const defaultDemoUsers: DemoUser[] = [
  { userId: "supad", password: "1234", name: "Super Administrator", email: "superadmin@platform.local", department: "Platform", roles: ["super-admin"], accessRoutes: roleDefaultAccess["super-admin"], editRoutes: roleDefaultAccess["super-admin"], organization: "Platform" },
  { userId: "admin", password: "1234", name: "Administrator", email: "admin@pro.local", department: "Administration", roles: ["admin"], accessRoutes: roleDefaultAccess.admin, editRoutes: ["/admin"], organization: "Pro" },
  { userId: "heado", password: "1234", name: "Head Office", email: "headoffice@pro.local", department: "Operations", roles: ["head-office"], accessRoutes: roleDefaultAccess["head-office"], editRoutes: [], organization: "Pro" },
  { userId: "gate1", password: "1234", name: "Gate Officer", email: "gate@pro.local", department: "Gate", roles: ["gate"], accessRoutes: roleDefaultAccess.gate, editRoutes: [], organization: "Pro" },
  { userId: "maint", password: "1234", name: "Maintenance Officer", email: "maintenance@pro.local", department: "Maintenance", roles: ["maintenance"], accessRoutes: roleDefaultAccess.maintenance, editRoutes: roleDefaultEditAccess.maintenance, organization: "Pro" },
  { userId: "vehas", password: "1234", name: "Vehicle Assignment Officer", email: "vehicle@pro.local", department: "Transport", roles: ["vehicle-assignment"], accessRoutes: roleDefaultAccess["vehicle-assignment"], editRoutes: [], organization: "Pro" },
]

export function normalizeRoles(roles?: UserRole[]) {
  const safeRoles = roles?.filter(Boolean) ?? []
  return safeRoles.length > 0 ? Array.from(new Set(safeRoles)) : (["head-office"] as UserRole[])
}

export function normalizeAccessRoutes(accessRoutes?: AccessRoute[], roles?: UserRole[]) {
  const normalizedRoles = normalizeRoles(roles)
  const safeRoutes = accessRoutes?.filter(Boolean) ?? []

  if (accessRoutes) {
    return Array.from(new Set(safeRoutes))
  }

  const roleBasedRoutes = normalizedRoles.flatMap((role) => roleDefaultAccess[role])

  return Array.from(new Set(roleBasedRoutes))
}

function emitWindowEvent(eventName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(eventName))
  }
}

export function getStoredSessionToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export function storeSessionToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, token)
  emitWindowEvent(AUTH_EVENT_NAME)
}

export function encodeLocalSessionToken(session: AuthSession) {
  if (typeof window === "undefined") {
    return ""
  }

  return `local:${window.btoa(JSON.stringify(session))}`
}

export function decodeLocalSessionToken(token: string): AuthSession | null {
  if (typeof window === "undefined" || !token.startsWith("local:")) {
    return null
  }

  try {
    const payload = window.atob(token.slice("local:".length))
    return normalizeSession(JSON.parse(payload) as LegacySession)
  } catch {
    return null
  }
}

export function clearStoredSessionToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  emitWindowEvent(AUTH_EVENT_NAME)
}

export function getStoredSessionSnapshot(token: string) {
  if (typeof window === "undefined" || !token) {
    return null
  }

  const rawSnapshot = window.localStorage.getItem(AUTH_SESSION_SNAPSHOT_STORAGE_KEY)
  if (!rawSnapshot) {
    return null
  }

  try {
    const snapshot = JSON.parse(rawSnapshot) as SessionSnapshot
    if (snapshot.token !== token) {
      return null
    }

    return normalizeSession(snapshot.session)
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_SNAPSHOT_STORAGE_KEY)
    return null
  }
}

export function storeSessionSnapshot(token: string, session: AuthSession) {
  if (typeof window === "undefined" || !token) {
    return
  }

  const snapshot: SessionSnapshot = {
    token,
    session: normalizeSession(session),
  }
  window.localStorage.setItem(AUTH_SESSION_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearStoredSessionSnapshot() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_SNAPSHOT_STORAGE_KEY)
}

export function getRoleLabel(role: UserRole) {
  return roleLabels[role]
}

export function getRoleLabels(roles: UserRole[]) {
  return normalizeRoles(roles).map(getRoleLabel).join(", ")
}

export function getDefaultAccessForRoles(roles: UserRole[]) {
  return normalizeAccessRoutes(undefined, roles)
}

export function getDefaultEditRoutesForRoles(roles: UserRole[]) {
  const normalizedRoles = normalizeRoles(roles)
  const routes = normalizedRoles.flatMap((role) => roleDefaultEditAccess[role])
  return Array.from(new Set(routes))
}

export function getOrganizations() {
  if (typeof window === "undefined") {
    return defaultOrganizations
  }

  const rawOrganizations = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY)
  if (!rawOrganizations) {
    return defaultOrganizations
  }

  try {
    const parsedOrganizations = JSON.parse(rawOrganizations) as OrganizationConfig[]
    return parsedOrganizations.length > 0 ? parsedOrganizations.map(normalizeOrganization) : defaultOrganizations
  } catch {
    window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY)
    return defaultOrganizations
  }
}

export function storeOrganizations(organizations: OrganizationConfig[], emitEvent = true) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(organizations.map(normalizeOrganization)))
  if (emitEvent) {
    emitWindowEvent(ORGANIZATION_EVENT_NAME)
  }
}

export function resetOrganizations() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(defaultOrganizations))
  emitWindowEvent(ORGANIZATION_EVENT_NAME)
}

function normalizeUser(user: LegacyUser): DemoUser {
  const roles = normalizeRoles(user.roles ?? (user.role ? [user.role] : undefined))

  return {
    userId: user.userId,
    name: user.name,
    password: user.password,
    email: user.email ?? "",
    department: user.department ?? "",
    roles,
    accessRoutes: normalizeAccessRoutes(user.accessRoutes, roles),
    editRoutes: Array.from(new Set([...getDefaultEditRoutesForRoles(roles), ...(user.editRoutes?.filter(Boolean) ?? [])])),
    organization: user.organization ?? "Pro",
  }
}

function normalizeSession(session: LegacySession): AuthSession {
  const roles = normalizeRoles(session.roles ?? (session.role ? [session.role] : undefined))

  return {
    userId: session.userId,
    name: session.name,
    roles,
    accessRoutes: normalizeAccessRoutes(session.accessRoutes, roles),
    editRoutes: Array.from(new Set([...getDefaultEditRoutesForRoles(roles), ...(session.editRoutes?.filter(Boolean) ?? [])])),
    organization: session.organization ?? "Pro",
  }
}

export function getUserDirectory() {
  if (typeof window === "undefined") {
    return defaultDemoUsers
  }

  const rawUsers = window.localStorage.getItem(USER_DIRECTORY_STORAGE_KEY)
  if (!rawUsers) {
    return defaultDemoUsers
  }

  try {
    const parsedUsers = JSON.parse(rawUsers) as LegacyUser[]
    if (parsedUsers.length === 0) {
      return defaultDemoUsers
    }

    const normalizedUsers = parsedUsers.map(normalizeUser)
    const existingUserIds = new Set(normalizedUsers.map((user) => `${user.organization.toLowerCase()}::${user.userId.toLowerCase()}`))
    const missingDefaultUsers = defaultDemoUsers.filter(
      (user) => !existingUserIds.has(`${user.organization.toLowerCase()}::${user.userId.toLowerCase()}`)
    )

    return [...normalizedUsers, ...missingDefaultUsers]
  } catch {
    window.localStorage.removeItem(USER_DIRECTORY_STORAGE_KEY)
    return defaultDemoUsers
  }
}

export function storeUserDirectory(users: DemoUser[], emitEvent = true) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(USER_DIRECTORY_STORAGE_KEY, JSON.stringify(users.map(normalizeUser)))
  if (emitEvent) {
    emitWindowEvent(USER_DIRECTORY_EVENT_NAME)
  }
}

export function resetUserDirectory() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(USER_DIRECTORY_STORAGE_KEY, JSON.stringify(defaultDemoUsers))
  emitWindowEvent(USER_DIRECTORY_EVENT_NAME)
}

export function getOrganizationLimit(organizationName: string) {
  return getOrganizations().find((organization) => organization.name.toLowerCase() === organizationName.toLowerCase()) ?? null
}

export function getOrganizationAppPermissions(organizationName: string) {
  return getOrganizationLimit(organizationName)?.appPermissions ?? accessOptions.map((item) => item.route)
}

export function getEffectiveAccessRoutes(session: Pick<AuthSession, "roles" | "accessRoutes" | "organization">) {
  if (session.roles.includes("super-admin")) {
    return superAdminWorkspaceRoutes
  }

  const organizationPermissions = new Set(getOrganizationAppPermissions(session.organization))
  return session.accessRoutes.filter((route) => !organizationScopedRoutes.has(route) || organizationPermissions.has(route))
}

export function getEffectiveEditRoutes(session: Pick<AuthSession, "roles" | "editRoutes" | "organization">) {
  if (session.roles.includes("super-admin")) {
    return superAdminWorkspaceRoutes
  }

  const organizationPermissions = new Set(getOrganizationAppPermissions(session.organization))
  return session.editRoutes.filter((route) => !organizationScopedRoutes.has(route) || organizationPermissions.has(route))
}

export function countUsersForOrganization(users: DemoUser[], organizationName: string) {
  return users.filter((user) => user.organization.toLowerCase() === organizationName.toLowerCase()).length
}

export function authenticateUser(organization: string, userId: string, password: string): AuthSession | null {
  const normalizedOrganization = organization.trim().toLowerCase()
  const normalizedUserId = userId.trim().toLowerCase()
  const user = getUserDirectory().find(
    (item) =>
      item.organization.toLowerCase() === normalizedOrganization &&
      item.userId.toLowerCase() === normalizedUserId &&
      item.password === password
  )

  if (!user) {
    return null
  }

  return {
    userId: user.userId,
    name: user.name,
    roles: normalizeRoles(user.roles),
    accessRoutes: getEffectiveAccessRoutes({
      roles: normalizeRoles(user.roles),
      accessRoutes: normalizeAccessRoutes(user.accessRoutes, user.roles),
      organization: user.organization,
    }),
    editRoutes: getEffectiveEditRoutes({
      roles: normalizeRoles(user.roles),
      editRoutes: Array.from(new Set([...getDefaultEditRoutesForRoles(normalizeRoles(user.roles)), ...(user.editRoutes?.filter(Boolean) ?? [])])),
      organization: user.organization,
    }),
    organization: user.organization,
  }
}

export function getDefaultRouteForSession(session: Pick<AuthSession, "roles" | "accessRoutes" | "organization">) {
  const effectiveAccessRoutes = getEffectiveAccessRoutes(session)

  if (session.roles.includes("super-admin")) {
    return "/superadmin"
  }
  if (session.roles.includes("admin")) {
    return "/admin"
  }

  if (effectiveAccessRoutes.includes("/dashboard")) return "/dashboard"
  return effectiveAccessRoutes[0] ?? "/dashboard"
}

export function canAccessRoute(session: Pick<AuthSession, "roles" | "accessRoutes" | "organization">, pathname: string) {
  const effectiveAccessRoutes = getEffectiveAccessRoutes(session)

  if (pathname === "/orderlanding" || pathname.startsWith("/orderlanding/")) {
    return false
  }

  if (pathname === "/planning" || pathname.startsWith("/planning/")) {
    return false
  }

  if (pathname === "/vehicledriver" || pathname.startsWith("/vehicledriver/")) {
    return false
  }

  if (
    session.roles.includes("super-admin") &&
    pathname === "/superadmin"
  ) {
    return true
  }

  if (session.roles.includes("admin") && pathname === "/admin") {
    return true
  }

  return effectiveAccessRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function canEditRoute(session: Pick<AuthSession, "roles" | "editRoutes" | "organization">, pathname: string) {
  const effectiveEditRoutes = getEffectiveEditRoutes(session)

  if (session.roles.includes("super-admin")) {
    return true
  }

  if (session.roles.includes("admin") && pathname === "/admin") {
    return true
  }

  if (session.roles.includes("vehicle-assignment") && (pathname === "/vehicleassignment" || pathname.startsWith("/vehicleassignment/"))) {
    return true
  }

  if (session.roles.includes("gate") && (pathname === "/gatepass" || pathname.startsWith("/gatepass/"))) {
    return true
  }

  return effectiveEditRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function getStoredSession(): AuthSession | null {
  return null
}

export function storeSession(session: AuthSession) {
  void session
}

export function clearStoredSession() {
  clearStoredSessionToken()
}
