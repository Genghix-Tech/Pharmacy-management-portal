-- ============================================================================
-- PharmaFlow — 0002: core schema
-- ============================================================================

-- One row per Supabase auth user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per pharmacy tenant.
create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  logo_url text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  country text,
  tax_number text,
  currency text not null default 'USD',
  invoice_prefix text not null default 'INV',
  invoice_footer text not null default 'Thank you for your business. Get well soon!',
  tax_rate numeric(6, 3) not null default 0,
  expiry_alert_days integer not null default 30,
  next_invoice_seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Staff membership + role for a pharmacy. The owner also gets a row here.
create table public.pharmacy_users (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'cashier', 'inventory_manager')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (pharmacy_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (pharmacy_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  date_of_birth date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  name text not null,
  generic_name text,
  brand text,
  sku text,
  barcode text,
  category_id uuid references public.categories (id) on delete set null,
  manufacturer text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  batch_number text,
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  min_stock_level integer not null default 10 check (min_stock_level >= 0),
  expiry_date date,
  manufacturing_date date,
  unit_type text not null default 'unit',
  tax_rate numeric(6, 3) not null default 0,
  discount_rate numeric(6, 3) not null default 0,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, sku),
  unique (pharmacy_id, barcode)
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  type text not null check (type in ('purchase', 'sale', 'adjustment', 'return', 'initial')),
  quantity_change integer not null,
  quantity_after integer not null,
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  purchase_number text not null,
  purchase_date date not null default current_date,
  total_amount numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (pharmacy_id, purchase_number)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete restrict,
  batch_number text,
  quantity integer not null check (quantity > 0),
  purchase_price numeric(12, 2) not null check (purchase_price >= 0),
  expiry_date date,
  total numeric(12, 2) not null default 0
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  invoice_number text not null,
  customer_id uuid references public.customers (id) on delete set null,
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  cost_amount numeric(12, 2) not null default 0,
  profit_amount numeric(12, 2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'bank_transfer', 'other')),
  status text not null default 'completed' check (status in ('completed', 'refunded', 'partially_refunded')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (pharmacy_id, invoice_number)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  medicine_id uuid references public.medicines (id) on delete set null,
  medicine_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount_amount numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  cost_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  refunded_quantity integer not null default 0
);

-- Immutable snapshot of pharmacy + customer details at the moment of sale,
-- so a changed pharmacy profile never rewrites history on an old invoice.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  sale_id uuid not null unique references public.sales (id) on delete cascade,
  invoice_number text not null,
  pharmacy_snapshot jsonb not null,
  customer_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  title text not null,
  category text not null default 'other',
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'bank_transfer', 'other')),
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  type text not null check (
    type in ('low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'new_sale', 'purchase_recorded')
  ),
  title text not null,
  message text not null,
  reference_type text,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pharmacies for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.medicines for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.expenses for each row execute function public.set_updated_at();

-- Indexes for the lookups the app performs constantly.
create index idx_pharmacy_users_pharmacy on public.pharmacy_users (pharmacy_id);
create index idx_pharmacy_users_user on public.pharmacy_users (user_id);
create index idx_categories_pharmacy on public.categories (pharmacy_id);
create index idx_suppliers_pharmacy on public.suppliers (pharmacy_id);
create index idx_customers_pharmacy on public.customers (pharmacy_id);
create index idx_customers_search on public.customers using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '')));
create index idx_medicines_pharmacy on public.medicines (pharmacy_id);
create index idx_medicines_category on public.medicines (category_id);
create index idx_medicines_supplier on public.medicines (supplier_id);
create index idx_medicines_barcode on public.medicines (pharmacy_id, barcode);
create index idx_medicines_expiry on public.medicines (pharmacy_id, expiry_date);
create index idx_medicines_search on public.medicines using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(generic_name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(sku, '')));
create index idx_inventory_tx_pharmacy on public.inventory_transactions (pharmacy_id, created_at desc);
create index idx_inventory_tx_medicine on public.inventory_transactions (medicine_id, created_at desc);
create index idx_purchases_pharmacy on public.purchases (pharmacy_id, purchase_date desc);
create index idx_purchase_items_purchase on public.purchase_items (purchase_id);
create index idx_purchase_items_medicine on public.purchase_items (medicine_id);
create index idx_sales_pharmacy on public.sales (pharmacy_id, created_at desc);
create index idx_sales_customer on public.sales (customer_id);
create index idx_sale_items_sale on public.sale_items (sale_id);
create index idx_sale_items_medicine on public.sale_items (medicine_id);
create index idx_expenses_pharmacy on public.expenses (pharmacy_id, expense_date desc);
create index idx_notifications_pharmacy on public.notifications (pharmacy_id, created_at desc);
create index idx_notifications_unread on public.notifications (pharmacy_id, is_read);
