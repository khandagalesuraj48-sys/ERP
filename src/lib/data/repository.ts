/**
 * MILESTONE ERP — Data Repository Layer
 * Construction Machinery & Mechanical ERP
 *
 * Full CRUD & Aggregations across all 9 Phase-1 tables:
 * 1. projects
 * 2. sites
 * 3. vendors
 * 4. machinery
 * 5. fuel_issues
 * 6. log_books
 * 7. breakdowns
 * 8. maintenance_records
 * 9. attachments
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Machinery,
  LogBook,
  FuelIssue,
  Breakdown,
  MaintenanceRecord,
  Attachment,
  ComplianceDoc,
  Project,
  Site,
  Vendor,
  DashboardStats,
  FuelEfficiencyRecord,
  CurrentUser,
  MeterType,
  Engine,
  FuelTank,
  Store,
  Item,
  MaterialInward,
  MaterialInwardItem,
  MaterialOutward,
  MaterialOutwardItem,
  StockTransfer,
  StockTransferItem,
  TransferStatus,
  MaterialReturn,
  MaterialReturnItem,
  StockAdjustment,
  StockAdjustmentItem,
  StockTransaction,
  StoreStockSummary,
  Asset,
  AssetTransfer,
  MachineryEfficiencyRecord,
  EfficiencyStatus,
  DailyFuelConsumptionRecord,
  ConsumptionStatus,
  TheoreticalFuelBalance,
  FuelIssueAllocation,
} from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

export const isDatabaseConnected = isSupabaseConfigured;

export const DEFAULT_USER: CurrentUser = {
  id: "usr-admin-001",
  name: "System Administrator",
  email: "admin@milestone.internal",
  role: "Administrator",
  department: "Plant & Machinery (P&M)",
};

// ===========================================================================
// LOCAL STORAGE PERSISTENCE (Offline / Development Fallback Store)
// Allows instantaneous local testing of all CRUD, calculations, reports,
// and dashboard KPIs even before remote Supabase credentials are plugged in.
// ===========================================================================

const STORAGE_KEYS = {
  MACHINERY: "milestone_erp_machinery",
  PROJECTS: "milestone_erp_projects",
  SITES: "milestone_erp_sites",
  VENDORS: "milestone_erp_vendors",
  LOG_BOOKS: "milestone_erp_log_books",
  FUEL_ISSUES: "milestone_erp_fuel_issues",
  BREAKDOWNS: "milestone_erp_breakdowns",
  MAINTENANCE: "milestone_erp_maintenance",
  ATTACHMENTS: "milestone_erp_attachments",
};

function getLocal<T>(key: string, defaultVal: T[] = []): T[] {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T[];
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

// Default initial seed data for immediate local preview
const DEFAULT_PROJECTS: Project[] = [
  {
    id: "prj-001",
    code: "PRJ-MUM-EXPR",
    name: "Mumbai Expressway Package 4",
    clientName: "NHAI",
    status: "active",
    startDate: "2024-01-15",
    targetCompletionDate: "2026-12-31",
    description: "48km 8-lane expressway construction with 6 major bridges.",
  },
  {
    id: "prj-002",
    code: "PRJ-DEL-METRO",
    name: "Delhi Metro Phase IV Line 8",
    clientName: "DMRC",
    status: "active",
    startDate: "2024-06-01",
    targetCompletionDate: "2027-05-30",
    description: "Elevated viaduct and 4 underground metro stations.",
  },
];

const DEFAULT_SITES: Site[] = [
  {
    id: "sit-001",
    projectId: "prj-001",
    code: "SITE-CH-0-15",
    name: "Chainage 0+000 to 15+000 Batching Plant",
    address: "Panvel-JNPT Junction, Maharashtra",
    inChargePerson: "Rajesh Sharma (Site Eng)",
    contactPhone: "+91 98765 43210",
    isActive: true,
  },
  {
    id: "sit-002",
    projectId: "prj-001",
    code: "SITE-BRG-2",
    name: "Bridge 2 Deck Construction Pier 12",
    address: "Ulhas River Bridge Site",
    inChargePerson: "Sunil Verma (Structure Eng)",
    contactPhone: "+91 98765 43211",
    isActive: true,
  },
  {
    id: "sit-003",
    projectId: "prj-002",
    code: "SITE-DMRC-STN1",
    name: "Station 1 Underground Shaft",
    address: "Janakpuri West Extension, Delhi",
    inChargePerson: "Vikas Patel",
    contactPhone: "+91 98765 43212",
    isActive: true,
  },
];

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: "vnd-001",
    vendorCode: "VND-CAT-01",
    name: "Gmmco Ltd (Caterpillar Dealer)",
    vendorType: "oem_dealer",
    contactPerson: "Anil Deshmukh",
    phone: "+91 22 2589 1234",
    email: "service@gmmco.example.com",
    gstin: "27AAACG1234A1Z5",
    address: "Thane Industrial Area, Maharashtra",
    isActive: true,
  },
  {
    id: "vnd-002",
    vendorCode: "VND-IOCL-SITE",
    name: "Indian Oil Direct Fuel Supply Agency",
    vendorType: "fuel_agency",
    contactPerson: "K. R. Nair",
    phone: "+91 22 2876 5432",
    email: "fuelsupply@iocl-agency.example.com",
    gstin: "27AAACI5678B1Z2",
    address: "Navi Mumbai Terminal",
    isActive: true,
  },
];

const DEFAULT_MACHINERY: Machinery[] = [
  {
    id: "mch-001",
    assetCode: "MCH-00001",
    registrationNo: "MH-04-AB-1234",
    machineryName: "Tata Prima 2830.K Tipper",
    machineryType: "Tipper",
    category: "Concrete & Haulage",
    make: "Tata Motors",
    model: "Prima 2830.K (16 CuM)",
    yearOfManufacture: 2022,
    capacity: "16 CuM",
    fuelType: "Diesel",
    meterType: "KM",
    engineConfig: "single",
    fuelTankCapacity: 300,
    currentProjectId: "prj-001",
    currentSiteId: "sit-001",
    department: "Plant & Machinery",
    openingReading: 12500,
    currentReading: 14850,
    purchaseDate: "2022-04-10",
    insuranceExpiry: "2027-04-09",
    pucExpiry: "2026-11-20",
    fitnessExpiry: "2027-04-09",
    status: "active",
    remarks: "Dedicated to Sub-base aggregate hauling.",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mch-002",
    assetCode: "MCH-00002",
    registrationNo: null, // Non-road excavator without RTO plate
    machineryName: "CAT 320D Hydraulic Excavator",
    machineryType: "Excavator",
    category: "Earthmoving",
    make: "Caterpillar",
    model: "320D2 GC",
    yearOfManufacture: 2021,
    capacity: "1.0 CuM Bucket",
    fuelType: "Diesel",
    meterType: "HOUR",
    engineConfig: "single",
    fuelTankCapacity: 400,
    currentProjectId: "prj-001",
    currentSiteId: "sit-001",
    department: "Plant & Machinery",
    openingReading: 3200,
    currentReading: 4120,
    purchaseDate: "2021-08-15",
    insuranceExpiry: "2026-10-15",
    pucExpiry: null,
    fitnessExpiry: null,
    status: "active",
    remarks: "Deep excavation at Bridge 2 Pier foundation.",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mch-003",
    assetCode: "MCH-00003",
    registrationNo: null, // Soil compactor
    machineryName: "Hamm 311 Soil Compactor",
    machineryType: "Soil Compactor",
    category: "Compaction",
    make: "Hamm / Wirtgen",
    model: "311 Single Drum (11 Ton)",
    yearOfManufacture: 2023,
    capacity: "11 Ton",
    fuelType: "Diesel",
    meterType: "HOUR",
    engineConfig: "single",
    fuelTankCapacity: 300,
    currentProjectId: "prj-001",
    currentSiteId: "sit-001",
    department: "Plant & Machinery",
    openingReading: 850,
    currentReading: 1240,
    purchaseDate: "2023-01-20",
    insuranceExpiry: "2027-01-19",
    pucExpiry: null,
    fitnessExpiry: null,
    status: "active",
    remarks: "Earthwork compaction.",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Database Column Mappers (Snake Case <-> Camel Case)
// ---------------------------------------------------------------------------

function mapDbToMachinery(r: any): Machinery {
  return {
    id: r.id,
    assetCode: r.asset_code,
    registrationNo: r.registration_no,
    machineryName: r.machinery_name,
    machineryType: r.machinery_type,
    category: r.category,
    make: r.make,
    model: r.model,
    yearOfManufacture: r.year_of_manufacture,
    capacity: r.capacity,
    fuelType: r.fuel_type,
    meterType: r.meter_type,
    meterConfiguration: r.meter_configuration || (r.meter_type === "KM" ? "single_km" : "single_hour"),
    ownership: r.ownership || "own",
    vendorId: r.vendor_id || null,
    registrationStatus: r.registration_status || (r.registration_no ? "registered" : "unregistered"),
    engineConfig: r.engine_config || "single",
    fuelTankCapacity: r.fuel_tank_capacity ? Number(r.fuel_tank_capacity) : null,
    standardFuelEfficiency: r.standard_fuel_efficiency != null ? Number(r.standard_fuel_efficiency) : null,
    currentProjectId: r.current_project_id,
    currentSiteId: r.current_site_id,
    department: r.department,
    openingReading: Number(r.opening_reading || 0),
    currentReading: Number(r.current_reading || 0),
    purchaseDate: r.purchase_date,
    insuranceExpiry: r.insurance_expiry,
    insuranceDocNo: r.insurance_doc_no || null,
    pucExpiry: r.puc_expiry,
    pucDocNo: r.puc_doc_no || null,
    fitnessExpiry: r.fitness_expiry,
    fitnessDocNo: r.fitness_doc_no || null,
    permitExpiry: r.permit_expiry || null,
    permitDocNo: r.permit_doc_no || null,
    roadTaxExpiry: r.road_tax_expiry || null,
    roadTaxDocNo: r.road_tax_doc_no || null,
    status: r.status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMachineryToDb(m: Partial<Machinery>): any {
  const db: any = {};
  if (m.id !== undefined) db.id = m.id;
  if (m.assetCode !== undefined) db.asset_code = m.assetCode;
  if (m.registrationNo !== undefined) db.registration_no = m.registrationNo ? m.registrationNo.trim() : null;
  if (m.machineryName !== undefined) db.machinery_name = m.machineryName;
  if (m.machineryType !== undefined) db.machinery_type = m.machineryType;
  if (m.category !== undefined) db.category = m.category;
  if (m.make !== undefined) db.make = m.make;
  if (m.model !== undefined) db.model = m.model;
  if (m.yearOfManufacture !== undefined) db.year_of_manufacture = m.yearOfManufacture;
  if (m.capacity !== undefined) db.capacity = m.capacity;
  if (m.fuelType !== undefined) db.fuel_type = m.fuelType;
  if (m.meterType !== undefined) db.meter_type = m.meterType;
  if (m.meterConfiguration !== undefined) db.meter_configuration = m.meterConfiguration;
  if (m.ownership !== undefined) db.ownership = m.ownership;
  if (m.vendorId !== undefined) db.vendor_id = m.vendorId || null;
  if (m.registrationStatus !== undefined) db.registration_status = m.registrationStatus;
  if (m.engineConfig !== undefined) db.engine_config = m.engineConfig;
  if (m.fuelTankCapacity !== undefined) db.fuel_tank_capacity = m.fuelTankCapacity || null;
  if (m.standardFuelEfficiency !== undefined) db.standard_fuel_efficiency = m.standardFuelEfficiency != null ? Number(m.standardFuelEfficiency) : null;
  if (m.currentProjectId !== undefined) db.current_project_id = m.currentProjectId || null;
  if (m.currentSiteId !== undefined) db.current_site_id = m.currentSiteId || null;
  if (m.department !== undefined) db.department = m.department;
  if (m.openingReading !== undefined) db.opening_reading = m.openingReading;
  if (m.currentReading !== undefined) db.current_reading = m.currentReading;
  if (m.purchaseDate !== undefined) db.purchase_date = m.purchaseDate || null;
  if (m.insuranceExpiry !== undefined) db.insurance_expiry = m.insuranceExpiry || null;
  if (m.insuranceDocNo !== undefined) db.insurance_doc_no = m.insuranceDocNo || null;
  if (m.pucExpiry !== undefined) db.puc_expiry = m.pucExpiry || null;
  if (m.pucDocNo !== undefined) db.puc_doc_no = m.pucDocNo || null;
  if (m.fitnessExpiry !== undefined) db.fitness_expiry = m.fitnessExpiry || null;
  if (m.fitnessDocNo !== undefined) db.fitness_doc_no = m.fitnessDocNo || null;
  if (m.permitExpiry !== undefined) db.permit_expiry = m.permitExpiry || null;
  if (m.permitDocNo !== undefined) db.permit_doc_no = m.permitDocNo || null;
  if (m.roadTaxExpiry !== undefined) db.road_tax_expiry = m.roadTaxExpiry || null;
  if (m.roadTaxDocNo !== undefined) db.road_tax_doc_no = m.roadTaxDocNo || null;
  if (m.status !== undefined) db.status = m.status;
  if (m.remarks !== undefined) db.remarks = m.remarks || null;
  return db;
}

function mapDbToProject(r: any): Project {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    clientName: r.client_name,
    projectType: r.project_type,
    location: r.location,
    status: r.status,
    startDate: r.start_date,
    targetCompletionDate: r.target_completion_date,
    expectedEndDate: r.expected_end_date,
    actualCompletionDate: r.actual_completion_date,
    projectManager: r.project_manager,
    description: r.description,
    remarks: r.remarks,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapProjectToDb(p: Partial<Project>): any {
  const db: any = {};
  if (p.id !== undefined) db.id = p.id;
  if (p.code !== undefined) db.code = p.code;
  if (p.name !== undefined) db.name = p.name;
  if (p.clientName !== undefined) db.client_name = p.clientName || null;
  if (p.projectType !== undefined) db.project_type = p.projectType || null;
  if (p.location !== undefined) db.location = p.location || null;
  if (p.status !== undefined) db.status = p.status;
  if (p.startDate !== undefined) db.start_date = p.startDate || null;
  if (p.targetCompletionDate !== undefined) db.target_completion_date = p.targetCompletionDate || null;
  if (p.expectedEndDate !== undefined) db.expected_end_date = p.expectedEndDate || null;
  if (p.actualCompletionDate !== undefined) db.actual_completion_date = p.actualCompletionDate || null;
  if (p.projectManager !== undefined) db.project_manager = p.projectManager || null;
  if (p.description !== undefined) db.description = p.description || null;
  if (p.remarks !== undefined) db.remarks = p.remarks || null;
  if (p.isActive !== undefined) db.is_active = p.isActive;
  return db;
}

function mapDbToSite(r: any): Site {
  return {
    id: r.id,
    projectId: r.project_id,
    code: r.code,
    name: r.name,
    address: r.address,
    chainageLocation: r.chainage_location,
    inChargePerson: r.in_charge_person,
    contactPhone: r.contact_phone,
    hasStore: r.has_store !== false,
    isActive: r.is_active,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapSiteToDb(s: Partial<Site>): any {
  const db: any = {};
  if (s.id !== undefined) db.id = s.id;
  if (s.projectId !== undefined) db.project_id = s.projectId;
  if (s.code !== undefined) db.code = s.code;
  if (s.name !== undefined) db.name = s.name;
  if (s.address !== undefined) db.address = s.address || null;
  if (s.chainageLocation !== undefined) db.chainage_location = s.chainageLocation || null;
  if (s.inChargePerson !== undefined) db.in_charge_person = s.inChargePerson || null;
  if (s.contactPhone !== undefined) db.contact_phone = s.contactPhone || null;
  if (s.hasStore !== undefined) db.has_store = s.hasStore;
  if (s.isActive !== undefined) db.is_active = s.isActive;
  if (s.remarks !== undefined) db.remarks = s.remarks || null;
  return db;
}

function mapDbToVendor(r: any): Vendor {
  return {
    id: r.id,
    vendorCode: r.vendor_code,
    name: r.name,
    vendorType: r.vendor_type,
    contactPerson: r.contact_person,
    phone: r.phone,
    mobile: r.mobile || r.phone,
    alternateMobile: r.alternate_mobile,
    email: r.email,
    gstin: r.gstin,
    pan: r.pan,
    address: r.address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    paymentTerms: r.payment_terms,
    creditDays: r.credit_days ? Number(r.credit_days) : 30,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    ifscCode: r.ifsc_code,
    remarks: r.remarks,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapVendorToDb(v: Partial<Vendor>): any {
  const db: any = {};
  if (v.id !== undefined) db.id = v.id;
  if (v.vendorCode !== undefined) db.vendor_code = v.vendorCode;
  if (v.name !== undefined) db.name = v.name;
  if (v.vendorType !== undefined) db.vendor_type = v.vendorType;
  if (v.contactPerson !== undefined) db.contact_person = v.contactPerson || null;
  if (v.phone !== undefined) db.phone = v.phone || null;
  if (v.mobile !== undefined) db.mobile = v.mobile || null;
  if (v.alternateMobile !== undefined) db.alternate_mobile = v.alternateMobile || null;
  if (v.email !== undefined) db.email = v.email || null;
  if (v.gstin !== undefined) db.gstin = v.gstin || null;
  if (v.pan !== undefined) db.pan = v.pan || null;
  if (v.address !== undefined) db.address = v.address || null;
  if (v.city !== undefined) db.city = v.city || null;
  if (v.state !== undefined) db.state = v.state || null;
  if (v.pincode !== undefined) db.pincode = v.pincode || null;
  if (v.paymentTerms !== undefined) db.payment_terms = v.paymentTerms || null;
  if (v.creditDays !== undefined) db.credit_days = v.creditDays || 30;
  if (v.bankName !== undefined) db.bank_name = v.bankName || null;
  if (v.accountNumber !== undefined) db.account_number = v.accountNumber || null;
  if (v.ifscCode !== undefined) db.ifsc_code = v.ifscCode || null;
  if (v.remarks !== undefined) db.remarks = v.remarks || null;
  if (v.isActive !== undefined) db.is_active = v.isActive;
  return db;
}

function mapDbToLogBook(r: any): LogBook {
  return {
    id: r.id,
    logNo: r.log_no,
    date: r.date,
    machineryId: r.machinery_id,
    engineId: r.engine_id || null,
    isMeterReset: Boolean(r.is_meter_reset),
    projectId: r.project_id,
    siteId: r.site_id,
    openingReading: Number(r.opening_reading || 0),
    closingReading: Number(r.closing_reading || 0),
    totalKmHours: Number(r.total_km_hours || (Number(r.closing_reading) - Number(r.opening_reading))),
    startTime: r.start_time,
    endTime: r.end_time,
    workingHours: r.working_hours ? Number(r.working_hours) : null,
    breakdownHours: Number(r.breakdown_hours || 0),
    operatorName: r.operator_name,
    trips: Number(r.trips || 0),
    workDescription: r.work_description,
    remarks: r.remarks,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLogBookToDb(l: Partial<LogBook>): any {
  const db: any = {};
  if (l.id !== undefined) db.id = l.id;
  if (l.logNo !== undefined) db.log_no = l.logNo;
  if (l.date !== undefined) db.date = l.date;
  if (l.machineryId !== undefined) db.machinery_id = l.machineryId;
  if (l.engineId !== undefined) db.engine_id = l.engineId || null;
  if (l.isMeterReset !== undefined) db.is_meter_reset = Boolean(l.isMeterReset);
  if (l.projectId !== undefined) db.project_id = l.projectId || null;
  if (l.siteId !== undefined) db.site_id = l.siteId || null;
  if (l.openingReading !== undefined) db.opening_reading = l.openingReading;
  if (l.closingReading !== undefined) db.closing_reading = l.closingReading;
  if (l.startTime !== undefined) db.start_time = l.startTime || null;
  if (l.endTime !== undefined) db.end_time = l.endTime || null;
  if (l.workingHours !== undefined) db.working_hours = l.workingHours ?? null;
  if (l.breakdownHours !== undefined) db.breakdown_hours = l.breakdownHours ?? 0;
  if (l.operatorName !== undefined) db.operator_name = l.operatorName || null;
  if (l.trips !== undefined) db.trips = l.trips ?? 0;
  if (l.workDescription !== undefined) db.work_description = l.workDescription || null;
  if (l.remarks !== undefined) db.remarks = l.remarks || null;
  if (l.status !== undefined) db.status = l.status || "approved";
  return db;
}

function mapDbToFuelIssue(r: any): FuelIssue {
  const qty = Number(r.quantity_litres || 0);
  const rate = Number(r.rate_per_litre || 0);
  return {
    id: r.id,
    issueNo: r.issue_no,
    issueDate: r.issue_date,
    issueTime: r.issue_time,
    machineryId: r.machinery_id,
    tankId: r.tank_id,
    engineId: r.engine_id,
    allocationMode: r.allocation_mode || "shared",
    projectId: r.project_id,
    siteId: r.site_id,
    meterReading: Number(r.meter_reading || 0),
    isMeterReset: Boolean(r.is_meter_reset),
    fuelType: r.fuel_type,
    quantityLitres: qty,
    ratePerLitre: rate,
    amount: Number(r.amount || (qty * rate)),
    fuelSource: r.fuel_source,
    slipReference: r.slip_reference,
    operatorName: r.operator_name,
    issuedBy: r.issued_by,
    remarks: r.remarks,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapFuelIssueToDb(f: Partial<FuelIssue>): any {
  const db: any = {};
  if (f.id !== undefined) db.id = f.id;
  if (f.issueNo !== undefined) db.issue_no = f.issueNo;
  if (f.issueDate !== undefined) db.issue_date = f.issueDate;
  if (f.issueTime !== undefined) db.issue_time = f.issueTime || null;
  if (f.machineryId !== undefined) db.machinery_id = f.machineryId;
  if (f.tankId !== undefined) db.tank_id = f.tankId || null;
  if (f.engineId !== undefined) db.engine_id = f.engineId || null;
  if (f.allocationMode !== undefined) db.allocation_mode = f.allocationMode || "shared";
  if (f.projectId !== undefined) db.project_id = f.projectId || null;
  if (f.siteId !== undefined) db.site_id = f.siteId || null;
  if (f.meterReading !== undefined) db.meter_reading = f.meterReading;
  if (f.isMeterReset !== undefined) db.is_meter_reset = Boolean(f.isMeterReset);
  if (f.fuelType !== undefined) db.fuel_type = f.fuelType;
  if (f.quantityLitres !== undefined) db.quantity_litres = f.quantityLitres;
  if (f.ratePerLitre !== undefined) db.rate_per_litre = f.ratePerLitre;
  if (f.fuelSource !== undefined) db.fuel_source = f.fuelSource;
  if (f.slipReference !== undefined) db.slip_reference = f.slipReference || null;
  if (f.operatorName !== undefined) db.operator_name = f.operatorName || null;
  if (f.issuedBy !== undefined) db.issued_by = f.issuedBy || null;
  if (f.remarks !== undefined) db.remarks = f.remarks || null;
  if (f.status !== undefined) db.status = f.status || "confirmed";
  return db;
}

function mapDbToBreakdown(r: any): Breakdown {
  return {
    id: r.id,
    breakdownNo: r.breakdown_no,
    breakdownDate: r.breakdown_date,
    date: r.breakdown_date,
    breakdownTime: r.breakdown_time,
    machineryId: r.machinery_id,
    currentReading: Number(r.current_reading || 0),
    projectId: r.project_id,
    siteId: r.site_id,
    reportedBy: r.reported_by,
    problemDescription: r.problem_description,
    priority: r.priority,
    status: r.status,
    resolutionDate: r.resolution_date,
    resolutionNotes: r.resolution_notes,
    downtimeHours: r.downtime_hours ? Number(r.downtime_hours) : null,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapBreakdownToDb(b: Partial<Breakdown>): any {
  const db: any = {};
  if (b.id !== undefined) db.id = b.id;
  if (b.breakdownNo !== undefined) db.breakdown_no = b.breakdownNo;
  if (b.breakdownDate !== undefined) db.breakdown_date = b.breakdownDate;
  if (b.breakdownTime !== undefined) db.breakdown_time = b.breakdownTime || null;
  if (b.machineryId !== undefined) db.machinery_id = b.machineryId;
  if (b.currentReading !== undefined) db.current_reading = b.currentReading;
  if (b.projectId !== undefined) db.project_id = b.projectId || null;
  if (b.siteId !== undefined) db.site_id = b.siteId || null;
  if (b.reportedBy !== undefined) db.reported_by = b.reportedBy;
  if (b.problemDescription !== undefined) db.problem_description = b.problemDescription;
  if (b.priority !== undefined) db.priority = b.priority;
  if (b.status !== undefined) db.status = b.status;
  if (b.resolutionDate !== undefined) db.resolution_date = b.resolutionDate || null;
  if (b.resolutionNotes !== undefined) db.resolution_notes = b.resolutionNotes || null;
  if (b.downtimeHours !== undefined) db.downtime_hours = b.downtimeHours ?? null;
  if (b.remarks !== undefined) db.remarks = b.remarks || null;
  return db;
}

function mapDbToMaintenance(r: any): MaintenanceRecord {
  return {
    id: r.id,
    maintenanceNo: r.maintenance_no,
    machineryId: r.machinery_id,
    breakdownId: r.breakdown_id,
    serviceDate: r.service_date,
    date: r.service_date,
    currentReading: Number(r.current_reading || 0),
    maintenanceType: r.maintenance_type,
    complaint: r.complaint,
    diagnosis: r.diagnosis,
    workPerformed: r.work_performed,
    requiredParts: r.required_parts,
    vendorId: r.vendor_id,
    quotationReference: r.quotation_reference,
    estimatedCost: Number(r.estimated_cost || 0),
    actualCost: Number(r.actual_cost || 0),
    partsCost: Number(r.parts_cost || 0),
    labourCost: Number(r.labour_cost || 0),
    status: r.status,
    workStartDate: r.work_start_date,
    completionDate: r.completion_date,
    nextServiceReading: r.next_service_reading ? Number(r.next_service_reading) : null,
    nextServiceDate: r.next_service_date,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMaintenanceToDb(m: Partial<MaintenanceRecord>): any {
  const db: any = {};
  if (m.id !== undefined) db.id = m.id;
  if (m.maintenanceNo !== undefined) db.maintenance_no = m.maintenanceNo;
  if (m.machineryId !== undefined) db.machinery_id = m.machineryId;
  if (m.breakdownId !== undefined) db.breakdown_id = m.breakdownId || null;
  if (m.serviceDate !== undefined) db.service_date = m.serviceDate;
  if (m.currentReading !== undefined) db.current_reading = m.currentReading;
  if (m.maintenanceType !== undefined) db.maintenance_type = m.maintenanceType;
  if (m.complaint !== undefined) db.complaint = m.complaint || null;
  if (m.diagnosis !== undefined) db.diagnosis = m.diagnosis || null;
  if (m.workPerformed !== undefined) db.work_performed = m.workPerformed || null;
  if (m.requiredParts !== undefined) db.required_parts = m.requiredParts || null;
  if (m.vendorId !== undefined) db.vendor_id = m.vendorId || null;
  if (m.quotationReference !== undefined) db.quotation_reference = m.quotationReference || null;
  if (m.estimatedCost !== undefined) db.estimated_cost = m.estimatedCost;
  if (m.actualCost !== undefined) db.actual_cost = m.actualCost;
  if (m.partsCost !== undefined) db.parts_cost = m.partsCost;
  if (m.labourCost !== undefined) db.labour_cost = m.labourCost;
  if (m.status !== undefined) db.status = m.status;
  if (m.workStartDate !== undefined) db.work_start_date = m.workStartDate || null;
  if (m.completionDate !== undefined) db.completion_date = m.completionDate || null;
  if (m.nextServiceReading !== undefined) db.next_service_reading = m.nextServiceReading || null;
  if (m.nextServiceDate !== undefined) db.next_service_date = m.nextServiceDate || null;
  if (m.remarks !== undefined) db.remarks = m.remarks || null;
  return db;
}

function mapDbToAttachment(r: any): Attachment {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    documentType: r.document_type,
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileSizeBytes: r.file_size_bytes ? Number(r.file_size_bytes) : null,
    mimeType: r.mime_type,
    expiryDate: r.expiry_date,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
  };
}

function mapAttachmentToDb(a: Partial<Attachment>): any {
  const db: any = {};
  if (a.id !== undefined) db.id = a.id;
  if (a.entityType !== undefined) db.entity_type = a.entityType;
  if (a.entityId !== undefined) db.entity_id = a.entityId;
  if (a.documentType !== undefined) db.document_type = a.documentType;
  if (a.fileName !== undefined) db.file_name = a.fileName;
  if (a.fileUrl !== undefined) db.file_url = a.fileUrl;
  if (a.fileSizeBytes !== undefined) db.file_size_bytes = a.fileSizeBytes || null;
  if (a.mimeType !== undefined) db.mime_type = a.mimeType || null;
  if (a.expiryDate !== undefined) db.expiry_date = a.expiryDate || null;
  if (a.uploadedBy !== undefined) db.uploaded_by = a.uploadedBy || null;
  return db;
}

// ===========================================================================
// 1. MACHINERY CRUD
// ===========================================================================

export async function getMachinery(filters?: {
  status?: string;
  category?: string;
  meterType?: MeterType;
  projectId?: string;
  siteId?: string;
  search?: string;
}): Promise<Machinery[]> {
  if (supabase) {
    let query = supabase.from("machinery").select("*").order("asset_code", { ascending: true });
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters?.category && filters.category !== "all") query = query.eq("category", filters.category);
    if (filters?.meterType) query = query.eq("meter_type", filters.meterType);
    if (filters?.projectId) query = query.eq("current_project_id", filters.projectId);
    if (filters?.siteId) query = query.eq("current_site_id", filters.siteId);
    if (filters?.search) {
      query = query.or(
        `asset_code.ilike.%${filters.search}%,machinery_name.ilike.%${filters.search}%,registration_no.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
      );
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching machinery:", error);
      throw new Error(error.message);
    }
    return (data || []).map(mapDbToMachinery);
  }

  // Local fallback
  let items = getLocal<Machinery>(STORAGE_KEYS.MACHINERY, DEFAULT_MACHINERY);
  if (filters?.status && filters.status !== "all") items = items.filter((m) => m.status === filters.status);
  if (filters?.category && filters.category !== "all") items = items.filter((m) => m.category === filters.category);
  if (filters?.meterType) items = items.filter((m) => m.meterType === filters.meterType);
  if (filters?.projectId) items = items.filter((m) => m.currentProjectId === filters.projectId);
  if (filters?.siteId) items = items.filter((m) => m.currentSiteId === filters.siteId);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (m) =>
        m.assetCode.toLowerCase().includes(q) ||
        m.machineryName.toLowerCase().includes(q) ||
        (m.registrationNo && m.registrationNo.toLowerCase().includes(q)) ||
        m.make.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function getMachineryById(id: string): Promise<Machinery | undefined> {
  if (supabase) {
    const { data, error } = await supabase.from("machinery").select("*").eq("id", id).single();
    if (error) return undefined;
    return mapDbToMachinery(data);
  }
  const items = getLocal<Machinery>(STORAGE_KEYS.MACHINERY, DEFAULT_MACHINERY);
  return items.find((m) => m.id === id);
}

export async function createMachinery(machinery: Omit<Machinery, "id" | "createdAt" | "updatedAt">): Promise<Machinery> {
  const pId = machinery.currentProjectId || machinery.projectId;
  const sId = machinery.currentSiteId || machinery.siteId;
  await validateProjectSiteConsistency(pId, sId);

  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mch-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const dbPayload = mapMachineryToDb({
      ...machinery,
      id: newId,
    });
    const { data, error } = await supabase.from("machinery").insert(dbPayload).select().single();
    if (error) {
      console.error("Error creating machinery:", error);
      throw new Error(error.message);
    }
    return mapDbToMachinery(data);
  }

  // Local fallback
  const created: Machinery = {
    ...machinery,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  const items = getLocal<Machinery>(STORAGE_KEYS.MACHINERY, DEFAULT_MACHINERY);
  // Check duplicate asset code
  if (items.some((m) => m.assetCode.toLowerCase() === created.assetCode.toLowerCase())) {
    throw new Error(`Machinery Asset Code '${created.assetCode}' already exists.`);
  }
  // Check duplicate registration_no if not empty
  if (created.registrationNo && items.some((m) => m.registrationNo && m.registrationNo.toLowerCase() === created.registrationNo!.toLowerCase())) {
    throw new Error(`Registration Number '${created.registrationNo}' already exists.`);
  }
  const next = [created, ...items];
  setLocal(STORAGE_KEYS.MACHINERY, next);
  return created;
}

export async function updateMachinery(id: string, updates: Partial<Machinery>): Promise<Machinery> {
  const now = new Date().toISOString();

  if (supabase) {
    const dbPayload = mapMachineryToDb(updates);
    dbPayload.updated_at = now;
    const { data, error } = await supabase.from("machinery").update(dbPayload).eq("id", id).select().single();
    if (error) {
      console.error("Error updating machinery:", error);
      throw new Error(error.message);
    }
    return mapDbToMachinery(data);
  }

  // Local fallback
  const items = getLocal<Machinery>(STORAGE_KEYS.MACHINERY, DEFAULT_MACHINERY);
  const index = items.findIndex((m) => m.id === id);
  if (index === -1) throw new Error("Machinery not found");
  const updated = {
    ...items[index],
    ...updates,
    updatedAt: now,
  };
  items[index] = updated;
  setLocal(STORAGE_KEYS.MACHINERY, items);
  return updated;
}

export async function archiveMachinery(id: string): Promise<Machinery> {
  return updateMachinery(id, { status: "archived" });
}

// Helper: generate next sequential Asset Code (e.g. MCH-00004)
export async function getNextAssetCode(): Promise<string> {
  const all = await getMachinery();
  const maxNum = all.reduce((max, m) => {
    const match = m.assetCode.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  const nextNum = maxNum + 1;
  return `MCH-${String(nextNum).padStart(5, "0")}`;
}

// ===========================================================================
// 2. PROJECTS & SITES CRUD
// ===========================================================================

export async function getProjects(): Promise<Project[]> {
  if (supabase) {
    const { data, error } = await supabase.from("projects").select("*").order("code", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToProject);
  }
  return getLocal<Project>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  if (supabase) {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) return undefined;
    return mapDbToProject(data);
  }
  const items = getLocal<Project>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  return items.find((p) => p.id === id);
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `prj-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapProjectToDb({ ...project, id: newId });
    const { data, error } = await supabase.from("projects").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return mapDbToProject(data);
  }

  const created: Project = { ...project, id: newId, createdAt: now, updatedAt: now };
  const items = getLocal<Project>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  if (items.some((p) => p.code.toLowerCase() === created.code.toLowerCase())) {
    throw new Error(`Project Code '${created.code}' already exists.`);
  }
  setLocal(STORAGE_KEYS.PROJECTS, [created, ...items]);
  return created;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  if (supabase) {
    const payload = mapProjectToDb(updates);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("projects").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapDbToProject(data);
  }
  const items = getLocal<Project>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Project not found");
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  setLocal(STORAGE_KEYS.PROJECTS, items);
  return items[idx];
}

export async function getSites(projectId?: string): Promise<Site[]> {
  if (supabase) {
    let query = supabase.from("sites").select("*").order("code", { ascending: true });
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToSite);
  }
  let items = getLocal<Site>(STORAGE_KEYS.SITES, DEFAULT_SITES);
  if (projectId) items = items.filter((s) => s.projectId === projectId);
  return items;
}

export async function createSite(site: Omit<Site, "id" | "createdAt" | "updatedAt">): Promise<Site> {
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sit-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapSiteToDb({ ...site, id: newId });
    const { data, error } = await supabase.from("sites").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return mapDbToSite(data);
  }

  const created: Site = { ...site, id: newId, createdAt: now, updatedAt: now };
  const items = getLocal<Site>(STORAGE_KEYS.SITES, DEFAULT_SITES);
  if (items.some((s) => s.projectId === created.projectId && s.code.toLowerCase() === created.code.toLowerCase())) {
    throw new Error(`Site code '${created.code}' already exists in this project.`);
  }
  setLocal(STORAGE_KEYS.SITES, [created, ...items]);
  return created;
}

export async function updateSite(id: string, updates: Partial<Site>): Promise<Site> {
  if (supabase) {
    const payload = mapSiteToDb(updates);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("sites").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapDbToSite(data);
  }
  const items = getLocal<Site>(STORAGE_KEYS.SITES, DEFAULT_SITES);
  const idx = items.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Site not found");
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  setLocal(STORAGE_KEYS.SITES, items);
  return items[idx];
}

// Enforces relational integrity: verifies that a site belongs to the specified project
export async function validateProjectSiteConsistency(projectId?: string | null, siteId?: string | null): Promise<void> {
  if (projectId && siteId) {
    const sites = await getSites(projectId);
    const siteBelongs = sites.some((s) => s.id === siteId);
    if (!siteBelongs) {
      throw new Error(`Project / Site Integrity Error: Selected Site (${siteId}) does not belong to Project (${projectId}).`);
    }
  }
}

// ===========================================================================
// 3. VENDORS CRUD
// ===========================================================================

export async function getVendors(): Promise<Vendor[]> {
  if (supabase) {
    const { data, error } = await supabase.from("vendors").select("*").order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToVendor);
  }
  return getLocal<Vendor>(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS);
}

export async function createVendor(vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">): Promise<Vendor> {
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `vnd-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapVendorToDb({ ...vendor, id: newId });
    const { data, error } = await supabase.from("vendors").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return mapDbToVendor(data);
  }

  const created: Vendor = { ...vendor, id: newId, createdAt: now, updatedAt: now };
  const items = getLocal<Vendor>(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS);
  if (items.some((v) => v.vendorCode.toLowerCase() === created.vendorCode.toLowerCase())) {
    throw new Error(`Vendor Code '${created.vendorCode}' already exists.`);
  }
  setLocal(STORAGE_KEYS.VENDORS, [created, ...items]);
  return created;
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor> {
  if (supabase) {
    const payload = mapVendorToDb(updates);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("vendors").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapDbToVendor(data);
  }
  const items = getLocal<Vendor>(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS);
  const idx = items.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error("Vendor not found");
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  setLocal(STORAGE_KEYS.VENDORS, items);
  return items[idx];
}

// ===========================================================================
// 4. DAILY LOG BOOKS CRUD & TRANSACTION CONTINUITY
// ===========================================================================

export async function getLogBooks(machineryId?: string): Promise<LogBook[]> {
  if (supabase) {
    let query = supabase.from("log_books").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
    if (machineryId) query = query.eq("machinery_id", machineryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToLogBook);
  }
  let items = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, []);
  if (machineryId) items = items.filter((l) => l.machineryId === machineryId);
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getLogBookById(id: string): Promise<LogBook | undefined> {
  if (supabase) {
    const { data, error } = await supabase.from("log_books").select("*").eq("id", id).single();
    if (error || !data) return undefined;
    return mapDbToLogBook(data);
  }
  const items = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, []);
  return items.find((l) => l.id === id);
}

export async function getLatestLogBookReading(
  machineryId: string,
  beforeDate?: string,
  engineId?: string | null
): Promise<{
  previousClosingReading: number;
  suggestedOpeningReading: number;
  hasPreviousEntry: boolean;
  lastLogDate: string | null;
  lastLogNo: string | null;
  meterType: MeterType;
}> {
  const machine = await getMachineryById(machineryId);
  const meterType: MeterType = (machine?.meterType as MeterType) || "HOUR";

  if (supabase) {
    let q = supabase
      .from("log_books")
      .select("*")
      .eq("machinery_id", machineryId)
      .neq("status", "cancelled");

    if (engineId) {
      q = q.eq("engine_id", engineId);
    }

    if (beforeDate) {
      q = q.lte("date", beforeDate);
    }

    q = q.order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1);
    const { data, error } = await q;

    if (!error && data && data.length > 0) {
      const last = data[0];
      const closing = Number(last.closing_reading || 0);
      return {
        previousClosingReading: closing,
        suggestedOpeningReading: closing,
        hasPreviousEntry: true,
        lastLogDate: last.date,
        lastLogNo: last.log_no,
        meterType,
      };
    }
  }

  // Local fallback / check
  const localLogs = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, [])
    .filter((l) => l.machineryId === machineryId && l.status !== "cancelled" && (!engineId || l.engineId === engineId))
    .filter((l) => !beforeDate || l.date <= beforeDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (localLogs.length > 0) {
    const last = localLogs[0];
    return {
      previousClosingReading: Number(last.closingReading),
      suggestedOpeningReading: Number(last.closingReading),
      hasPreviousEntry: true,
      lastLogDate: last.date,
      lastLogNo: last.logNo,
      meterType,
    };
  }

  // Fallback to initial opening from engine or machine master
  let initial = Number(machine?.openingReading || machine?.currentReading || 0);
  if (engineId) {
    const engines = await getEngines(machineryId);
    const eng = engines.find((e) => e.id === engineId);
    if (eng) {
      initial = Number(eng.openingReading || eng.currentReading || 0);
    }
  }

  return {
    previousClosingReading: initial,
    suggestedOpeningReading: initial,
    hasPreviousEntry: false,
    lastLogDate: null,
    lastLogNo: null,
    meterType,
  };
}

export async function getDailyFuelIssued(
  machineryId: string,
  date: string,
  engineId?: string | null
): Promise<{
  totalLitres: number;
  issueCount: number;
  issues: Array<{
    id: string;
    issueNo: string;
    quantityLitres: number;
    ratePerLitre: number;
    amount: number;
    slipReference?: string | null;
    fuelSource: string;
    operatorName?: string | null;
  }>;
  engineAllocations?: Array<{
    engineId: string;
    allocatedLitres: number;
  }>;
}> {
  if (supabase) {
    const { data: issuesData } = await supabase
      .from("fuel_issues")
      .select("*")
      .eq("machinery_id", machineryId)
      .eq("issue_date", date)
      .neq("status", "cancelled");

    const issues = issuesData || [];
    let totalLitres = 0;
    const issueSummaries: any[] = [];
    const engineAllocations: any[] = [];

    for (const iss of issues) {
      const qty = Number(iss.quantity_litres || 0);
      issueSummaries.push({
        id: iss.id,
        issueNo: iss.issue_no,
        quantityLitres: qty,
        ratePerLitre: Number(iss.rate_per_litre || 0),
        amount: Number(iss.amount || 0),
        slipReference: iss.slip_reference,
        fuelSource: iss.fuel_source,
        operatorName: iss.operator_name,
      });

      if (engineId) {
        const { data: allocs } = await supabase
          .from("fuel_issue_allocations")
          .select("*")
          .eq("fuel_issue_id", iss.id);

        if (allocs && allocs.length > 0) {
          const engAlloc = allocs.find((a: any) => a.engine_id === engineId);
          if (engAlloc) {
            const aQty = Number(engAlloc.allocated_litres || 0);
            totalLitres += aQty;
            engineAllocations.push({
              engineId,
              allocatedLitres: aQty,
            });
          }
        } else if (iss.engine_id === engineId || iss.allocation_mode === "shared" || !iss.allocation_mode) {
          totalLitres += qty;
        }
      } else {
        totalLitres += qty;
      }
    }

    return {
      totalLitres,
      issueCount: issues.length,
      issues: issueSummaries,
      engineAllocations,
    };
  }

  // Local fallback
  const localIssues = getLocal<FuelIssue>(STORAGE_KEYS.FUEL_ISSUES, [])
    .filter((f) => f.machineryId === machineryId && f.issueDate === date && f.status !== "cancelled");

  let totalLitres = 0;
  const issueSummaries = localIssues.map((iss) => {
    const qty = Number(iss.quantityLitres || 0);
    if (!engineId || iss.engineId === engineId || iss.allocationMode === "shared") {
      totalLitres += qty;
    }
    return {
      id: iss.id,
      issueNo: iss.issueNo,
      quantityLitres: qty,
      ratePerLitre: Number(iss.ratePerLitre || 0),
      amount: Number(iss.amount || 0),
      slipReference: iss.slipReference,
      fuelSource: iss.fuelSource,
      operatorName: iss.operatorName,
    };
  });

  return {
    totalLitres,
    issueCount: localIssues.length,
    issues: issueSummaries,
  };
}

export async function checkExistingLogBook(
  machineryId: string,
  date: string,
  engineId?: string | null
): Promise<LogBook | null> {
  const allLogs = await getLogBooks(machineryId);
  const found = allLogs.find((l) => 
    l.machineryId === machineryId && 
    l.date === date && 
    (l.engineId || null) === (engineId || null) &&
    l.status !== "cancelled"
  );
  return found || null;
}

export async function createLogBook(log: Omit<LogBook, "id" | "totalKmHours" | "createdAt" | "updatedAt">): Promise<LogBook> {
  await validateProjectSiteConsistency(log.projectId, log.siteId);

  // Validation: non-negative readings
  if (Number(log.openingReading) < 0 || Number(log.closingReading) < 0) {
    throw new Error("Meter readings cannot be negative.");
  }

  // Validation: closing reading must be >= opening reading unless meter was reset
  if (!log.isMeterReset && Number(log.closingReading) < Number(log.openingReading)) {
    throw new Error(`Closing reading (${log.closingReading}) cannot be less than opening reading (${log.openingReading}). If this is a meter reset or replacement, enable 'Meter Reset / Replacement'.`);
  }

  const totalKmHours = Math.max(0, Number(log.closingReading) - Number(log.openingReading));
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`;
  const now = new Date().toISOString();

  // Collision-safe unique log_no generation
  let safeLogNo = log.logNo;
  if (!safeLogNo || safeLogNo.trim() === "") {
    safeLogNo = await generateLogNumber(log.date, log.machineryId);
  } else {
    // Check if this log_no already exists
    const allLogs = await getLogBooks();
    if (allLogs.some((l) => l.logNo === safeLogNo)) {
      safeLogNo = await generateLogNumber(log.date, log.machineryId);
    }
  }

  if (supabase) {
    const payload = mapLogBookToDb({
      ...log,
      logNo: safeLogNo,
      id: newId,
    });
    const { data, error } = await supabase.from("log_books").insert(payload).select().single();
    if (error) {
      // In case of unique constraint race condition, retry with guaranteed unique number
      if (error.code === "23505") {
        const fallbackNo = `LOG-${log.date.replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;
        payload.log_no = fallbackNo;
        const retry = await supabase.from("log_books").insert(payload).select().single();
        if (retry.error) throw new Error(`Log Book creation failed: ${retry.error.message}`);
        return mapDbToLogBook(retry.data);
      }
      throw new Error(`Log Book creation failed: ${error.message}`);
    }

    // Operational Continuity: Advance machinery current_reading if closing reading is higher
    const machine = await getMachineryById(log.machineryId);
    if (machine && (log.isMeterReset || Number(log.closingReading) > Number(machine.currentReading))) {
      await updateMachinery(log.machineryId, { currentReading: Number(log.closingReading) });
    }

    // Operational Continuity for Engine if assigned
    if (log.engineId) {
      await supabase.from("engines").update({ current_reading: Number(log.closingReading) }).eq("id", log.engineId);
    }

    return mapDbToLogBook(data);
  }

  // Local fallback
  const created: LogBook = {
    ...log,
    id: newId,
    logNo: safeLogNo,
    totalKmHours,
    createdAt: now,
    updatedAt: now,
  };
  const items = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, []);
  setLocal(STORAGE_KEYS.LOG_BOOKS, [created, ...items]);

  // Operational Continuity: Advance machinery reading locally
  const machine = await getMachineryById(log.machineryId);
  if (machine && (log.isMeterReset || Number(log.closingReading) > Number(machine.currentReading))) {
    await updateMachinery(log.machineryId, { currentReading: Number(log.closingReading) });
  }

  return created;
}

export async function updateLogBook(id: string, updates: Partial<LogBook>): Promise<LogBook> {
  if (supabase) {
    const payload = mapLogBookToDb(updates);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("log_books").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    // If closing reading updated, advance machinery current reading
    if (updates.closingReading !== undefined && updates.machineryId) {
      const machine = await getMachineryById(updates.machineryId);
      if (machine && Number(updates.closingReading) > Number(machine.currentReading)) {
        await updateMachinery(updates.machineryId, { currentReading: Number(updates.closingReading) });
      }
      if (updates.engineId) {
        await supabase.from("engines").update({ current_reading: Number(updates.closingReading) }).eq("id", updates.engineId);
      }
    }
    return mapDbToLogBook(data);
  }

  const items = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, []);
  const idx = items.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error("Log Book entry not found.");
  const updated: LogBook = {
    ...items[idx],
    ...updates,
    totalKmHours: updates.closingReading !== undefined || updates.openingReading !== undefined
      ? Math.max(0, Number(updates.closingReading ?? items[idx].closingReading) - Number(updates.openingReading ?? items[idx].openingReading))
      : items[idx].totalKmHours,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = updated;
  setLocal(STORAGE_KEYS.LOG_BOOKS, items);
  return updated;
}

export async function deleteLogBook(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("log_books").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const items = getLocal<LogBook>(STORAGE_KEYS.LOG_BOOKS, []);
  setLocal(STORAGE_KEYS.LOG_BOOKS, items.filter((l) => l.id !== id));
}

export async function calculateMachineryEfficiency(params: {
  machineryId?: string;
  fromDate?: string;
  toDate?: string;
  engineId?: string | null;
  projectId?: string | null;
  siteId?: string | null;
}): Promise<MachineryEfficiencyRecord[]> {
  const allMachinery = await getMachinery();
  const targetMachines = params.machineryId && params.machineryId !== "all"
    ? allMachinery.filter((m) => m.id === params.machineryId)
    : allMachinery;

  const records: MachineryEfficiencyRecord[] = [];

  for (const machine of targetMachines) {
    // Check project/site filter
    if (params.projectId && machine.currentProjectId !== params.projectId && machine.projectId !== params.projectId) {
      continue;
    }
    if (params.siteId && machine.currentSiteId !== params.siteId && machine.siteId !== params.siteId) {
      continue;
    }

    const engines = await getEngines(machine.id);
    const hasMultiEngines = machine.engineConfig === "multi" || engines.length > 0;

    // Fetch all logs for this machine
    const machineLogs = (await getLogBooks(machine.id)).filter((l) => {
      if (l.status === "cancelled") return false;
      if (params.fromDate && l.date < params.fromDate) return false;
      if (params.toDate && l.date > params.toDate) return false;
      if (params.projectId && l.projectId && l.projectId !== params.projectId) return false;
      if (params.siteId && l.siteId && l.siteId !== params.siteId) return false;
      return true;
    });

    // Fetch all fuel issues for this machine
    const machineFuelIssues = (await getFuelIssues(machine.id)).filter((f) => {
      if (f.status === "cancelled") return false;
      if (params.fromDate && f.issueDate < params.fromDate) return false;
      if (params.toDate && f.issueDate > params.toDate) return false;
      if (params.projectId && f.projectId && f.projectId !== params.projectId) return false;
      if (params.siteId && f.siteId && f.siteId !== params.siteId) return false;
      return true;
    });

    // 1. If machine has multiple engines and user requested specific engine OR all engines
    if (hasMultiEngines && engines.length > 0) {
      const targetEngines = params.engineId && params.engineId !== "all"
        ? engines.filter((e) => e.id === params.engineId)
        : engines;

      for (const eng of targetEngines) {
        const engLogs = machineLogs.filter((l) => l.engineId === eng.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate engine-specific fuel
        let engDiesel = 0;
        let engFuelCount = 0;
        for (const f of machineFuelIssues) {
          if (f.allocationMode === "engine_wise" && f.allocations) {
            const a = f.allocations.find((al) => al.engineId === eng.id);
            if (a) {
              engDiesel += Number(a.allocatedLitres || 0);
              engFuelCount++;
            }
          } else if (f.engineId === eng.id) {
            engDiesel += Number(f.quantityLitres || 0);
            engFuelCount++;
          }
        }

        const firstOpening = engLogs.length > 0 ? engLogs[0].openingReading : eng.openingReading;
        const lastClosing = engLogs.length > 0 ? engLogs[engLogs.length - 1].closingReading : eng.currentReading;
        const totalRun = engLogs.reduce((s, l) => s + l.totalKmHours, 0);

        const standard = eng.standardFuelEfficiency != null && Number(eng.standardFuelEfficiency) > 0 ? Number(eng.standardFuelEfficiency) : null;
        let actualAverage = 0;
        let lPer100Km: number | undefined;

        if (eng.meterType === "KM") {
          actualAverage = engDiesel > 0 ? Number((totalRun / engDiesel).toFixed(2)) : 0;
          lPer100Km = totalRun > 0 ? Number(((engDiesel / totalRun) * 100).toFixed(2)) : 0;
        } else {
          actualAverage = totalRun > 0 ? Number((engDiesel / totalRun).toFixed(2)) : 0;
        }

        let status: EfficiencyStatus = "No Consumption Data";
        let variance: number | null = null;
        let variancePercentage: number | null = null;

        if (engDiesel > 0 && totalRun > 0) {
          if (standard == null || standard <= 0) {
            status = "No Standard Set";
          } else {
            variance = Number((actualAverage - standard).toFixed(2));
            variancePercentage = Number(((variance / standard) * 100).toFixed(1));

            if (eng.meterType === "KM") {
              // Higher KM/L is better
              if (actualAverage >= standard) {
                status = actualAverage > standard * 1.05 ? "Lower Consumption" : "Within Standard";
              } else {
                status = "Higher Consumption";
              }
            } else {
              // Lower L/Hour is better
              if (actualAverage <= standard) {
                status = actualAverage < standard * 0.95 ? "Lower Consumption" : "Within Standard";
              } else {
                status = "Higher Consumption";
              }
            }
          }
        }

        records.push({
          machineryId: machine.id,
          machineryName: machine.machineryName,
          assetCode: machine.assetCode,
          registrationNo: machine.registrationNo,
          meterType: eng.meterType,
          engineId: eng.id,
          engineName: eng.engineName,
          fromDate: params.fromDate || (engLogs[0]?.date || "Period Start"),
          toDate: params.toDate || (engLogs[engLogs.length - 1]?.date || "Period End"),
          firstOpeningReading: firstOpening,
          lastClosingReading: lastClosing,
          totalKmHours: totalRun,
          totalDieselLitres: engDiesel,
          actualAverage,
          consumptionLPer100Km: lPer100Km,
          standardFuelEfficiency: standard,
          variance,
          variancePercentage,
          status,
          logEntriesCount: engLogs.length,
          fuelIssuesCount: engFuelCount,
        });
      }
    }

    // 2. Machine-level record (or Single-engine machine)
    if (!params.engineId || params.engineId === "all") {
      const sortedLogs = [...machineLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstOpening = sortedLogs.length > 0 ? sortedLogs[0].openingReading : machine.openingReading;
      const lastClosing = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].closingReading : machine.currentReading;
      const totalRun = sortedLogs.reduce((s, l) => s + l.totalKmHours, 0);
      const totalDiesel = machineFuelIssues.reduce((s, f) => s + Number(f.quantityLitres || 0), 0);

      const standard = machine.standardFuelEfficiency != null && Number(machine.standardFuelEfficiency) > 0 ? Number(machine.standardFuelEfficiency) : null;
      let actualAverage = 0;
      let lPer100Km: number | undefined;

      if (machine.meterType === "KM") {
        actualAverage = totalDiesel > 0 ? Number((totalRun / totalDiesel).toFixed(2)) : 0;
        lPer100Km = totalRun > 0 ? Number(((totalDiesel / totalRun) * 100).toFixed(2)) : 0;
      } else {
        actualAverage = totalRun > 0 ? Number((totalDiesel / totalRun).toFixed(2)) : 0;
      }

      let status: EfficiencyStatus = "No Consumption Data";
      let variance: number | null = null;
      let variancePercentage: number | null = null;

      if (totalDiesel > 0 && totalRun > 0) {
        if (standard == null || standard <= 0) {
          status = "No Standard Set";
        } else {
          variance = Number((actualAverage - standard).toFixed(2));
          variancePercentage = Number(((variance / standard) * 100).toFixed(1));

          if (machine.meterType === "KM") {
            // Higher KM/L is better
            if (actualAverage >= standard) {
              status = actualAverage > standard * 1.05 ? "Lower Consumption" : "Within Standard";
            } else {
              status = "Higher Consumption";
            }
          } else {
            // Lower L/Hour is better
            if (actualAverage <= standard) {
              status = actualAverage < standard * 0.95 ? "Lower Consumption" : "Within Standard";
            } else {
              status = "Higher Consumption";
            }
          }
        }
      }

      records.push({
        machineryId: machine.id,
        machineryName: machine.machineryName,
        assetCode: machine.assetCode,
        registrationNo: machine.registrationNo,
        meterType: machine.meterType,
        engineId: null,
        engineName: hasMultiEngines ? "Overall Equipment" : undefined,
        fromDate: params.fromDate || (sortedLogs[0]?.date || "Period Start"),
        toDate: params.toDate || (sortedLogs[sortedLogs.length - 1]?.date || "Period End"),
        firstOpeningReading: firstOpening,
        lastClosingReading: lastClosing,
        totalKmHours: totalRun,
        totalDieselLitres: totalDiesel,
        actualAverage,
        consumptionLPer100Km: lPer100Km,
        standardFuelEfficiency: standard,
        variance,
        variancePercentage,
        status,
        logEntriesCount: sortedLogs.length,
        fuelIssuesCount: machineFuelIssues.length,
      });
    }
  }

  return records;
}

export async function generateLogNumber(
  dateStr: string = new Date().toISOString().slice(0, 10),
  machineryId?: string
): Promise<string> {
  const d = dateStr.replace(/-/g, "");
  let codeSnippet = "MCH";
  if (machineryId) {
    const m = await getMachineryById(machineryId);
    if (m?.assetCode) {
      codeSnippet = m.assetCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    }
  }

  const all = await getLogBooks();
  const dateLogs = all.filter((l) => l.date === dateStr);
  const machineDateLogs = dateLogs.filter((l) => !machineryId || l.machineryId === machineryId);

  let seq = machineDateLogs.length + 1;
  let candidate = `LOG-${d}-${codeSnippet}-${String(seq).padStart(3, "0")}`;

  while (all.some((l) => l.logNo === candidate)) {
    seq++;
    candidate = `LOG-${d}-${codeSnippet}-${String(seq).padStart(3, "0")}`;
  }
  return candidate;
}

// ===========================================================================
// DAILY FUEL CONSUMPTION & THEORETICAL BALANCE ENGINE
// ===========================================================================

export interface DailyConsumptionFilter {
  date?: string;
  fromDate?: string;
  toDate?: string;
  machineryId?: string;
  engineId?: string;
  projectId?: string;
  siteId?: string;
}

export async function calculateDailyFuelConsumptionRecords(
  filter: DailyConsumptionFilter = {}
): Promise<DailyFuelConsumptionRecord[]> {
  const [allMachinery, allLogs, allFuelIssues] = await Promise.all([
    getMachinery(),
    getLogBooks(),
    getFuelIssues(),
  ]);

  let targetMachinery = allMachinery;
  if (filter.machineryId && filter.machineryId !== "all") {
    targetMachinery = targetMachinery.filter((m) => m.id === filter.machineryId);
  }
  if (filter.projectId && filter.projectId !== "all") {
    targetMachinery = targetMachinery.filter((m) => m.currentProjectId === filter.projectId);
  }
  if (filter.siteId && filter.siteId !== "all") {
    targetMachinery = targetMachinery.filter((m) => m.currentSiteId === filter.siteId);
  }

  const records: DailyFuelConsumptionRecord[] = [];

  for (const machine of targetMachinery) {
    const engines = await getEngines(machine.id);
    const hasMultiEngines = machine.engineConfig === "multi" && engines.length > 0;

    // Collect dates that have activity for this machine
    const machineLogs = allLogs.filter((l) => l.machineryId === machine.id && l.status !== "cancelled");
    const machineFuel = allFuelIssues.filter((f) => f.machineryId === machine.id && f.status !== "cancelled");

    // Process Engine-wise if multi-engine
    if (hasMultiEngines) {
      const targetEngines = filter.engineId && filter.engineId !== "all"
        ? engines.filter((e) => e.id === filter.engineId)
        : engines;

      for (const eng of targetEngines) {
        const engLogs = machineLogs.filter((l) => l.engineId === eng.id);
        const engFuelAllocations: { date: string; litres: number }[] = [];
        
        for (const fi of machineFuel) {
          if (fi.allocationMode === "engine_wise" && fi.allocations) {
            const alloc = fi.allocations.find((a) => a.engineId === eng.id);
            if (alloc && alloc.allocatedLitres > 0) {
              engFuelAllocations.push({ date: fi.issueDate, litres: Number(alloc.allocatedLitres) });
            }
          } else if (fi.engineId === eng.id) {
            engFuelAllocations.push({ date: fi.issueDate, litres: Number(fi.quantityLitres) });
          }
        }

        // Chronological dates
        const dateSet = new Set<string>();
        engLogs.forEach((l) => dateSet.add(l.date));
        engFuelAllocations.forEach((f) => dateSet.add(f.date));
        if (filter.date) dateSet.add(filter.date);

        const sortedDates = Array.from(dateSet).sort();
        let rollingBalance = 0;

        for (const curDate of sortedDates) {
          const dayOpeningBalance = rollingBalance;
          const dayLogs = engLogs.filter((l) => l.date === curDate).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const dayRun = dayLogs.reduce((s, l) => s + Number(l.totalKmHours || 0), 0);
          const firstOpening = dayLogs.length > 0 ? dayLogs[0].openingReading : Number(eng.openingReading || 0);
          const lastClosing = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1].closingReading : firstOpening;

          const dayFuel = engFuelAllocations.filter((f) => f.date === curDate).reduce((s, f) => s + f.litres, 0);
          const standard = eng.standardFuelEfficiency != null && Number(eng.standardFuelEfficiency) > 0 ? Number(eng.standardFuelEfficiency) : null;

          let theoreticalConsumption = 0;
          if (standard && standard > 0 && dayRun > 0) {
            if (eng.meterType === "KM") {
              theoreticalConsumption = Number((dayRun / standard).toFixed(2));
            } else {
              theoreticalConsumption = Number((dayRun * standard).toFixed(2));
            }
          }

          const closingTheoreticalBalance = Number((dayOpeningBalance + dayFuel - theoreticalConsumption).toFixed(2));
          rollingBalance = closingTheoreticalBalance;

          // Status determination
          let status: ConsumptionStatus = "Normal";
          let efficiencyStatus: EfficiencyStatus = "Within Standard";

          if (standard == null || standard <= 0) {
            status = "Insufficient Data";
            efficiencyStatus = "No Standard Set";
          } else if (closingTheoreticalBalance < 0) {
            status = "Negative Book Balance";
          } else if (dayRun > 0 && dayFuel > 0) {
            const actual = eng.meterType === "KM" ? (dayRun / dayFuel) : (dayFuel / dayRun);
            if (eng.meterType === "KM") {
              efficiencyStatus = actual >= standard ? "Within Standard" : "Higher Consumption";
            } else {
              efficiencyStatus = actual <= standard ? "Within Standard" : "Higher Consumption";
            }
          } else if (dayRun === 0 && dayFuel === 0) {
            status = "Normal";
            efficiencyStatus = "No Consumption Data";
          }

          // Apply date filters for return
          const matchesDate = !filter.date || filter.date === curDate;
          const matchesFrom = !filter.fromDate || curDate >= filter.fromDate;
          const matchesTo = !filter.toDate || curDate <= filter.toDate;

          if (matchesDate && matchesFrom && matchesTo) {
            records.push({
              id: `cons-${machine.id}-${eng.id}-${curDate}`,
              date: curDate,
              machineryId: machine.id,
              assetCode: machine.assetCode,
              machineryName: machine.machineryName,
              registrationNo: machine.registrationNo,
              displayName: getMachineryDisplayName(machine),
              engineId: eng.id,
              engineName: eng.engineName,
              meterType: eng.meterType,
              openingReading: firstOpening,
              closingReading: lastClosing,
              run: dayRun,
              totalRun: dayRun,
              standardEfficiency: standard,
              standardFuelEfficiency: standard ?? 0,
              openingTheoreticalBalance: dayOpeningBalance,
              openingFuelBalance: dayOpeningBalance,
              fuelIssued: dayFuel,
              fuelIssuedToday: dayFuel,
              theoreticalConsumption,
              closingTheoreticalBalance,
              closingFuelBalance: closingTheoreticalBalance,
              status,
              efficiencyStatus,
              projectId: machine.currentProjectId,
              siteId: machine.currentSiteId,
            });
          }
        }
      }
    }

    // Process Machine-level (or Single Engine)
    if (!hasMultiEngines && (!filter.engineId || filter.engineId === "all")) {
      const dateSet = new Set<string>();
      machineLogs.forEach((l) => dateSet.add(l.date));
      machineFuel.forEach((f) => dateSet.add(f.issueDate));
      if (filter.date) dateSet.add(filter.date);

      const sortedDates = Array.from(dateSet).sort();
      let rollingBalance = 0;

      for (const curDate of sortedDates) {
        const dayOpeningBalance = rollingBalance;
        const dayLogs = machineLogs.filter((l) => l.date === curDate).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const dayRun = dayLogs.reduce((s, l) => s + Number(l.totalKmHours || 0), 0);
        const firstOpening = dayLogs.length > 0 ? dayLogs[0].openingReading : Number(machine.openingReading || 0);
        const lastClosing = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1].closingReading : firstOpening;

        const dayFuel = machineFuel.filter((f) => f.issueDate === curDate).reduce((s, f) => s + Number(f.quantityLitres || 0), 0);
        const standard = machine.standardFuelEfficiency != null && Number(machine.standardFuelEfficiency) > 0 ? Number(machine.standardFuelEfficiency) : null;

        let theoreticalConsumption = 0;
        if (standard && standard > 0 && dayRun > 0) {
          if (machine.meterType === "KM") {
            theoreticalConsumption = Number((dayRun / standard).toFixed(2));
          } else {
            theoreticalConsumption = Number((dayRun * standard).toFixed(2));
          }
        }

        const closingTheoreticalBalance = Number((dayOpeningBalance + dayFuel - theoreticalConsumption).toFixed(2));
        rollingBalance = closingTheoreticalBalance;

        let status: ConsumptionStatus = "Normal";
        let efficiencyStatus: EfficiencyStatus = "Within Standard";

        if (standard == null || standard <= 0) {
          status = "Insufficient Data";
          efficiencyStatus = "No Standard Set";
        } else if (closingTheoreticalBalance < 0) {
          status = "Negative Book Balance";
        } else if (dayRun > 0 && dayFuel > 0) {
          const actual = machine.meterType === "KM" ? (dayRun / dayFuel) : (dayFuel / dayRun);
          if (machine.meterType === "KM") {
            efficiencyStatus = actual >= standard ? "Within Standard" : "Higher Consumption";
          } else {
            efficiencyStatus = actual <= standard ? "Within Standard" : "Higher Consumption";
          }
        } else if (dayRun === 0 && dayFuel === 0) {
          status = "Normal";
          efficiencyStatus = "No Consumption Data";
        }

        const matchesDate = !filter.date || filter.date === curDate;
        const matchesFrom = !filter.fromDate || curDate >= filter.fromDate;
        const matchesTo = !filter.toDate || curDate <= filter.toDate;

        if (matchesDate && matchesFrom && matchesTo) {
          records.push({
            id: `cons-${machine.id}-${curDate}`,
            date: curDate,
            machineryId: machine.id,
            assetCode: machine.assetCode,
            machineryName: machine.machineryName,
            registrationNo: machine.registrationNo,
            displayName: getMachineryDisplayName(machine),
            engineId: null,
            engineName: hasMultiEngines ? "Chassis / Main" : undefined,
            meterType: machine.meterType,
            openingReading: firstOpening,
            closingReading: lastClosing,
            run: dayRun,
            totalRun: dayRun,
            standardEfficiency: machine.standardFuelEfficiency ?? null,
            standardFuelEfficiency: machine.standardFuelEfficiency ?? 0,
            openingTheoreticalBalance: dayOpeningBalance,
            openingFuelBalance: dayOpeningBalance,
            fuelIssued: dayFuel,
            fuelIssuedToday: dayFuel,
            theoreticalConsumption,
            closingTheoreticalBalance,
            closingFuelBalance: closingTheoreticalBalance,
            status,
            efficiencyStatus,
            projectId: machine.currentProjectId,
            siteId: machine.currentSiteId,
          });
        }
      }
    }
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getTheoreticalFuelBalance(
  machineryId: string,
  asOfDate: string = new Date().toISOString().slice(0, 10),
  engineId?: string | null
): Promise<TheoreticalFuelBalance> {
  const records = await calculateDailyFuelConsumptionRecords({
    machineryId,
    engineId: engineId || undefined,
    toDate: asOfDate,
  });

  const latest = records.find((r) => r.machineryId === machineryId && (!engineId || r.engineId === engineId));
  const opening = latest?.openingTheoreticalBalance || 0;
  const issued = latest?.fuelIssued || 0;
  const consumption = latest?.theoreticalConsumption || 0;
  const closing = latest?.closingTheoreticalBalance || 0;

  return {
    machineryId,
    engineId: engineId || null,
    asOfDate,
    openingBalance: opening,
    fuelIssued: issued,
    totalFuelIssuedLitres: issued,
    theoreticalConsumption: consumption,
    totalConsumptionLitres: consumption,
    closingBalance: closing,
    theoreticalClosingBalanceLitres: closing,
    status: latest?.status || "Normal",
    disclaimer: "Calculated from fuel issues and standard-based consumption. Physical tank quantity is not verified by this system.",
  };
}

// ===========================================================================
// COMPLIANCE ALERTS ENGINE
// ===========================================================================

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

export async function getComplianceAlerts(
  warningThresholdDays: number = 30
): Promise<{
  all: ComplianceAlertItem[];
  valid: ComplianceAlertItem[];
  expiringSoon: ComplianceAlertItem[];
  expired: ComplianceAlertItem[];
}> {
  const machinery = await getMachinery();
  const now = new Date();
  const items: ComplianceAlertItem[] = [];

  for (const m of machinery) {
    const displayName = getMachineryDisplayName(m);

    const docs: { type: ComplianceAlertItem["documentType"]; label: string; date?: string | null; docNo?: string | null }[] = [
      { type: "insurance", label: "Insurance", date: m.insuranceExpiry, docNo: m.insuranceDocNo },
      { type: "puc", label: "PUC", date: m.pucExpiry, docNo: m.pucDocNo },
      { type: "fitness", label: "Fitness", date: m.fitnessExpiry, docNo: m.fitnessDocNo },
      { type: "permit", label: "Permit", date: m.permitExpiry, docNo: m.permitDocNo },
      { type: "road_tax", label: "Road Tax", date: m.roadTaxExpiry, docNo: m.roadTaxDocNo },
    ];

    for (const d of docs) {
      if (d.date) {
        const exp = new Date(d.date);
        const diffMs = exp.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / 86400000);

        let status: ComplianceAlertItem["status"] = "valid";
        let message = `${d.label} is valid (${daysRemaining} days left) — ${displayName}`;

        if (daysRemaining < 0) {
          status = "expired";
          message = `${d.label} expired ${Math.abs(daysRemaining)} days ago — ${displayName}`;
        } else if (daysRemaining <= warningThresholdDays) {
          status = "expiring";
          message = `${d.label} expires in ${daysRemaining} days — ${displayName}`;
        }

        items.push({
          id: `${m.id}-${d.type}`,
          machineryId: m.id,
          machineryName: m.machineryName,
          registrationNo: m.registrationNo,
          displayName,
          documentType: d.type,
          label: d.label,
          documentNo: d.docNo,
          expiryDate: d.date,
          daysRemaining,
          status,
          message,
        });
      }
    }
  }

  const expired = items.filter((i) => i.status === "expired").sort((a, b) => a.daysRemaining - b.daysRemaining);
  const expiringSoon = items.filter((i) => i.status === "expiring").sort((a, b) => a.daysRemaining - b.daysRemaining);
  const valid = items.filter((i) => i.status === "valid").sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    all: [...expired, ...expiringSoon, ...valid],
    valid,
    expiringSoon,
    expired,
  };
}

// ===========================================================================
// ENGINE MASTER MANAGEMENT
// ===========================================================================

export async function updateEngine(id: string, updates: Partial<Engine>): Promise<Engine> {
  if (supabase) {
    const payload: any = {};
    if (updates.engineName !== undefined) payload.engine_name = updates.engineName;
    if (updates.engineCode !== undefined) payload.engine_code = updates.engineCode;
    if (updates.engineNumber !== undefined) payload.engine_number = updates.engineNumber;
    if (updates.serialNumber !== undefined) payload.serial_number = updates.serialNumber;
    if (updates.engineType !== undefined) payload.engine_type = updates.engineType;
    if (updates.make !== undefined) payload.make = updates.make;
    if (updates.model !== undefined) payload.model = updates.model;
    if (updates.fuelType !== undefined) payload.fuel_type = updates.fuelType;
    if (updates.meterType !== undefined) payload.meter_type = updates.meterType;
    if (updates.openingReading !== undefined) payload.opening_reading = updates.openingReading;
    if (updates.currentReading !== undefined) payload.current_reading = updates.currentReading;
    if (updates.standardFuelEfficiency !== undefined) payload.standard_fuel_efficiency = updates.standardFuelEfficiency != null ? Number(updates.standardFuelEfficiency) : null;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("engines").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      machineryId: data.machinery_id,
      engineCode: data.engine_code,
      engineName: data.engine_name,
      engineType: data.engine_type,
      meterType: data.meter_type,
      fuelType: data.fuel_type,
      openingReading: Number(data.opening_reading),
      currentReading: Number(data.current_reading),
      standardFuelEfficiency: data.standard_fuel_efficiency != null ? Number(data.standard_fuel_efficiency) : null,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const all = getLocal<Engine>("milestone_erp_engines", []);
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Engine not found.");
  const updated: Engine = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  setLocal("milestone_erp_engines", all);
  return updated;
}

export async function deactivateEngine(id: string): Promise<void> {
  await updateEngine(id, { status: "inactive" });
}

export async function getEngineHistory(engineId: string): Promise<{
  logs: LogBook[];
  fuelIssues: FuelIssueAllocation[];
  maintenance: MaintenanceRecord[];
}> {
  const [allLogs, allMaint] = await Promise.all([
    getLogBooks(),
    getMaintenanceRecords(),
  ]);

  const logs = allLogs.filter((l) => l.engineId === engineId);
  const maintenance = allMaint.filter((m) => m.engineId === engineId);

  let fuelIssues: FuelIssueAllocation[] = [];
  if (supabase) {
    const { data } = await supabase.from("fuel_issue_allocations").select("*").eq("engine_id", engineId);
    fuelIssues = (data || []).map((r: any) => ({
      id: r.id,
      fuelIssueId: r.fuel_issue_id,
      engineId: r.engine_id,
      allocatedLitres: Number(r.allocated_litres),
      meterReading: r.meter_reading ? Number(r.meter_reading) : undefined,
      notes: r.notes,
    }));
  }

  return { logs, fuelIssues, maintenance };
}

// ===========================================================================
// 5. FUEL ISSUES CRUD (Direct Issue — NO Stock / Inward Holding)
// ===========================================================================

export async function getFuelIssues(machineryId?: string): Promise<FuelIssue[]> {
  if (supabase) {
    let query = supabase.from("fuel_issues").select("*").order("issue_date", { ascending: false }).order("created_at", { ascending: false });
    if (machineryId) query = query.eq("machinery_id", machineryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToFuelIssue);
  }
  let items = getLocal<FuelIssue>(STORAGE_KEYS.FUEL_ISSUES, []);
  if (machineryId) items = items.filter((f) => f.machineryId === machineryId);
  return items.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export async function createFuelIssue(issue: Omit<FuelIssue, "id" | "amount" | "createdAt" | "updatedAt">): Promise<FuelIssue> {
  await validateProjectSiteConsistency(issue.projectId, issue.siteId);

  // Validation: positive quantity, non-negative rate
  if (Number(issue.quantityLitres) <= 0) {
    throw new Error("Fuel quantity must be greater than zero.");
  }
  if (Number(issue.ratePerLitre) < 0) {
    throw new Error("Fuel rate cannot be negative.");
  }
  if (Number(issue.meterReading) < 0) {
    throw new Error("Meter reading cannot be negative.");
  }

  const amount = Number(issue.quantityLitres) * Number(issue.ratePerLitre);
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `fuel-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapFuelIssueToDb({
      ...issue,
      id: newId,
    });
    const { data, error } = await supabase.from("fuel_issues").insert(payload).select().single();
    if (error) throw new Error(error.message);

    // Save multi-engine fuel allocations if applicable
    if (issue.allocationMode === "engine_wise" && issue.allocations && issue.allocations.length > 0) {
      const allocPayload = issue.allocations.map((a) => ({
        fuel_issue_id: data.id,
        engine_id: a.engineId,
        allocated_litres: Number(a.allocatedLitres),
        remarks: a.remarks || null,
      }));
      await supabase.from("fuel_issue_allocations").insert(allocPayload);
    }

    // Operational Continuity: Advance machinery reading or support meter reset
    const machine = await getMachineryById(issue.machineryId);
    if (machine) {
      if (issue.isMeterReset || Number(issue.meterReading) > Number(machine.currentReading)) {
        await updateMachinery(issue.machineryId, { currentReading: Number(issue.meterReading) });
      }
    }

    return mapDbToFuelIssue(data);
  }

  // Local fallback
  const created: FuelIssue = {
    ...issue,
    id: newId,
    amount,
    createdAt: now,
    updatedAt: now,
  };
  const items = getLocal<FuelIssue>(STORAGE_KEYS.FUEL_ISSUES, []);
  setLocal(STORAGE_KEYS.FUEL_ISSUES, [created, ...items]);

  // Operational Continuity
  const machine = await getMachineryById(issue.machineryId);
  if (machine) {
    if (issue.isMeterReset || Number(issue.meterReading) > Number(machine.currentReading)) {
      await updateMachinery(issue.machineryId, { currentReading: Number(issue.meterReading) });
    }
  }

  return created;
}

export async function generateFuelIssueNumber(dateStr: string = new Date().toISOString().slice(0, 10)): Promise<string> {
  const d = dateStr.replace(/-/g, "");
  const all = await getFuelIssues();
  const todays = all.filter((f) => f.issueDate === dateStr);
  const nextSeq = todays.length + 1;
  return `FUEL-${d}-${String(nextSeq).padStart(4, "0")}`;
}

// ===========================================================================
// 6. BREAKDOWNS CRUD
// ===========================================================================

export async function getBreakdowns(machineryId?: string): Promise<Breakdown[]> {
  if (supabase) {
    let query = supabase.from("breakdowns").select("*").order("breakdown_date", { ascending: false }).order("created_at", { ascending: false });
    if (machineryId) query = query.eq("machinery_id", machineryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToBreakdown);
  }
  let items = getLocal<Breakdown>(STORAGE_KEYS.BREAKDOWNS, []);
  if (machineryId) items = items.filter((b) => b.machineryId === machineryId);
  return items.sort((a, b) => new Date(b.breakdownDate).getTime() - new Date(a.breakdownDate).getTime());
}

export async function getBreakdownById(id: string): Promise<Breakdown | undefined> {
  if (supabase) {
    const { data, error } = await supabase.from("breakdowns").select("*").eq("id", id).single();
    if (error) return undefined;
    return mapDbToBreakdown(data);
  }
  const items = getLocal<Breakdown>(STORAGE_KEYS.BREAKDOWNS, []);
  return items.find((b) => b.id === id);
}

export async function createBreakdown(breakdown: Omit<Breakdown, "id" | "createdAt" | "updatedAt">): Promise<Breakdown> {
  await validateProjectSiteConsistency(breakdown.projectId, breakdown.siteId);

  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `brk-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapBreakdownToDb({
      ...breakdown,
      id: newId,
    });
    const { data, error } = await supabase.from("breakdowns").insert(payload).select().single();
    if (error) throw new Error(error.message);

    // If breakdown is open / in repair, mark machinery status as under_repair
    if (["open", "under_inspection", "waiting_for_parts", "under_repair"].includes(breakdown.status)) {
      await updateMachinery(breakdown.machineryId, { status: "under_repair" });
    }

    return mapDbToBreakdown(data);
  }

  // Local fallback
  const created: Breakdown = {
    ...breakdown,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  const items = getLocal<Breakdown>(STORAGE_KEYS.BREAKDOWNS, []);
  setLocal(STORAGE_KEYS.BREAKDOWNS, [created, ...items]);

  if (["open", "under_inspection", "waiting_for_parts", "under_repair"].includes(breakdown.status)) {
    await updateMachinery(breakdown.machineryId, { status: "under_repair" });
  }

  return created;
}

export async function updateBreakdown(id: string, updates: Partial<Breakdown>): Promise<Breakdown> {
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapBreakdownToDb(updates);
    payload.updated_at = now;
    const { data, error } = await supabase.from("breakdowns").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    // If marked completed, check if machine has other open breakdowns; if not, mark active
    if (updates.status === "completed") {
      const allOpen = (await getBreakdowns(data.machinery_id)).filter(
        (b) => b.id !== id && ["open", "under_inspection", "waiting_for_parts", "under_repair"].includes(b.status)
      );
      if (allOpen.length === 0) {
        await updateMachinery(data.machinery_id, { status: "active" });
      }
    }

    return mapDbToBreakdown(data);
  }

  // Local fallback
  const items = getLocal<Breakdown>(STORAGE_KEYS.BREAKDOWNS, []);
  const idx = items.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Breakdown record not found");
  const updated: Breakdown = { ...items[idx], ...updates, updatedAt: now };
  items[idx] = updated;
  setLocal(STORAGE_KEYS.BREAKDOWNS, items);

  if (updates.status === "completed") {
    const allOpen = items.filter(
      (b) => b.machineryId === updated.machineryId && b.id !== id && ["open", "under_inspection", "waiting_for_parts", "under_repair"].includes(b.status)
    );
    if (allOpen.length === 0) {
      await updateMachinery(updated.machineryId, { status: "active" });
    }
  }

  return updated;
}

export async function generateBreakdownNumber(dateStr: string = new Date().toISOString().slice(0, 10)): Promise<string> {
  const d = dateStr.replace(/-/g, "");
  const all = await getBreakdowns();
  const todays = all.filter((b) => b.breakdownDate === dateStr);
  const nextSeq = todays.length + 1;
  return `BRK-${d}-${String(nextSeq).padStart(4, "0")}`;
}

// ===========================================================================
// 7. MAINTENANCE RECORDS CRUD
// ===========================================================================

export async function getMaintenanceRecords(machineryId?: string): Promise<MaintenanceRecord[]> {
  if (supabase) {
    let query = supabase.from("maintenance_records").select("*").order("service_date", { ascending: false }).order("created_at", { ascending: false });
    if (machineryId) query = query.eq("machinery_id", machineryId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToMaintenance);
  }
  let items = getLocal<MaintenanceRecord>(STORAGE_KEYS.MAINTENANCE, []);
  if (machineryId) items = items.filter((m) => m.machineryId === machineryId);
  return items.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
}

export async function createMaintenanceRecord(record: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt">): Promise<MaintenanceRecord> {
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mnt-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapMaintenanceToDb({
      ...record,
      id: newId,
    });
    const { data, error } = await supabase.from("maintenance_records").insert(payload).select().single();
    if (error) throw new Error(error.message);

    // If maintenance completes and has a linked breakdown, resolve the breakdown
    if (record.status === "completed" && record.breakdownId) {
      await updateBreakdown(record.breakdownId, {
        status: "completed",
        resolutionDate: now,
        resolutionNotes: record.workPerformed || "Resolved through maintenance service.",
      });
    }

    return mapDbToMaintenance(data);
  }

  // Local fallback
  const created: MaintenanceRecord = {
    ...record,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  const items = getLocal<MaintenanceRecord>(STORAGE_KEYS.MAINTENANCE, []);
  setLocal(STORAGE_KEYS.MAINTENANCE, [created, ...items]);

  if (record.status === "completed" && record.breakdownId) {
    await updateBreakdown(record.breakdownId, {
      status: "completed",
      resolutionDate: now,
      resolutionNotes: record.workPerformed || "Resolved through maintenance service.",
    });
  }

  return created;
}

export async function updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapMaintenanceToDb(updates);
    payload.updated_at = now;
    const { data, error } = await supabase.from("maintenance_records").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    if (updates.status === "completed" && data.breakdown_id) {
      await updateBreakdown(data.breakdown_id, {
        status: "completed",
        resolutionDate: now,
        resolutionNotes: updates.workPerformed || "Resolved through maintenance service.",
      });
    }

    return mapDbToMaintenance(data);
  }

  const items = getLocal<MaintenanceRecord>(STORAGE_KEYS.MAINTENANCE, []);
  const idx = items.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Maintenance record not found");
  const updated = { ...items[idx], ...updates, updatedAt: now };
  items[idx] = updated;
  setLocal(STORAGE_KEYS.MAINTENANCE, items);

  if (updates.status === "completed" && updated.breakdownId) {
    await updateBreakdown(updated.breakdownId, {
      status: "completed",
      resolutionDate: now,
      resolutionNotes: updates.workPerformed || "Resolved through maintenance service.",
    });
  }

  return updated;
}

export async function generateMaintenanceNumber(dateStr: string = new Date().toISOString().slice(0, 10)): Promise<string> {
  const d = dateStr.replace(/-/g, "");
  const all = await getMaintenanceRecords();
  const todays = all.filter((m) => m.serviceDate === dateStr);
  const nextSeq = todays.length + 1;
  return `MNT-${d}-${String(nextSeq).padStart(4, "0")}`;
}

// ===========================================================================
// 8. ATTACHMENTS & COMPLIANCE DOCUMENTS
// ===========================================================================

export async function getAttachments(entityType?: string, entityId?: string): Promise<Attachment[]> {
  if (supabase) {
    let query = supabase.from("attachments").select("*").order("created_at", { ascending: false });
    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToAttachment);
  }
  let items = getLocal<Attachment>(STORAGE_KEYS.ATTACHMENTS, []);
  if (entityType) items = items.filter((a) => a.entityType === entityType);
  if (entityId) items = items.filter((a) => a.entityId === entityId);
  return items;
}

export async function createAttachment(attachment: Omit<Attachment, "id" | "createdAt">): Promise<Attachment> {
  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    const payload = mapAttachmentToDb({
      ...attachment,
      id: newId,
    });
    const { data, error } = await supabase.from("attachments").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return mapDbToAttachment(data);
  }

  const created: Attachment = {
    ...attachment,
    id: newId,
    createdAt: now,
  };
  const items = getLocal<Attachment>(STORAGE_KEYS.ATTACHMENTS, []);
  setLocal(STORAGE_KEYS.ATTACHMENTS, [created, ...items]);
  return created;
}

// Upload file helper: saves to Supabase Storage if available or creates local path
// Storage Object Path format: {entity_type}/{entity_id}/{uuid}-{filename}
export async function uploadAttachmentFile(
  file: File,
  entityType: string = "machinery",
  entityId: string = "general"
): Promise<string> {
  const ext = file.name.split(".").pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const objectPath = `${entityType}/${entityId}/${uuid}-${cleanName}`;

  if (supabase) {
    const { data, error } = await supabase.storage.from("attachments").upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.error("Supabase Storage upload error:", error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    return data.path; // Stores exact object path in attachments.file_url
  }

  // Offline mock storage path
  return objectPath;
}

// Generates a temporary signed download URL for an attachment object path
export async function getAttachmentDownloadUrl(objectPath: string): Promise<string> {
  if (supabase) {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(objectPath, 3600);
    if (error) {
      console.warn("Failed to generate signed download URL:", error);
      return "";
    }
    return data.signedUrl;
  }
  return `/storage/${objectPath}`;
}


// Legacy-compatible Compliance Doc adapter for UI
export async function getComplianceDocs(machineryId?: string): Promise<ComplianceDoc[]> {
  const attachments = await getAttachments("machinery", machineryId);
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

  return attachments.map((att) => {
    let status: ComplianceDoc["status"] = "valid";
    if (att.expiryDate) {
      const exp = new Date(att.expiryDate);
      if (exp < now) status = "expired";
      else if (exp <= thirtyDaysOut) status = "expiring";
    }
    return {
      id: att.id,
      machineryId: att.entityId,
      type: att.documentType as any,
      documentNo: att.fileName,
      expiryDate: att.expiryDate || "",
      status,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
    };
  });
}

// ===========================================================================
// 9. DASHBOARD METRICS & RECENT AGGREGATIONS
// Real calculated values from the live database — No fake numbers
// ===========================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [machines, fuels, logs, breakdowns, maintenances, attachments, itemsList, storesList, assetsList, stockList, inwardsList, outwardsList] = await Promise.all([
    getMachinery(),
    getFuelIssues(),
    getLogBooks(),
    getBreakdowns(),
    getMaintenanceRecords(),
    getAttachments(),
    getItems(),
    getStores(),
    getAssets(),
    getStoreStock(),
    getMaterialInwards(),
    getMaterialOutwards(),
  ]);

  const totalMachinery = machines.length;
  const activeMachinery = machines.filter((m) => m.status === "active").length;
  const underRepairMachinery = machines.filter((m) => m.status === "under_repair").length;
  const inactiveMachinery = machines.filter((m) => m.status === "inactive").length;

  const totalItems = itemsList.length;
  const totalStores = storesList.length;
  const totalAssets = assetsList.length;
  const activeAssets = assetsList.filter((a) => a.status === "active").length;
  const assetsUnderRepair = assetsList.filter((a) => a.status === "under_repair").length;

  // Real stock value: each stock summary multiplied by item rate from inward, or standard
  const itemRateMap: Record<string, number> = {};
  inwardsList.forEach((grn) => {
    (grn.items || []).forEach((it) => {
      if (it.rate && Number(it.rate) > 0) {
        itemRateMap[it.itemId] = Number(it.rate);
      }
    });
  });

  let totalStockValue = 0;
  let lowStockItemsCount = 0;
  stockList.forEach((stk) => {
    const rate = itemRateMap[stk.itemId] || 0;
    if (stk.availableQuantity > 0) {
      totalStockValue += stk.availableQuantity * rate;
    }
    if (stk.isLowStock) {
      lowStockItemsCount++;
    }
  });

  const openBreakdowns = breakdowns.filter((b) => b.status === "open" || b.status === "under_repair").length;

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  // Today's Inward
  let todayInwardAmount = 0;
  let todayInwardCount = 0;
  inwardsList.forEach((inw) => {
    if (inw.status === "confirmed" && inw.grnDate === today) {
      todayInwardAmount += Number(inw.totalAmount || 0);
      todayInwardCount++;
    }
  });

  // Today's Outward and Month Material Consumption
  let todayOutwardAmount = 0;
  let todayOutwardCount = 0;
  let monthMaterialConsumption = 0;
  outwardsList.forEach((outw) => {
    if (outw.status === "confirmed") {
      let slipTotal = 0;
      (outw.items || []).forEach((item) => {
        const cost = Number(item.totalCost) || (Number(item.quantity) * (itemRateMap[item.itemId] || 0));
        slipTotal += cost;
      });

      if (outw.issueDate === today) {
        todayOutwardAmount += slipTotal;
        todayOutwardCount++;
      }
      if (outw.issueDate && outw.issueDate.startsWith(thisMonth)) {
        monthMaterialConsumption += slipTotal;
      }
    }
  });

  let todayFuelLitres = 0;
  let todayFuelAmount = 0;
  let monthFuelLitres = 0;
  let monthFuelAmount = 0;

  fuels.forEach((f) => {
    if (f.status === "confirmed") {
      const q = Number(f.quantityLitres) || 0;
      const a = Number(f.amount) || 0;
      if (f.issueDate === today) {
        todayFuelLitres += q;
        todayFuelAmount += a;
      }
      if (f.issueDate && f.issueDate.startsWith(thisMonth)) {
        monthFuelLitres += q;
        monthFuelAmount += a;
      }
    }
  });

  let monthMaintenanceCost = 0;
  let totalMaintenanceCost = 0;

  maintenances.forEach((m) => {
    const cost = Number(m.actualCost) || Number(m.estimatedCost) || 0;
    totalMaintenanceCost += cost;
    if (m.serviceDate && m.serviceDate.startsWith(thisMonth)) {
      monthMaintenanceCost += cost;
    }
  });

  // Expiring compliance docs (within 30 days)
  let expiringDocumentsCount = 0;
  let expiredDocumentsCount = 0;
  const now = new Date();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  const checkExp = (dateStr?: string | null) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d < now) expiredDocumentsCount++;
    else if (d <= thirtyDaysOut) expiringDocumentsCount++;
  };

  machines.forEach((m) => {
    checkExp(m.insuranceExpiry);
    checkExp(m.pucExpiry);
    checkExp(m.fitnessExpiry);
  });

  attachments.forEach((a) => {
    checkExp(a.expiryDate);
  });

  // Fuel trend by date (last 7 recorded dates or 7 days)
  const fuelByDate: Record<string, { litres: number; amount: number }> = {};
  fuels.forEach((f) => {
    if (f.status === "confirmed") {
      if (!fuelByDate[f.issueDate]) fuelByDate[f.issueDate] = { litres: 0, amount: 0 };
      fuelByDate[f.issueDate].litres += Number(f.quantityLitres);
      fuelByDate[f.issueDate].amount += Number(f.amount);
    }
  });
  const fuelTrend = Object.entries(fuelByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, data]) => ({ date, litres: Math.round(data.litres), amount: Math.round(data.amount) }));

  // Utilization by machine
  const utilMap: Record<string, { machine: string; hours: number; trips: number }> = {};
  logs.forEach((l) => {
    const m = machines.find((mac) => mac.id === l.machineryId);
    const label = m ? m.assetCode : l.machineryId.slice(0, 8);
    if (!utilMap[label]) utilMap[label] = { machine: label, hours: 0, trips: 0 };
    utilMap[label].hours += Number(l.totalKmHours);
    utilMap[label].trips += Number(l.trips || 0);
  });
  const utilizationHours = Object.values(utilMap).slice(0, 6);

  // Maintenance cost by type/category
  const costByType: Record<string, number> = {};
  maintenances.forEach((m) => {
    const typeKey = m.maintenanceType.charAt(0).toUpperCase() + m.maintenanceType.slice(1);
    costByType[typeKey] = (costByType[typeKey] || 0) + Number(m.actualCost || m.estimatedCost || 0);
  });
  const maintenanceCostsByCategory = Object.entries(costByType).map(([category, cost]) => ({ category, cost }));

  // Breakdowns by status
  const brkMap: Record<string, number> = {};
  breakdowns.forEach((b) => {
    const st = b.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    brkMap[st] = (brkMap[st] || 0) + 1;
  });
  const breakdownsByStatus = Object.entries(brkMap).map(([status, count]) => ({ status, count }));

  return {
    totalMachinery,
    activeMachinery,
    underRepairMachinery,
    inactiveMachinery,
    openBreakdowns,
    todayFuelLitres,
    todayFuelAmount,
    monthFuelLitres,
    monthFuelAmount,
    monthMaintenanceCost,
    totalMaintenanceCost,
    expiringDocumentsCount,
    expiredDocumentsCount,
    totalItems,
    totalStockValue: Math.round(totalStockValue),
    lowStockItemsCount,
    totalAssets,
    activeAssets,
    assetsUnderRepair,
    totalStores,
    todayInwardAmount: Math.round(todayInwardAmount),
    todayInwardCount,
    todayOutwardAmount: Math.round(todayOutwardAmount),
    todayOutwardCount,
    monthMaterialConsumption: Math.round(monthMaterialConsumption),
    fuelTrend,
    utilizationHours,
    maintenanceCostsByCategory,
    breakdownsByStatus,
  };
}

// ===========================================================================
// 10. FUEL EFFICIENCY & REPORTING AGGREGATIONS
// STRICT RULE: KM machinery evaluates KM/L & L/100 KM.
// HOUR machinery evaluates L/Hour. Never mix them.
// ===========================================================================

export async function getFuelEfficiencyReport(): Promise<FuelEfficiencyRecord[]> {
  const [machines, fuels, logs] = await Promise.all([getMachinery(), getFuelIssues(), getLogBooks()]);

  return machines.map((machine) => {
    const machineFuels = fuels.filter((f) => f.machineryId === machine.id && f.status === "confirmed");
    const machineLogs = logs.filter((l) => l.machineryId === machine.id);

    const totalLitres = machineFuels.reduce((sum, f) => sum + Number(f.quantityLitres), 0);
    const totalAmount = machineFuels.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalUnits = machineLogs.reduce((sum, l) => sum + Number(l.totalKmHours), 0);

    let efficiency = 0;
    let lPer100Km: number | undefined = undefined;

    if (machine.meterType === "KM") {
      // KM/L: Higher is better
      efficiency = totalLitres > 0 ? Number((totalUnits / totalLitres).toFixed(2)) : 0;
      // L/100 KM
      lPer100Km = totalUnits > 0 ? Number(((totalLitres / totalUnits) * 100).toFixed(2)) : 0;
    } else {
      // HOUR Machinery: Litres / Hour (Lower is better / consumption rate)
      efficiency = totalUnits > 0 ? Number((totalLitres / totalUnits).toFixed(2)) : 0;
    }

    return {
      machineryId: machine.id,
      assetCode: machine.assetCode,
      machineryName: machine.machineryName,
      meterType: machine.meterType,
      totalUnits,
      totalLitres,
      totalAmount,
      efficiency,
      lPer100Km,
    };
  });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return DEFAULT_USER;
}

// ===========================================================================
// 11. MULTI-ENGINE & FUEL TANK REPOSITORY
// ===========================================================================

export async function getEngines(machineryId?: string): Promise<Engine[]> {
  if (supabase) {
    let q = supabase.from("engines").select("*").order("created_at", { ascending: true });
    if (machineryId) q = q.eq("machinery_id", machineryId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        machineryId: r.machinery_id,
        engineCode: r.engine_code,
        engineName: r.engine_name,
        engineNumber: r.engine_number,
        serialNumber: r.serial_number,
        engineType: r.engine_type,
        make: r.make,
        model: r.model,
        fuelType: r.fuel_type,
        meterType: r.meter_type,
        openingReading: Number(r.opening_reading || 0),
        currentReading: Number(r.current_reading || 0),
        standardFuelEfficiency: r.standard_fuel_efficiency != null ? Number(r.standard_fuel_efficiency) : null,
        installationDate: r.installation_date,
        warrantyExpiry: r.warranty_expiry,
        status: r.status,
        remarks: r.remarks,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  const all = getLocal<Engine>("milestone_erp_engines", []);
  return machineryId ? all.filter((e) => e.machineryId === machineryId) : all;
}

export async function createEngine(engineData: Partial<Engine>): Promise<Engine> {
  if (supabase) {
    const payload: any = {
      machinery_id: engineData.machineryId,
      engine_code: engineData.engineCode,
      engine_name: engineData.engineName,
      engine_number: engineData.engineNumber || null,
      serial_number: engineData.serialNumber || null,
      engine_type: engineData.engineType || "main",
      make: engineData.make || null,
      model: engineData.model || null,
      fuel_type: engineData.fuelType || "Diesel",
      meter_type: engineData.meterType || "HOUR",
      opening_reading: engineData.openingReading || 0,
      current_reading: engineData.currentReading || engineData.openingReading || 0,
      standard_fuel_efficiency: engineData.standardFuelEfficiency != null ? Number(engineData.standardFuelEfficiency) : null,
      status: engineData.status || "active",
      remarks: engineData.remarks || null,
    };
    const { data, error } = await supabase.from("engines").insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      machineryId: data.machinery_id,
      engineCode: data.engine_code,
      engineName: data.engine_name,
      engineType: data.engine_type,
      meterType: data.meter_type,
      fuelType: data.fuel_type,
      openingReading: Number(data.opening_reading),
      currentReading: Number(data.current_reading),
      standardFuelEfficiency: data.standard_fuel_efficiency != null ? Number(data.standard_fuel_efficiency) : null,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  const all = getLocal<Engine>("milestone_erp_engines", []);
  const created: Engine = {
    id: `eng-${Date.now()}`,
    machineryId: engineData.machineryId || "",
    engineCode: engineData.engineCode || `ENG-${Date.now().toString().slice(-3)}`,
    engineName: engineData.engineName || "Engine",
    engineType: engineData.engineType || "main",
    fuelType: engineData.fuelType || "Diesel",
    meterType: engineData.meterType || "HOUR",
    openingReading: engineData.openingReading || 0,
    currentReading: engineData.currentReading || 0,
    status: engineData.status || "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocal("milestone_erp_engines", [...all, created]);
  return created;
}

export async function getFuelTanks(machineryId?: string): Promise<FuelTank[]> {
  if (supabase) {
    let q = supabase.from("fuel_tanks").select("*");
    if (machineryId) q = q.eq("machinery_id", machineryId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        machineryId: r.machinery_id,
        tankName: r.tank_name,
        tankNumber: r.tank_number,
        capacityLitres: Number(r.capacity_litres || 0),
        fuelType: r.fuel_type,
        status: r.status,
        remarks: r.remarks,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return [];
}

export async function createFuelTank(tankData: Partial<FuelTank>): Promise<FuelTank> {
  if (supabase) {
    const payload = {
      machinery_id: tankData.machineryId,
      tank_name: tankData.tankName || "Main Tank",
      tank_number: tankData.tankNumber || null,
      capacity_litres: tankData.capacityLitres || 200,
      fuel_type: tankData.fuelType || "Diesel",
      status: tankData.status || "active",
      remarks: tankData.remarks || null,
    };
    const { data, error } = await supabase.from("fuel_tanks").insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      machineryId: data.machinery_id,
      tankName: data.tank_name,
      tankNumber: data.tank_number,
      capacityLitres: Number(data.capacity_litres),
      fuelType: data.fuel_type,
      status: data.status,
      remarks: data.remarks,
    };
  }
  return {
    id: `tnk-${Date.now()}`,
    machineryId: tankData.machineryId || "",
    tankName: tankData.tankName || "Main Tank",
    capacityLitres: tankData.capacityLitres || 200,
    fuelType: "Diesel",
    status: "active",
  };
}

// ===========================================================================
// 12. STORE MASTER REPOSITORY
// ===========================================================================

export async function getStores(projectId?: string, siteId?: string): Promise<Store[]> {
  if (supabase) {
    let q = supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    if (siteId) q = q.eq("site_id", siteId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        siteId: r.site_id,
        storeCode: r.store_code,
        storeName: r.store_name,
        storeType: r.store_type,
        inChargePerson: r.in_charge_person,
        contactPhone: r.contact_phone,
        location: r.location,
        isActive: r.is_active,
        remarks: r.remarks,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  const all = getLocal<Store>("milestone_erp_stores", []);
  let filtered = all;
  if (projectId) filtered = filtered.filter((s) => s.projectId === projectId);
  if (siteId) filtered = filtered.filter((s) => s.siteId === siteId);
  return filtered;
}

export async function createStore(storeData: Partial<Store>): Promise<Store> {
  if (supabase) {
    const payload = {
      project_id: storeData.projectId,
      site_id: storeData.siteId,
      store_code: storeData.storeCode,
      store_name: storeData.storeName,
      store_type: storeData.storeType || "mechanical",
      in_charge_person: storeData.inChargePerson || null,
      contact_phone: storeData.contactPhone || null,
      location: storeData.location || null,
      is_active: storeData.isActive !== false,
      remarks: storeData.remarks || null,
    };
    const { data, error } = await supabase.from("stores").insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id,
      siteId: data.site_id,
      storeCode: data.store_code,
      storeName: data.store_name,
      storeType: data.store_type,
      inChargePerson: data.in_charge_person,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  const all = getLocal<Store>("milestone_erp_stores", []);
  const created: Store = {
    id: `str-${Date.now()}`,
    projectId: storeData.projectId || "",
    siteId: storeData.siteId || "",
    storeCode: storeData.storeCode || `STR-${Date.now().toString().slice(-4)}`,
    storeName: storeData.storeName || "Store",
    storeType: storeData.storeType || "mechanical",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocal("milestone_erp_stores", [...all, created]);
  return created;
}

// ===========================================================================
// 13. ITEM MASTER REPOSITORY
// ===========================================================================

export async function getItems(): Promise<Item[]> {
  if (supabase) {
    const { data, error } = await supabase.from("items").select("*").order("item_code", { ascending: true });
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        itemCode: r.item_code,
        itemName: r.item_name,
        category: r.category,
        subCategory: r.sub_category,
        itemType: r.item_type,
        uom: r.uom,
        hsnSac: r.hsn_sac,
        gstRatePercent: Number(r.gst_rate_percent || 18),
        minimumStock: Number(r.minimum_stock || 0),
        reorderLevel: Number(r.reorder_level || 0),
        maximumStock: r.maximum_stock ? Number(r.maximum_stock) : undefined,
        preferredVendorId: r.preferred_vendor_id,
        serialTracking: Boolean(r.serial_tracking),
        batchTracking: Boolean(r.batch_tracking),
        expiryTracking: Boolean(r.expiry_tracking),
        isActive: Boolean(r.is_active),
        description: r.description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return getLocal<Item>("milestone_erp_items", []);
}

export async function createItem(itemData: Partial<Item>): Promise<Item> {
  if (supabase) {
    const payload = {
      item_code: itemData.itemCode,
      item_name: itemData.itemName,
      category: itemData.category || "Mechanical",
      sub_category: itemData.subCategory || null,
      item_type: itemData.itemType || "spare_part",
      uom: itemData.uom || "Nos",
      hsn_sac: itemData.hsnSac || null,
      gst_rate_percent: itemData.gstRatePercent ?? 18,
      minimum_stock: itemData.minimumStock || 0,
      reorder_level: itemData.reorderLevel || 0,
      maximum_stock: itemData.maximumStock || null,
      preferred_vendor_id: itemData.preferredVendorId || null,
      serial_tracking: itemData.serialTracking || false,
      batch_tracking: itemData.batchTracking || false,
      expiry_tracking: itemData.expiryTracking || false,
      is_active: itemData.isActive !== false,
      description: itemData.description || null,
    };
    const { data, error } = await supabase.from("items").insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      itemCode: data.item_code,
      itemName: data.item_name,
      category: data.category,
      itemType: data.item_type,
      uom: data.uom,
      gstRatePercent: Number(data.gst_rate_percent),
      minimumStock: Number(data.minimum_stock),
      reorderLevel: Number(data.reorder_level),
      serialTracking: data.serial_tracking,
      batchTracking: data.batch_tracking,
      expiryTracking: data.expiry_tracking,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  const all = getLocal<Item>("milestone_erp_items", []);
  const created: Item = {
    id: `itm-${Date.now()}`,
    itemCode: itemData.itemCode || `ITM-${Date.now().toString().slice(-4)}`,
    itemName: itemData.itemName || "Item",
    category: itemData.category || "Mechanical",
    itemType: itemData.itemType || "spare_part",
    uom: itemData.uom || "Nos",
    gstRatePercent: itemData.gstRatePercent ?? 18,
    minimumStock: itemData.minimumStock || 0,
    reorderLevel: itemData.reorderLevel || 0,
    serialTracking: false,
    batchTracking: false,
    expiryTracking: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocal("milestone_erp_items", [...all, created]);
  return created;
}

// ===========================================================================
// 14. MATERIAL INWARD / GRN REPOSITORY
// ===========================================================================

export async function getMaterialInwards(filter?: { storeId?: string; projectId?: string }): Promise<MaterialInward[]> {
  if (supabase) {
    let q = supabase.from("material_inwards").select("*, vendors(name), material_inward_items(*, items(item_code, item_name))").order("created_at", { ascending: false });
    if (filter?.storeId) q = q.eq("store_id", filter.storeId);
    if (filter?.projectId) q = q.eq("project_id", filter.projectId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        grnNo: r.grn_no,
        grnDate: r.grn_date,
        projectId: r.project_id,
        siteId: r.site_id,
        storeId: r.store_id,
        vendorId: r.vendor_id,
        vendorName: r.vendors?.name || "Vendor",
        poReference: r.po_reference,
        invoiceNo: r.invoice_no,
        invoiceDate: r.invoice_date,
        challanNo: r.challan_no,
        receivedBy: r.received_by,
        approvedBy: r.approved_by,
        status: r.status,
        subtotalAmount: Number(r.subtotal_amount || 0),
        taxAmount: Number(r.tax_amount || 0),
        totalAmount: Number(r.total_amount || 0),
        remarks: r.remarks,
        items: (r.material_inward_items || []).map((i: any) => ({
          id: i.id,
          materialInwardId: i.material_inward_id,
          itemId: i.item_id,
          itemName: i.items?.item_name || "Item",
          itemCode: i.items?.item_code || "",
          quantity: Number(i.quantity),
          uom: i.uom,
          rate: Number(i.rate),
          taxableAmount: Number(i.taxable_amount),
          gstPercent: Number(i.gst_percent),
          gstAmount: Number(i.gst_amount),
          totalAmount: Number(i.total_amount),
          batchNo: i.batch_no,
          serialNo: i.serial_no,
          expiryDate: i.expiry_date,
          remarks: i.remarks,
        })),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return getLocal<MaterialInward>("milestone_erp_inwards", []);
}

export async function createMaterialInward(grnData: Partial<MaterialInward>, items: MaterialInwardItem[]): Promise<MaterialInward> {
  const grnNo = grnData.grnNo || `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
  const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.rate), 0);
  const tax = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.rate) * (Number(it.gstPercent || 18) / 100)), 0);
  const total = subtotal + tax;

  if (supabase) {
    const payload = {
      grn_no: grnNo,
      grn_date: grnData.grnDate || new Date().toISOString().slice(0, 10),
      project_id: grnData.projectId,
      site_id: grnData.siteId,
      store_id: grnData.storeId,
      vendor_id: grnData.vendorId,
      po_reference: grnData.poReference || null,
      invoice_no: grnData.invoiceNo || null,
      invoice_date: grnData.invoiceDate || null,
      challan_no: grnData.challanNo || null,
      received_by: grnData.receivedBy || null,
      status: grnData.status || "confirmed",
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      remarks: grnData.remarks || null,
    };
    const { data: grn, error: grnErr } = await supabase.from("material_inwards").insert(payload).select().single();
    if (grnErr) throw grnErr;

    const itemsPayload = items.map((i) => ({
      material_inward_id: grn.id,
      item_id: i.itemId,
      quantity: Number(i.quantity),
      uom: i.uom,
      rate: Number(i.rate),
      gst_percent: Number(i.gstPercent || 18),
      batch_no: i.batchNo || null,
      serial_no: i.serialNo || null,
      expiry_date: i.expiryDate || null,
      remarks: i.remarks || null,
    }));
    const { error: itemErr } = await supabase.from("material_inward_items").insert(itemsPayload);
    if (itemErr) throw itemErr;

    // If confirmed, post stock transactions atomically!
    if (payload.status === "confirmed") {
      const stockPayload = items.map((i) => ({
        project_id: grnData.projectId,
        site_id: grnData.siteId,
        store_id: grnData.storeId,
        item_id: i.itemId,
        transaction_type: "inward",
        reference_table: "material_inwards",
        reference_id: grn.id,
        reference_no: grn.grn_no,
        quantity: Number(i.quantity),
        uom: i.uom,
        unit_rate: Number(i.rate),
        transaction_date: payload.grn_date,
      }));
      await supabase.from("stock_transactions").insert(stockPayload);
    }

    return {
      id: grn.id,
      grnNo: grn.grn_no,
      grnDate: grn.grn_date,
      projectId: grn.project_id,
      siteId: grn.site_id,
      storeId: grn.store_id,
      vendorId: grn.vendor_id,
      status: grn.status,
      subtotalAmount: subtotal,
      taxAmount: tax,
      totalAmount: total,
      items,
    };
  }

  const all = getLocal<MaterialInward>("milestone_erp_inwards", []);
  const created: MaterialInward = {
    id: `grn-${Date.now()}`,
    grnNo,
    grnDate: grnData.grnDate || new Date().toISOString().slice(0, 10),
    projectId: grnData.projectId || "",
    siteId: grnData.siteId || "",
    storeId: grnData.storeId || "",
    vendorId: grnData.vendorId || "",
    status: grnData.status || "confirmed",
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
    items,
  };
  setLocal("milestone_erp_inwards", [...all, created]);
  return created;
}

// ===========================================================================
// 15. MATERIAL OUTWARD / STORE ISSUE REPOSITORY
// ===========================================================================

export async function getMaterialOutwards(filter?: { storeId?: string; projectId?: string; machineryId?: string }): Promise<MaterialOutward[]> {
  if (supabase) {
    let q = supabase.from("material_outwards").select("*, material_outward_items(*, items(item_code, item_name))").order("created_at", { ascending: false });
    if (filter?.storeId) q = q.eq("store_id", filter.storeId);
    if (filter?.projectId) q = q.eq("project_id", filter.projectId);
    if (filter?.machineryId) q = q.eq("machinery_id", filter.machineryId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        issueNo: r.issue_no,
        issueDate: r.issue_date,
        projectId: r.project_id,
        siteId: r.site_id,
        storeId: r.store_id,
        issuedTo: r.issued_to,
        department: r.department,
        machineryId: r.machinery_id,
        engineId: r.engine_id,
        maintenanceId: r.maintenance_id,
        breakdownId: r.breakdown_id,
        purpose: r.purpose,
        approvedBy: r.approved_by,
        issuedBy: r.issued_by,
        status: r.status,
        remarks: r.remarks,
        items: (r.material_outward_items || []).map((i: any) => ({
          id: i.id,
          materialOutwardId: i.material_outward_id,
          itemId: i.item_id,
          itemName: i.items?.item_name || "Item",
          itemCode: i.items?.item_code || "",
          quantity: Number(i.quantity),
          uom: i.uom,
          rate: Number(i.rate || 0),
          totalCost: Number(i.total_cost || 0),
          remarks: i.remarks,
        })),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return getLocal<MaterialOutward>("milestone_erp_outwards", []);
}

export async function createMaterialOutward(issueData: Partial<MaterialOutward>, items: MaterialOutwardItem[]): Promise<MaterialOutward> {
  const issueNo = issueData.issueNo || `ISS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

  // Stock Validation Check: Prevent negative stock
  if (supabase && issueData.storeId) {
    for (const it of items) {
      const available = await getAvailableItemStock(issueData.storeId, it.itemId);
      if (Number(it.quantity) > available) {
        throw new Error(`Stock validation failed: Requested ${it.quantity} ${it.uom}, but only ${available} ${it.uom} available in selected store.`);
      }
    }
  }

  if (supabase) {
    const payload = {
      issue_no: issueNo,
      issue_date: issueData.issueDate || new Date().toISOString().slice(0, 10),
      project_id: issueData.projectId,
      site_id: issueData.siteId,
      store_id: issueData.storeId,
      issued_to: issueData.issuedTo || "Site In-Charge",
      department: issueData.department || null,
      machinery_id: issueData.machineryId || null,
      engine_id: issueData.engineId || null,
      maintenance_id: issueData.maintenanceId || null,
      breakdown_id: issueData.breakdownId || null,
      purpose: issueData.purpose || "Machinery Repair",
      approved_by: issueData.approvedBy || null,
      issued_by: issueData.issuedBy || null,
      status: issueData.status || "confirmed",
      remarks: issueData.remarks || null,
    };

    const { data: outw, error: outwErr } = await supabase.from("material_outwards").insert(payload).select().single();
    if (outwErr) throw outwErr;

    const itemsPayload = items.map((i) => ({
      material_outward_id: outw.id,
      item_id: i.itemId,
      quantity: Number(i.quantity),
      uom: i.uom,
      rate: Number(i.rate || 0),
      remarks: i.remarks || null,
    }));
    const { error: itemErr } = await supabase.from("material_outward_items").insert(itemsPayload);
    if (itemErr) throw itemErr;

    // Post negative movement to stock transactions
    if (payload.status === "confirmed") {
      const stockPayload = items.map((i) => ({
        project_id: issueData.projectId,
        site_id: issueData.siteId,
        store_id: issueData.storeId,
        item_id: i.itemId,
        transaction_type: "outward",
        reference_table: "material_outwards",
        reference_id: outw.id,
        reference_no: outw.issue_no,
        quantity: -Math.abs(Number(i.quantity)),
        uom: i.uom,
        unit_rate: Number(i.rate || 0),
        transaction_date: payload.issue_date,
      }));
      await supabase.from("stock_transactions").insert(stockPayload);
    }

    return {
      id: outw.id,
      issueNo: outw.issue_no,
      issueDate: outw.issue_date,
      projectId: outw.project_id,
      siteId: outw.site_id,
      storeId: outw.store_id,
      issuedTo: outw.issued_to,
      purpose: outw.purpose,
      status: outw.status,
      items,
    };
  }

  const all = getLocal<MaterialOutward>("milestone_erp_outwards", []);
  const created: MaterialOutward = {
    id: `iss-${Date.now()}`,
    issueNo,
    issueDate: issueData.issueDate || new Date().toISOString().slice(0, 10),
    projectId: issueData.projectId || "",
    siteId: issueData.siteId || "",
    storeId: issueData.storeId || "",
    issuedTo: issueData.issuedTo || "Site In-Charge",
    purpose: issueData.purpose || "Machinery Repair",
    status: issueData.status || "confirmed",
    items,
  };
  setLocal("milestone_erp_outwards", [...all, created]);
  return created;
}

// ===========================================================================
// 16. STOCK LEDGER & REAL-TIME AVAILABLE BALANCE CALCULATION
// Formula: Sum of all stock_transactions for that Store & Item
// ===========================================================================

export async function getAvailableItemStock(storeId: string, itemId: string): Promise<number> {
  if (supabase) {
    const { data, error } = await supabase
      .from("stock_transactions")
      .select("quantity")
      .eq("store_id", storeId)
      .eq("item_id", itemId);
    if (!error && data) {
      return data.reduce((sum: number, r: any) => sum + Number(r.quantity), 0);
    }
  }
  return 999; // Default fallback if offline
}

export async function getStoreStock(storeId?: string, itemId?: string): Promise<StoreStockSummary[]> {
  const [items, stores] = await Promise.all([getItems(), getStores()]);

  if (supabase) {
    let q = supabase.from("stock_transactions").select("*");
    if (storeId) q = q.eq("store_id", storeId);
    if (itemId) q = q.eq("item_id", itemId);
    const { data: trans } = await q;

    const map: Record<string, number> = {};
    (trans || []).forEach((t: any) => {
      const key = `${t.store_id}_${t.item_id}`;
      map[key] = (map[key] || 0) + Number(t.quantity);
    });

    const result: StoreStockSummary[] = [];
    stores.forEach((st) => {
      if (storeId && st.id !== storeId) return;
      items.forEach((it) => {
        if (itemId && it.id !== itemId) return;
        const key = `${st.id}_${it.id}`;
        const qty = map[key] || 0;
        result.push({
          storeId: st.id,
          storeName: st.storeName,
          itemId: it.id,
          itemCode: it.itemCode,
          itemName: it.itemName,
          category: it.category,
          uom: it.uom,
          availableQuantity: qty,
          minimumStock: it.minimumStock,
          reorderLevel: it.reorderLevel,
          isLowStock: qty <= it.minimumStock && it.minimumStock > 0,
        });
      });
    });

    return result.filter((r) => r.availableQuantity > 0 || r.minimumStock > 0);
  }

  return [];
}

export async function getStockLedger(itemId?: string, storeId?: string): Promise<StockTransaction[]> {
  if (supabase) {
    let q = supabase.from("stock_transactions").select("*").order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
    if (itemId) q = q.eq("item_id", itemId);
    if (storeId) q = q.eq("store_id", storeId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        siteId: r.site_id,
        storeId: r.store_id,
        itemId: r.item_id,
        transactionType: r.transaction_type,
        referenceTable: r.reference_table,
        referenceId: r.reference_id,
        referenceNo: r.reference_no,
        quantity: Number(r.quantity),
        uom: r.uom,
        unitRate: Number(r.unit_rate),
        transactionDate: r.transaction_date,
        createdAt: r.created_at,
      }));
    }
  }
  return [];
}

export async function createStockAdjustment(
  adjustmentData: {
    projectId: string;
    siteId: string;
    storeId: string;
    reason: string;
    remarks?: string;
    approvedBy?: string;
  },
  items: { itemId: string; adjustmentType: "increase" | "decrease"; quantity: number; uom: string; remarks?: string }[]
): Promise<{ id: string; adjustmentNo: string }> {
  const adjNo = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
  const today = new Date().toISOString().slice(0, 10);

  if (supabase) {
    // 1. Insert stock_adjustment header
    const { data: adjData, error: adjErr } = await supabase
      .from("stock_adjustments")
      .insert({
        adjustment_no: adjNo,
        adjustment_date: today,
        project_id: adjustmentData.projectId,
        site_id: adjustmentData.siteId,
        store_id: adjustmentData.storeId,
        reason: adjustmentData.reason,
        status: "confirmed",
        approved_by: adjustmentData.approvedBy || null,
        remarks: adjustmentData.remarks || null,
      })
      .select()
      .single();
    if (adjErr) throw adjErr;

    // 2. Insert adjustment items
    for (const itm of items) {
      const { error: itmErr } = await supabase.from("stock_adjustment_items").insert({
        stock_adjustment_id: adjData.id,
        item_id: itm.itemId,
        adjustment_type: itm.adjustmentType,
        quantity: itm.quantity,
        uom: itm.uom,
        remarks: itm.remarks || null,
      });
      if (itmErr) throw itmErr;

      // 3. Post stock transaction (positive for increase, negative for decrease)
      const txnQty = itm.adjustmentType === "increase" ? itm.quantity : -itm.quantity;
      const txnType = itm.adjustmentType === "increase" ? "adjustment_pos" : "adjustment_neg";
      const { error: txErr } = await supabase.from("stock_transactions").insert({
        project_id: adjustmentData.projectId,
        site_id: adjustmentData.siteId,
        store_id: adjustmentData.storeId,
        item_id: itm.itemId,
        transaction_type: txnType,
        reference_table: "stock_adjustments",
        reference_id: adjData.id,
        reference_no: adjNo,
        quantity: txnQty,
        uom: itm.uom,
        unit_rate: 0,
        transaction_date: today,
      });
      if (txErr) throw txErr;
    }

    return { id: adjData.id, adjustmentNo: adjNo };
  }

  // localStorage fallback
  return { id: `adj-${Date.now()}`, adjustmentNo: adjNo };
}

// ===========================================================================
// 16B. STOCK TRANSFERS REPOSITORY (Store-to-Store Transfers)
// ===========================================================================

export async function getStockTransfers(filter?: { fromStoreId?: string; toStoreId?: string; projectId?: string }): Promise<StockTransfer[]> {
  if (supabase) {
    let q = supabase.from("stock_transfers").select("*, stock_transfer_items(*, items(item_code, item_name))").order("created_at", { ascending: false });
    if (filter?.fromStoreId) q = q.eq("from_store_id", filter.fromStoreId);
    if (filter?.toStoreId) q = q.eq("to_store_id", filter.toStoreId);
    if (filter?.projectId) q = q.or(`from_project_id.eq.${filter.projectId},to_project_id.eq.${filter.projectId}`);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        transferNo: r.transfer_no,
        transferDate: r.transfer_date,
        fromProjectId: r.from_project_id,
        fromSiteId: r.from_site_id,
        fromStoreId: r.from_store_id,
        toProjectId: r.to_project_id,
        toSiteId: r.to_site_id,
        toStoreId: r.to_store_id,
        issuedBy: r.issued_by,
        receivedBy: r.received_by,
        status: r.status,
        reason: r.reason,
        items: (r.stock_transfer_items || []).map((i: any) => ({
          id: i.id,
          stockTransferId: i.stock_transfer_id,
          itemId: i.item_id,
          itemName: i.items?.item_name || "Item",
          itemCode: i.items?.item_code || "",
          quantity: Number(i.quantity),
          uom: i.uom,
          remarks: i.remarks,
        })),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return getLocal<StockTransfer>("milestone_erp_transfers", []);
}

export async function createStockTransfer(
  transferData: Partial<StockTransfer>,
  items: StockTransferItem[]
): Promise<StockTransfer> {
  const transferNo = transferData.transferNo || `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
  const status: TransferStatus = transferData.status || "received";

  if (transferData.fromStoreId === transferData.toStoreId) {
    throw new Error("Source store and Destination store cannot be the same.");
  }

  // Stock Validation Check: only when confirmed / affecting stock
  if (status === "received" || status === "in_transit") {
    if (supabase && transferData.fromStoreId) {
      for (const it of items) {
        const available = await getAvailableItemStock(transferData.fromStoreId, it.itemId);
        if (Number(it.quantity) > available) {
          throw new Error(`Stock transfer failed: Requested ${it.quantity} ${it.uom}, but only ${available} ${it.uom} available in source store.`);
        }
      }
    }
  }

  if (supabase) {
    const payload = {
      transfer_no: transferNo,
      transfer_date: transferData.transferDate || new Date().toISOString().slice(0, 10),
      from_project_id: transferData.fromProjectId,
      from_site_id: transferData.fromSiteId,
      from_store_id: transferData.fromStoreId,
      to_project_id: transferData.toProjectId,
      to_site_id: transferData.toSiteId,
      to_store_id: transferData.toStoreId,
      issued_by: transferData.issuedBy || null,
      received_by: transferData.receivedBy || null,
      status: status,
      reason: transferData.reason || null,
    };
    const { data: header, error: headErr } = await supabase.from("stock_transfers").insert(payload).select().single();
    if (headErr) throw headErr;

    for (const it of items) {
      const { error: itErr } = await supabase.from("stock_transfer_items").insert({
        stock_transfer_id: header.id,
        item_id: it.itemId,
        quantity: it.quantity,
        uom: it.uom,
        remarks: it.remarks || null,
      });
      if (itErr) throw itErr;

      // When confirmed ('received'):
      // 1. Decrease from source store (transfer_out)
      // 2. Increase to destination store (transfer_in)
      if (status === "received") {
        await supabase.from("stock_transactions").insert({
          project_id: transferData.fromProjectId,
          site_id: transferData.fromSiteId,
          store_id: transferData.fromStoreId,
          item_id: it.itemId,
          transaction_type: "transfer_out",
          reference_table: "stock_transfers",
          reference_id: header.id,
          reference_no: transferNo,
          quantity: -Number(it.quantity),
          uom: it.uom,
          unit_rate: 0,
          transaction_date: header.transfer_date,
        });

        await supabase.from("stock_transactions").insert({
          project_id: transferData.toProjectId,
          site_id: transferData.toSiteId,
          store_id: transferData.toStoreId,
          item_id: it.itemId,
          transaction_type: "transfer_in",
          reference_table: "stock_transfers",
          reference_id: header.id,
          reference_no: transferNo,
          quantity: Number(it.quantity),
          uom: it.uom,
          unit_rate: 0,
          transaction_date: header.transfer_date,
        });
      }
    }

    return {
      id: header.id,
      transferNo: header.transfer_no,
      transferDate: header.transfer_date,
      fromProjectId: header.from_project_id,
      fromSiteId: header.from_site_id,
      fromStoreId: header.from_store_id,
      toProjectId: header.to_project_id,
      toSiteId: header.to_site_id,
      toStoreId: header.to_store_id,
      issuedBy: header.issued_by,
      receivedBy: header.received_by,
      status: header.status,
      reason: header.reason,
      items,
      createdAt: header.created_at,
      updatedAt: header.updated_at,
    };
  }

  const all = getLocal<StockTransfer>("milestone_erp_transfers", []);
  const created: StockTransfer = {
    id: `trf-${Date.now()}`,
    transferNo,
    transferDate: transferData.transferDate || new Date().toISOString().slice(0, 10),
    fromProjectId: transferData.fromProjectId || "",
    fromSiteId: transferData.fromSiteId || "",
    fromStoreId: transferData.fromStoreId || "",
    toProjectId: transferData.toProjectId || "",
    toSiteId: transferData.toSiteId || "",
    toStoreId: transferData.toStoreId || "",
    status,
    items,
  };
  setLocal("milestone_erp_transfers", [...all, created]);
  return created;
}

// ===========================================================================
// 16C. MATERIAL RETURNS REPOSITORY (Store Returns & Vendor Returns)
// ===========================================================================

export async function getMaterialReturns(filter?: { storeId?: string; projectId?: string; returnType?: string }): Promise<MaterialReturn[]> {
  if (supabase) {
    let q = supabase.from("material_returns").select("*, material_return_items(*, items(item_code, item_name)), vendors(name, vendor_code)").order("created_at", { ascending: false });
    if (filter?.storeId) q = q.eq("store_id", filter.storeId);
    if (filter?.projectId) q = q.eq("project_id", filter.projectId);
    if (filter?.returnType) q = q.eq("return_type", filter.returnType);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        returnNo: r.return_no,
        returnDate: r.return_date,
        returnType: r.return_type,
        projectId: r.project_id,
        siteId: r.site_id,
        storeId: r.store_id,
        vendorId: r.vendor_id,
        vendorName: r.vendors?.name,
        machineryId: r.machinery_id,
        returnedBy: r.returned_by,
        approvedBy: r.approved_by,
        status: r.status,
        reason: r.reason,
        items: (r.material_return_items || []).map((i: any) => ({
          id: i.id,
          materialReturnId: i.material_return_id,
          itemId: i.item_id,
          itemName: i.items?.item_name || "Item",
          itemCode: i.items?.item_code || "",
          quantity: Number(i.quantity),
          uom: i.uom,
          remarks: i.remarks,
        })),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  return getLocal<MaterialReturn>("milestone_erp_returns", []);
}

export async function createMaterialReturn(
  returnData: Partial<MaterialReturn>,
  items: MaterialReturnItem[]
): Promise<MaterialReturn> {
  const returnNo = returnData.returnNo || `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
  const status = returnData.status || "confirmed";
  const returnType = returnData.returnType || "store_return";

  // For vendor_return: validate store stock before returning
  if (returnType === "vendor_return" && status === "confirmed") {
    if (supabase && returnData.storeId) {
      for (const it of items) {
        const available = await getAvailableItemStock(returnData.storeId, it.itemId);
        if (Number(it.quantity) > available) {
          throw new Error(`Vendor return failed: Requested ${it.quantity} ${it.uom}, but only ${available} ${it.uom} available in store.`);
        }
      }
    }
  }

  if (supabase) {
    const payload = {
      return_no: returnNo,
      return_date: returnData.returnDate || new Date().toISOString().slice(0, 10),
      return_type: returnType,
      project_id: returnData.projectId,
      site_id: returnData.siteId,
      store_id: returnData.storeId,
      vendor_id: returnType === "vendor_return" ? (returnData.vendorId || null) : null,
      machinery_id: returnData.machineryId || null,
      returned_by: returnData.returnedBy || null,
      approved_by: returnData.approvedBy || null,
      status: status,
      reason: returnData.reason || null,
    };
    const { data: header, error: headErr } = await supabase.from("material_returns").insert(payload).select().single();
    if (headErr) throw headErr;

    for (const it of items) {
      const { error: itErr } = await supabase.from("material_return_items").insert({
        material_return_id: header.id,
        item_id: it.itemId,
        quantity: it.quantity,
        uom: it.uom,
        remarks: it.remarks || null,
      });
      if (itErr) throw itErr;

      // When confirmed:
      // Store Return: material returned back to store -> increases stock (return_in, +quantity)
      // Vendor Return: store sends material back to vendor -> decreases stock (return_out, -quantity)
      if (status === "confirmed") {
        const txnType = returnType === "store_return" ? "return_in" : "return_out";
        const txnQty = returnType === "store_return" ? Number(it.quantity) : -Number(it.quantity);

        await supabase.from("stock_transactions").insert({
          project_id: returnData.projectId,
          site_id: returnData.siteId,
          store_id: returnData.storeId,
          item_id: it.itemId,
          transaction_type: txnType,
          reference_table: "material_returns",
          reference_id: header.id,
          reference_no: returnNo,
          quantity: txnQty,
          uom: it.uom,
          unit_rate: 0,
          transaction_date: header.return_date,
        });
      }
    }

    return {
      id: header.id,
      returnNo: header.return_no,
      returnDate: header.return_date,
      returnType: header.return_type,
      projectId: header.project_id,
      siteId: header.site_id,
      storeId: header.store_id,
      vendorId: header.vendor_id,
      machineryId: header.machinery_id,
      returnedBy: header.returned_by,
      approvedBy: header.approved_by,
      status: header.status,
      reason: header.reason,
      items,
      createdAt: header.created_at,
      updatedAt: header.updated_at,
    };
  }

  const all = getLocal<MaterialReturn>("milestone_erp_returns", []);
  const created: MaterialReturn = {
    id: `ret-${Date.now()}`,
    returnNo,
    returnDate: returnData.returnDate || new Date().toISOString().slice(0, 10),
    returnType,
    projectId: returnData.projectId || "",
    siteId: returnData.siteId || "",
    storeId: returnData.storeId || "",
    status,
    items,
  };
  setLocal("milestone_erp_returns", [...all, created]);
  return created;
}

// ===========================================================================
// 17. ASSET MASTER REPOSITORY
// ===========================================================================

export async function getAssets(projectId?: string, siteId?: string): Promise<Asset[]> {
  if (supabase) {
    let q = supabase.from("assets").select("*").order("asset_code", { ascending: true });
    if (projectId) q = q.eq("project_id", projectId);
    if (siteId) q = q.eq("site_id", siteId);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        assetCode: r.asset_code,
        assetName: r.asset_name,
        category: r.category,
        serialNumber: r.serial_number,
        make: r.make,
        model: r.model,
        purchaseDate: r.purchase_date,
        purchaseCost: r.purchase_cost ? Number(r.purchase_cost) : undefined,
        vendorId: r.vendor_id,
        projectId: r.project_id,
        siteId: r.site_id,
        location: r.location,
        department: r.department,
        warrantyExpiry: r.warranty_expiry,
        amcDetails: r.amc_details,
        status: r.status,
        currentCondition: r.current_condition,
        remarks: r.remarks,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  }
  const all = getLocal<Asset>("milestone_erp_assets", []);
  let filtered = all;
  if (projectId) filtered = filtered.filter((a) => a.projectId === projectId);
  if (siteId) filtered = filtered.filter((a) => a.siteId === siteId);
  return filtered;
}

export async function createAsset(assetData: Partial<Asset>): Promise<Asset> {
  if (supabase) {
    const payload = {
      asset_code: assetData.assetCode || `AST-${Date.now().toString().slice(-4)}`,
      asset_name: assetData.assetName,
      category: assetData.category || "Power Generator",
      serial_number: assetData.serialNumber || null,
      make: assetData.make || null,
      model: assetData.model || null,
      purchase_date: assetData.purchaseDate || null,
      purchase_cost: assetData.purchaseCost || null,
      vendor_id: assetData.vendorId || null,
      project_id: assetData.projectId,
      site_id: assetData.siteId,
      location: assetData.location || null,
      department: assetData.department || "Plant & Machinery",
      status: assetData.status || "active",
      current_condition: assetData.currentCondition || "Good",
      remarks: assetData.remarks || null,
    };
    const { data, error } = await supabase.from("assets").insert(payload).select().single();
    if (error) throw error;
    return {
      id: data.id,
      assetCode: data.asset_code,
      assetName: data.asset_name,
      category: data.category,
      projectId: data.project_id,
      siteId: data.site_id,
      status: data.status,
      currentCondition: data.current_condition,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  const all = getLocal<Asset>("milestone_erp_assets", []);
  const created: Asset = {
    id: `ast-${Date.now()}`,
    assetCode: assetData.assetCode || `AST-${Date.now().toString().slice(-4)}`,
    assetName: assetData.assetName || "Fixed Asset",
    category: assetData.category || "Power Generator",
    projectId: assetData.projectId || "",
    siteId: assetData.siteId || "",
    status: assetData.status || "active",
    currentCondition: "Good",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocal("milestone_erp_assets", [...all, created]);
  return created;
}

export async function transferAsset(
  assetId: string,
  toProjectId: string,
  toSiteId: string,
  transferredBy?: string,
  remarks?: string
): Promise<AssetTransfer> {
  if (supabase) {
    const { data: curAsset } = await supabase.from("assets").select("project_id, site_id").eq("id", assetId).single();
    const fromProjectId = curAsset?.project_id;
    const fromSiteId = curAsset?.site_id;

    // 1. Insert into asset_transfers
    const { data: trans, error: transErr } = await supabase.from("asset_transfers").insert({
      asset_id: assetId,
      from_project_id: fromProjectId,
      from_site_id: fromSiteId,
      to_project_id: toProjectId,
      to_site_id: toSiteId,
      transfer_date: new Date().toISOString().slice(0, 10),
      transferred_by: transferredBy || "Plant Manager",
      status: "completed",
      remarks: remarks || null,
    }).select().single();

    if (transErr) throw transErr;

    // 2. Update current asset location
    await supabase.from("assets").update({
      project_id: toProjectId,
      site_id: toSiteId,
    }).eq("id", assetId);

    return {
      id: trans.id,
      assetId: trans.asset_id,
      fromProjectId: trans.from_project_id,
      fromSiteId: trans.from_site_id,
      toProjectId: trans.to_project_id,
      toSiteId: trans.to_site_id,
      transferDate: trans.transfer_date,
      status: trans.status,
      remarks: trans.remarks,
      createdAt: trans.created_at,
    };
  }
  return {
    id: `at-${Date.now()}`,
    assetId,
    fromProjectId: "",
    fromSiteId: "",
    toProjectId,
    toSiteId,
    transferDate: new Date().toISOString().slice(0, 10),
    status: "completed",
  };
}

