-- Create schools table
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Enable RLS
alter table schools enable row level security;

-- Create policy to allow read access to everyone (so landing page can validate slug)
create policy "Allow public read access"
  on schools for select
  using (true);

-- Seed initial data
insert into schools (name, slug)
values ('Escola do Empreendedor Raiz', 'escola-raiz')
on conflict (slug) do nothing;
