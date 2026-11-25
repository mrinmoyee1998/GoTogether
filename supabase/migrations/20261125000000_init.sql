-- =====================================================================
-- GoTogether — initial schema
-- Tables: profiles, activities, join_requests, reports
-- All tables use Row Level Security. Join-request state changes go
-- through SECURITY DEFINER functions so capacity rules are enforced
-- atomically in the database (not just in the UI).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enumerations as check-constrained text (simple to evolve)
-- ---------------------------------------------------------------------
-- Categories / interests (slugs). Keep in sync with src/lib/constants.ts
create or replace function public.valid_category(c text)
returns boolean
language sql
immutable
as $$
  select c in (
    'sports','fitness','food','outdoors','music','art',
    'workshops','gaming','board_games','travel','social'
  );
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  age_confirmed boolean not null default false,
  city text not null default 'Mumbai' check (char_length(city) <= 60),
  neighbourhood text check (neighbourhood is null or char_length(neighbourhood) <= 60),
  bio text check (bio is null or char_length(bio) <= 300),
  interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Onboarding can only be completed by someone who confirmed they are 18+
  constraint onboarding_requires_age check (not onboarding_completed or age_confirmed),
  constraint onboarding_requires_fields check (
    not onboarding_completed
    or (char_length(trim(full_name)) >= 2 and neighbourhood is not null and cardinality(interests) >= 1)
  ),
  constraint interests_valid check (
    cardinality(interests) <= 11
    and interests <@ array['sports','fitness','food','outdoors','music','art',
                           'workshops','gaming','board_games','travel','social']::text[]
  )
);

comment on table public.profiles is 'Public-facing user profile. Contains no contact details.';

-- Create an empty profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 80),
  description text not null check (char_length(trim(description)) between 20 and 2000),
  category text not null check (public.valid_category(category)),
  activity_date date not null,
  start_time time not null,
  venue_name text not null check (char_length(trim(venue_name)) between 2 and 120),
  neighbourhood text not null check (char_length(trim(neighbourhood)) between 2 and 60),
  maps_url text check (maps_url is null or (maps_url ~* '^https://' and char_length(maps_url) <= 500)),
  estimated_cost integer check (estimated_cost is null or (estimated_cost >= 0 and estimated_cost <= 100000)),
  cover_image_url text check (cover_image_url is null or char_length(cover_image_url) <= 500),
  max_participants integer not null check (max_participants between 1 and 50),
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Hard guarantee: an activity can never be over-filled.
  constraint capacity_not_exceeded check (confirmed_count <= max_participants)
);

comment on column public.activities.max_participants is
  'Number of people who can join (the organiser is not counted).';
comment on column public.activities.confirmed_count is
  'Maintained by trigger from accepted join_requests. Not client-writable.';

create index activities_upcoming_idx on public.activities (status, activity_date, start_time);
create index activities_organiser_idx on public.activities (organiser_id);
create index activities_category_idx on public.activities (category);
create index activities_neighbourhood_idx on public.activities (neighbourhood);

-- Activities must start in the future (Mumbai time) when created or rescheduled.
create or replace function public.activities_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.activity_date is distinct from old.activity_date
     or new.start_time is distinct from old.start_time then
    if ((new.activity_date + new.start_time) at time zone 'Asia/Kolkata') <= now() then
      raise exception 'Activity must be scheduled in the future'
        using errcode = 'check_violation';
    end if;
  end if;
  if tg_op = 'INSERT' then
    new.confirmed_count := 0;
    new.status := 'active';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger activities_validate
  before insert or update on public.activities
  for each row execute function public.activities_validate();

-- ---------------------------------------------------------------------
-- join_requests
-- ---------------------------------------------------------------------
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  message text check (message is null or char_length(message) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One request row per (activity, user): prevents duplicate active requests.
  constraint join_requests_unique unique (activity_id, user_id)
);

create index join_requests_user_idx on public.join_requests (user_id, status);
create index join_requests_activity_idx on public.join_requests (activity_id, status);

-- Keep activities.confirmed_count in sync with accepted requests.
create or replace function public.sync_confirmed_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity uuid;
begin
  v_activity := coalesce(new.activity_id, old.activity_id);
  update public.activities a
     set confirmed_count = (
       select count(*) from public.join_requests r
        where r.activity_id = v_activity and r.status = 'accepted'
     )
   where a.id = v_activity;
  return null;
end;
$$;

create trigger join_requests_sync_count
  after insert or update of status or delete on public.join_requests
  for each row execute function public.sync_confirmed_count();

-- ---------------------------------------------------------------------
-- reports (activity reports for moderation)
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('unsafe','spam','inappropriate','misleading','other')),
  details text check (details is null or char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  constraint reports_one_per_user unique (activity_id, reporter_id)
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.join_requests enable row level security;
alter table public.reports enable row level security;

-- ---------- profiles ----------
-- Signed-in users can see community profiles (no contact details are stored here).
create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);
-- Logged-out visitors may read profiles, but column grants below restrict
-- them to id / full_name / avatar_url only (organiser name on public cards).
create policy "profiles minimal public read"
  on public.profiles for select to anon using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- (Inserts happen via the handle_new_user trigger; no insert policy needed.)

revoke all on public.profiles from anon, authenticated;
grant select (id, full_name, avatar_url) on public.profiles to anon;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, age_confirmed, city, neighbourhood, bio, interests, onboarding_completed)
  on public.profiles to authenticated;

-- ---------- activities ----------
create policy "activities are publicly viewable"
  on public.activities for select to anon, authenticated using (true);

create policy "onboarded users create activities as themselves"
  on public.activities for insert to authenticated
  with check (
    organiser_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
       where p.id = (select auth.uid()) and p.onboarding_completed and p.age_confirmed
    )
  );

create policy "organisers update own activities"
  on public.activities for update to authenticated
  using (organiser_id = (select auth.uid()))
  with check (organiser_id = (select auth.uid()));

create policy "organisers delete own activities"
  on public.activities for delete to authenticated
  using (organiser_id = (select auth.uid()));

revoke all on public.activities from anon, authenticated;
grant select on public.activities to anon, authenticated;
grant insert (organiser_id, title, description, category, activity_date, start_time, venue_name,
              neighbourhood, maps_url, estimated_cost, cover_image_url, max_participants)
  on public.activities to authenticated;
grant update (title, description, category, activity_date, start_time, venue_name, neighbourhood,
              maps_url, estimated_cost, cover_image_url, max_participants, status)
  on public.activities to authenticated;
grant delete on public.activities to authenticated;

-- ---------- join_requests ----------
-- Read: your own requests; requests to activities you organise; and the
-- accepted participant list of any activity (signed-in users only).
create policy "read own requests"
  on public.join_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy "organisers read requests for their activities"
  on public.join_requests for select to authenticated
  using (exists (
    select 1 from public.activities a
     where a.id = activity_id and a.organiser_id = (select auth.uid())
  ));
create policy "signed-in users see confirmed participants"
  on public.join_requests for select to authenticated
  using (status = 'accepted');

-- No direct writes. All changes go through the functions below.
revoke all on public.join_requests from anon, authenticated;
grant select on public.join_requests to authenticated;

-- ---------- reports ----------
create policy "users file reports as themselves"
  on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy "users see their own reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()));

revoke all on public.reports from anon, authenticated;
grant select, insert on public.reports to authenticated;

-- =====================================================================
-- Join-request workflow functions (atomic, permission-checked)
-- =====================================================================

-- Request to join an activity. Re-opens a previously cancelled request.
create or replace function public.request_to_join(p_activity_id uuid, p_message text default null)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_activity public.activities;
  v_existing public.join_requests;
  v_result public.join_requests;
begin
  if v_uid is null then
    raise exception 'You need to be logged in' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
     where id = v_uid and onboarding_completed and age_confirmed
  ) then
    raise exception 'Please complete your profile before joining activities' using errcode = '42501';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;
  if v_activity.organiser_id = v_uid then
    raise exception 'You are the organiser of this activity' using errcode = 'P0001';
  end if;
  if v_activity.status <> 'active' then
    raise exception 'This activity has been cancelled' using errcode = 'P0001';
  end if;
  if ((v_activity.activity_date + v_activity.start_time) at time zone 'Asia/Kolkata') <= now() then
    raise exception 'This activity has already started' using errcode = 'P0001';
  end if;
  if v_activity.confirmed_count >= v_activity.max_participants then
    raise exception 'This activity is full' using errcode = 'P0001';
  end if;

  select * into v_existing from public.join_requests
   where activity_id = p_activity_id and user_id = v_uid
   for update;

  if found then
    if v_existing.status = 'pending' then
      raise exception 'You already have a pending request for this activity' using errcode = 'P0001';
    elsif v_existing.status = 'accepted' then
      raise exception 'You are already confirmed for this activity' using errcode = 'P0001';
    elsif v_existing.status = 'declined' then
      raise exception 'The organiser has declined your request for this activity' using errcode = 'P0001';
    end if;
    update public.join_requests
       set status = 'pending', message = nullif(trim(p_message), ''), updated_at = now(),
           created_at = now()
     where id = v_existing.id
     returning * into v_result;
  else
    insert into public.join_requests (activity_id, user_id, status, message)
    values (p_activity_id, v_uid, 'pending', nullif(trim(left(p_message, 280)), ''))
    returning * into v_result;
  end if;

  return v_result;
end;
$$;

-- Organiser accepts or declines a request. Capacity is checked while
-- holding a row lock on the activity, so concurrent accepts for the last
-- spot are serialised: exactly one succeeds.
create or replace function public.respond_to_join_request(p_request_id uuid, p_decision text)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.join_requests;
  v_activity public.activities;
  v_accepted integer;
  v_result public.join_requests;
begin
  if v_uid is null then
    raise exception 'You need to be logged in' using errcode = '42501';
  end if;
  if p_decision not in ('accepted','declined') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  select * into v_request from public.join_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  -- Lock the activity row first (serialises all accepts for this activity).
  select * into v_activity from public.activities where id = v_request.activity_id for update;
  if v_activity.organiser_id is distinct from v_uid then
    raise exception 'Only the organiser can respond to join requests' using errcode = '42501';
  end if;

  -- Re-read the request under lock.
  select * into v_request from public.join_requests where id = p_request_id for update;

  if p_decision = 'accepted' then
    if v_request.status <> 'pending' then
      raise exception 'Only pending requests can be accepted' using errcode = 'P0001';
    end if;
    if v_activity.status <> 'active' then
      raise exception 'This activity has been cancelled' using errcode = 'P0001';
    end if;
    select count(*) into v_accepted from public.join_requests
     where activity_id = v_activity.id and status = 'accepted';
    if v_accepted >= v_activity.max_participants then
      raise exception 'This activity is already full' using errcode = 'P0001';
    end if;
  else
    -- Organiser may decline a pending request or remove an accepted participant.
    if v_request.status not in ('pending','accepted') then
      raise exception 'This request can no longer be declined' using errcode = 'P0001';
    end if;
  end if;

  update public.join_requests
     set status = p_decision, updated_at = now()
   where id = p_request_id
   returning * into v_result;

  return v_result;
end;
$$;

-- Requester cancels their own pending request (or leaves after acceptance).
create or replace function public.cancel_join_request(p_request_id uuid)
returns public.join_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.join_requests;
  v_result public.join_requests;
begin
  if v_uid is null then
    raise exception 'You need to be logged in' using errcode = '42501';
  end if;

  select * into v_request from public.join_requests where id = p_request_id for update;
  if not found or v_request.user_id <> v_uid then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if v_request.status not in ('pending','accepted') then
    raise exception 'This request cannot be cancelled' using errcode = 'P0001';
  end if;

  update public.join_requests
     set status = 'cancelled', updated_at = now()
   where id = p_request_id
   returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.request_to_join(uuid, text) from public, anon;
revoke all on function public.respond_to_join_request(uuid, text) from public, anon;
revoke all on function public.cancel_join_request(uuid) from public, anon;
grant execute on function public.request_to_join(uuid, text) to authenticated;
grant execute on function public.respond_to_join_request(uuid, text) to authenticated;
grant execute on function public.cancel_join_request(uuid) to authenticated;

-- Internal helpers are not callable by clients.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_confirmed_count() from public, anon, authenticated;

-- =====================================================================
-- Storage: avatars and activity cover images (public read, owner write)
-- Files must live under a folder named after the uploader's user id.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('activity-covers', 'activity-covers', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read for gotogether images"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('avatars','activity-covers'));

create policy "users upload images to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars','activity-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users update own images"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars','activity-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars','activity-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
