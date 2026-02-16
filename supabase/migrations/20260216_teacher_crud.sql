-- Migration for Teacher CRUD features
-- 1. Add slug to course table
ALTER TABLE course ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow public access to thumbnails
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Allow teachers to upload thumbnails
CREATE POLICY "Teacher Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE users_profile.id = auth.uid()
    AND users_profile.role = 'TEACHER'
  )
);

-- Allow teachers to update/delete their own uploads
CREATE POLICY "Teacher Update/Delete Own Access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-thumbnails' AND
  auth.uid() = owner
);
