-- ============================================================================
-- MILESTONE ERP — LOG BOOK & FUEL EFFICIENCY UPGRADE MIGRATION
-- Adds standard_fuel_efficiency to machinery and engines,
-- engine_id and is_meter_reset to log_books.
-- ============================================================================

-- 1. Add standard_fuel_efficiency to machinery
ALTER TABLE public.machinery 
  ADD COLUMN IF NOT EXISTS standard_fuel_efficiency NUMERIC(10, 2) NULL;

-- 2. Add standard_fuel_efficiency to engines
ALTER TABLE public.engines 
  ADD COLUMN IF NOT EXISTS standard_fuel_efficiency NUMERIC(10, 2) NULL;

-- 3. Add engine_id and is_meter_reset to log_books
ALTER TABLE public.log_books 
  ADD COLUMN IF NOT EXISTS engine_id UUID NULL REFERENCES public.engines(id) ON DELETE SET NULL;

ALTER TABLE public.log_books 
  ADD COLUMN IF NOT EXISTS is_meter_reset BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Index for log_books lookup by machinery, engine, and date
CREATE INDEX IF NOT EXISTS idx_log_books_machinery_date 
  ON public.log_books(machinery_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_log_books_engine_date 
  ON public.log_books(engine_id, date DESC);

-- 5. Index for fuel_issues lookup by machinery and date
CREATE INDEX IF NOT EXISTS idx_fuel_issues_machinery_date 
  ON public.fuel_issues(machinery_id, issue_date);

