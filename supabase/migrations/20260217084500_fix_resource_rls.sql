-- Migration to fix Resource RLS and ensure teacher access

-- 1. Explicitly redefine Resource Manage policy with WITH CHECK
DROP POLICY IF EXISTS "Manage resource school teachers" ON resource;

CREATE POLICY "Manage resource school teachers" ON resource FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = resource.school_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('TEACHER', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = resource.school_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('TEACHER', 'ADMIN')
  )
);

-- 2. Double check Storage RLS for developers (lesson-resources)
-- Already in 20260217063000_lesson_resources.sql, but ensuring it's comprehensive.
-- No changes needed here if 20260217063000 was applied correctly.
