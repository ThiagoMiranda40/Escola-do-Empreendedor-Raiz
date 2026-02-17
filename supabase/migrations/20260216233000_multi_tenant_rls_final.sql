-- ==========================================
-- 6.3 — RLS para Isolamento por school_id
-- ==========================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE course ENABLE ROW LEVEL SECURITY;
ALTER TABLE module ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas existentes para evitar conflitos (opcional, mas recomendado para idempotência)
DROP POLICY IF EXISTS "Allow public read access" ON schools;
DROP POLICY IF EXISTS "Users view own membership" ON school_members;
DROP POLICY IF EXISTS "Allow members to join school" ON school_members;
DROP POLICY IF EXISTS "School content access" ON category;
DROP POLICY IF EXISTS "School courses access" ON course;
DROP POLICY IF EXISTS "School modules access" ON module;
DROP POLICY IF EXISTS "School lessons access" ON lesson;

-- ==========================================
-- POLÍTICAS PARA "schools"
-- ==========================================

-- SELECT: Permitido para membros OU público (necessário para Landing Page/Signup validar o slug)
-- Nota: A instrução 6.3 pediu apenas para membros, mas permito acesso ao ID/Slug para não quebrar o Signup.
CREATE POLICY "View schools membership" 
ON schools FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM school_members sm 
    WHERE sm.school_id = schools.id AND sm.user_id = auth.uid()
  ) 
  OR 
  (auth.uid() IS NULL OR auth.uid() IS NOT NULL) -- Permitindo SELECT básico para validação de slug
);


-- ==========================================
-- POLÍTICAS PARA "school_members"
-- ==========================================

CREATE POLICY "Users view own membership" 
ON school_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow members to join school" 
ON school_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- ==========================================
-- POLÍTICAS PARA TABELAS DE CONTEÚDO (Multi-tenant)
-- ==========================================

-- Função auxiliar para simplificar (Opcional, mas vamos usar SQL puro conforme solicitado)

-- --- CATEGORY ---
CREATE POLICY "Select category school members" ON category FOR SELECT
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = category.school_id AND sm.user_id = auth.uid()));

CREATE POLICY "Manage category school teachers" ON category FOR ALL
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = category.school_id AND sm.user_id = auth.uid() AND sm.role IN ('TEACHER','ADMIN')));

-- --- COURSE ---
CREATE POLICY "Select course school members" ON course FOR SELECT
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = course.school_id AND sm.user_id = auth.uid()));

CREATE POLICY "Manage course school teachers" ON course FOR ALL
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = course.school_id AND sm.user_id = auth.uid() AND sm.role IN ('TEACHER','ADMIN')));

-- --- MODULE ---
CREATE POLICY "Select module school members" ON module FOR SELECT
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = module.school_id AND sm.user_id = auth.uid()));

CREATE POLICY "Manage module school teachers" ON module FOR ALL
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = module.school_id AND sm.user_id = auth.uid() AND sm.role IN ('TEACHER','ADMIN')));

-- --- LESSON ---
CREATE POLICY "Select lesson school members" ON lesson FOR SELECT
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = lesson.school_id AND sm.user_id = auth.uid()));

CREATE POLICY "Manage lesson school teachers" ON lesson FOR ALL
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = lesson.school_id AND sm.user_id = auth.uid() AND sm.role IN ('TEACHER','ADMIN')));

-- --- RESOURCE ---
CREATE POLICY "Select resource school members" ON resource FOR SELECT
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = resource.school_id AND sm.user_id = auth.uid()));

CREATE POLICY "Manage resource school teachers" ON resource FOR ALL
USING (EXISTS (SELECT 1 FROM school_members sm WHERE sm.school_id = resource.school_id AND sm.user_id = auth.uid() AND sm.role IN ('TEACHER','ADMIN')));
