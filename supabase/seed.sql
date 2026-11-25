-- =====================================================================
-- GoTogether demo seed data (Mumbai)
--
-- Creates 4 SAMPLE host accounts and 10 upcoming activities dated
-- relative to "today" in Mumbai, so the app looks populated in demos.
-- The sample hosts cannot log in (random passwords) and say in their
-- bio that they are sample accounts. Run supabase/remove_demo_data.sql
-- before a real launch.
--
-- Safe to re-run: it refreshes activity dates so they stay in the future.
-- Local:  supabase db reset        (runs automatically)
-- Hosted: paste into Supabase Dashboard → SQL Editor → Run
-- =====================================================================

-- ---------- Sample host accounts ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name), now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('a1111111-1111-4111-8111-111111111111'::uuid, 'sample.host.ananya@example.com', 'Ananya Rao'),
  ('a2222222-2222-4222-8222-222222222222'::uuid, 'sample.host.kabir@example.com',  'Kabir Mehta'),
  ('a3333333-3333-4333-8333-333333333333'::uuid, 'sample.host.zara@example.com',   'Zara Shaikh'),
  ('a4444444-4444-4444-8444-444444444444'::uuid, 'sample.host.rohan@example.com',  'Rohan Iyer')
) as u(id, email, full_name)
on conflict (id) do nothing;

-- Profiles are auto-created by the signup trigger; fill them in.
update public.profiles p set
  full_name = s.full_name,
  age_confirmed = true,
  city = 'Mumbai',
  neighbourhood = s.neighbourhood,
  bio = s.bio,
  interests = s.interests,
  onboarding_completed = true
from (values
  ('a1111111-1111-4111-8111-111111111111'::uuid, 'Ananya Rao', 'Bandra',
   'Sample host account for the GoTogether demo. Loves badminton, cafes and slow Sunday mornings.',
   array['sports','food','social']),
  ('a2222222-2222-4222-8222-222222222222'::uuid, 'Kabir Mehta', 'Powai',
   'Sample host account for the GoTogether demo. Cyclist, weekend trekker, always up for chai after.',
   array['fitness','outdoors','travel']),
  ('a3333333-3333-4333-8333-333333333333'::uuid, 'Zara Shaikh', 'Andheri',
   'Sample host account for the GoTogether demo. Pottery, sketching and board game nights.',
   array['art','workshops','board_games']),
  ('a4444444-4444-4444-8444-444444444444'::uuid, 'Rohan Iyer', 'Juhu',
   'Sample host account for the GoTogether demo. Football on weekends, sunsets on weekdays.',
   array['sports','social','music'])
) as s(id, full_name, neighbourhood, bio, interests)
where p.id = s.id;

-- ---------- Activities ----------
-- day_offset: positive = days from today; 'SAT'/'SUN' codes = upcoming Saturday/Sunday
-- (at least 1 day ahead, so the demo always has plans this weekend or next).
with today as (select (now() at time zone 'Asia/Kolkata')::date as d),
next_sat as (
  select d + (case when (6 - extract(dow from d)::int) <= 0 then 7 + (6 - extract(dow from d)::int)
                   else 6 - extract(dow from d)::int end) as sat
  from today
)
insert into public.activities (
  id, organiser_id, title, description, category, activity_date, start_time,
  venue_name, neighbourhood, maps_url, estimated_cost, max_participants
)
select a.id, a.organiser_id, a.title, a.description, a.category,
       case a.day_offset
         when 'SAT' then (select sat from next_sat)
         when 'SUN' then (select sat from next_sat) + 1
         else (select d from today) + a.day_offset::int
       end,
       a.start_time::time, a.venue_name, a.neighbourhood, a.maps_url, a.estimated_cost, a.max_participants
from (values
  ('b0000001-0000-4000-8000-000000000001'::uuid, 'a1111111-1111-4111-8111-111111111111'::uuid,
   'Sunday Morning Badminton',
   'Casual doubles for all levels — if you can hold a racquet, you are welcome. We have booked two courts for 2 hours and rotate partners so everyone plays. Bring your own racquet if you have one; shuttles are covered. Court cost is split equally.',
   'sports', 'SUN', '07:00', 'Bandra Gymkhana Courts', 'Bandra',
   'https://maps.google.com/?q=Bandra+Gymkhana+Mumbai', 250, 6),
  ('b0000001-0000-4000-8000-000000000002'::uuid, 'a2222222-2222-4222-8222-222222222222'::uuid,
   'Weekend Cycling Group — Powai Lake Loop',
   'An easy-paced 20 km loop around Powai Lake and Hiranandani, with a breakfast stop at the end. Helmets are mandatory. Rental cycles are available nearby if you do not own one. We ride together and nobody gets left behind.',
   'fitness', 'SAT', '06:15', 'Powai Lake Promenade (main gate)', 'Powai',
   'https://maps.google.com/?q=Powai+Lake+Mumbai', 0, 10),
  ('b0000001-0000-4000-8000-000000000003'::uuid, 'a3333333-3333-4333-8333-333333333333'::uuid,
   'Pottery for Beginners',
   'A hands-on, 2-hour wheel-throwing session at a small studio in Andheri West. The instructor walks you through centering, shaping and trimming. You will take home one finished piece after firing. Wear clothes you do not mind getting muddy!',
   'workshops', '6', '16:00', 'Clay Corner Studio', 'Andheri',
   'https://maps.google.com/?q=Andheri+West+Mumbai', 1500, 5),
  ('b0000001-0000-4000-8000-000000000004'::uuid, 'a3333333-3333-4333-8333-333333333333'::uuid,
   'Board Games Evening',
   'Catan, Codenames, Splendor and plenty of party games. Never played before? Perfect — we will teach you. The cafe charges a small cover that includes unlimited games; food and drinks are separate.',
   'board_games', '3', '19:00', 'The Game Room Cafe', 'Lower Parel',
   'https://maps.google.com/?q=Lower+Parel+Mumbai', 300, 8),
  ('b0000001-0000-4000-8000-000000000005'::uuid, 'a4444444-4444-4444-8444-444444444444'::uuid,
   'Marine Drive Sunset Walk',
   'A relaxed walk from NCPA to Girgaum Chowpatty as the sun goes down, followed by optional bhutta and chai. Great if you have just moved to Mumbai and want to meet a few new people. Comfortable shoes recommended.',
   'social', '2', '17:45', 'NCPA end of Marine Drive', 'Marine Drive',
   'https://maps.google.com/?q=NCPA+Marine+Drive+Mumbai', 0, 12),
  ('b0000001-0000-4000-8000-000000000006'::uuid, 'a2222222-2222-4222-8222-222222222222'::uuid,
   'Beginner''s Trekking Meetup — Kanheri Caves Trail',
   'A beginner-friendly half-day trek inside Sanjay Gandhi National Park up to the Kanheri Caves. Moderate pace with plenty of breaks. Carry 2 litres of water, a snack and sturdy shoes. Park entry fee is paid individually at the gate.',
   'outdoors', 'SUN', '07:30', 'SGNP Main Gate, Borivali East', 'Sanjay Gandhi National Park',
   'https://maps.google.com/?q=Sanjay+Gandhi+National+Park+Main+Gate', 150, 10),
  ('b0000001-0000-4000-8000-000000000007'::uuid, 'a1111111-1111-4111-8111-111111111111'::uuid,
   'Cafe Hopping in Bandra',
   'Three cafes, one afternoon. We start in Ranwar village, try a signature drink or dessert at each stop and wander the lanes in between. Everyone pays for their own order. Ideal for food lovers and people new to the city.',
   'food', 'SAT', '15:00', 'Ranwar Square', 'Bandra',
   'https://maps.google.com/?q=Ranwar+Bandra+Mumbai', 800, 6),
  ('b0000001-0000-4000-8000-000000000008'::uuid, 'a4444444-4444-4444-8444-444444444444'::uuid,
   'Weekend Football',
   'Friendly 7-a-side on the turf near Juhu. Mixed skill levels and a no-tackling, good-vibes-only rule. We split into teams on the spot. Turf booking is split between everyone who plays.',
   'sports', 'SAT', '18:30', 'Juhu Turf Arena', 'Juhu',
   'https://maps.google.com/?q=Juhu+Mumbai', 200, 13),
  ('b0000001-0000-4000-8000-000000000009'::uuid, 'a3333333-3333-4333-8333-333333333333'::uuid,
   'Sketching at Kala Ghoda',
   'Bring a sketchbook and any pens or pencils you like. We will sit around the Kala Ghoda precinct for an hour and draw the heritage buildings, then share what we made over coffee. All skill levels welcome.',
   'art', '9', '10:00', 'Kala Ghoda Arts Precinct', 'Fort',
   'https://maps.google.com/?q=Kala+Ghoda+Mumbai', 0, 8),
  ('b0000001-0000-4000-8000-000000000010'::uuid, 'a4444444-4444-4444-8444-444444444444'::uuid,
   'Open Mic Night — Listeners Welcome',
   'An evening of acoustic music, poetry and stand-up at a cosy venue in Versova. You can sign up to perform for 5 minutes or simply come to listen and cheer. Cover charge includes one drink.',
   'music', '10', '20:00', 'Versova Social Stage', 'Versova',
   'https://maps.google.com/?q=Versova+Mumbai', 400, 15)
) as a(id, organiser_id, title, description, category, day_offset, start_time,
       venue_name, neighbourhood, maps_url, estimated_cost, max_participants)
on conflict (id) do update set activity_date = excluded.activity_date, status = 'active';

-- ---------- A few sample hosts joining each other's plans ----------
insert into public.join_requests (activity_id, user_id, status)
values
  ('b0000001-0000-4000-8000-000000000001', 'a4444444-4444-4444-8444-444444444444', 'accepted'),
  ('b0000001-0000-4000-8000-000000000001', 'a3333333-3333-4333-8333-333333333333', 'accepted'),
  ('b0000001-0000-4000-8000-000000000004', 'a1111111-1111-4111-8111-111111111111', 'accepted'),
  ('b0000001-0000-4000-8000-000000000005', 'a2222222-2222-4222-8222-222222222222', 'accepted'),
  ('b0000001-0000-4000-8000-000000000006', 'a4444444-4444-4444-8444-444444444444', 'accepted'),
  ('b0000001-0000-4000-8000-000000000003', 'a1111111-1111-4111-8111-111111111111', 'accepted')
on conflict (activity_id, user_id) do nothing;
