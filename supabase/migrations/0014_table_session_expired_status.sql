-- Konobar: add EXPIRED to table_session_status
-- Run after 0001-0013, ALONE, in its own SQL Editor execution - a new enum
-- value can't be referenced by any statement in the same transaction that
-- adds it, so this must commit by itself before 0015 (which references
-- 'EXPIRED') is run.

alter type public.table_session_status add value if not exists 'EXPIRED';
