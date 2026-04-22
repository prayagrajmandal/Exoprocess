"use client"

import { availableFleet } from "@/lib/mock-data"

export type TruckSize = "Small Truck" | "Medium Truck" | "Big Truck"
export const TRUCK_SIZE_OPTIONS: TruckSize[] = ["Small Truck", "Medium Truck", "Big Truck"]

export interface VehicleAssignment {
  id: string
  gatePassId: string
  gatePassStatus: "Pending" | "Approved" | "Rejected"
  deliveryId: string
  customer: string
  source: string
  destination: string
  quantityKg: number
  loadType: string
  recommendedTruckSize: string
  assignedVehicleId: string
  assignedVehicleType: string
  assignedVehicleCapacity: string
  assignedDriverId?: string
  assignedDriverName?: string
  assignedAssistantId?: string
  assignedAssistantName?: string
  assignedBy: string
  assignedByUserId: string
  organization: string
  createdAt: string
  notes: string
}

export const VEHICLE_ASSIGNMENTS_STORAGE_KEY = "vehicle-management-vehicle-assignments"
export const VEHICLE_ASSIGNMENTS_EVENT_NAME = "vehicle-management-vehicle-assignments-change"

export const defaultVehicleAssignments: VehicleAssignment[] = [
  {
    id: "VA-101",
    gatePassId: "GP-901",
    gatePassStatus: "Approved",
    deliveryId: "DLV-9001",
    customer: "Reliance Industries",
    source: "Mumbai",
    destination: "Delhi",
    quantityKg: 3200,
    loadType: "FMCG cartons",
    recommendedTruckSize: "Small Truck",
    assignedVehicleId: "VH-212",
    assignedVehicleType: "14ft Canter",
    assignedVehicleCapacity: "4,000 kg",
    assignedDriverId: "DRV-401",
    assignedDriverName: "Driver One",
    assignedAssistantId: "AST-401",
    assignedAssistantName: "Assistant One",
    assignedBy: "Head Office",
    assignedByUserId: "heado",
    organization: "Pro",
    createdAt: "2026-03-16 09:15",
    notes: "Small quantity delivery. Gate team can release the assigned truck.",
  },
  {
    id: "VA-102",
    gatePassId: "GP-902",
    gatePassStatus: "Pending",
    deliveryId: "DLV-9002",
    customer: "Adani Ports",
    source: "Pune",
    destination: "Jaipur",
    quantityKg: 14800,
    loadType: "Bulk material",
    recommendedTruckSize: "Big Truck",
    assignedVehicleId: "VH-201",
    assignedVehicleType: "32ft MXL",
    assignedVehicleCapacity: "15,000 kg",
    assignedDriverId: "DRV-402",
    assignedDriverName: "Driver Two",
    assignedAssistantId: "AST-402",
    assignedAssistantName: "Assistant Two",
    assignedBy: "Administrator",
    assignedByUserId: "admin",
    organization: "Pro",
    createdAt: "2026-03-16 11:40",
    notes: "Large quantity shipment. Big truck assigned for full-load dispatch.",
  },
]

function emitVehicleAssignmentsEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(VEHICLE_ASSIGNMENTS_EVENT_NAME))
  }
}

export function parseCapacityKg(capacity: string) {
  const digitsOnly = capacity.replace(/,/g, "").match(/\d+/)
  return digitsOnly ? Number(digitsOnly[0]) : 0
}

export function getRecommendedTruckSize(quantityKg: number): TruckSize {
  if (quantityKg <= 4000) {
    return "Small Truck"
  }

  if (quantityKg <= 10000) {
    return "Medium Truck"
  }

  return "Big Truck"
}

function matchesTruckSize(capacityKg: number, truckSize: TruckSize) {
  if (truckSize === "Small Truck") {
    return capacityKg <= 4000
  }

  if (truckSize === "Medium Truck") {
    return capacityKg > 4000 && capacityKg <= 10000
  }

  return capacityKg > 10000
}

export function getAvailableVehiclesForTruckSize(quantityKg: number, truckSize: TruckSize) {
  const matchingVehicles = availableFleet
    .filter((vehicle) => parseCapacityKg(vehicle.capacity) >= quantityKg)
    .filter((vehicle) => matchesTruckSize(parseCapacityKg(vehicle.capacity), truckSize))
    .sort((left, right) => parseCapacityKg(left.capacity) - parseCapacityKg(right.capacity))

  if (matchingVehicles.length > 0) {
    return matchingVehicles
  }

  return []
}

export function getAvailableVehiclesForQuantity(quantityKg: number) {
  const recommendedTruckSize = getRecommendedTruckSize(quantityKg)

  const matchingVehicles = getAvailableVehiclesForTruckSize(quantityKg, recommendedTruckSize)

  if (matchingVehicles.length > 0) {
    return matchingVehicles
  }

  return availableFleet
    .filter((vehicle) => parseCapacityKg(vehicle.capacity) >= quantityKg)
    .sort((left, right) => parseCapacityKg(left.capacity) - parseCapacityKg(right.capacity))
}

export function getVehicleAssignments() {
  if (typeof window === "undefined") {
    return defaultVehicleAssignments
  }

  const rawAssignments = window.localStorage.getItem(VEHICLE_ASSIGNMENTS_STORAGE_KEY)
  if (!rawAssignments) {
    return defaultVehicleAssignments
  }

  try {
    const parsedAssignments = JSON.parse(rawAssignments) as VehicleAssignment[]
    return parsedAssignments.length > 0 ? parsedAssignments : defaultVehicleAssignments
  } catch {
    window.localStorage.removeItem(VEHICLE_ASSIGNMENTS_STORAGE_KEY)
    return defaultVehicleAssignments
  }
}

export function storeVehicleAssignments(assignments: VehicleAssignment[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(VEHICLE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments))
  emitVehicleAssignmentsEvent()
}
