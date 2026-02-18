-- Migration: Enforce Admin-only updates for course access fields
-- Description: Ensures that only users with 'ADMIN' role in school_members can modify access_model, course_tier, and required_entitlement_key.

-- 1. Create the enforcement function
CREATE OR REPLACE FUNCTION public.check_course_access_update_permission()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check if any protected columns are being modified
    IF (OLD.access_model IS DISTINCT FROM NEW.access_model OR
        OLD.course_tier IS DISTINCT FROM NEW.course_tier OR
        OLD.required_entitlement_key IS DISTINCT FROM NEW.required_entitlement_key) THEN
        
        -- Get the role of the user performing the update
        SELECT role INTO v_user_role
        FROM public.school_members
        WHERE school_id = NEW.school_id 
        AND user_id = auth.uid();

        -- If user is NOT an ADMIN, block the update
        IF v_user_role IS DISTINCT FROM 'ADMIN' THEN
            RAISE EXCEPTION 'Apenas administradores da escola podem alterar o modelo de acesso ou tier do curso.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_enforce_course_admin_only_fields ON public.course;
CREATE TRIGGER tr_enforce_course_admin_only_fields
BEFORE UPDATE ON public.course
FOR EACH ROW
EXECUTE FUNCTION public.check_course_access_update_permission();

-- NOTE: We don't need to check INSERT because the teacher creates the course as OPEN/TIER_1 by default, 
-- and if they try to insert with different values, the trigger could also be applied to INSERT.
-- Let's apply it to INSERT as well to be 100% safe.

DROP TRIGGER IF EXISTS tr_enforce_course_admin_only_fields_insert ON public.course;
CREATE TRIGGER tr_enforce_course_admin_only_fields_insert
BEFORE INSERT ON public.course
FOR EACH ROW
EXECUTE FUNCTION public.check_course_access_update_permission();
