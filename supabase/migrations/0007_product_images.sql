-- Konobar: Supabase Storage for product images
-- Run after 0001-0006, in the SQL Editor.

-- Replace the manual image_url text field with a Storage object path.
-- Binary/base64 image data is never stored in Postgres.
alter table public.menu_products drop column if exists image_url;
alter table public.menu_products add column if not exists image_path text;

-- Bucket is public for read (product photos are guest-facing menu content
-- anyway); writes are still gated entirely by the RLS policies below. Only
-- the client-side-converted WebP output is ever uploaded, so the bucket
-- itself only accepts image/webp regardless of what the guest UI validates.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: restaurants/{restaurantId}/products/{productId}/{uuid}.webp
-- storage.foldername(name) returns the path split into folder segments
-- (filename excluded), so segment [1] = 'restaurants', [2] = restaurantId.
-- The restaurantId compared against is public.current_user_restaurant_id(),
-- resolved server-side from the caller's own profile/JWT - never from the
-- object path a client chooses to upload to.

create policy product_images_public_select
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy product_images_super_admin_all
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images'
  and public.current_user_role() = 'SUPER_ADMIN'
)
with check (
  bucket_id = 'product-images'
  and public.current_user_role() = 'SUPER_ADMIN'
);

create policy product_images_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.current_user_role() = 'OWNER'
  and (storage.foldername(name))[1] = 'restaurants'
  and (storage.foldername(name))[2] = public.current_user_restaurant_id()::text
);

create policy product_images_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.current_user_role() = 'OWNER'
  and (storage.foldername(name))[1] = 'restaurants'
  and (storage.foldername(name))[2] = public.current_user_restaurant_id()::text
)
with check (
  bucket_id = 'product-images'
  and public.current_user_role() = 'OWNER'
  and (storage.foldername(name))[1] = 'restaurants'
  and (storage.foldername(name))[2] = public.current_user_restaurant_id()::text
);

create policy product_images_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.current_user_role() = 'OWNER'
  and (storage.foldername(name))[1] = 'restaurants'
  and (storage.foldername(name))[2] = public.current_user_restaurant_id()::text
);
