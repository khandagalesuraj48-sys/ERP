// ===========================================================================
// MILESTONE ERP — Domain Models & Schema Definitions
// Construction Machinery, Mechanical, Store, Inventory & Asset ERP
// ===========================================================================

export type MeterType = "KM" | "HOUR";

export type MeterConfiguration = "single_km" | "single_hour" | "dual" | "multi_engine";

export type Ownership = "own" | "rental";

export type RegistrationStatus = "registered" | "unregistered";

export type MachineryStatus = "active" | "under_repair" | "inactive" | "archived";

export type EngineConfig = "single" | "multi";

export type MachineryCategory =
  | "Earthmoving"
  | "Road Construction"
  | "Concrete"
  | "Haulage / Transport"
  | "Lifting"
  | "Utility / Support"
  | "Concrete & Haulage"
  | "Compaction"
  | "Material Handling"
  | "Power & Utility"
  | "Light Commercial"
  | "Other";

export type FuelType = "Diesel" | "Petrol" | "CNG" | "Electric" | "Other";

export const UNIVERSAL_CONSTRUCTION_TYPES: Record<string, string[]> = {
  "Earthmoving": [
    "Excavator",
    "Mini Excavator",
    "Backhoe Loader",
    "Wheel Loader",
    "Skid Steer Loader",
    "Motor Grader",
    "Bulldozer",
    "Crawler Dozer",
    "Soil Compactor",
    "Rock Breaker",
    "Trencher",
  ],
  "Road Construction": [
    "Static Road Roller",
    "Vibratory Roller",
    "Tandem Roller",
    "Pneumatic Tyre Roller",
    "Combination Roller",
    "Milling Machine",
    "Asphalt Paver",
    "Sensor Paver",
    "Bitumen Sprayer",
    "Bitumen Distributor",
    "Road Sweeper",
    "Broomer",
    "Chip Spreader",
    "Cold Recycler",
  ],
  "Concrete": [
    "Transit Mixer",
    "Concrete Batching Plant",
    "Mobile Batching Plant",
    "Concrete Pump",
    "Boom Pump",
    "Concrete Vibrator",
    "Crusher",
    "Screening Plant",
  ],
  "Haulage / Transport": [
    "Tipper",
    "Dumper",
    "Tractor",
    "Trailer",
    "Water Tanker",
    "Bitumen Tanker",
    "Fuel Bowser",
    "Pickup",
    "Service Van",
    "Truck",
  ],
  "Lifting": [
    "Mobile Crane",
    "Crawler Crane",
    "Tower Crane",
    "Hydra",
    "Forklift",
    "Telehandler",
  ],
  "Utility / Support": [
    "Generator",
    "Air Compressor",
    "Welding Machine",
    "Dewatering Pump",
    "Light Tower",
    "Other Construction Equipment",
  ],
  "Other": [
    "Other Construction Equipment",
  ],
};

export const ALL_CONSTRUCTION_MACHINERY_TYPES: string[] = Object.values(UNIVERSAL_CONSTRUCTION_TYPES).flat();

/**
 * Universal identification helper:
 * Registered: "Machinery Name — Registration Number"
 * Unregistered: "Machinery Name"
 */
export function getMachineryDisplayName(m: {
  machineryName: string;
  registrationNo?: string | null;
  registrationStatus?: string | null;
  assetCode?: string | null;
}): string {
  if (!m) return "Unknown Machine";
  const name = m.machineryName || "Equipment";
  if (m.registrationStatus === "unregistered") {
    return name;
  }
  if (m.registrationNo && m.registrationNo.trim()) {
    return `${name} — ${m.registrationNo.trim()}`;
  }
  return name;
}

// ---------------------------------------------------------------------------
// 1. Projects & Sites
// ---------------------------------------------------------------------------
export type ProjectStatus = "bidding" | "active" | "on_hold" | "completed" | "archived";

export interface Project {
  id: string;
  code: string;
  name: string;
  clientName?: string;
  projectType?: string;
  location?: string;
  status: ProjectStatus;
  startDate?: string;
  targetCompletionDate?: string;
  expectedEndDate?: string;
  actualCompletionDate?: string;
  projectManager?: string;
  description?: string;
  remarks?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Site {
  id: string;
  projectId: string;
  code: string;
  name: string;
  address?: string;
  chainageLocation?: string;
  inChargePerson?: string;
  contactPhone?: string;
  hasStore?: boolean;
  isActive: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 2. Vendors (Workshops, OEM Dealers, Suppliers & Service Providers)
// ---------------------------------------------------------------------------
export type VendorType =
  | "Machinery Rental"
  | "Own Machinery"
  | "Spare Parts"
  | "OEM / Dealer"
  | "Workshop"
  | "Fuel Agency"
  | "Lubricants"
  | "workshop"
  | "oem_dealer"
  | "spare_parts"
  | "fuel_agency"
  | "lubricants"
  | "tyre_supplier"
  | "battery_supplier"
  | "electrical"
  | "fabricator"
  | "general_supplier"
  | "other"
  | "Other";

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  vendorType: VendorType | string;
  contactPerson?: string;
  phone?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  paymentTerms?: string;
  creditDays?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  isActive: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 3. Machinery & Engines
// ---------------------------------------------------------------------------
export interface Machinery {
  id: string;
  assetCode: string; // e.g. MCH-00001
  registrationNo?: string | null; // Nullable for non-road equipment
  machineryName: string;
  machineryType: string;
  category: MachineryCategory | string;
  make: string;
  model: string;
  yearOfManufacture?: number | null;
  capacity?: string | null;
  fuelType: FuelType | string;
  meterType: MeterType;
  meterConfiguration?: MeterConfiguration;
  ownership?: Ownership;
  vendorId?: string | null;
  vendorName?: string | null;
  registrationStatus?: RegistrationStatus;
  engineConfig?: EngineConfig;
  fuelTankCapacity?: number | null;
  standardFuelEfficiency?: number | null; // KM/L for KM, L/Hour for HOUR
  currentProjectId?: string | null;
  currentSiteId?: string | null;
  projectId?: string | null; // Alias for currentProjectId
  siteId?: string | null; // Alias for currentSiteId
  department: string;
  departmentId?: string | null;
  operatorId?: string | null;
  openingReading: number;
  currentReading: number;
  purchaseDate?: string | null;
  insuranceExpiry?: string | null;
  insuranceDocNo?: string | null;
  pucExpiry?: string | null;
  pucDocNo?: string | null;
  fitnessExpiry?: string | null;
  fitnessDocNo?: string | null;
  permitExpiry?: string | null;
  permitDocNo?: string | null;
  roadTaxExpiry?: string | null;
  roadTaxDocNo?: string | null;
  status: MachineryStatus;
  remarks?: string | null;
  engines?: Engine[];
  fuelTanks?: FuelTank[];
  createdAt: string;
  updatedAt: string;
}

export type EngineType = "main" | "auxiliary" | "drum" | "pump" | "hydraulic" | "other";
export type EngineStatus = "active" | "under_repair" | "inactive" | "replaced";

export interface Engine {
  id: string;
  machineryId: string;
  engineCode: string; // e.g. ENG-001
  engineName: string; // e.g. Main Chassis Engine, Mixer Drum Auxiliary Engine
  engineNumber?: string;
  serialNumber?: string;
  engineType: EngineType | string;
  make?: string;
  model?: string;
  fuelType: FuelType | string;
  meterType: MeterType;
  openingReading: number;
  currentReading: number;
  standardFuelEfficiency?: number | null; // Standard L/Hour
  installationDate?: string;
  warrantyExpiry?: string;
  status: EngineStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuelTank {
  id: string;
  machineryId: string;
  tankName: string;
  tankNumber?: string;
  capacityLitres: number;
  fuelType: FuelType | string;
  status: "active" | "inactive" | "damaged";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 4. Daily Log Book
// ---------------------------------------------------------------------------
export type LogBookStatus = "draft" | "approved" | "cancelled";
export type LogBookShift = "Day" | "Night";

export interface LogBook {
  id: string;
  logNo: string;
  date: string;
  shift?: LogBookShift | null;
  machineryId: string;
  engineId?: string | null;
  projectId?: string | null;
  siteId?: string | null;
  openingReading: number;
  closingReading: number;
  totalKmHours: number;
  isMeterReset?: boolean;
  dieselIssuedLitres?: number;
  startTime?: string | null;
  endTime?: string | null;
  workingHours?: number | null;
  breakdownHours?: number | null;
  operatorName?: string | null;
  trips?: number;
  workDescription?: string | null;
  remarks?: string | null;
  status: LogBookStatus;
  createdAt: string;
  updatedAt: string;
}

export type EfficiencyStatus = "Within Standard" | "Higher Consumption" | "Lower Consumption" | "No Standard Set" | "No Consumption Data";

export interface MachineryEfficiencyRecord {
  machineryId: string;
  machineryName: string;
  assetCode: string;
  registrationNo?: string | null;
  meterType: MeterType;
  engineId?: string | null;
  engineName?: string | null;
  fromDate: string;
  toDate: string;
  firstOpeningReading: number;
  lastClosingReading: number;
  totalKmHours: number;
  totalDieselLitres: number;
  actualAverage: number; // KM/L for KM, L/Hour for HOUR
  consumptionLPer100Km?: number; // only for KM: (Diesel / KM) * 100
  standardFuelEfficiency?: number | null;
  variance?: number | null;
  variancePercentage?: number | null;
  status: EfficiencyStatus;
  logEntriesCount: number;
  fuelIssuesCount: number;
}

export type ConsumptionStatus =
  | "Normal"
  | "Review Required"
  | "Negative Book Balance"
  | "Insufficient Data";

export interface DailyFuelConsumptionRecord {
  id: string;
  date: string;
  machineryId: string;
  assetCode: string;
  machineryName: string;
  registrationNo?: string | null;
  displayName: string;
  engineId?: string | null;
  engineName?: string | null;
  meterType: MeterType;
  openingReading: number;
  closingReading: number;
  run: number; // KM or Hours
  totalRun: number; // alias for run
  standardEfficiency: number | null; // KM/L for KM, L/Hour for HOUR
  standardFuelEfficiency: number; // alias
  openingTheoreticalBalance: number;
  openingFuelBalance: number; // alias
  fuelIssued: number;
  fuelIssuedToday: number; // alias
  theoreticalConsumption: number;
  closingTheoreticalBalance: number;
  closingFuelBalance: number; // alias
  status: ConsumptionStatus;
  efficiencyStatus: EfficiencyStatus;
  projectId?: string | null;
  siteId?: string | null;
}

export interface TheoreticalFuelBalance {
  machineryId: string;
  engineId?: string | null;
  asOfDate: string;
  openingBalance: number;
  fuelIssued: number;
  totalFuelIssuedLitres: number; // alias
  theoreticalConsumption: number;
  totalConsumptionLitres: number; // alias
  closingBalance: number;
  theoreticalClosingBalanceLitres: number; // alias
  status: ConsumptionStatus;
  disclaimer: string;
}

export interface ComplianceAlertItem {
  id: string;
  machineryId: string;
  machineryName: string;
  registrationNo?: string | null;
  displayName: string;
  documentType: "insurance" | "puc" | "fitness" | "permit" | "road_tax";
  label: string;
  documentNo?: string | null;
  expiryDate: string;
  daysRemaining: number;
  status: "valid" | "expiring" | "expired";
  message: string;
}

// ---------------------------------------------------------------------------
// 5. Fuel Issue (Direct Issue to Machine — Single / Multi-Engine)
// ---------------------------------------------------------------------------
export type FuelSource = "Site Bowser" | "Retail Pump" | "Mobile Tanker" | "Barrel" | "Other";
export type FuelIssueStatus = "confirmed" | "cancelled";
export type FuelAllocationMode = "shared" | "engine_wise";

export interface FuelIssueAllocation {
  id?: string;
  fuelIssueId?: string;
  engineId: string;
  engineName?: string;
  allocatedLitres: number;
  remarks?: string;
}

export interface FuelIssue {
  id: string;
  issueNo: string;
  issueDate: string;
  issueTime?: string | null;
  machineryId: string;
  tankId?: string | null;
  engineId?: string | null;
  allocationMode: FuelAllocationMode;
  allocations?: FuelIssueAllocation[];
  projectId?: string | null;
  siteId?: string | null;
  meterReading: number;
  isMeterReset: boolean;
  fuelType: FuelType | string;
  quantityLitres: number;
  ratePerLitre: number;
  amount: number;
  fuelSource: FuelSource | string;
  slipReference?: string | null;
  operatorName?: string | null;
  issuedBy?: string | null;
  remarks?: string | null;
  status: FuelIssueStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 6. Breakdowns & Maintenance Records
// ---------------------------------------------------------------------------
export type BreakdownPriority = "low" | "medium" | "high" | "critical";
export type BreakdownStatus =
  | "open"
  | "under_inspection"
  | "waiting_for_parts"
  | "under_repair"
  | "completed"
  | "cancelled";

export interface Breakdown {
  id: string;
  breakdownNo: string;
  breakdownDate: string;
  date?: string;
  breakdownTime?: string | null;
  machineryId: string;
  engineId?: string | null;
  currentReading: number;
  projectId?: string | null;
  siteId?: string | null;
  reportedBy: string;
  problemDescription: string;
  priority: BreakdownPriority;
  status: BreakdownStatus;
  resolutionDate?: string | null;
  resolutionNotes?: string | null;
  downtimeHours?: number | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType =
  | "preventive"
  | "breakdown"
  | "corrective"
  | "service"
  | "inspection";

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface MaintenanceRecord {
  id: string;
  maintenanceNo: string;
  machineryId: string;
  engineId?: string | null;
  breakdownId?: string | null;
  serviceDate: string;
  date?: string;
  currentReading: number;
  maintenanceType: MaintenanceType;
  complaint?: string | null;
  diagnosis?: string | null;
  workPerformed?: string | null;
  requiredParts?: string | null;
  vendorId?: string | null;
  quotationReference?: string | null;
  estimatedCost: number;
  actualCost: number;
  partsCost: number;
  labourCost: number;
  status: MaintenanceStatus;
  workStartDate?: string | null;
  completionDate?: string | null;
  nextServiceReading?: number | null;
  nextServiceDate?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. Store Master & Item Master
// ---------------------------------------------------------------------------
export type StoreType = "mechanical" | "general" | "electrical" | "spare_parts" | "site_store" | "other";

export interface Store {
  id: string;
  projectId: string;
  siteId: string;
  storeCode: string; // e.g. STR-MUM-01
  storeName: string;
  storeType: StoreType;
  inChargePerson?: string;
  contactPhone?: string;
  location?: string;
  isActive: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ItemType =
  | "spare_part"
  | "consumable"
  | "lubricant"
  | "battery"
  | "tyre"
  | "electrical"
  | "hydraulic"
  | "engine_part"
  | "mechanical_part"
  | "tool"
  | "safety_item"
  | "welding"
  | "general_material"
  | "asset"
  | "other";

export interface Item {
  id: string;
  itemCode: string; // e.g. ITM-0001
  itemName: string;
  category: string;
  subCategory?: string;
  itemType: ItemType;
  uom: string; // Nos, Litre, Kg, Meter, Set, Box, Pair
  hsnSac?: string;
  gstRatePercent: number;
  minimumStock: number;
  reorderLevel: number;
  maximumStock?: number;
  preferredVendorId?: string;
  serialTracking: boolean;
  batchTracking: boolean;
  expiryTracking: boolean;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 8. Material Inward (GRN)
// ---------------------------------------------------------------------------
export type InwardStatus = "draft" | "confirmed" | "cancelled";

export interface MaterialInwardItem {
  id?: string;
  materialInwardId?: string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  quantity: number;
  uom: string;
  rate: number;
  taxableAmount?: number;
  gstPercent: number;
  gstAmount?: number;
  totalAmount?: number;
  batchNo?: string;
  serialNo?: string;
  expiryDate?: string;
  remarks?: string;
}

export interface MaterialInward {
  id: string;
  grnNo: string; // GRN-YYYYMMDD-00001
  grnDate: string;
  projectId: string;
  siteId: string;
  storeId: string;
  vendorId: string;
  vendorName?: string;
  poReference?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  challanNo?: string;
  receivedBy?: string;
  approvedBy?: string;
  status: InwardStatus;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  remarks?: string;
  items: MaterialInwardItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 9. Material Outward (Issue Slip)
// ---------------------------------------------------------------------------
export type OutwardStatus = "draft" | "confirmed" | "cancelled";
export type OutwardPurpose =
  | "Machinery Repair"
  | "Preventive Maintenance"
  | "Breakdown"
  | "Site Consumption"
  | "Construction Work"
  | "Electrical Work"
  | "General Consumption"
  | "Other";

export interface MaterialOutwardItem {
  id?: string;
  materialOutwardId?: string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  quantity: number;
  uom: string;
  rate?: number;
  totalCost?: number;
  remarks?: string;
}

export interface MaterialOutward {
  id: string;
  issueNo: string; // ISS-YYYYMMDD-00001
  issueDate: string;
  projectId: string;
  siteId: string;
  storeId: string;
  issuedTo: string;
  department?: string;
  machineryId?: string | null;
  engineId?: string | null;
  maintenanceId?: string | null;
  breakdownId?: string | null;
  purpose: OutwardPurpose;
  approvedBy?: string;
  issuedBy?: string;
  status: OutwardStatus;
  remarks?: string;
  items: MaterialOutwardItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 10. Stock Transfers, Returns & Adjustments
// ---------------------------------------------------------------------------
export type TransferStatus = "draft" | "in_transit" | "received" | "cancelled";

export interface StockTransferItem {
  id?: string;
  stockTransferId?: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  uom: string;
  remarks?: string;
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  transferDate: string;
  fromProjectId: string;
  fromSiteId: string;
  fromStoreId: string;
  toProjectId: string;
  toSiteId: string;
  toStoreId: string;
  issuedBy?: string;
  receivedBy?: string;
  status: TransferStatus;
  reason?: string;
  remarks?: string;
  items: StockTransferItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialReturnItem {
  id?: string;
  materialReturnId?: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  uom: string;
  remarks?: string;
}

export interface MaterialReturn {
  id: string;
  returnNo: string;
  returnDate: string;
  returnType: "store_return" | "vendor_return";
  projectId: string;
  siteId: string;
  storeId: string;
  vendorId?: string;
  vendorName?: string;
  machineryId?: string;
  returnedBy?: string;
  approvedBy?: string;
  originalReference?: string;
  status: "draft" | "confirmed" | "cancelled";
  reason?: string;
  remarks?: string;
  items: MaterialReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAdjustmentItem {
  id?: string;
  stockAdjustmentId?: string;
  itemId: string;
  itemName?: string;
  adjustmentType: "increase" | "decrease";
  quantity: number;
  uom: string;
  remarks?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  adjustmentDate: string;
  projectId: string;
  siteId: string;
  storeId: string;
  reason: "Physical Count Difference" | "Damage" | "Loss" | "Found Material" | "Data Correction" | "Other";
  status: "draft" | "confirmed" | "cancelled";
  approvedBy?: string;
  remarks?: string;
  items: StockAdjustmentItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 11. Atomic Stock Transactions & Current Stock Ledger
// ---------------------------------------------------------------------------
export type StockTransactionType =
  | "opening"
  | "inward"
  | "outward"
  | "transfer_in"
  | "transfer_out"
  | "return_in"
  | "return_out"
  | "adjustment_pos"
  | "adjustment_neg";

export interface StockTransaction {
  id: string;
  projectId: string;
  siteId: string;
  storeId: string;
  itemId: string;
  transactionType: StockTransactionType;
  referenceTable: string;
  referenceId: string;
  referenceNo: string;
  quantity: number;
  uom: string;
  unitRate: number;
  transactionDate: string;
  createdAt: string;
}

export interface StoreStockSummary {
  storeId: string;
  storeName: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  uom: string;
  availableQuantity: number;
  minimumStock: number;
  reorderLevel: number;
  isLowStock: boolean;
}

// ---------------------------------------------------------------------------
// 12. Asset Master & Transfers
// ---------------------------------------------------------------------------
export type AssetStatus =
  | "active"
  | "under_repair"
  | "idle"
  | "transferred"
  | "sold"
  | "scrapped"
  | "archived";

export interface Asset {
  id: string;
  assetCode: string; // AST-0001
  assetName: string;
  category: string;
  serialNumber?: string;
  make?: string;
  model?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  vendorId?: string;
  projectId: string;
  siteId: string;
  location?: string;
  department?: string;
  warrantyExpiry?: string;
  amcDetails?: string;
  status: AssetStatus;
  currentCondition: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  fromProjectId: string;
  fromSiteId: string;
  toProjectId: string;
  toSiteId: string;
  transferDate: string;
  transferredBy?: string;
  status: "in_transit" | "completed" | "cancelled";
  remarks?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// 13. Attachments (Polymorphic Documents)
// ---------------------------------------------------------------------------
export type EntityType =
  | "machinery"
  | "engine"
  | "breakdown"
  | "maintenance"
  | "compliance"
  | "fuel"
  | "project"
  | "site"
  | "vendor"
  | "asset"
  | "item"
  | "grn"
  | "outward";

export type AttachmentDocType =
  | "insurance"
  | "puc"
  | "fitness"
  | "road_tax"
  | "quotation"
  | "invoice"
  | "repair_photo"
  | "delivery_challan"
  | "warranty"
  | "manual"
  | "general";

export interface Attachment {
  id: string;
  entityType: EntityType;
  entityId: string;
  documentType: AttachmentDocType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  expiryDate?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
}

export type DocumentType = AttachmentDocType;
export type ComplianceStatus = "valid" | "expiring" | "expired";

export interface ComplianceDoc {
  id: string;
  machineryId: string;
  type: DocumentType;
  documentNo: string;
  issueDate?: string;
  expiryDate: string;
  status: ComplianceStatus;
  fileName?: string;
  fileUrl?: string;
}

// ---------------------------------------------------------------------------
// 14. Dashboard KPIs & Reports Data Types
// ---------------------------------------------------------------------------
export interface DashboardStats {
  totalMachinery: number;
  activeMachinery: number;
  underRepairMachinery: number;
  inactiveMachinery: number;
  openBreakdowns: number;
  todayFuelLitres: number;
  todayFuelAmount: number;
  monthFuelLitres: number;
  monthFuelAmount: number;
  monthMaintenanceCost: number;
  totalMaintenanceCost: number;
  expiringDocumentsCount: number;
  expiredDocumentsCount: number;
  totalItems: number;
  totalStockValue: number;
  lowStockItemsCount: number;
  totalStores: number;
  totalAssets: number;
  activeAssets: number;
  assetsUnderRepair: number;
  todayInwardAmount: number;
  todayInwardCount: number;
  todayOutwardAmount: number;
  todayOutwardCount: number;
  monthMaterialConsumption: number;
  fuelTrend: { date: string; litres: number; amount: number }[];
  utilizationHours: { machine: string; hours: number; trips: number }[];
  maintenanceCostsByCategory: { category: string; cost: number }[];
  breakdownsByStatus: { status: string; count: number }[];
}

export interface FuelEfficiencyRecord {
  machineryId: string;
  assetCode: string;
  machineryName: string;
  meterType: MeterType;
  totalUnits: number;
  totalLitres: number;
  totalAmount: number;
  efficiency: number;
  lPer100Km?: number;
}

// ---------------------------------------------------------------------------
// User & Auth Context
// ---------------------------------------------------------------------------
export type UserRole =
  | "SUPER_ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "STORE_KEEPER"
  | "MAINTENANCE_HEAD"
  | "Administrator"
  | "Viewer";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}
