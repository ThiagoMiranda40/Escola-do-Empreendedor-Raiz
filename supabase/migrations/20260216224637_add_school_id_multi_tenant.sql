-- Ensure schools table exists (from previous steps)
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Ensure school_members table exists (from previous steps)
create table if not exists school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'TEACHER')),
  created_at timestamptz default now(),
  unique(school_id, user_id)
);

-- Seed initial data if not exists
insert into schools (name, slug)
values ('Escola do Empreendedor Raiz', 'escola-raiz')
on conflict (slug) do nothing;

-- Function to add school_id to content tables
do $$
declare
  root_school_id uuid;
begin
  -- Get the ID of the root school
  select id into root_school_id from schools where slug = 'escola-raiz';

  -- If root school doesn't exist (shouldn't happen due to insert above), raise notice or create it (handled above)
  if root_school_id is null then
    raise exception 'Root school not found';
  end if;

  -- List of tables to migrate
  declare
    tables text[] := array['category', 'course', 'module', 'lesson', 'resource'];
    t text;
  begin
    foreach t in array tables loop
      -- Check if school_id column exists
      if not exists (select 1 from information_schema.columns where table_name = t and column_name = 'school_id') then
        
        -- Add the column
        execute format('alter table %I add column school_id uuid references schools(id) on delete cascade;', t);
        
        -- Backfill existing data
        execute format('update %I set school_id = %L where school_id is null;', t, root_school_id);
        
        -- Make it not null after backfill (optional, usually good practice for multi-tenant tables, but might break if table was empty? No, update handles existing. If table is empty, no update, constraint valid. If table has data but update fails? Update sets to root_id. So constraint should be safe.)
        -- However, user requirement didn't explicitly say NOT NULL, but implied "multi-tenant por escola". 
        -- If I set NOT NULL, I ensure data integrity. But let's stick to just adding reference for now to avoid strictness issues if something is weird.
        -- Actually, for existing apps, NOT NULL is desired. I'll add NOT NULL constraint after update.
        execute format('alter table %I alter column school_id set not null;', t);

        -- Add Index
        execute format('create index idx_%I_school_id on %I(school_id);', t, t);
        
        raise notice 'Added school_id to table %', t;
      else
        raise notice 'Column school_id already exists in table %', t;
      end if;
    end loop;
  end;
  
  -- Add index to school_members if not exists
  if not exists (select 1 from pg_indexes where tablename = 'school_members' and indexname = 'idx_school_members_user_school') then
    create index idx_school_members_user_school on school_members(user_id, school_id);
  end if;

end $$;
