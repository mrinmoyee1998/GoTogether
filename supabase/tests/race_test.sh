#!/usr/bin/env bash
# Concurrency test: two organiser sessions try to accept two different
# requests for the LAST spot at the same time. Exactly one must succeed.
# Usage: DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres bash supabase/tests/race_test.sh
set -euo pipefail
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
A=00000000-0000-4000-8000-0000000000a1
B=00000000-0000-4000-8000-0000000000b1
C=00000000-0000-4000-8000-0000000000c1
ACT=00000000-0000-4000-8000-0000000000f1
q() { psql "$DB_URL" -qtAX -v ON_ERROR_STOP=1 -c "$1"; }

cleanup() { q "delete from auth.users where id in ('$A','$B','$C');" >/dev/null; }
trap cleanup EXIT
cleanup

q "insert into auth.users (id, email, aud, role, instance_id) values
   ('$A','race.a@example.com','authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
   ('$B','race.b@example.com','authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
   ('$C','race.c@example.com','authenticated','authenticated','00000000-0000-0000-0000-000000000000');
   update public.profiles set full_name='Racer', age_confirmed=true, neighbourhood='Bandra', interests='{sports}', onboarding_completed=true
    where id in ('$A','$B','$C');
   insert into public.activities (id, organiser_id, title, description, category, activity_date, start_time, venue_name, neighbourhood, max_participants)
   values ('$ACT','$A','Race test','Testing concurrent acceptance of the last spot.','sports',
           (now() at time zone 'Asia/Kolkata')::date + 2,'07:00','Venue','Bandra',1);
   insert into public.join_requests (activity_id, user_id) values ('$ACT','$B'),('$ACT','$C');" >/dev/null

RB=$(q "select id from public.join_requests where activity_id='$ACT' and user_id='$B'")
RC=$(q "select id from public.join_requests where activity_id='$ACT' and user_id='$C'")

accept() { # $1 request id, $2 delay before commit
  psql "$DB_URL" -qtAX 2>&1 <<SQL || true
begin;
select set_config('role','authenticated',true), set_config('request.jwt.claims','{"sub":"$A","role":"authenticated"}',true) \g /dev/null
select 'OK ' || status from public.respond_to_join_request('$1','accepted');
select pg_sleep($2) \g /dev/null
commit;
SQL
}

# Session 1 accepts B and holds its transaction open for 2s; session 2 tries C meanwhile.
accept "$RB" 2 > /tmp/race1.out &
sleep 0.5
accept "$RC" 0 > /tmp/race2.out &
wait

echo "Session 1: $(tr '\n' ' ' < /tmp/race1.out)"
echo "Session 2: $(tr '\n' ' ' < /tmp/race2.out)"
ACCEPTED=$(q "select count(*) from public.join_requests where activity_id='$ACT' and status='accepted'")
COUNT=$(q "select confirmed_count from public.activities where id='$ACT'")
echo "Accepted rows: $ACCEPTED, confirmed_count: $COUNT (max 1)"
if [[ "$ACCEPTED" == "1" && "$COUNT" == "1" ]]; then echo "PASS: last spot was given to exactly one person"; else echo "FAIL"; exit 1; fi
