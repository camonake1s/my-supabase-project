-- ==========================================================
-- PlayFul Paws — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ==========================================================

-- 1) ANIMALS ------------------------------------------------
create table if not exists public.animals (
  id           bigserial primary key,
  name         text not null,
  type         text check (type in ('dog','cat','special')) default 'dog',
  age          text,
  gender       text check (gender in ('male','female')) ,
  status       text check (status in ('looking','urgent','treatment')) default 'looking',
  description  text,
  photo_url    text,
  arrival_story text,
  special_characteristics text,
  created_at   timestamptz default now()
);

-- 2) RESCUE STORIES (the small "Rescue Story" card on hero + future news)
create table if not exists public.rescue_stories (
  id           bigserial primary key,
  title        text not null,
  body         text,
  is_featured  boolean default false,
  created_at   timestamptz default now()
);

-- 3) QUESTIONS / MESSAGES on each animal page
--    edit_token: returned once on insert; only that browser session can edit/delete via RPC
create table if not exists public.questions (
  id          bigserial primary key,
  animal_id   bigint references public.animals(id) on delete cascade,
  author      text default 'Guest',
  message     text not null,
  edit_token  uuid not null default gen_random_uuid(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 4) ADOPTION APPLICATIONS — submitted from the form
create table if not exists public.adoptions (
  id                 bigserial primary key,
  animal_id          bigint references public.animals(id) on delete set null,
  full_name          text not null,
  phone              text not null,
  email              text,
  visit_at           timestamptz,           -- the calendar / preferred visit slot
  animal_experience  text,
  living_environment text,
  consent_given      boolean default false, -- explicit consent checkbox
  created_at         timestamptz default now()
);

-- Index that orders applications by the soonest scheduled visit.
-- The shelter's admin queries should ORDER BY visit_at ASC NULLS LAST.
create index if not exists adoptions_visit_at_idx
  on public.adoptions (visit_at asc nulls last);

-- ==========================================================
-- ROW LEVEL SECURITY
-- The site uses the public anon key, so we must explicitly allow
-- the operations we want from the browser.
-- ==========================================================
alter table public.animals         enable row level security;
alter table public.rescue_stories  enable row level security;
alter table public.questions       enable row level security;
alter table public.adoptions       enable row level security;

-- Public READ for catalogue + stories + questions
drop policy if exists "public read animals"  on public.animals;
create policy "public read animals"  on public.animals         for select using (true);

drop policy if exists "public read stories" on public.rescue_stories;
create policy "public read stories"  on public.rescue_stories  for select using (true);

drop policy if exists "public read questions" on public.questions;
create policy "public read questions" on public.questions      for select using (true);

-- Anyone can post a question; updates/deletes go only through RPCs below (token check).
drop policy if exists "public insert questions" on public.questions;
create policy "public insert questions" on public.questions    for insert with check (true);

drop policy if exists "public update questions" on public.questions;
drop policy if exists "public delete questions" on public.questions;

-- Secure RPCs: caller must supply the edit_token that was returned when the row was created.
create or replace function public.update_own_question(
  q_id bigint,
  t uuid,
  new_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(new_message)) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  update public.questions
  set message = trim(new_message),
      updated_at = now()
  where id = q_id and edit_token = t;
  if not found then
    raise exception 'Not authorized or question not found';
  end if;
end;
$$;

create or replace function public.delete_own_question(q_id bigint, t uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.questions where id = q_id and edit_token = t;
  if not found then
    raise exception 'Not authorized or question not found';
  end if;
end;
$$;

revoke all on function public.update_own_question(bigint, uuid, text) from public;
grant execute on function public.update_own_question(bigint, uuid, text) to anon, authenticated;

revoke all on function public.delete_own_question(bigint, uuid) from public;
grant execute on function public.delete_own_question(bigint, uuid) to anon, authenticated;

-- Public can submit adoption applications (write-only)
drop policy if exists "public submit adoptions" on public.adoptions;
create policy "public submit adoptions" on public.adoptions    for insert with check (true);

-- Add structured profile fields on existing databases
alter table public.animals add column if not exists arrival_story text;
alter table public.animals add column if not exists special_characteristics text;

-- Ensure all adoption columns exist on older databases that were created
-- before these columns were added to the schema. Safe to re-run.
alter table public.adoptions add column if not exists animal_id          bigint;
alter table public.adoptions add column if not exists email              text;
alter table public.adoptions add column if not exists visit_at           timestamptz;
alter table public.adoptions add column if not exists animal_experience  text;
alter table public.adoptions add column if not exists living_environment text;
alter table public.adoptions add column if not exists consent_given      boolean default false;

-- Ensure all adoption columns exist on older databases that were created
-- before these columns were added to the schema. Safe to re-run.
alter table public.adoptions add column if not exists email              text;
alter table public.adoptions add column if not exists visit_at           timestamptz;
alter table public.adoptions add column if not exists animal_experience  text;
alter table public.adoptions add column if not exists living_environment text;
alter table public.adoptions add column if not exists consent_given      boolean default false;

-- Force PostgREST to pick up the new columns immediately (otherwise
-- the API may keep using its old schema cache for up to a few minutes).
notify pgrst, 'reload schema';

-- Backfill arrival story from legacy description when empty
update public.animals
set arrival_story = description
where (arrival_story is null or trim(arrival_story) = '')
  and description is not null
  and trim(description) <> '';

-- ==========================================================
-- SEED a few rows so the page isn't empty on first run
-- ==========================================================
insert into public.rescue_stories (title, body, is_featured) values
  ('Victoria — three surgeries',
   'A local resident poured a chemical solution on her. Thanks to your help, Victoria is finally healing.',
   true)
on conflict do nothing;

insert into public.animals (
  name, type, age, gender, status, description,
  arrival_story, special_characteristics
) values
  ('Coco', 'dog', '1 year', 'male', 'looking',
   'Active and kind dog. Vaccinated. Gets along well with other dogs.',
   'Brought to Comes after a volunteer found him near a market; he had no chip and waited in temporary foster before joining the shelter dogs.',
   'Friendly with other dogs; good for an active household.'),
  ('Luna', 'cat', '2 years', 'female', 'looking',
   'Calm and affectionate. Loves quiet homes.',
   'Transferred from a city apartment when the owner moved abroad; she lived indoors only.',
   'Prefers a calm environment; shy around loud children at first.'),
  ('Rex', 'dog', '4 years', 'male', 'urgent',
   'Rescued from the street. Needs urgent support for treatment.',
   'Found on the roadside with a leg injury; clinic partners in Almaty stabilised him before return to Kaynar for rehab.',
   'Ongoing physiotherapy; needs a patient adopter who can follow vet guidance.'),
  ('Mila', 'cat', '6 months', 'female', 'treatment',
   'Currently under veterinary treatment.',
   'Arrived as part of a small litter from a rural area; the shelter coordinated vaccinations and spay planning.',
   'Still building confidence; best with gentle handling.')
on conflict do nothing;
