-- SingleBIT Arcade Phase 05 — Supabase schema
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Privacy design: no IP address, device fingerprint, precise location or anonymous visitor identity is stored.

create extension if not exists pgcrypto;

create table if not exists public.sb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name text not null default 'Arcade Player' check (char_length(display_name) <= 60),
  bio text not null default '' check (char_length(bio) <= 500),
  website text not null default '' check (char_length(website) <= 200),
  is_public boolean not null default true,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sb_profile_daily_views (
  day date not null default (now() at time zone 'utc')::date,
  profile_slug text not null,
  view_count bigint not null default 0 check (view_count >= 0),
  primary key (day, profile_slug)
);

create or replace function public.sb_is_owner(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.sb_profiles where id = check_user and is_owner = true); $$;

create or replace function public.sb_handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare requested_username text;
begin
  requested_username := coalesce(new.raw_user_meta_data->>'username', 'player_' || left(replace(new.id::text,'-',''),10));
  if requested_username !~ '^[a-zA-Z0-9_]{3,24}$' then
    requested_username := 'player_' || left(replace(new.id::text,'-',''),10);
  end if;
  insert into public.sb_profiles(id, username, display_name)
  values(new.id, requested_username, coalesce(nullif(left(new.raw_user_meta_data->>'display_name',60),''),'Arcade Player'))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists sb_auth_user_created on auth.users;
create trigger sb_auth_user_created after insert on auth.users
for each row execute procedure public.sb_handle_new_user();

create or replace function public.sb_record_profile_view(profile_slug text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if profile_slug is null or profile_slug !~ '^[a-z0-9-]{2,80}$' then return; end if;
  insert into public.sb_profile_daily_views(day, profile_slug, view_count)
  values((now() at time zone 'utc')::date, profile_slug, 1)
  on conflict (day, profile_slug)
  do update set view_count = public.sb_profile_daily_views.view_count + 1;
end; $$;

alter table public.sb_profiles enable row level security;
alter table public.sb_profile_daily_views enable row level security;

drop policy if exists "Public profiles are readable" on public.sb_profiles;
create policy "Public profiles are readable" on public.sb_profiles
for select using (is_public = true or id = auth.uid() or public.sb_is_owner());

drop policy if exists "Users update their own public fields" on public.sb_profiles;
create policy "Users update their own public fields" on public.sb_profiles
for update using (id = auth.uid())
with check (id = auth.uid() and is_owner = false);

drop policy if exists "Owner reads aggregate profile views" on public.sb_profile_daily_views;
create policy "Owner reads aggregate profile views" on public.sb_profile_daily_views
for select using (public.sb_is_owner());

revoke all on public.sb_profile_daily_views from anon, authenticated;
grant select on public.sb_profile_daily_views to authenticated;
revoke all on public.sb_profiles from anon, authenticated;
grant select on public.sb_profiles to anon, authenticated;
grant update(username, display_name, bio, website, is_public) on public.sb_profiles to authenticated;
grant execute on function public.sb_record_profile_view(text) to anon, authenticated;
grant execute on function public.sb_is_owner(uuid) to authenticated;

-- After the owner creates their account, run this once with their Auth user UUID:
-- update public.sb_profiles set is_owner = true where id = 'YOUR-AUTH-USER-UUID';
