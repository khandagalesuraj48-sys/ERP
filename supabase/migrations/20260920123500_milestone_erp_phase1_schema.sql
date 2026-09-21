-- ===========================================================================
-- MILESTONE ERP — Phase 1 Database Schema Migration
-- Product: Construction Machinery & Mechanical ERP
-- Created: 2026-09-20
--
-- CORE DESIGN PRINCIPLES:
-- 1. Machinery is the central operational asset.
-- 2. Dual meter tracking: KM vs HOUR strictly separated.
-- 3. NO fuel stock, inward, depot, or tank inventory tables.
--    Fuel is issued DIRECTLY to machinery.
-- 4. UUID primary keys with separate human-readable identifiers.
-- 5. Audit-ready: created_at, updated_at, created_by, updated_by, organization_id.
-- ===========================================================================

-- Enable pgcrypto / uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Trigger Function: Automatic updated_at timestamp maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 1. PROJECTS (Construction Projects Master)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_name TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('bidding', 'active', 'on_hold', 'completed', 'archived')),
  start_date DATE NULL,
  target_completion_date DATE NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 2. SITES (Physical Work Sites & Project Stretches)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  code VARCHAR(32) NOT NULL,
  name TEXT NOT NULL,
  address TEXT NULL,
  in_charge_person TEXT NULL,
  contact_phone VARCHAR(20) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  -- Note: uq_site_project_code automatically creates a B-tree index on (project_id, code),
  -- which also serves queries filtering by project_id alone without needing a redundant index.
  CONSTRAINT uq_site_project_code UNIQUE (project_id, code)
);

CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 3. VENDORS (Workshops, OEM Dealers & Service Providers)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  vendor_code VARCHAR(32) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  vendor_type VARCHAR(30) NOT NULL DEFAULT 'workshop' CHECK (vendor_type IN ('workshop', 'oem_dealer', 'spare_parts', 'fuel_agency', 'lubricants', 'other')),
  contact_person TEXT NULL,
  phone VARCHAR(20) NULL,
  email TEXT NULL,
  gstin VARCHAR(15) NULL,
  address TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 4. MACHINERY (Central Equipment / Asset Master)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.machinery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  asset_code VARCHAR(32) NOT NULL UNIQUE,
  registration_no VARCHAR(32) NULL, -- Nullable: Non-road equipment (generators, compactors, rollers) may lack RTO registration
  machinery_name TEXT NOT NULL,
  machinery_type VARCHAR(50) NOT NULL, -- Tipper, Transit Mixer, Roller, Compactor, Excavator, Loader, Water Tanker, Pickup, Generator, Other
  category VARCHAR(50) NOT NULL DEFAULT 'Earthmoving',
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year_of_manufacture INT NULL CHECK (year_of_manufacture >= 1990 AND year_of_manufacture <= 2050),
  capacity VARCHAR(50) NULL,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Diesel' CHECK (fuel_type IN ('Diesel', 'Petrol', 'CNG', 'Electric', 'Other')),
  meter_type VARCHAR(10) NOT NULL CHECK (meter_type IN ('KM', 'HOUR')),
  current_project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Application-level validation ensures current_site_id belongs to current_project_id
  current_site_id UUID NULL REFERENCES public.sites(id) ON DELETE SET NULL,
  department VARCHAR(50) NOT NULL DEFAULT 'Plant & Machinery',
  opening_reading NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (opening_reading >= 0),
  current_reading NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_reading >= 0), -- Operational value; no permanent >= opening_reading constraint to permit legitimate meter replacements/resets
  purchase_date DATE NULL,
  insurance_expiry DATE NULL,
  puc_expiry DATE NULL,
  fitness_expiry DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_repair', 'inactive', 'archived')),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

-- Prevent duplicate non-null registration numbers while allowing multiple nulls for non-road equipment
CREATE UNIQUE INDEX IF NOT EXISTS idx_machinery_registration_no_unique
  ON public.machinery(registration_no)
  WHERE registration_no IS NOT NULL;

CREATE TRIGGER trg_machinery_updated_at
  BEFORE UPDATE ON public.machinery
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 5. FUEL_ISSUES (Direct Machine Fuel Issuance — NO Stock/Inward Holding)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.fuel_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  issue_no VARCHAR(32) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_time TIME NULL,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE RESTRICT,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Application-level validation ensures site_id belongs to project_id
  site_id UUID NULL REFERENCES public.sites(id) ON DELETE SET NULL,
  meter_reading NUMERIC(12, 2) NOT NULL CHECK (meter_reading >= 0),
  is_meter_reset BOOLEAN NOT NULL DEFAULT false,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Diesel' CHECK (fuel_type IN ('Diesel', 'Petrol', 'CNG', 'Electric', 'Other')),
  quantity_litres NUMERIC(10, 2) NOT NULL CHECK (quantity_litres > 0),
  rate_per_litre NUMERIC(10, 2) NOT NULL CHECK (rate_per_litre >= 0),
  amount NUMERIC(14, 2) GENERATED ALWAYS AS (quantity_litres * rate_per_litre) STORED,
  fuel_source VARCHAR(50) NOT NULL DEFAULT 'Site Bowser' CHECK (fuel_source IN ('Site Bowser', 'Retail Pump', 'Mobile Tanker', 'Barrel', 'Other')),
  slip_reference VARCHAR(64) NULL,
  operator_name TEXT NULL,
  issued_by TEXT NULL,
  remarks TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_fuel_issues_updated_at
  BEFORE UPDATE ON public.fuel_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 6. LOG_BOOKS (Daily Equipment Running Log Book)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.log_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  log_no VARCHAR(32) NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE RESTRICT,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Application-level validation ensures site_id belongs to project_id
  site_id UUID NULL REFERENCES public.sites(id) ON DELETE SET NULL,
  opening_reading NUMERIC(12, 2) NOT NULL CHECK (opening_reading >= 0),
  closing_reading NUMERIC(12, 2) NOT NULL CHECK (closing_reading >= opening_reading),
  total_km_hours NUMERIC(12, 2) GENERATED ALWAYS AS (closing_reading - opening_reading) STORED,
  start_time TIME NULL,
  end_time TIME NULL,
  working_hours NUMERIC(5, 2) NULL CHECK (working_hours >= 0 AND working_hours <= 24),
  breakdown_hours NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (breakdown_hours >= 0 AND breakdown_hours <= 24),
  operator_name TEXT NULL,
  trips INT NOT NULL DEFAULT 0 CHECK (trips >= 0),
  work_description TEXT NULL,
  remarks TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_log_books_updated_at
  BEFORE UPDATE ON public.log_books
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 7. BREAKDOWNS (Unscheduled Downtime Incidents)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  breakdown_no VARCHAR(32) NOT NULL UNIQUE,
  breakdown_date DATE NOT NULL DEFAULT CURRENT_DATE,
  breakdown_time TIME NULL,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE RESTRICT,
  current_reading NUMERIC(12, 2) NOT NULL CHECK (current_reading >= 0),
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Application-level validation ensures site_id belongs to project_id
  site_id UUID NULL REFERENCES public.sites(id) ON DELETE SET NULL,
  reported_by TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  priority VARCHAR(15) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(25) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_inspection', 'waiting_for_parts', 'under_repair', 'completed', 'cancelled')),
  resolution_date TIMESTAMPTZ NULL,
  resolution_notes TEXT NULL,
  downtime_hours NUMERIC(8, 2) NULL CHECK (downtime_hours >= 0),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_breakdowns_updated_at
  BEFORE UPDATE ON public.breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 8. MAINTENANCE_RECORDS (Preventive, Service & Overhaul Records)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  maintenance_no VARCHAR(32) NOT NULL UNIQUE,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE RESTRICT,
  breakdown_id UUID NULL REFERENCES public.breakdowns(id) ON DELETE SET NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_reading NUMERIC(12, 2) NOT NULL CHECK (current_reading >= 0),
  maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('preventive', 'breakdown', 'corrective', 'service', 'inspection')),
  complaint TEXT NULL,
  diagnosis TEXT NULL,
  work_performed TEXT NULL,
  -- TODO: Phase 3 will introduce dedicated junction table `maintenance_parts` referencing `store_items`/`spare_parts`
  required_parts TEXT NULL,
  vendor_id UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  quotation_reference VARCHAR(64) NULL,
  estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (actual_cost >= 0),
  parts_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
  labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (labour_cost >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  work_start_date DATE NULL,
  completion_date DATE NULL,
  next_service_reading NUMERIC(12, 2) NULL,
  next_service_date DATE NULL,
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 9. ATTACHMENTS (Documents, Photos, Compliance & Quotations)
-- Polymorphic table: entity_type + entity_id (validated at application layer)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('machinery', 'breakdown', 'maintenance', 'compliance', 'fuel')),
  entity_id UUID NOT NULL, -- Polymorphic reference to machinery.id, breakdowns.id, or maintenance_records.id (validated at application level; no DB foreign key)
  document_type VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (document_type IN ('insurance', 'puc', 'fitness', 'road_tax', 'quotation', 'invoice', 'repair_photo', 'general')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage object path (e.g. 'documents/2026/09/uuid.pdf') — not a public URL requirement
  file_size_bytes BIGINT NULL,
  mime_type VARCHAR(100) NULL,
  expiry_date DATE NULL, -- Populated for statutory compliance docs (Insurance, PUC, Fitness)
  uploaded_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- INDEXES FOR PERFORMANCE & RELATIONAL INTEGRITY
-- Total Explicit Indexes: 26
-- (Note: Primary keys, code UNIQUE, and uq_site_project_code have their own automatic indexes)
-- ===========================================================================

-- Machinery
CREATE INDEX IF NOT EXISTS idx_machinery_status ON public.machinery(status);
CREATE INDEX IF NOT EXISTS idx_machinery_project_site ON public.machinery(current_project_id, current_site_id);
CREATE INDEX IF NOT EXISTS idx_machinery_type ON public.machinery(machinery_type);
CREATE INDEX IF NOT EXISTS idx_machinery_meter_type ON public.machinery(meter_type);
CREATE INDEX IF NOT EXISTS idx_machinery_org ON public.machinery(organization_id);

-- Fuel Issues
CREATE INDEX IF NOT EXISTS idx_fuel_issues_machinery ON public.fuel_issues(machinery_id);
CREATE INDEX IF NOT EXISTS idx_fuel_issues_date ON public.fuel_issues(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_issues_project_site ON public.fuel_issues(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_fuel_issues_org ON public.fuel_issues(organization_id);

-- Daily Log Books
CREATE INDEX IF NOT EXISTS idx_log_books_machinery ON public.log_books(machinery_id);
CREATE INDEX IF NOT EXISTS idx_log_books_date ON public.log_books(date DESC);
CREATE INDEX IF NOT EXISTS idx_log_books_project_site ON public.log_books(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_log_books_org ON public.log_books(organization_id);

-- Breakdowns
CREATE INDEX IF NOT EXISTS idx_breakdowns_machinery ON public.breakdowns(machinery_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON public.breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_priority ON public.breakdowns(priority);
CREATE INDEX IF NOT EXISTS idx_breakdowns_date ON public.breakdowns(breakdown_date DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_org ON public.breakdowns(organization_id);

-- Maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_machinery ON public.maintenance_records(machinery_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vendor ON public.maintenance_records(vendor_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdown ON public.maintenance_records(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_service_date ON public.maintenance_records(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_org ON public.maintenance_records(organization_id);

-- Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_document_type ON public.attachments(document_type);
CREATE INDEX IF NOT EXISTS idx_attachments_expiry_date ON public.attachments(expiry_date) WHERE expiry_date IS NOT NULL;
