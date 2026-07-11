-- Konobar: fix "function gen_random_bytes(integer) does not exist" in the
-- guest session RPCs from 0015_guest_ordering_sessions.sql
-- Run after 0015, in the SQL Editor.
--
-- Supabase installs pgcrypto (and its gen_random_bytes) into the
-- `extensions` schema, not `public`, on every project. 0015 pinned
-- `search_path = public` only, which is correct/safe for every
-- schema-qualified `public.*` reference in those function bodies, but
-- left the one unqualified call - `gen_random_bytes(16)` when minting a
-- new session_token - unresolvable. Adding `extensions` to the pinned
-- search_path (still a fixed, non-caller-controlled list, so no
-- hijacking risk reappears) fixes it without having to guess/hardcode
-- which schema this particular Supabase project put pgcrypto in via an
-- explicit `extensions.gen_random_bytes(...)` call.

alter function public.resolve_guest_session(uuid, uuid, uuid, text)
  set search_path = public, extensions;

alter function public.place_guest_order(uuid, uuid, text, jsonb)
  set search_path = public, extensions;
