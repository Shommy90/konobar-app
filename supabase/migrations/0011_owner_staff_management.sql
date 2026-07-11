-- Konobar: allow OWNER to create STAFF accounts for their own restaurant
-- Run after 0001-0010, in the SQL Editor.

-- profiles_insert (0002) only allowed SUPER_ADMIN. This adds a second,
-- narrower permissive policy for OWNER: they may only insert a profile
-- that is role = 'STAFF' and scoped to their own restaurant_id - they
-- still can't create another OWNER, a SUPER_ADMIN, or a profile for a
-- restaurant that isn't theirs.
create policy profiles_owner_insert_staff
on public.profiles
for insert
with check (
  public.current_user_role() = 'OWNER'
  and role = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
);
