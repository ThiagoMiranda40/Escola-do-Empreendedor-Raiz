-- Create school_members table
create table if not exists school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'TEACHER')),
  created_at timestamptz default now(),
  unique(school_id, user_id)
);

-- Enable RLS
alter table school_members enable row level security;

-- Policy: Users can view their own memberships
create policy "Users can view own memberships"
  on school_members for select
  using (auth.uid() = user_id);

-- Policy: Allow inserts during signup (MVP approach)
-- In a stricter environment, this might be handled by a trigger or edge function
create policy "Allow inserts for authenticated users"
  on school_members for insert
  with check (auth.uid() = user_id);

-- Policy: Allow updates if user is admin of the school (Future proofing)
-- For now, members can update their own profile? Or maybe restricted?
-- Leaving minimal for MVP.
