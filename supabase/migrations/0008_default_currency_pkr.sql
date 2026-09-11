-- ============================================================================
-- PharmaFlow — 0008: default currency PKR
-- ============================================================================

alter table public.pharmacies alter column currency set default 'PKR';

-- Backfill pharmacies still on the old default — leaves any pharmacy that
-- has already deliberately chosen a different currency untouched.
update public.pharmacies set currency = 'PKR' where currency = 'USD';
