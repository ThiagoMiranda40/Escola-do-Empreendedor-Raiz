-- Migration: Create Entitlements Table (Etapa 1.1)
-- Description: Agnostic access control system for multi-tenant structure.
-- This table handles permissions/purchases independently of the payment provider.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    source TEXT NOT NULL DEFAULT 'MANUAL',
    provider TEXT NOT NULL DEFAULT 'NONE',
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    provider_order_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 2. Constraints (Check Enums and Content)
    CONSTRAINT entitlements_status_check CHECK (status IN ('ACTIVE','CANCELED','EXPIRED')),
    CONSTRAINT entitlements_key_check CHECK (length(trim(key)) > 0),
    CONSTRAINT entitlements_provider_check CHECK (provider IN ('NONE','ASAAS','HOTMART','EDUZZ','MONETIZZE','VOOMP','STRIPE','MANUAL')),
    CONSTRAINT entitlements_source_check CHECK (source IN ('MANUAL','IMPORT','WEBHOOK'))
);

-- 3. Indices for performance
-- High frequency lookups for user access
CREATE INDEX IF NOT EXISTS idx_entitlements_school_user ON public.entitlements (school_id, user_id);
-- Lookup specific permission/course access
CREATE INDEX IF NOT EXISTS idx_entitlements_school_key ON public.entitlements (school_id, key);
-- Provider lookup for idempotency (e.g., webhook from Asaas for a specific order)
CREATE INDEX IF NOT EXISTS idx_entitlements_provider_order ON public.entitlements (provider, provider_order_id) 
WHERE provider_order_id IS NOT NULL;

-- 4. Unique Constraint for Active Entitlements
-- Prevents a user from having multiple active 'keys' for the same thing simultaneously.
-- We use a Partial Unique Index because it's the most flexible way in PostgreSQL to handle "Active-only" uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_entitlement 
ON public.entitlements (school_id, user_id, key) 
WHERE (status = 'ACTIVE');

-- ==========================================
-- SANITY CHECKS (Execute in SQL Editor)
-- ==========================================

/*
-- [SANITY CHECK A] Insert 1 valid manual entitlement
-- Replace IDs with real ones from your DB
INSERT INTO public.entitlements (school_id, user_id, key, source)
VALUES (
    (SELECT id FROM schools LIMIT 1), 
    (SELECT id FROM auth.users LIMIT 1), 
    'access_full_platform', 
    'MANUAL'
);

-- [SANITY CHECK B] Consult by school_id + user_id
SELECT * FROM public.entitlements 
WHERE school_id = (SELECT id FROM schools LIMIT 1) 
AND user_id = (SELECT id FROM auth.users LIMIT 1);

-- [SANITY CHECK C] Try to insert empty key (SHOULD FAIL)
INSERT INTO public.entitlements (school_id, user_id, key)
VALUES (
    (SELECT id FROM schools LIMIT 1), 
    (SELECT id FROM auth.users LIMIT 1), 
    '   '
);
*/
