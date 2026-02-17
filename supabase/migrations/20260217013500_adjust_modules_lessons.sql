-- Migration to adjust module and lesson tables for multi-tenancy requirements
-- 1. Rename sort_order to order_index in module and lesson (for consistency with user request)
ALTER TABLE module RENAME COLUMN sort_order TO order_index;
ALTER TABLE lesson RENAME COLUMN sort_order TO order_index;

-- 2. Add course_id to lesson Table
-- First add nullable column
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course(id) ON DELETE CASCADE;

-- Backfill course_id from module table
UPDATE lesson l
SET course_id = m.course_id
FROM module m
WHERE l.module_id = m.id AND l.course_id IS NULL;

-- Set NOT NULL constraint after backfill
ALTER TABLE lesson ALTER COLUMN course_id SET NOT NULL;

-- 3. Add video_url to lesson Table
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. Ensure school_id is NOT NULL in module and lesson (redundant check)
ALTER TABLE module ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE lesson ALTER COLUMN school_id SET NOT NULL;

-- 5. Add Index for course_id in lesson for performance
CREATE INDEX IF NOT EXISTS idx_lesson_course_id ON lesson(course_id);
