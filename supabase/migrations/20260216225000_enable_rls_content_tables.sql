-- Enable RLS for all content tables
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE course ENABLE ROW LEVEL SECURITY;
ALTER TABLE module ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource ENABLE ROW LEVEL SECURITY;

-- Category Policies
CREATE POLICY "Users can view categories of their school"
    ON category FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = category.school_id 
        AND school_members.user_id = auth.uid()
    ));

CREATE POLICY "Admin/Teachers can manage categories"
    ON category FOR ALL
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = category.school_id 
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('ADMIN', 'TEACHER')
    ));

-- Course Policies
CREATE POLICY "Users can view courses of their school"
    ON course FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = course.school_id 
        AND school_members.user_id = auth.uid()
    ));

CREATE POLICY "Teachers can manage courses"
    ON course FOR ALL
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = course.school_id 
        AND school_members.user_id = auth.uid()
        AND (
            school_members.role = 'ADMIN' 
            OR (school_members.role = 'TEACHER' AND course.teacher_id = auth.uid())
        )
    ));

-- Module Policies
CREATE POLICY "Users can view modules of their school"
    ON module FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = module.school_id 
        AND school_members.user_id = auth.uid()
    ));

CREATE POLICY "Teachers can manage modules"
    ON module FOR ALL
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = module.school_id 
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('ADMIN', 'TEACHER')
    ));

-- Lesson Policies
CREATE POLICY "Users can view lessons of their school"
    ON lesson FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = lesson.school_id 
        AND school_members.user_id = auth.uid()
    ));

CREATE POLICY "Teachers can manage lessons"
    ON lesson FOR ALL
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = lesson.school_id 
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('ADMIN', 'TEACHER')
    ));

-- Resource Policies
CREATE POLICY "Users can view resources of their school"
    ON resource FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = resource.school_id 
        AND school_members.user_id = auth.uid()
    ));

CREATE POLICY "Teachers can manage resources"
    ON resource FOR ALL
    USING (EXISTS (
        SELECT 1 FROM school_members 
        WHERE school_members.school_id = resource.school_id 
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('ADMIN', 'TEACHER')
    ));
