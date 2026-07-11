-- Konobar: revert staff nickname login and owner-managed staff accounts
-- Run after 0001-0012, in the SQL Editor.

-- Decided to defer STAFF accounts/login: for now OWNER logs in and the
-- same session is used on the shared staff tablet. The STAFF role stays
-- in profiles.role for future use, but the nickname-login machinery and
-- the OWNER-can-insert-STAFF policy added in 0011/0012 are no longer used.

drop policy if exists profiles_owner_insert_staff on public.profiles;

alter table public.profiles drop constraint if exists profiles_staff_nickname_check;
alter table public.profiles drop constraint if exists profiles_nickname_format_check;
alter table public.profiles drop column if exists nickname;
