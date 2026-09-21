-- ============================================================================
-- MILESTONE ERP — MASTER PRODUCTION UPGRADE MIGRATION
-- Machinery + Engine + Log Book + Fuel + Consumption + Average + Compliance
-- Additive migration only. Preserves all existing tables and data.
-- ============================================================================

-- 1. ADDITIVE COLUMNS TO PUBLIC.MACHINERY
ALTER TABLE public.machinery 
  ADD COLUMN IF NOT EXISTS ownership VARCHAR(20) NOT NULL DEFAULT 'own',
  ADD COLUMN IF NOT EXISTS vendor_id UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS meter_configuration VARCHAR(20) NOT NULL DEFAULT 'single_km',
  ADD COLUMN IF NOT EXISTS permit_expiry DATE NULL,
  ADD COLUMN IF NOT EXISTS road_tax_expiry DATE NULL,
  ADD COLUMN IF NOT EXISTS insurance_doc_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS puc_doc_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS fitness_doc_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS permit_doc_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS road_tax_doc_no VARCHAR(100) NULL;

-- 2. INDEXES FOR MACHINERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_machinery_ownership ON public.machinery(ownership);
CREATE INDEX IF NOT EXISTS idx_machinery_registration_status ON public.machinery(registration_status);
CREATE INDEX IF NOT EXISTS idx_machinery_vendor_id ON public.machinery(vendor_id);
CREATE INDEX IF NOT EXISTS idx_machinery_meter_config ON public.machinery(meter_configuration);

-- 3. ENSURE LOG_BOOKS HAS ALL REQUIRED COLUMNS & PROPER SIZE
ALTER TABLE public.log_books 
  ALTER COLUMN log_no TYPE VARCHAR(64);

ALTER TABLE public.log_books 
  ADD COLUMN IF NOT EXISTS engine_id UUID NULL REFERENCES public.engines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_meter_reset BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. ENSURE ENGINES TABLE HAS STANDARD FUEL EFFICIENCY
ALTER TABLE public.engines 
  ADD COLUMN IF NOT EXISTS standard_fuel_efficiency NUMERIC(10, 2) NULL;

-- 5. INDEXES FOR FASTER LOOKUP
CREATE INDEX IF NOT EXISTS idx_log_books_machinery_engine_date 
  ON public.log_books(machinery_id, engine_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_issues_machinery_engine_date 
  ON public.fuel_issues(machinery_id, issue_date DESC);

