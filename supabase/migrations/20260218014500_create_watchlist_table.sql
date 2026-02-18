-- Migration to create course watchlist for students
CREATE TABLE IF NOT EXISTS course_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE course_watchlist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watchlist"
ON course_watchlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist"
ON course_watchlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
ON course_watchlist FOR DELETE
USING (auth.uid() = user_id);
