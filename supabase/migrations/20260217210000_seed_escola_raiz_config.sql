-- Migration/Seed: Configuração Idempotente para 'escola-raiz' (Etapa 1.3)
-- Descrição: Padroniza os cursos da Escola do Empreendedor Raiz para o modelo de assinatura COMMUNITY_ANNUAL.

DO $$
DECLARE
    v_school_id UUID;
BEGIN
    -- 1. Capturar o ID da escola-raiz
    SELECT id INTO v_school_id FROM public.schools WHERE slug = 'escola-raiz';

    IF v_school_id IS NOT NULL THEN
        -- 2. Atualizar todos os cursos da escola-raiz para o modelo de assinatura
        -- Regras:
        -- - Todos exigem entitlement 'COMMUNITY_ANNUAL'
        -- - Course Tier é mantido se já existir, senão assume TIER_1
        UPDATE public.course
        SET 
            access_model = 'ENTITLEMENT_REQUIRED',
            required_entitlement_key = 'COMMUNITY_ANNUAL',
            course_tier = COALESCE(NULLIF(course_tier, ''), 'TIER_1')
        WHERE 
            school_id = v_school_id
            AND (
                access_model != 'ENTITLEMENT_REQUIRED' 
                OR required_entitlement_key IS DISTINCT FROM 'COMMUNITY_ANNUAL'
            );
            
        RAISE NOTICE 'Cursos da escola-raiz atualizados com sucesso.';
    ELSE
        RAISE NOTICE 'Escola com slug escola-raiz não encontrada.';
    END IF;
END $$;

-- ==========================================
-- SANITY CHECKS (Execute no SQL Editor)
-- ==========================================

/*
-- [SANITY CHECK A] Listar status dos cursos da escola-raiz
SELECT 
    c.title, 
    c.access_model, 
    c.course_tier, 
    c.required_entitlement_key 
FROM public.course c
JOIN public.schools s ON s.id = c.school_id
WHERE s.slug = 'escola-raiz'
LIMIT 10;

-- [SANITY CHECK B] Contagem de consistência
SELECT count(*) as total_comunidade
FROM public.course c
JOIN public.schools s ON s.id = c.school_id
WHERE s.slug = 'escola-raiz'
AND c.access_model = 'ENTITLEMENT_REQUIRED'
AND c.required_entitlement_key = 'COMMUNITY_ANNUAL';
*/
