-- ===========================================================================
-- MILESTONE ERP — Phase 1 Security, RLS & Storage Migration
-- Product: Construction Machinery & Mechanical ERP
-- Created: 2026-09-20
--
-- SECURITY PRINCIPLES:
-- 1. Explicit Row Level Security (RLS) enabled on all 9 Phase-1 tables.
-- 2. Authenticated-only access: Zero unrestricted anonymous write access.
-- 3. Anonymous role (anon) is blocked from INSERT, UPDATE, DELETE.
-- 4. Multi-tenant readiness through organization_id.
-- 5. Private Supabase Storage bucket 'attachments' with authenticated RLS.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 9 TABLES
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. RLS POLICIES FOR AUTHENTICATED USERS
-- Strictly enforces that users must have an active Supabase Auth session (auth.uid() IS NOT NULL).
-- Anonymous users (anon) have NO permissions to insert, modify, or delete records.
-- ---------------------------------------------------------------------------

-- Projects
CREATE POLICY "Allow authenticated access to projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Sites
CREATE POLICY "Allow authenticated access to sites"
  ON public.sites
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Vendors
CREATE POLICY "Allow authenticated access to vendors"
  ON public.vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Machinery
CREATE POLICY "Allow authenticated access to machinery"
  ON public.machinery
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fuel Issues
CREATE POLICY "Allow authenticated access to fuel_issues"
  ON public.fuel_issues
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Log Books
CREATE POLICY "Allow authenticated access to log_books"
  ON public.log_books
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Breakdowns
CREATE POLICY "Allow authenticated access to breakdowns"
  ON public.breakdowns
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Maintenance Records
CREATE POLICY "Allow authenticated access to maintenance_records"
  ON public.maintenance_records
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Attachments Table
CREATE POLICY "Allow authenticated access to attachments"
  ON public.attachments
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 3. SUPABASE STORAGE BUCKET: attachments
-- Creates private storage bucket for machinery compliance docs & work order photos.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- ---------------------------------------------------------------------------
-- 4. STORAGE RLS POLICIES ON storage.objects
-- ---------------------------------------------------------------------------
CREATE POLICY "Allow authenticated select on attachments bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert on attachments bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update on attachments bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete on attachments bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

