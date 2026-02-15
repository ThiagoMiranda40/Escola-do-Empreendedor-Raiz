-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile Table
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT CHECK (role IN ('STUDENT', 'TEACHER', 'MANAGER')) DEFAULT 'STUDENT',
  payment_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS course (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumb_url TEXT,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules Table
CREATE TABLE IF NOT EXISTS module (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lesson (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES module(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  panda_embed TEXT,
  sort_order INT DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources (Materials) Table
CREATE TABLE IF NOT EXISTS resource (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lesson(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('link', 'file')) DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE course ENABLE ROW LEVEL SECURITY;
ALTER TABLE module ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can select their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for category (teachers can CRUD)
CREATE POLICY "Teachers can select categories"
  ON category FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'TEACHER'
    )
  );

CREATE POLICY "Teachers can insert categories"
  ON category FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'TEACHER'
    )
  );

CREATE POLICY "Teachers can update categories"
  ON category FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'TEACHER'
    )
  );

CREATE POLICY "Teachers can delete categories"
  ON category FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'TEACHER'
    )
  );

-- RLS Policies for course (teachers can CRUD only their own)
CREATE POLICY "Teachers can select their own courses"
  ON course FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert courses"
  ON course FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own courses"
  ON course FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own courses"
  ON course FOR DELETE
  USING (teacher_id = auth.uid());

-- RLS Policies for module (teachers can CRUD if they own the course)
CREATE POLICY "Teachers can select modules of their courses"
  ON module FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course
      WHERE course.id = module.course_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert modules in their courses"
  ON module FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course
      WHERE course.id = module.course_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update modules in their courses"
  ON module FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course
      WHERE course.id = module.course_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete modules in their courses"
  ON module FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course
      WHERE course.id = module.course_id
      AND course.teacher_id = auth.uid()
    )
  );

-- RLS Policies for lesson (teachers can CRUD if they own the course)
CREATE POLICY "Teachers can select lessons of their courses"
  ON lesson FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module
      JOIN course ON course.id = module.course_id
      WHERE module.id = lesson.module_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert lessons in their courses"
  ON lesson FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module
      JOIN course ON course.id = module.course_id
      WHERE module.id = lesson.module_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update lessons in their courses"
  ON lesson FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM module
      JOIN course ON course.id = module.course_id
      WHERE module.id = lesson.module_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete lessons in their courses"
  ON lesson FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM module
      JOIN course ON course.id = module.course_id
      WHERE module.id = lesson.module_id
      AND course.teacher_id = auth.uid()
    )
  );

-- RLS Policies for resource (teachers can CRUD if they own the course)
CREATE POLICY "Teachers can select resources of their lessons"
  ON resource FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson
      JOIN module ON module.id = lesson.module_id
      JOIN course ON course.id = module.course_id
      WHERE lesson.id = resource.lesson_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert resources in their lessons"
  ON resource FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson
      JOIN module ON module.id = lesson.module_id
      JOIN course ON course.id = module.course_id
      WHERE lesson.id = resource.lesson_id
      AND course.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete resources in their lessons"
  ON resource FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lesson
      JOIN module ON module.id = lesson.module_id
      JOIN course ON course.id = module.course_id
      WHERE lesson.id = resource.lesson_id
      AND course.teacher_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_course_teacher_id ON course(teacher_id);
CREATE INDEX idx_course_category_id ON course(category_id);
CREATE INDEX idx_module_course_id ON module(course_id);
CREATE INDEX idx_lesson_module_id ON lesson(module_id);
CREATE INDEX idx_resource_lesson_id ON resource(lesson_id);
