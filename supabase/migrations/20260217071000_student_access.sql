-- Migration to enable student access and refine RLS policies

-- 1. Update school_members constraint to include STUDENT
ALTER TABLE school_members DROP CONSTRAINT IF EXISTS school_members_role_check;
ALTER TABLE school_members ADD CONSTRAINT school_members_role_check CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT'));

-- 2. Refine Course RLS: Students only see published courses
DROP POLICY IF EXISTS "Select course school members" ON course;
CREATE POLICY "Select course school members" ON course FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = course.school_id 
    AND sm.user_id = auth.uid() 
    AND (sm.role IN ('TEACHER', 'ADMIN') OR course.status = 'published')
  )
);

-- 3. Refine Module RLS: Students only see modules that belong to their school
-- (Filtering modules with no public lessons will be done in the UI for performance,
--  but we ensure multi-tenant isolation here)
DROP POLICY IF EXISTS "Select module school members" ON module;
CREATE POLICY "Select module school members" ON module FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = module.school_id 
    AND sm.user_id = auth.uid()
  )
);

-- 4. Refine Lesson RLS: Students only see published lessons
DROP POLICY IF EXISTS "Select lesson school members" ON lesson;
CREATE POLICY "Select lesson school members" ON lesson FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = lesson.school_id 
    AND sm.user_id = auth.uid() 
    AND (sm.role IN ('TEACHER', 'ADMIN') OR lesson.status = 'published')
  )
);

-- 5. Refine Resource RLS: Students only see resources of their school/lessons
DROP POLICY IF EXISTS "Select resource school members" ON resource;
CREATE POLICY "Select resource school members" ON resource FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = resource.school_id 
    AND sm.user_id = auth.uid()
    AND (
      sm.role IN ('TEACHER', 'ADMIN')
      OR
      EXISTS (
        SELECT 1 FROM lesson l
        WHERE l.id = resource.lesson_id
        AND l.status = 'published'
      )
    )
  )
);

-- 6. Helper for testing: Create a STUDENT member for 'escola-raiz' (adjust user_id as needed)
-- NOTE: For the AI to help you, run this snippet replacing YOUR_USER_ID with your student test account ID
-- INSERT INTO school_members (school_id, user_id, role)
-- SELECT id, 'YOUR_USER_ID'::uuid, 'STUDENT'
-- FROM schools WHERE slug = 'escola-raiz'
-- ON CONFLICT DO NOTHING;
