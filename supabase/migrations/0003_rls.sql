-- ============================================================================
-- PharmaFlow — 0003: Row Level Security (complete tenant isolation)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions. SECURITY DEFINER so they can read pharmacy_users without
-- being blocked by (or recursing into) that table's own RLS policies.
-- ---------------------------------------------------------------------------

create or replace function public.is_pharmacy_member(p_pharmacy_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pharmacy_users pu
    where pu.pharmacy_id = p_pharmacy_id
      and pu.user_id = auth.uid()
      and pu.status = 'active'
  );
$$;

create or replace function public.current_pharmacy_role(p_pharmacy_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.pharmacy_users
  where pharmacy_id = p_pharmacy_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.is_pharmacy_owner(p_pharmacy_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_pharmacy_role(p_pharmacy_id) = 'owner';
$$;

create or replace function public.can_manage_pharmacy(p_pharmacy_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_pharmacy_role(p_pharmacy_id) in ('owner', 'manager');
$$;

-- Every pharmacy this user belongs to. Used by list/dashboard queries so a
-- user with several pharmacies (rare, but not disallowed) sees all of them.
create or replace function public.my_pharmacy_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select pharmacy_id from public.pharmacy_users
  where user_id = auth.uid() and status = 'active';
$$;

grant execute on function public.is_pharmacy_member(uuid) to authenticated;
grant execute on function public.current_pharmacy_role(uuid) to authenticated;
grant execute on function public.is_pharmacy_owner(uuid) to authenticated;
grant execute on function public.can_manage_pharmacy(uuid) to authenticated;
grant execute on function public.my_pharmacy_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_users enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.medicines enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: a user can read/update only their own profile. Other members of
-- the same pharmacy can read teammates' names for staff/attribution display.
-- ---------------------------------------------------------------------------

create policy "profiles_select_own_or_teammate" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.pharmacy_users mine
      join public.pharmacy_users theirs on theirs.pharmacy_id = mine.pharmacy_id
      where mine.user_id = auth.uid() and mine.status = 'active'
        and theirs.user_id = public.profiles.id and theirs.status = 'active'
    )
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- pharmacies
-- ---------------------------------------------------------------------------

create policy "pharmacies_select_member" on public.pharmacies
  for select using (public.is_pharmacy_member(id));

create policy "pharmacies_update_manager" on public.pharmacies
  for update using (public.can_manage_pharmacy(id)) with check (public.can_manage_pharmacy(id));

-- Inserts happen only via the SECURITY DEFINER signup trigger, never
-- directly from client code, so no insert policy is granted to clients.

-- ---------------------------------------------------------------------------
-- pharmacy_users (staff): members can see the roster; only the owner can
-- add, change or remove staff.
-- ---------------------------------------------------------------------------

create policy "pharmacy_users_select_member" on public.pharmacy_users
  for select using (public.is_pharmacy_member(pharmacy_id));

create policy "pharmacy_users_insert_owner" on public.pharmacy_users
  for insert with check (public.is_pharmacy_owner(pharmacy_id));

create policy "pharmacy_users_update_owner" on public.pharmacy_users
  for update using (public.is_pharmacy_owner(pharmacy_id)) with check (public.is_pharmacy_owner(pharmacy_id));

create policy "pharmacy_users_delete_owner" on public.pharmacy_users
  for delete using (public.is_pharmacy_owner(pharmacy_id) and role <> 'owner');

-- ---------------------------------------------------------------------------
-- Generic per-tenant policy for the remaining pharmacy-scoped tables: any
-- active member may read and write their own pharmacy's rows, nothing else.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  -- purchase_items and sale_items are scoped through their parent row
  -- further down (they have no pharmacy_id column of their own).
  tables text[] := array[
    'categories', 'suppliers', 'customers', 'medicines',
    'inventory_transactions', 'purchases',
    'sales', 'invoices', 'expenses', 'notifications'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy "%1$s_select_member" on public.%1$s for select using (public.is_pharmacy_member(pharmacy_id));',
      t
    );
    execute format(
      'create policy "%1$s_insert_member" on public.%1$s for insert with check (public.is_pharmacy_member(pharmacy_id));',
      t
    );
    execute format(
      'create policy "%1$s_update_member" on public.%1$s for update using (public.is_pharmacy_member(pharmacy_id)) with check (public.is_pharmacy_member(pharmacy_id));',
      t
    );
    execute format(
      'create policy "%1$s_delete_member" on public.%1$s for delete using (public.is_pharmacy_member(pharmacy_id));',
      t
    );
  end loop;
end;
$$;

-- purchase_items and sale_items are keyed by purchase_id/sale_id rather than
-- pharmacy_id directly, so scope them through their parent row instead.

create policy "purchase_items_select_member" on public.purchase_items
  for select using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and public.is_pharmacy_member(p.pharmacy_id)
  ));
create policy "purchase_items_insert_member" on public.purchase_items
  for insert with check (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and public.is_pharmacy_member(p.pharmacy_id)
  ));
create policy "purchase_items_update_member" on public.purchase_items
  for update using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and public.is_pharmacy_member(p.pharmacy_id)
  ));
create policy "purchase_items_delete_member" on public.purchase_items
  for delete using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and public.is_pharmacy_member(p.pharmacy_id)
  ));

create policy "sale_items_select_member" on public.sale_items
  for select using (exists (
    select 1 from public.sales s
    where s.id = sale_id and public.is_pharmacy_member(s.pharmacy_id)
  ));
create policy "sale_items_insert_member" on public.sale_items
  for insert with check (exists (
    select 1 from public.sales s
    where s.id = sale_id and public.is_pharmacy_member(s.pharmacy_id)
  ));
create policy "sale_items_update_member" on public.sale_items
  for update using (exists (
    select 1 from public.sales s
    where s.id = sale_id and public.is_pharmacy_member(s.pharmacy_id)
  ));
create policy "sale_items_delete_member" on public.sale_items
  for delete using (exists (
    select 1 from public.sales s
    where s.id = sale_id and public.is_pharmacy_member(s.pharmacy_id)
  ));
