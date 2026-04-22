// Mock data for the TMS application

export const kpiData = {
  activeTrips: 47,
  pendingOrders: 128,
  vehiclesAvailable: 23,
  activeGatePasses: 12,
  pendingApprovals: 5,
}

export const orders = [
  { id: "ORD-1001", customer: "Reliance Industries", source: "Mumbai", destination: "Delhi", weight: "12,500 kg", volume: "45 CBM", status: "Pending", createdAt: "2026-02-18" },
  { id: "ORD-1002", customer: "Tata Motors", source: "Pune", destination: "Chennai", weight: "8,200 kg", volume: "30 CBM", status: "Planned", createdAt: "2026-02-17" },
  { id: "ORD-1003", customer: "Hindustan Unilever", source: "Bangalore", destination: "Hyderabad", weight: "5,600 kg", volume: "22 CBM", status: "Dispatched", createdAt: "2026-02-16" },
  { id: "ORD-1004", customer: "Mahindra Logistics", source: "Kolkata", destination: "Guwahati", weight: "9,800 kg", volume: "38 CBM", status: "Pending", createdAt: "2026-02-15" },
  { id: "ORD-1005", customer: "Adani Ports", source: "Ahmedabad", destination: "Jaipur", weight: "15,000 kg", volume: "52 CBM", status: "Planned", createdAt: "2026-02-14" },
  { id: "ORD-1006", customer: "ITC Limited", source: "Delhi", destination: "Lucknow", weight: "7,300 kg", volume: "28 CBM", status: "Pending", createdAt: "2026-02-13" },
  { id: "ORD-1007", customer: "Asian Paints", source: "Mumbai", destination: "Nagpur", weight: "11,200 kg", volume: "41 CBM", status: "Dispatched", createdAt: "2026-02-12" },
  { id: "ORD-1008", customer: "Godrej Consumer", source: "Chennai", destination: "Bangalore", weight: "4,500 kg", volume: "18 CBM", status: "Pending", createdAt: "2026-02-11" },
]

export const unplannedOrders = orders.filter(o => o.status === "Pending")

export const availableFleet = [
  { id: "VH-201", type: "32ft MXL", capacity: "15,000 kg", location: "Mumbai Hub", status: "Available" },
  { id: "VH-205", type: "20ft SXL", capacity: "9,000 kg", location: "Delhi Hub", status: "Available" },
  { id: "VH-208", type: "Trailer", capacity: "25,000 kg", location: "Pune Hub", status: "Available" },
  { id: "VH-212", type: "14ft Canter", capacity: "4,000 kg", location: "Chennai Hub", status: "Available" },
  { id: "VH-215", type: "32ft MXL", capacity: "15,000 kg", location: "Bangalore Hub", status: "Available" },
]

export const activeTrips = [
  { id: "TRP-3001", vehicle: "VH-101", driver: "Rajesh Kumar", route: "Mumbai → Delhi", eta: "Feb 20, 14:30", status: "In Transit" },
  { id: "TRP-3002", vehicle: "VH-102", driver: "Sunil Patil", route: "Pune → Chennai", eta: "Feb 21, 08:00", status: "Loading" },
  { id: "TRP-3003", vehicle: "VH-103", driver: "Manoj Singh", route: "Delhi → Lucknow", eta: "Feb 19, 22:00", status: "In Transit" },
  { id: "TRP-3004", vehicle: "VH-104", driver: "Vikram Yadav", route: "Kolkata → Guwahati", eta: "Feb 22, 10:00", status: "In Transit" },
  { id: "TRP-3005", vehicle: "VH-105", driver: "Amit Sharma", route: "Bangalore → Hyderabad", eta: "Feb 19, 18:30", status: "Unloading" },
]

export const completedTrips = [
  { id: "TRP-2901", vehicle: "VH-110", driver: "Prem Nath", distance: "1,420 km", completedAt: "2026-02-18 16:45" },
  { id: "TRP-2902", vehicle: "VH-111", driver: "Ravi Teja", distance: "680 km", completedAt: "2026-02-17 12:30" },
  { id: "TRP-2903", vehicle: "VH-112", driver: "Dinesh Gupta", distance: "920 km", completedAt: "2026-02-16 09:15" },
  { id: "TRP-2904", vehicle: "VH-113", driver: "Gopal Reddy", distance: "1,100 km", completedAt: "2026-02-15 21:00" },
  { id: "TRP-2905", vehicle: "VH-114", driver: "Sanjay Mishra", distance: "540 km", completedAt: "2026-02-14 14:20" },
]

export const drivers = [
  { id: "DRV-401", name: "Rajesh Kumar", phone: "+91 98765 43210", license: "DL-1420110012345", tripsToday: 1, rating: 4.8, status: "On Trip" },
  { id: "DRV-402", name: "Sunil Patil", phone: "+91 87654 32109", license: "MH-1220100098765", tripsToday: 0, rating: 4.5, status: "Available" },
  { id: "DRV-403", name: "Manoj Singh", phone: "+91 76543 21098", license: "UP-5320090087654", tripsToday: 2, rating: 4.9, status: "On Trip" },
  { id: "DRV-404", name: "Vikram Yadav", phone: "+91 65432 10987", license: "WB-0620080076543", tripsToday: 1, rating: 4.3, status: "On Trip" },
  { id: "DRV-405", name: "Amit Sharma", phone: "+91 54321 09876", license: "KA-0120070065432", tripsToday: 1, rating: 4.7, status: "On Break" },
  { id: "DRV-406", name: "Prem Nath", phone: "+91 43210 98765", license: "TN-0920060054321", tripsToday: 0, rating: 4.6, status: "Available" },
]

export const fleet = [
  { id: "VH-101", type: "32ft MXL", capacity: "15,000 kg", location: "Mumbai → Delhi (NH-48)", lastService: "2026-01-15", status: "On Trip" },
  { id: "VH-102", type: "20ft SXL", capacity: "9,000 kg", location: "Pune Hub", lastService: "2026-02-01", status: "Loading" },
  { id: "VH-103", type: "Trailer", capacity: "25,000 kg", location: "Delhi → Lucknow (NH-24)", lastService: "2025-12-20", status: "On Trip" },
  { id: "VH-201", type: "32ft MXL", capacity: "15,000 kg", location: "Mumbai Hub", lastService: "2026-02-10", status: "Available" },
  { id: "VH-205", type: "20ft SXL", capacity: "9,000 kg", location: "Delhi Hub", lastService: "2026-01-28", status: "Available" },
  { id: "VH-208", type: "Trailer", capacity: "25,000 kg", location: "Pune Hub", lastService: "2026-02-05", status: "Available" },
  { id: "VH-212", type: "14ft Canter", capacity: "4,000 kg", location: "Chennai Hub", lastService: "2026-01-20", status: "Available" },
  { id: "VH-300", type: "32ft MXL", capacity: "15,000 kg", location: "Workshop", lastService: "2026-02-18", status: "Maintenance" },
]

export const invoices = [
  { id: "INV-6001", tripId: "TRP-2901", customer: "Reliance Industries", amount: "Rs. 1,45,000", status: "Paid", createdAt: "2026-02-18" },
  { id: "INV-6002", tripId: "TRP-2902", customer: "Tata Motors", amount: "Rs. 82,500", status: "Pending", createdAt: "2026-02-17" },
  { id: "INV-6003", tripId: "TRP-2903", customer: "Hindustan Unilever", amount: "Rs. 56,000", status: "Overdue", createdAt: "2026-02-10" },
  { id: "INV-6004", tripId: "TRP-2904", customer: "Mahindra Logistics", amount: "Rs. 1,10,000", status: "Paid", createdAt: "2026-02-15" },
  { id: "INV-6005", tripId: "TRP-2905", customer: "Adani Ports", amount: "Rs. 67,800", status: "Pending", createdAt: "2026-02-14" },
]

// Track Scale / Weighbridge data
export const trackScaleKpi = {
  todayWeighments: 84,
  totalInwardWeight: "1,24,350 kg",
  totalOutwardWeight: "98,720 kg",
  vehiclesInYard: 17,
}

export const recentWeighments = [
  { id: "WB-7001", vehicle: "VH-101", type: "Inward", grossWeight: "26,500 kg", tareWeight: "12,000 kg", netWeight: "14,500 kg", material: "Steel Coils", time: "2026-02-22 08:12", status: "Completed" },
  { id: "WB-7002", vehicle: "VH-208", type: "Outward", grossWeight: "18,200 kg", tareWeight: "8,500 kg", netWeight: "9,700 kg", material: "Cement Bags", time: "2026-02-22 08:35", status: "Completed" },
  { id: "WB-7003", vehicle: "VH-212", type: "Inward", grossWeight: "10,800 kg", tareWeight: "4,200 kg", netWeight: "6,600 kg", material: "FMCG Goods", time: "2026-02-22 09:01", status: "Completed" },
  { id: "WB-7004", vehicle: "VH-205", type: "Inward", grossWeight: "22,400 kg", tareWeight: "9,000 kg", netWeight: "13,400 kg", material: "Auto Parts", time: "2026-02-22 09:28", status: "In Progress" },
  { id: "WB-7005", vehicle: "VH-300", type: "Outward", grossWeight: "19,000 kg", tareWeight: "8,800 kg", netWeight: "10,200 kg", material: "Fertilizers", time: "2026-02-22 09:45", status: "Completed" },
  { id: "WB-7006", vehicle: "VH-201", type: "Inward", grossWeight: "28,100 kg", tareWeight: "12,500 kg", netWeight: "15,600 kg", material: "Iron Ore", time: "2026-02-22 10:02", status: "In Progress" },
]

export const hourlyWeighmentData = [
  { hour: "06:00", inward: 5, outward: 2 },
  { hour: "07:00", inward: 8, outward: 4 },
  { hour: "08:00", inward: 12, outward: 7 },
  { hour: "09:00", inward: 15, outward: 10 },
  { hour: "10:00", inward: 11, outward: 8 },
  { hour: "11:00", inward: 9, outward: 6 },
  { hour: "12:00", inward: 6, outward: 5 },
  { hour: "13:00", inward: 4, outward: 3 },
  { hour: "14:00", inward: 7, outward: 5 },
]

// Vehicle & Driver Master Data
export const vehicleDriverVehicles = [
  { VehicleID: "VH-101", VehicleNumber: "MH-04-AB-1234", VehicleType: "Truck", Ownership: "Own Vehicle", Capacity: "15 Ton", Status: "On Trip" },
  { VehicleID: "VH-102", VehicleNumber: "MH-12-CD-5678", VehicleType: "Mini Truck", Ownership: "3rd Party Vehicle", Capacity: "5 Ton", Status: "Available" },
  { VehicleID: "VH-103", VehicleNumber: "DL-01-EF-9012", VehicleType: "Container", Ownership: "Own Vehicle", Capacity: "25 Ton", Status: "On Trip" },
  { VehicleID: "VH-201", VehicleNumber: "MH-04-GH-3456", VehicleType: "Truck", Ownership: "Own Vehicle", Capacity: "15 Ton", Status: "Available" },
  { VehicleID: "VH-205", VehicleNumber: "DL-02-IJ-7890", VehicleType: "Bus", Ownership: "Own Vehicle", Capacity: "9 Ton", Status: "Available" },
  { VehicleID: "VH-208", VehicleNumber: "MH-14-KL-2345", VehicleType: "Container", Ownership: "3rd Party Vehicle", Capacity: "25 Ton", Status: "Available" },
  { VehicleID: "VH-212", VehicleNumber: "TN-09-MN-6789", VehicleType: "Mini Truck", Ownership: "Own Vehicle", Capacity: "4 Ton", Status: "Maintenance" },
  { VehicleID: "VH-300", VehicleNumber: "KA-01-OP-0123", VehicleType: "Truck", Ownership: "3rd Party Vehicle", Capacity: "15 Ton", Status: "Maintenance" },
  { VehicleID: "VH-215", VehicleNumber: "KA-03-QR-4567", VehicleType: "Office Pickup", Ownership: "Own Vehicle", Capacity: "1 Ton", Status: "Available" },
  { VehicleID: "VH-310", VehicleNumber: "AP-05-ST-8901", VehicleType: "Drop Car", Ownership: "Own Vehicle", Capacity: "0.5 Ton", Status: "Available" },
]

export const vehicleDriverDrivers = [
  { DriverID: "DRV-401", DriverName: "Rajesh Kumar", Mobile: "+91 98765 43210", AssignedVehicle: "VH-101", Status: "On Trip" },
  { DriverID: "DRV-402", DriverName: "Sunil Patil", Mobile: "+91 87654 32109", AssignedVehicle: "VH-102", Status: "Available" },
  { DriverID: "DRV-403", DriverName: "Manoj Singh", Mobile: "+91 76543 21098", AssignedVehicle: "VH-103", Status: "On Trip" },
  { DriverID: "DRV-404", DriverName: "Vikram Yadav", Mobile: "+91 65432 10987", AssignedVehicle: "—", Status: "Available" },
  { DriverID: "DRV-405", DriverName: "Amit Sharma", Mobile: "+91 54321 09876", AssignedVehicle: "—", Status: "On Break" },
  { DriverID: "DRV-406", DriverName: "Prem Nath", Mobile: "+91 43210 98765", AssignedVehicle: "VH-208", Status: "Available" },
  { DriverID: "DRV-407", DriverName: "Gopal Reddy", Mobile: "+91 32109 87654", AssignedVehicle: "—", Status: "Available" },
  { DriverID: "DRV-408", DriverName: "Sanjay Mishra", Mobile: "+91 21098 76543", AssignedVehicle: "VH-300", Status: "On Break" },
]

// Maintenance Data
export const maintenanceRecords = [
  { MaintenanceID: "MNT-801", VehicleNumber: "MH-04-AB-1234", MaintenanceType: "Routine Service", ServiceDate: "2026-01-15", NextDueDate: "2026-04-15", Cost: "Rs. 12,500", Workshop: "AutoCare Hub, Mumbai", Notes: "Full service with oil change" },
  { MaintenanceID: "MNT-802", VehicleNumber: "MH-12-CD-5678", MaintenanceType: "Tyre Change", ServiceDate: "2026-02-01", NextDueDate: "2026-08-01", Cost: "Rs. 28,000", Workshop: "TyrePlus, Pune", Notes: "All 4 tyres replaced" },
  { MaintenanceID: "MNT-803", VehicleNumber: "DL-01-EF-9012", MaintenanceType: "Brake Repair", ServiceDate: "2026-02-05", NextDueDate: "2026-05-05", Cost: "Rs. 8,200", Workshop: "BrakeMaster, Delhi", Notes: "Front brake pads replaced" },
  { MaintenanceID: "MNT-804", VehicleNumber: "MH-04-GH-3456", MaintenanceType: "Engine Repair", ServiceDate: "2026-02-10", NextDueDate: "2026-06-10", Cost: "Rs. 45,000", Workshop: "AutoCare Hub, Mumbai", Notes: "Turbo replacement" },
  { MaintenanceID: "MNT-805", VehicleNumber: "DL-02-IJ-7890", MaintenanceType: "Oil Change", ServiceDate: "2026-02-12", NextDueDate: "2026-05-12", Cost: "Rs. 5,500", Workshop: "QuickLube, Delhi", Notes: "Synthetic oil used" },
  { MaintenanceID: "MNT-806", VehicleNumber: "MH-14-KL-2345", MaintenanceType: "Cleaning & Wash", ServiceDate: "2026-02-14", NextDueDate: "2026-03-14", Cost: "Rs. 2,000", Workshop: "SparkleWash, Pune", Notes: "Deep interior cleaning" },
  { MaintenanceID: "MNT-807", VehicleNumber: "TN-09-MN-6789", MaintenanceType: "Battery Replacement", ServiceDate: "2026-02-16", NextDueDate: "2027-02-16", Cost: "Rs. 9,800", Workshop: "PowerCell, Chennai", Notes: "New 150AH battery" },
  { MaintenanceID: "MNT-808", VehicleNumber: "KA-01-OP-0123", MaintenanceType: "Accident Repair", ServiceDate: "2026-02-18", NextDueDate: "—", Cost: "Rs. 62,000", Workshop: "BodyShop Pro, Bangalore", Notes: "Front bumper and headlight" },
  { MaintenanceID: "MNT-809", VehicleNumber: "KA-03-QR-4567", MaintenanceType: "Routine Service", ServiceDate: "2026-02-20", NextDueDate: "2026-05-20", Cost: "Rs. 7,200", Workshop: "AutoCare Hub, Bangalore", Notes: "Standard check-up" },
  { MaintenanceID: "MNT-810", VehicleNumber: "AP-05-ST-8901", MaintenanceType: "Other Repair", ServiceDate: "2026-02-21", NextDueDate: "—", Cost: "Rs. 3,500", Workshop: "QuickFix, Hyderabad", Notes: "Wiper motor replaced" },
]

export const maintenanceCostByVehicle = [
  { vehicle: "MH-04-AB-1234", cost: 12500 },
  { vehicle: "MH-12-CD-5678", cost: 28000 },
  { vehicle: "DL-01-EF-9012", cost: 8200 },
  { vehicle: "MH-04-GH-3456", cost: 45000 },
  { vehicle: "DL-02-IJ-7890", cost: 5500 },
  { vehicle: "MH-14-KL-2345", cost: 2000 },
  { vehicle: "TN-09-MN-6789", cost: 9800 },
  { vehicle: "KA-01-OP-0123", cost: 62000 },
]

export const upcomingMaintenanceDueCount = 5

// Transport Route Map Data
export const transportRoutes = [
  { RouteID: "RT-001", RouteName: "Mumbai - Delhi Express", Start: "Mumbai", End: "Delhi", DistanceKM: 1420, EstTime: "22h 30m", VehicleType: "Truck", viaPoints: "Surat, Ahmedabad, Jaipur", color: "#1A73E8" },
  { RouteID: "RT-002", RouteName: "Pune - Chennai Corridor", Start: "Pune", End: "Chennai", DistanceKM: 1170, EstTime: "18h 45m", VehicleType: "Truck", viaPoints: "Solapur, Kurnool, Bangalore", color: "#10B981" },
  { RouteID: "RT-003", RouteName: "Delhi - Lucknow Fast", Start: "Delhi", End: "Lucknow", DistanceKM: 550, EstTime: "8h 15m", VehicleType: "Mini Truck", viaPoints: "Agra, Kanpur", color: "#F59E0B" },
  { RouteID: "RT-004", RouteName: "Kolkata - Guwahati Link", Start: "Kolkata", End: "Guwahati", DistanceKM: 980, EstTime: "16h 00m", VehicleType: "Truck", viaPoints: "Siliguri, Cooch Behar", color: "#8B5CF6" },
  { RouteID: "RT-005", RouteName: "Bangalore - Hyderabad Shuttle", Start: "Bangalore", End: "Hyderabad", DistanceKM: 570, EstTime: "9h 00m", VehicleType: "Bus", viaPoints: "Anantapur, Kurnool", color: "#EC4899" },
  { RouteID: "RT-006", RouteName: "Ahmedabad - Jaipur Route", Start: "Ahmedabad", End: "Jaipur", DistanceKM: 670, EstTime: "10h 30m", VehicleType: "Pickup", viaPoints: "Udaipur", color: "#06B6D4" },
  { RouteID: "RT-007", RouteName: "Mumbai - Nagpur Intra-State", Start: "Mumbai", End: "Nagpur", DistanceKM: 840, EstTime: "13h 00m", VehicleType: "Truck", viaPoints: "Nashik, Aurangabad", color: "#F97316" },
  { RouteID: "RT-008", RouteName: "Chennai - Bangalore Intercity", Start: "Chennai", End: "Bangalore", DistanceKM: 350, EstTime: "5h 30m", VehicleType: "Drop Car", viaPoints: "Vellore, Krishnagiri", color: "#EF4444" },
]

// Simulated route point coordinates for the map visualization (normalized 0-100 grid)
export const routeMapPoints: Record<string, { x: number; y: number; label: string }[]> = {
  "RT-001": [
    { x: 18, y: 55, label: "Mumbai" },
    { x: 20, y: 48, label: "Surat" },
    { x: 22, y: 40, label: "Ahmedabad" },
    { x: 32, y: 28, label: "Jaipur" },
    { x: 40, y: 22, label: "Delhi" },
  ],
  "RT-002": [
    { x: 22, y: 55, label: "Pune" },
    { x: 28, y: 60, label: "Solapur" },
    { x: 38, y: 68, label: "Kurnool" },
    { x: 42, y: 72, label: "Bangalore" },
    { x: 50, y: 72, label: "Chennai" },
  ],
  "RT-003": [
    { x: 40, y: 22, label: "Delhi" },
    { x: 44, y: 30, label: "Agra" },
    { x: 50, y: 35, label: "Kanpur" },
    { x: 55, y: 30, label: "Lucknow" },
  ],
  "RT-004": [
    { x: 65, y: 40, label: "Kolkata" },
    { x: 63, y: 30, label: "Siliguri" },
    { x: 68, y: 25, label: "Cooch Behar" },
    { x: 78, y: 28, label: "Guwahati" },
  ],
  "RT-005": [
    { x: 42, y: 72, label: "Bangalore" },
    { x: 40, y: 65, label: "Anantapur" },
    { x: 38, y: 60, label: "Kurnool" },
    { x: 42, y: 55, label: "Hyderabad" },
  ],
  "RT-006": [
    { x: 22, y: 40, label: "Ahmedabad" },
    { x: 26, y: 35, label: "Udaipur" },
    { x: 32, y: 28, label: "Jaipur" },
  ],
  "RT-007": [
    { x: 18, y: 55, label: "Mumbai" },
    { x: 22, y: 50, label: "Nashik" },
    { x: 30, y: 48, label: "Aurangabad" },
    { x: 42, y: 45, label: "Nagpur" },
  ],
  "RT-008": [
    { x: 50, y: 72, label: "Chennai" },
    { x: 48, y: 70, label: "Vellore" },
    { x: 45, y: 72, label: "Krishnagiri" },
    { x: 42, y: 72, label: "Bangalore" },
  ],
}

export const monthlyTripsData = [
  { month: "Sep", trips: 320 },
  { month: "Oct", trips: 380 },
  { month: "Nov", trips: 410 },
  { month: "Dec", trips: 360 },
  { month: "Jan", trips: 450 },
  { month: "Feb", trips: 420 },
]

export const fleetUtilData = [
  { type: "32ft MXL", utilization: 85 },
  { type: "20ft SXL", utilization: 72 },
  { type: "Trailer", utilization: 91 },
  { type: "14ft Canter", utilization: 68 },
  { type: "Container", utilization: 78 },
]
