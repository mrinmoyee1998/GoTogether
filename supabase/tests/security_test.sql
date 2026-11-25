-- =====================================================================
-- GoTogether database security tests.
-- Runs everything inside a transaction and rolls back, so it is safe to
-- run against a dev database:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_test.sql
-- Each check raises an exception (and aborts) if a rule is violated.
-- =====================================================================
begin;

-- Test users (A = organiser, B and C = participants, D = not onboarded)
insert into auth.users (id, email, aud, role, raw_user_meta_data, instance_id)
values
  ('00000000-0000-4000-8000-00000000000a', 'test.a@example.com', 'authenticated', 'authenticated', '{"full_name":"Test A"}', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-4000-8000-00000000000b', 'test.b@example.com', 'authenticated', 'authenticated', '{"full_name":"Test B"}', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-4000-8000-00000000000c', 'test.c@example.com', 'authenticated', 'authenticated', '{"full_name":"Test C"}', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-4000-8000-00000000000d', 'test.d@example.com', 'authenticated', 'authenticated', '{"full_name":"Test D"}', '00000000-0000-0000-0000-000000000000');

update public.profiles
   set age_confirmed = true, neighbourhood = 'Bandra', interests = '{sports}', onboarding_completed = true
 where id in ('00000000-0000-4000-8000-00000000000a','00000000-0000-4000-8000-00000000000b','00000000-0000-4000-8000-00000000000c');

create or replace function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

create or replace function pg_temp.reset_role() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  d uuid := '00000000-0000-4000-8000-00000000000d';
  act uuid;
  req_b uuid;
  req_c uuid;
  n int;
  failed boolean;
  tomorrow date := (now() at time zone 'Asia/Kolkata')::date + 1;
begin
  -- 1. Profile trigger created profiles
  select count(*) into n from public.profiles where id in (a, b, c, d);
  assert n = 4, 'profiles should be auto-created on signup';

  -- 2. Organiser A creates an activity with 1 spot
  perform pg_temp.act_as(a);
  insert into public.activities (organiser_id, title, description, category, activity_date, start_time, venue_name, neighbourhood, max_participants)
  values (a, 'Test badminton', 'A friendly test game of badminton for everyone.', 'sports', tomorrow, '07:00', 'Test Courts', 'Bandra', 1)
  returning id into act;
  raise notice 'PASS organiser can create activity';

  -- 3. B cannot create an activity as A
  perform pg_temp.act_as(b);
  failed := false;
  begin
    insert into public.activities (organiser_id, title, description, category, activity_date, start_time, venue_name, neighbourhood, max_participants)
    values (a, 'Spoofed', 'Trying to create as someone else, should fail.', 'sports', tomorrow, '07:00', 'X Venue', 'Bandra', 3);
  exception when others then failed := true; end;
  assert failed, 'B must not create activities as A';
  raise notice 'PASS cannot create activity as another user';

  -- 4. Activities in the past are rejected
  perform pg_temp.act_as(a);
  failed := false;
  begin
    insert into public.activities (organiser_id, title, description, category, activity_date, start_time, venue_name, neighbourhood, max_participants)
    values (a, 'Past plan', 'This is in the past and should be rejected.', 'sports', tomorrow - 3, '07:00', 'X Venue', 'Bandra', 3);
  exception when others then failed := true; end;
  assert failed, 'past activities must be rejected';
  raise notice 'PASS past activities rejected';

  -- 5. Client cannot set confirmed_count or organiser_id directly
  failed := false;
  begin
    update public.activities set confirmed_count = 1 where id = act;
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'confirmed_count must not be client-writable';
  raise notice 'PASS confirmed_count not writable';

  -- 6. B cannot edit A's activity (RLS filters it out: 0 rows)
  perform pg_temp.act_as(b);
  update public.activities set title = 'Hijacked title' where id = act;
  get diagnostics n = row_count;
  assert n = 0, 'B must not update A''s activity';
  raise notice 'PASS non-organiser cannot edit activity';

  -- 7. B cannot edit A's profile
  update public.profiles set full_name = 'Hacked' where id = a;
  get diagnostics n = row_count;
  assert n = 0, 'B must not update A''s profile';
  raise notice 'PASS cannot edit another profile';

  -- 8. Direct insert into join_requests is not allowed
  failed := false;
  begin
    insert into public.join_requests (activity_id, user_id, status) values (act, b, 'accepted');
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'direct join_requests insert must be denied';
  raise notice 'PASS direct join_requests writes denied';

  -- 9. Not-onboarded user D cannot request to join
  perform pg_temp.act_as(d);
  failed := false;
  begin perform public.request_to_join(act, null); exception when others then failed := true; end;
  assert failed, 'non-onboarded users must not join';
  raise notice 'PASS onboarding (18+) required to join';

  -- 10. Organiser cannot join own activity
  perform pg_temp.act_as(a);
  failed := false;
  begin perform public.request_to_join(act, null); exception when others then failed := true; end;
  assert failed, 'organiser must not join own activity';
  raise notice 'PASS organiser cannot join own activity';

  -- 11. B and C request to join; duplicate request rejected
  perform pg_temp.act_as(b);
  select id into req_b from public.request_to_join(act, 'Hi!');
  failed := false;
  begin perform public.request_to_join(act, null); exception when others then failed := true; end;
  assert failed, 'duplicate active request must be rejected';
  raise notice 'PASS duplicate requests rejected';

  perform pg_temp.act_as(c);
  select id into req_c from public.request_to_join(act, null);

  -- 12. C cannot see B's pending request; C cannot accept anything
  select count(*) into n from public.join_requests where id = req_b;
  assert n = 0, 'C must not see B''s pending request';
  failed := false;
  begin perform public.respond_to_join_request(req_c, 'accepted'); exception when others then failed := true; end;
  assert failed, 'only organiser may accept';
  raise notice 'PASS non-organiser cannot approve requests; pending requests private';

  -- 13. C cannot cancel B's request
  failed := false;
  begin perform public.cancel_join_request(req_b); exception when others then failed := true; end;
  assert failed, 'C must not cancel B''s request';
  raise notice 'PASS cannot cancel another user''s request';

  -- 14. Organiser sees both pending requests, accepts B
  perform pg_temp.act_as(a);
  select count(*) into n from public.join_requests where activity_id = act and status = 'pending';
  assert n = 2, 'organiser should see 2 pending requests';
  perform public.respond_to_join_request(req_b, 'accepted');
  select confirmed_count into n from public.activities where id = act;
  assert n = 1, 'confirmed_count should be 1 after acceptance';
  raise notice 'PASS organiser accepts; count updated';

  -- 15. Capacity: accepting C when full fails
  failed := false;
  begin perform public.respond_to_join_request(req_c, 'accepted'); exception when others then failed := true; end;
  assert failed, 'must not accept beyond capacity';
  raise notice 'PASS capacity enforced';

  -- 16. Organiser cannot shrink group below confirmed count (CHECK constraint)
  failed := false;
  begin update public.activities set max_participants = 0 where id = act; exception when others then failed := true; end;
  assert failed, 'cannot shrink below confirmed';

  -- 17. Signed-in users can see confirmed participants; anon cannot see requests
  perform pg_temp.act_as(c);
  select count(*) into n from public.join_requests where activity_id = act and status = 'accepted';
  assert n = 1, 'members should see confirmed participants';
  perform pg_temp.act_as_anon();
  failed := false;
  begin select count(*) into n from public.join_requests; exception when insufficient_privilege then failed := true; end;
  assert failed, 'anon must not read join_requests';
  raise notice 'PASS participant visibility rules';

  -- 18. Anon can read only public profile columns
  select count(*) into n from (select id, full_name, avatar_url from public.profiles) s;
  failed := false;
  begin select count(bio) into n from public.profiles; exception when insufficient_privilege then failed := true; end;
  assert failed, 'anon must not read profile bio';
  raise notice 'PASS anon limited to public profile columns';

  -- 19. B leaves; C can then be accepted
  perform pg_temp.act_as(b);
  perform public.cancel_join_request(req_b);
  perform pg_temp.act_as(a);
  perform public.respond_to_join_request(req_c, 'accepted');
  select confirmed_count into n from public.activities where id = act;
  assert n = 1, 'count should reflect leave + new accept';
  raise notice 'PASS leave frees a spot';

  -- 20. Declined user cannot re-request
  perform public.respond_to_join_request(req_c, 'declined');
  perform pg_temp.act_as(c);
  failed := false;
  begin perform public.request_to_join(act, null); exception when others then failed := true; end;
  assert failed, 'declined users must not re-request';
  raise notice 'PASS declined users cannot re-request';

  -- 21. Cancelled request can be re-opened
  perform pg_temp.act_as(b);
  perform public.request_to_join(act, 'Back again');
  select count(*) into n from public.join_requests where id = req_b and status = 'pending';
  assert n = 1, 'cancelled request should re-open as pending';
  raise notice 'PASS cancelled request can be re-sent';

  perform pg_temp.reset_role();
  raise notice 'ALL SECURITY TESTS PASSED';
end $$;

rollback;
