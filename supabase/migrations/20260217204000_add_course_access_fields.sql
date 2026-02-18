-- Migration: Add Access Control Fields to Course Table (Etapa 1.2)
-- Description: Implement tiers and entitlement requirements for courses.

-- 1. Add columns to 'course' table
ALTER TABLE public.course 
ADD COLUMN IF NOT EXISTS access_model TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN IF NOT EXISTS course_tier TEXT NOT NULL DEFAULT 'TIER_1',
ADD COLUMN IF NOT EXISTS required_entitlement_key TEXT NULL;

-- 2. Add Constraints
-- Validity checks for enums
ALTER TABLE public.course DROP CONSTRAINT IF EXISTS course_access_model_check;
ALTER TABLE public.course ADD CONSTRAINT course_access_model_check 
CHECK (access_model IN ('OPEN', 'ENTITLEMENT_REQUIRED'));

ALTER TABLE public.course DROP CONSTRAINT IF EXISTS course_tier_check;
ALTER TABLE public.course ADD CONSTRAINT course_tier_check 
CHECK (course_tier IN ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5'));

-- Key formatting check (if present)
ALTER TABLE public.course DROP CONSTRAINT IF EXISTS course_required_entitlement_key_format;
ALTER TABLE public.course ADD CONSTRAINT course_required_entitlement_key_format 
CHECK (required_entitlement_key IS NULL OR length(trim(required_entitlement_key)) > 0);

-- 3. Business Logic Constraint
-- If it's ENTITLEMENT_REQUIRED, the key MUST be provided
ALTER TABLE public.course DROP CONSTRAINT IF EXISTS course_entitlement_key_required_logic;
ALTER TABLE public.course ADD CONSTRAINT course_entitlement_key_required_logic 
CHECK (
    (access_model = 'OPEN') 
    OR 
    (access_model = 'ENTITLEMENT_REQUIRED' AND required_entitlement_key IS NOT NULL)
);

-- 4. Indices for list filtering and performance
CREATE INDEX IF NOT EXISTS idx_course_school_status ON public.course (school_id, status);
CREATE INDEX IF NOT EXISTS idx_course_school_access ON public.course (school_id, access_model);

-- ==========================================
-- SANITY CHECKS (Execute in SQL Editor)
-- ==========================================

/*
-- [SANITY CHECK A] Create course with defaults (Should pass and show OPEN/TIER_1/NULL key)
-- Note: Replace school_id and teacher_id with real ones if needed
INSERT INTO public.course (school_id, teacher_id, title, slug)
VALUES (
    (SELECT id FROM schools LIMIT 1), 
    (SELECT id FROM auth.users LIMIT 1), 
    'Curso Teste Defaults', 
    'curso-teste-defaults'
) RETURNING access_model, course_tier, required_entitlement_key;

-- [SANITY CHECK B] Try to set ENTITLEMENT_REQUIRED without a key (SHOULD FAIL)
UPDATE public.course 
SET access_model = 'ENTITLEMENT_REQUIRED', required_entitlement_key = NULL
WHERE slug = 'curso-teste-defaults';

-- [SANITY CHECK C] Set with key (SHOULD PASS)
UPDATE public.course 
SET access_model = 'ENTITLEMENT_REQUIRED', required_entitlement_key = 'access_full_platform'
WHERE slug = 'curso-teste-defaults';
*/
