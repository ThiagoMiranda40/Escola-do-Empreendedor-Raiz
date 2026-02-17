-- Migration to enhance lesson resources and setup storage

-- 1. Adjust resource table
ALTER TABLE resource ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE resource ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

-- Ensure type is uppercase for consistency if needed, but existing check is lowercase.
-- User requested LINK|FILE. Let's update the constraint.
ALTER TABLE resource DROP CONSTRAINT IF EXISTS resource_type_check;
ALTER TABLE resource ADD CONSTRAINT resource_type_check CHECK (type IN ('LINK', 'FILE', 'link', 'file'));

-- 2. Cleanup old policies for resource from schema.sql
DROP POLICY IF EXISTS "Teachers can select resources of their lessons" ON resource;
DROP POLICY IF EXISTS "Teachers can insert resources in their lessons" ON resource;
DROP POLICY IF EXISTS "Teachers can delete resources in their lessons" ON resource;

-- 3. Storage Bucket: lesson-resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-resources', 'lesson-resources', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS Policies for lesson-resources
-- We use a path structure: school_id/lesson_id/file_name

-- Allow teachers/admins to upload (INSERT)
CREATE POLICY "Teachers can upload lesson resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-resources' AND
  EXISTS (
    SELECT 1 FROM school_members sm
    WHERE sm.school_id = (storage.foldername(name))[1]::uuid
    AND sm.user_id = auth.uid()
    AND sm.role IN ('TEACHER', 'ADMIN')
  )
);

-- Allow members to view (SELECT)
CREATE POLICY "Members can view lesson resources"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-resources' AND
  EXISTS (
    SELECT 1 FROM school_members sm
    WHERE sm.school_id = (storage.foldername(name))[1]::uuid
    AND sm.user_id = auth.uid()
  )
);

-- Allow teachers/admins to delete
CREATE POLICY "Teachers can delete lesson resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-resources' AND
  EXISTS (
    SELECT 1 FROM school_members sm
    WHERE sm.school_id = (storage.foldername(name))[1]::uuid
    AND sm.user_id = auth.uid()
    AND sm.role IN ('TEACHER', 'ADMIN')
  )
);

-- Allow teachers/admins to update
CREATE POLICY "Teachers can update lesson resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-resources' AND
  EXISTS (
    SELECT 1 FROM school_members sm
    WHERE sm.school_id = (storage.foldername(name))[1]::uuid
    AND sm.user_id = auth.uid()
    AND sm.role IN ('TEACHER', 'ADMIN')
  )
);
