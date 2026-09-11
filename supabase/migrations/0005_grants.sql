-- ============================================================================
-- PharmaFlow — 0005: table grants
--
-- Supabase projects already grant broad table privileges to `authenticated`
-- by default (RLS is the real gate), but we set them explicitly here so this
-- schema is self-contained and behaves the same on any Postgres instance.
-- ============================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.pharmacies,
  public.pharmacy_users,
  public.categories,
  public.suppliers,
  public.customers,
  public.medicines,
  public.inventory_transactions,
  public.purchases,
  public.purchase_items,
  public.sales,
  public.sale_items,
  public.invoices,
  public.expenses,
  public.notifications
to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
