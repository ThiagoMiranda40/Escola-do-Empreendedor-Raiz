-- Migration: Add thumb_vertical_url to course table
-- Description: Adds a column for vertical thumbnails used in specific mobile/highlight views for students.

ALTER TABLE public.course 
ADD COLUMN IF NOT EXISTS thumb_vertical_url TEXT;
