-- ============================================================================
-- MILESTONE ERP — LOG BOOK SHIFT UPGRADE
-- Adds additive column 'shift' (Day / Night) to log_books
-- Safe additive migration: does NOT drop, truncate, or overwrite existing records.
-- Historical records remain valid with NULL shift.
-- ============================================================================

ALTER TABLE public.log_books 
  ADD COLUMN IF NOT EXISTS shift TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_log_books_shift 
  ON public.log_books(shift);

CREATE INDEX IF NOT EXISTS idx_log_books_machinery_date_shift 
  ON public.log_books(machinery_id, date DESC, shift);
