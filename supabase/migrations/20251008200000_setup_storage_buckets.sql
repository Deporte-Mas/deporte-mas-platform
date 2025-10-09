-- ============================================================================
-- Storage Buckets Setup
-- Date: 2025-10-08
-- Purpose: Create storage buckets for thumbnails and configure RLS policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE THUMBNAILS BUCKET
-- ============================================================================

-- Create thumbnails bucket (public access for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. RLS POLICIES FOR THUMBNAILS
-- ============================================================================

-- Allow public SELECT (viewing) of thumbnails
CREATE POLICY IF NOT EXISTS "Thumbnails are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Allow authenticated admins to INSERT thumbnails
-- NOTE: Using admin_users table (separate from regular users)
CREATE POLICY IF NOT EXISTS "Admins can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Allow authenticated admins to UPDATE thumbnails (replace)
CREATE POLICY IF NOT EXISTS "Admins can update thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Allow authenticated admins to DELETE thumbnails
CREATE POLICY IF NOT EXISTS "Admins can delete thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates:
-- ✅ Thumbnails bucket with 5MB file limit
-- ✅ Public viewing access for all thumbnails
-- ✅ Admin-only upload/update/delete access (using admin_users table)
-- ✅ Restricted to image file types only

COMMENT ON POLICY "Admins can upload thumbnails" ON storage.objects IS
  'Uses admin_users table (separate from regular users table)';
