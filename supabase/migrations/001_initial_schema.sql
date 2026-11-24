-- LIFEHUB AI initial MVP schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.life_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 180),
  source_type text not null default 'manual'
    check (source_type in ('manual','email','document','receipt','booking','bill','other')),
  raw_text text,
  extracted_data jsonb not null default '{}'::jsonb,
  status text not null default 'new'
    check (status in ('new','reviewing','processed','archived')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_item_id uuid references public.life_items(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.life_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_item_id uuid references public.life_items(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  event_type text not null default 'general',
  status text not null default 'upcoming'
    check (status in ('upcoming','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_item_id uuid references public.life_items(id) on delete cascade,
  life_event_id uuid references public.life_events(id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','sent','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists life_items_user_created_idx on public.life_items(user_id, created_at desc);
create index if not exists life_events_user_start_idx on public.life_events(user_id, starts_at);
create index if not exists reminders_user_time_idx on public.reminders(user_id, remind_at);
create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.life_items enable row level security;
alter table public.documents enable row level security;
alter table public.life_events enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles for all to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Users manage own life items" on public.life_items;
create policy "Users manage own life items" on public.life_items for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users manage own documents" on public.documents;
create policy "Users manage own documents" on public.documents for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users manage own events" on public.life_events;
create policy "Users manage own events" on public.life_events for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users manage own reminders" on public.reminders;
create policy "Users manage own reminders" on public.reminders for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Private file bucket. User files must be stored under <auth.uid()>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lifehub-documents', 'lifehub-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "Users read own lifehub files" on storage.objects;
create policy "Users read own lifehub files" on storage.objects for select to authenticated
using (bucket_id = 'lifehub-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users upload own lifehub files" on storage.objects;
create policy "Users upload own lifehub files" on storage.objects for insert to authenticated
with check (bucket_id = 'lifehub-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete own lifehub files" on storage.objects;
create policy "Users delete own lifehub files" on storage.objects for delete to authenticated
using (bucket_id = 'lifehub-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
