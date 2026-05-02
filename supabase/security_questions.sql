-- ==========================================================
-- Optional security hardening for `questions`
-- Run AFTER `schema.sql` if the table already exists.
-- Stops anonymous users from editing/deleting *other people's* messages.
-- ==========================================================

alter table public.questions
  add column if not exists edit_token uuid not null default gen_random_uuid();

-- Remove overly-permissive policies
drop policy if exists "public update questions" on public.questions;
drop policy if exists "public delete questions" on public.questions;

-- Only the row inserter can update/delete if they know the token (via RPC below).
-- Direct table UPDATE/DELETE from anon is denied (no policy = deny).

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
