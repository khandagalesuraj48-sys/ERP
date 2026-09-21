-- ===========================================================================
-- MILESTONE ERP — Master ERP Upgrade Migration (Phase 2)
-- Product: Construction Machinery, Mechanical, Store, Inventory & Assets
-- Created: 2026-09-20
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. ADDITIVE ENHANCEMENTS TO EXISTING TABLES (Zero Data Loss)
-- ---------------------------------------------------------------------------

-- 1.1 Projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS location TEXT NULL,
  ADD COLUMN IF NOT EXISTS expected_end_date DATE NULL,
  ADD COLUMN IF NOT EXISTS actual_completion_date DATE NULL,
  ADD COLUMN IF NOT EXISTS project_manager TEXT NULL,
  ADD COLUMN IF NOT EXISTS remarks TEXT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 1.2 Sites
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS chainage_location TEXT NULL,
  ADD COLUMN IF NOT EXISTS has_store BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS remarks TEXT NULL;

-- 1.3 Machinery
ALTER TABLE public.machinery
  ADD COLUMN IF NOT EXISTS engine_config VARCHAR(20) NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS fuel_tank_capacity NUMERIC(10,2) NULL;

-- 1.4 Vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS pan VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS bank_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT NULL,
  ADD COLUMN IF NOT EXISTS credit_days INTEGER NOT NULL DEFAULT 30;

-- 1.5 Fuel Issues
ALTER TABLE public.fuel_issues
  ADD COLUMN IF NOT EXISTS tank_id UUID NULL,
  ADD COLUMN IF NOT EXISTS allocation_mode VARCHAR(20) NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS engine_id UUID NULL;

-- 1.6 Maintenance Records
ALTER TABLE public.maintenance_records
  ADD COLUMN IF NOT EXISTS engine_id UUID NULL;


-- ---------------------------------------------------------------------------
-- 2. ENGINES (Multi-Engine & Engine Master)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE CASCADE,
  engine_code VARCHAR(32) NOT NULL,
  engine_name VARCHAR(100) NOT NULL,
  engine_number VARCHAR(50) NULL,
  serial_number VARCHAR(50) NULL,
  engine_type VARCHAR(50) NOT NULL DEFAULT 'main' CHECK (engine_type IN ('main', 'auxiliary', 'drum', 'pump', 'hydraulic', 'other')),
  make VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Diesel',
  meter_type VARCHAR(10) NOT NULL DEFAULT 'HOUR' CHECK (meter_type IN ('KM', 'HOUR')),
  opening_reading NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_reading >= 0),
  current_reading NUMERIC(12,2) NOT NULL DEFAULT 0,
  installation_date DATE NULL,
  warranty_expiry DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_repair', 'inactive', 'replaced')),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  CONSTRAINT uq_machinery_engine_code UNIQUE (machinery_id, engine_code)
);

CREATE TRIGGER trg_engines_updated_at
  BEFORE UPDATE ON public.engines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_engines_machinery ON public.engines(machinery_id);
CREATE INDEX IF NOT EXISTS idx_engines_status ON public.engines(status);


-- ---------------------------------------------------------------------------
-- 3. FUEL TANKS (Equipment-Attached Physical Tanks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fuel_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  machinery_id UUID NOT NULL REFERENCES public.machinery(id) ON DELETE CASCADE,
  tank_name VARCHAR(50) NOT NULL DEFAULT 'Main Tank',
  tank_number VARCHAR(32) NULL,
  capacity_litres NUMERIC(10,2) NOT NULL CHECK (capacity_litres > 0),
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Diesel',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'damaged')),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_machinery_tank_name UNIQUE (machinery_id, tank_name)
);

CREATE TRIGGER trg_fuel_tanks_updated_at
  BEFORE UPDATE ON public.fuel_tanks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_fuel_tanks_machinery ON public.fuel_tanks(machinery_id);


-- ---------------------------------------------------------------------------
-- 4. FUEL ISSUE ALLOCATIONS (Multi-Engine Fuel Allocation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fuel_issue_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_issue_id UUID NOT NULL REFERENCES public.fuel_issues(id) ON DELETE CASCADE,
  engine_id UUID NOT NULL REFERENCES public.engines(id) ON DELETE RESTRICT,
  allocated_litres NUMERIC(10,2) NOT NULL CHECK (allocated_litres > 0),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fuel_issue_alloc_issue ON public.fuel_issue_allocations(fuel_issue_id);
CREATE INDEX IF NOT EXISTS idx_fuel_issue_alloc_engine ON public.fuel_issue_allocations(engine_id);


-- ---------------------------------------------------------------------------
-- 5. STORES (Store Master: Project -> Site -> Store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_code VARCHAR(32) NOT NULL UNIQUE,
  store_name VARCHAR(100) NOT NULL,
  store_type VARCHAR(50) NOT NULL DEFAULT 'mechanical' CHECK (store_type IN ('mechanical', 'general', 'electrical', 'spare_parts', 'site_store', 'other')),
  in_charge_person TEXT NULL,
  contact_phone VARCHAR(20) NULL,
  location TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_stores_project_site ON public.stores(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);


-- ---------------------------------------------------------------------------
-- 6. ITEMS (Material & Spare Parts Master)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  item_code VARCHAR(32) NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  sub_category VARCHAR(50) NULL,
  item_type VARCHAR(50) NOT NULL DEFAULT 'spare_part' CHECK (item_type IN (
    'spare_part', 'consumable', 'lubricant', 'battery', 'tyre',
    'electrical', 'hydraulic', 'engine_part', 'mechanical_part',
    'tool', 'safety_item', 'welding', 'general_material', 'asset', 'other'
  )),
  uom VARCHAR(20) NOT NULL DEFAULT 'Nos',
  hsn_sac VARCHAR(20) NULL,
  gst_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_rate_percent >= 0),
  minimum_stock NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  reorder_level NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  maximum_stock NUMERIC(10,2) NULL,
  preferred_vendor_id UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  serial_tracking BOOLEAN NOT NULL DEFAULT false,
  batch_tracking BOOLEAN NOT NULL DEFAULT false,
  expiry_tracking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON public.items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_is_active ON public.items(is_active);


-- ---------------------------------------------------------------------------
-- 7. MATERIAL INWARDS (GRN / Goods Receipt Note Header)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_inwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  grn_no VARCHAR(32) NOT NULL UNIQUE,
  grn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  po_reference VARCHAR(50) NULL,
  invoice_no VARCHAR(50) NULL,
  invoice_date DATE NULL,
  challan_no VARCHAR(50) NULL,
  received_by TEXT NULL,
  approved_by TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_material_inwards_updated_at
  BEFORE UPDATE ON public.material_inwards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_material_inwards_store ON public.material_inwards(store_id);
CREATE INDEX IF NOT EXISTS idx_material_inwards_project_site ON public.material_inwards(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_material_inwards_vendor ON public.material_inwards(vendor_id);
CREATE INDEX IF NOT EXISTS idx_material_inwards_status ON public.material_inwards(status);


-- ---------------------------------------------------------------------------
-- 8. MATERIAL INWARD ITEMS (GRN Line Items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_inward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_inward_id UUID NOT NULL REFERENCES public.material_inwards(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  rate NUMERIC(12,2) NOT NULL CHECK (rate >= 0),
  taxable_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_percent >= 0),
  gst_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND((quantity * rate) * (gst_percent / 100.0), 2)) STORED,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND((quantity * rate) + ((quantity * rate) * (gst_percent / 100.0)), 2)) STORED,
  batch_no VARCHAR(50) NULL,
  serial_no VARCHAR(50) NULL,
  expiry_date DATE NULL,
  remarks TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_inward_items_inward ON public.material_inward_items(material_inward_id);
CREATE INDEX IF NOT EXISTS idx_inward_items_item ON public.material_inward_items(item_id);


-- ---------------------------------------------------------------------------
-- 9. MATERIAL OUTWARDS (Material Issue Slip Header)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_outwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  issue_no VARCHAR(32) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  issued_to TEXT NOT NULL,
  department VARCHAR(50) NULL,
  machinery_id UUID NULL REFERENCES public.machinery(id) ON DELETE SET NULL,
  engine_id UUID NULL REFERENCES public.engines(id) ON DELETE SET NULL,
  maintenance_id UUID NULL REFERENCES public.maintenance_records(id) ON DELETE SET NULL,
  breakdown_id UUID NULL REFERENCES public.breakdowns(id) ON DELETE SET NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'Machinery Repair' CHECK (purpose IN (
    'Machinery Repair', 'Preventive Maintenance', 'Breakdown',
    'Site Consumption', 'Construction Work', 'Electrical Work',
    'General Consumption', 'Other'
  )),
  approved_by TEXT NULL,
  issued_by TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TRIGGER trg_material_outwards_updated_at
  BEFORE UPDATE ON public.material_outwards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_material_outwards_store ON public.material_outwards(store_id);
CREATE INDEX IF NOT EXISTS idx_material_outwards_machinery ON public.material_outwards(machinery_id);
CREATE INDEX IF NOT EXISTS idx_material_outwards_maintenance ON public.material_outwards(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_material_outwards_status ON public.material_outwards(status);


-- ---------------------------------------------------------------------------
-- 10. MATERIAL OUTWARD ITEMS (Issue Slip Line Items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_outward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_outward_id UUID NOT NULL REFERENCES public.material_outwards(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  remarks TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_outward_items_outward ON public.material_outward_items(material_outward_id);
CREATE INDEX IF NOT EXISTS idx_outward_items_item ON public.material_outward_items(item_id);


-- ---------------------------------------------------------------------------
-- 11. STOCK TRANSFERS (Store-to-Store Transfer Header)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  transfer_no VARCHAR(32) NOT NULL UNIQUE,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  from_site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  from_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  to_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  to_site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  to_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  issued_by TEXT NULL,
  received_by TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_transit', 'received', 'cancelled')),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_transfers_updated_at
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON public.stock_transfers(from_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON public.stock_transfers(to_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);


-- ---------------------------------------------------------------------------
-- 12. STOCK TRANSFER ITEMS (Transfer Line Items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  remarks TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON public.stock_transfer_items(stock_transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_item ON public.stock_transfer_items(item_id);


-- ---------------------------------------------------------------------------
-- 13. MATERIAL RETURNS (Store Returns & Vendor Returns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  return_no VARCHAR(32) NOT NULL UNIQUE,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('store_return', 'vendor_return')),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  vendor_id UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  machinery_id UUID NULL REFERENCES public.machinery(id) ON DELETE SET NULL,
  returned_by TEXT NULL,
  approved_by TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_material_returns_updated_at
  BEFORE UPDATE ON public.material_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.material_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_return_id UUID NOT NULL REFERENCES public.material_returns(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  remarks TEXT NULL
);


-- ---------------------------------------------------------------------------
-- 14. STOCK ADJUSTMENTS (Physical Count Reconciliation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  adjustment_no VARCHAR(32) NOT NULL UNIQUE,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'Physical Count Difference', 'Damage', 'Loss', 'Found Material', 'Data Correction', 'Other'
  )),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  approved_by TEXT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_adjustments_updated_at
  BEFORE UPDATE ON public.stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  adjustment_type VARCHAR(10) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease')),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  remarks TEXT NULL
);


-- ---------------------------------------------------------------------------
-- 15. STOCK TRANSACTIONS (Atomic Stock Movement Ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'opening', 'inward', 'outward', 'transfer_in', 'transfer_out',
    'return_in', 'return_out', 'adjustment_pos', 'adjustment_neg'
  )),
  reference_table VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  reference_no VARCHAR(50) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_trans_store_item ON public.stock_transactions(store_id, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_trans_project_site ON public.stock_transactions(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_stock_trans_date ON public.stock_transactions(transaction_date);


-- ---------------------------------------------------------------------------
-- 16. ASSETS (Capital Equipment & Fixed Assets Master)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  asset_code VARCHAR(32) NOT NULL UNIQUE,
  asset_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'Power Generator', 'Batching Plant', 'Lab Equipment', 'Weighbridge',
    'Survey Equipment', 'Prefab Structure', 'Crane & Hoist', 'Compactor/Roller',
    'Water System', 'Workshop Machine', 'Other'
  )),
  serial_number VARCHAR(50) NULL,
  make VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  purchase_date DATE NULL,
  purchase_cost NUMERIC(12,2) NULL,
  vendor_id UUID NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  location TEXT NULL,
  department VARCHAR(50) NULL,
  warranty_expiry DATE NULL,
  amc_details TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'under_repair', 'idle', 'transferred', 'sold', 'scrapped', 'archived'
  )),
  current_condition VARCHAR(50) NOT NULL DEFAULT 'Good',
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_assets_project_site ON public.assets(project_id, site_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);


-- ---------------------------------------------------------------------------
-- 17. ASSET TRANSFERS (Equipment Relocation History)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asset_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  from_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  from_site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  to_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  to_site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transferred_by TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('in_transit', 'completed', 'cancelled')),
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON public.asset_transfers(asset_id);


-- ---------------------------------------------------------------------------
-- 18. ROW LEVEL SECURITY (RLS) ON ALL NEW TABLES
-- ---------------------------------------------------------------------------
ALTER TABLE public.engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_issue_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_inwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_inward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_outwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_outward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;

-- Create Authenticated Policies for all new tables
DO $$
DECLARE
  t text;
  new_tables text[] := ARRAY[
    'engines', 'fuel_tanks', 'fuel_issue_allocations', 'stores', 'items',
    'material_inwards', 'material_inward_items', 'material_outwards',
    'material_outward_items', 'stock_transfers', 'stock_transfer_items',
    'material_returns', 'material_return_items', 'stock_adjustments',
    'stock_adjustment_items', 'stock_transactions', 'assets', 'asset_transfers'
  ];
BEGIN
  FOREACH t IN ARRAY new_tables LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Allow authenticated access to %I" ON public.%I;
      CREATE POLICY "Allow authenticated access to %I"
        ON public.%I
        FOR ALL
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    ', t, t, t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 19. LEAST-PRIVILEGE PERMISSIONS
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

