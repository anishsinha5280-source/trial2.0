-- Supabase Database Schema for Cyber-ROI Application
-- Provides user profiles, workspace state persistence, and vulnerability finding records.

-- 1. Profiles / Application Users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now() not null,
  last_login_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

create index if not exists idx_profiles_username on public.profiles(username);

-- 2. Workspaces / User Settings
create table if not exists public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  loaded boolean default true not null,
  import_summary jsonb,
  budget numeric default 60 not null,
  selected_cve text,
  page text default 'overview' not null,
  theme text default 'light' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.workspaces enable row level security;

create policy "Users can view their own workspace"
  on public.workspaces for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workspace"
  on public.workspaces for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workspace"
  on public.workspaces for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workspace"
  on public.workspaces for delete
  using (auth.uid() = user_id);

create index if not exists idx_workspaces_user_id on public.workspaces(user_id);

-- 3. Vulnerability Findings
create table if not exists public.vulnerabilities (
  user_id uuid references auth.users(id) on delete cascade not null,
  id text not null,
  cve text not null,
  title text not null,
  description text default '' not null,
  cvss numeric not null,
  epss numeric not null,
  kev boolean default false not null,
  asset_criticality integer not null,
  fix_time numeric not null,
  internet_facing boolean default false,
  created_at timestamptz default now() not null,
  primary key (user_id, id)
);

alter table public.vulnerabilities enable row level security;

create policy "Users can view their own vulnerabilities"
  on public.vulnerabilities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own vulnerabilities"
  on public.vulnerabilities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own vulnerabilities"
  on public.vulnerabilities for update
  using (auth.uid() = user_id);

create policy "Users can delete their own vulnerabilities"
  on public.vulnerabilities for delete
  using (auth.uid() = user_id);

create index if not exists idx_vulnerabilities_user_id on public.vulnerabilities(user_id);
