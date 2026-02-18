-- Migration for Student Diagnostic Onboarding
-- This allows schools to define a "survey" that helps personalize the student experience.

-- 1. Create diagnostic_questions table
CREATE TABLE IF NOT EXISTS diagnostic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create diagnostic_options table
-- These are the choices for each question, including how they map to categories for recommendations
CREATE TABLE IF NOT EXISTS diagnostic_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES diagnostic_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  icon TEXT, -- Emoji or icon name
  weight INTEGER DEFAULT 1, -- Relevance weight
  -- Comma separated list of category slugs or IDs that this option strengthens
  mapped_categories JSONB DEFAULT '[]'::jsonb, 
  "order" INTEGER DEFAULT 0
);

-- 3. Create user_diagnostic_results
-- Stores the final profile of the student for recommendation algorithms
CREATE TABLE IF NOT EXISTS user_diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  top_categories JSONB DEFAULT '[]'::jsonb, -- Array of category names/IDs
  onboarding_completed BOOLEAN DEFAULT false,
  last_completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Enable RLS
ALTER TABLE diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_diagnostic_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access to Questions" ON diagnostic_questions FOR SELECT USING (true);
CREATE POLICY "Public Read Access to Options" ON diagnostic_options FOR SELECT USING (true);

CREATE POLICY "Users can view their own results"
ON user_diagnostic_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own results"
ON user_diagnostic_results FOR ALL
USING (auth.uid() = user_id);

-- Seed some initial questions for 'escola-raiz' as a demonstration
-- NOTE: Need to find 'escola-raiz' ID first in the actual execution or use a subquery
DO $$ 
DECLARE 
    v_school_id UUID;
    v_q1_id UUID;
    v_q2_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools WHERE slug = 'escola-raiz';
    
    IF v_school_id IS NOT NULL THEN
        -- QUESTION 1
        INSERT INTO diagnostic_questions (school_id, text, description, "order")
        VALUES (v_school_id, 'Qual é o seu momento atual?', 'Queremos entender onde você está para te levar mais longe.', 1)
        RETURNING id INTO v_q1_id;

        INSERT INTO diagnostic_options (question_id, text, icon, mapped_categories, "order")
        VALUES 
        (v_q1_id, 'Estou começando agora do zero', '🌱', '["iniciante", "mentalidade"]'::jsonb, 1),
        (v_q1_id, 'Já tenho um negócio e quero escalar', '🚀', '["escala", "gestão", "marketing"]'::jsonb, 2),
        (v_q1_id, 'Sou um profissional liberal buscando autoridade', '💼', '["branding", "vendas"]'::jsonb, 3);

        -- QUESTION 2
        INSERT INTO diagnostic_questions (school_id, text, description, "order")
        VALUES (v_school_id, 'Qual dessas áreas é sua prioridade hoje?', 'Isso nos ajuda a montar sua primeira trilha.', 2)
        RETURNING id INTO v_q2_id;

        INSERT INTO diagnostic_options (question_id, text, icon, mapped_categories, "order")
        VALUES 
        (v_q2_id, 'Marketing & Vendas', '💰', '["marketing", "vendas"]'::jsonb, 1),
        (v_q2_id, 'Gestão & Processos', '⚙️', '["gestão", "processos", "financeiro"]'::jsonb, 2),
        (v_q2_id, 'Liderança & Equipes', '👥', '["liderança", "equipes", "rh"]'::jsonb, 3),
        (v_q2_id, 'Inteligência Artificial & Tech', '🤖', '["ia", "tecnologia", "automação"]'::jsonb, 4);
    END IF;
END $$;
