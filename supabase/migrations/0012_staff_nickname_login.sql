-- Konobar: staff log in with a nickname instead of an email address
-- Run after 0001-0011, in the SQL Editor.

-- Supabase Auth is email-based, so a deterministic synthetic email
-- (nickname@staff.konobar.internal, see src/lib/staffLogin.ts) is still
-- used under the hood for STAFF accounts and stored in profiles.email -
-- nickname is the human-facing identifier STAFF accounts actually log in
-- with.
alter table public.profiles add column if not exists nickname text unique;

-- Keep it safely embeddable in a synthetic email address and predictable
-- to type on a shared tablet.
alter table public.profiles
  add constraint profiles_nickname_format_check
  check (nickname is null or nickname ~ '^[a-z0-9_-]{3,32}$');

-- Every STAFF profile must have a nickname; OWNER/SUPER_ADMIN don't use
-- one. Added NOT VALID so it doesn't fail on any pre-existing STAFF rows
-- created before this migration (those need a nickname backfilled, or
-- simplest: delete and recreate them via the new flow) - it still applies
-- to every insert/update from this point on regardless.
alter table public.profiles
  add constraint profiles_staff_nickname_check
  check (role <> 'STAFF' or nickname is not null) not valid;
