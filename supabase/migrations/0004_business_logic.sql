-- ============================================================================
-- PharmaFlow — 0004: signup automation, computed stock/expiry status, and the
-- transactional RPCs that back POS checkout, purchases, refunds and manual
-- stock adjustments. Keeping these as single Postgres functions means every
-- multi-table write (sale + line items + stock + invoice snapshot, etc.)
-- commits or rolls back together — no half-finished sales from a dropped
-- network request.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auto-provision a profile (+ pharmacy, on owner signup) for every new
-- Supabase auth user. Runs as SECURITY DEFINER since RLS would otherwise
-- block these inserts before the user's own membership row exists.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pharmacy_id uuid;
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(v_meta ->> 'owner_name', split_part(new.email, '@', 1)), new.email, v_meta ->> 'phone')
  on conflict (id) do update set email = excluded.email;

  if coalesce(v_meta ->> 'pharmacy_name', '') <> '' then
    insert into public.pharmacies (owner_id, name, phone, email, address, city, country)
    values (
      new.id,
      v_meta ->> 'pharmacy_name',
      v_meta ->> 'phone',
      new.email,
      v_meta ->> 'address',
      v_meta ->> 'city',
      v_meta ->> 'country'
    )
    returning id into v_pharmacy_id;

    insert into public.pharmacy_users (pharmacy_id, user_id, role)
    values (v_pharmacy_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Computed stock/expiry status. A view (not a materialized copy) so it is
-- always current and inherits medicines' RLS via security_invoker.
-- ---------------------------------------------------------------------------

create view public.medicine_status
with (security_invoker = true) as
select
  m.*,
  case
    when m.quantity = 0 then 'out_of_stock'
    when m.quantity <= m.min_stock_level then 'low_stock'
    else 'in_stock'
  end as stock_status,
  case
    when m.expiry_date is null then 'none'
    when m.expiry_date < current_date then 'expired'
    when m.expiry_date <= current_date + p.expiry_alert_days then 'expiring_soon'
    else 'ok'
  end as expiry_status
from public.medicines m
join public.pharmacies p on p.id = m.pharmacy_id;

grant select on public.medicine_status to authenticated;

-- ---------------------------------------------------------------------------
-- create_sale — the POS checkout transaction.
-- p_items: jsonb array of {medicine_id, quantity, unit_price, discount_amount, tax_amount}
-- ---------------------------------------------------------------------------

create or replace function public.create_sale(
  p_pharmacy_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_payment_method text default 'cash',
  p_notes text default null
)
returns public.sales
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pharmacy public.pharmacies;
  v_sale public.sales;
  v_item jsonb;
  v_medicine public.medicines;
  v_qty int;
  v_unit_price numeric(12, 2);
  v_discount numeric(12, 2);
  v_tax numeric(12, 2);
  v_line_total numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_discount_total numeric(12, 2) := 0;
  v_tax_total numeric(12, 2) := 0;
  v_cost_total numeric(12, 2) := 0;
  v_seq int;
  v_invoice_number text;
begin
  if not public.is_pharmacy_member(p_pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale needs at least one item';
  end if;

  -- Lock the pharmacy row so concurrent checkouts never share an invoice number.
  select * into v_pharmacy from public.pharmacies where id = p_pharmacy_id for update;
  v_seq := v_pharmacy.next_invoice_seq + 1;
  update public.pharmacies set next_invoice_seq = v_seq where id = p_pharmacy_id;
  v_invoice_number := v_pharmacy.invoice_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  insert into public.sales (
    pharmacy_id, invoice_number, customer_id, payment_method, notes, created_by,
    subtotal, discount_amount, tax_amount, total_amount, cost_amount, profit_amount
  ) values (
    p_pharmacy_id, v_invoice_number, p_customer_id, coalesce(p_payment_method, 'cash'), p_notes, auth.uid(),
    0, 0, 0, 0, 0, 0
  ) returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_medicine
      from public.medicines
      where id = (v_item ->> 'medicine_id')::uuid and pharmacy_id = p_pharmacy_id
      for update;

    if v_medicine.id is null then
      raise exception 'One of the items no longer exists in your inventory';
    end if;
    if v_medicine.status <> 'active' then
      raise exception '% is inactive and cannot be sold', v_medicine.name;
    end if;
    if v_medicine.expiry_date is not null and v_medicine.expiry_date < current_date then
      raise exception '% has expired and cannot be sold', v_medicine.name;
    end if;

    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for %', v_medicine.name;
    end if;
    if v_qty > v_medicine.quantity then
      raise exception 'Only % units of % are in stock', v_medicine.quantity, v_medicine.name;
    end if;

    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, v_medicine.selling_price);
    v_discount := coalesce((v_item ->> 'discount_amount')::numeric, 0);
    v_tax := coalesce((v_item ->> 'tax_amount')::numeric, 0);
    v_line_total := (v_unit_price * v_qty) - v_discount + v_tax;

    insert into public.sale_items (
      sale_id, medicine_id, medicine_name, quantity, unit_price, discount_amount, tax_amount, cost_price, total
    ) values (
      v_sale.id, v_medicine.id, v_medicine.name, v_qty, v_unit_price, v_discount, v_tax, v_medicine.purchase_price, v_line_total
    );

    update public.medicines set quantity = quantity - v_qty where id = v_medicine.id;

    insert into public.inventory_transactions (
      pharmacy_id, medicine_id, type, quantity_change, quantity_after, reason, reference_type, reference_id, created_by
    ) values (
      p_pharmacy_id, v_medicine.id, 'sale', -v_qty, v_medicine.quantity - v_qty,
      'Sale ' || v_invoice_number, 'sale', v_sale.id, auth.uid()
    );

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
    v_discount_total := v_discount_total + v_discount;
    v_tax_total := v_tax_total + v_tax;
    v_cost_total := v_cost_total + (v_medicine.purchase_price * v_qty);
  end loop;

  update public.sales set
    subtotal = v_subtotal,
    discount_amount = v_discount_total,
    tax_amount = v_tax_total,
    total_amount = v_subtotal - v_discount_total + v_tax_total,
    cost_amount = v_cost_total,
    profit_amount = (v_subtotal - v_discount_total + v_tax_total) - v_cost_total
  where id = v_sale.id
  returning * into v_sale;

  insert into public.invoices (pharmacy_id, sale_id, invoice_number, pharmacy_snapshot, customer_snapshot)
  select
    p_pharmacy_id,
    v_sale.id,
    v_invoice_number,
    jsonb_build_object(
      'name', ph.name, 'logo_url', ph.logo_url, 'address', ph.address, 'city', ph.city,
      'country', ph.country, 'phone', ph.phone, 'email', ph.email, 'tax_number', ph.tax_number,
      'invoice_footer', ph.invoice_footer, 'currency', ph.currency
    ),
    case when p_customer_id is not null then
      (select jsonb_build_object('name', c.name, 'phone', c.phone, 'email', c.email, 'address', c.address)
       from public.customers c where c.id = p_customer_id)
    else null end
  from public.pharmacies ph where ph.id = p_pharmacy_id;

  insert into public.notifications (pharmacy_id, type, title, message, reference_type, reference_id)
  values (
    p_pharmacy_id, 'new_sale', 'New sale completed',
    'Invoice ' || v_invoice_number || ' — ' || to_char(v_sale.total_amount, 'FM999,999,990.00'),
    'sale', v_sale.id
  );

  return v_sale;
end;
$$;

grant execute on function public.create_sale(uuid, jsonb, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- refund_sale — restores stock for a completed sale and marks it refunded.
-- ---------------------------------------------------------------------------

create or replace function public.refund_sale(p_sale_id uuid, p_reason text default null)
returns public.sales
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale public.sales;
  v_item record;
  v_new_qty int;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if v_sale.id is null then
    raise exception 'Sale not found';
  end if;
  if not public.is_pharmacy_member(v_sale.pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;
  if v_sale.status = 'refunded' then
    raise exception 'This sale was already refunded';
  end if;

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    if v_item.medicine_id is not null and v_item.quantity > v_item.refunded_quantity then
      update public.medicines
        set quantity = quantity + (v_item.quantity - v_item.refunded_quantity)
        where id = v_item.medicine_id
        returning quantity into v_new_qty;

      insert into public.inventory_transactions (
        pharmacy_id, medicine_id, type, quantity_change, quantity_after, reason, reference_type, reference_id, created_by
      ) values (
        v_sale.pharmacy_id, v_item.medicine_id, 'return', (v_item.quantity - v_item.refunded_quantity), v_new_qty,
        coalesce(p_reason, 'Refund for ' || v_sale.invoice_number), 'sale', v_sale.id, auth.uid()
      );
    end if;

    update public.sale_items set refunded_quantity = quantity where id = v_item.id;
  end loop;

  update public.sales set status = 'refunded' where id = p_sale_id returning * into v_sale;

  return v_sale;
end;
$$;

grant execute on function public.refund_sale(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- create_purchase — records a supplier purchase and restocks inventory.
-- p_items: jsonb array of {medicine_id, batch_number, quantity, purchase_price, expiry_date}
-- ---------------------------------------------------------------------------

create or replace function public.create_purchase(
  p_pharmacy_id uuid,
  p_items jsonb,
  p_supplier_id uuid default null,
  p_purchase_date date default current_date,
  p_notes text default null,
  p_amount_paid numeric default null
)
returns public.purchases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_purchase public.purchases;
  v_item jsonb;
  v_medicine public.medicines;
  v_qty int;
  v_price numeric(12, 2);
  v_expiry date;
  v_line_total numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_seq int;
  v_purchase_number text;
  v_new_qty int;
begin
  if not public.is_pharmacy_member(p_pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A purchase needs at least one item';
  end if;

  select count(*) + 1 into v_seq from public.purchases where pharmacy_id = p_pharmacy_id;
  v_purchase_number := 'PO-' || to_char(coalesce(p_purchase_date, current_date), 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  insert into public.purchases (pharmacy_id, supplier_id, purchase_number, purchase_date, notes, created_by, total_amount)
  values (p_pharmacy_id, p_supplier_id, v_purchase_number, coalesce(p_purchase_date, current_date), p_notes, auth.uid(), 0)
  returning * into v_purchase;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_medicine
      from public.medicines
      where id = (v_item ->> 'medicine_id')::uuid and pharmacy_id = p_pharmacy_id
      for update;

    if v_medicine.id is null then
      raise exception 'One of the items no longer exists in your inventory';
    end if;

    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for %', v_medicine.name;
    end if;
    v_price := coalesce((v_item ->> 'purchase_price')::numeric, v_medicine.purchase_price);
    v_expiry := nullif(v_item ->> 'expiry_date', '')::date;
    v_line_total := v_price * v_qty;

    insert into public.purchase_items (purchase_id, medicine_id, batch_number, quantity, purchase_price, expiry_date, total)
    values (v_purchase.id, v_medicine.id, nullif(v_item ->> 'batch_number', ''), v_qty, v_price, v_expiry, v_line_total);

    update public.medicines set
      quantity = quantity + v_qty,
      purchase_price = v_price,
      batch_number = coalesce(nullif(v_item ->> 'batch_number', ''), batch_number),
      expiry_date = coalesce(v_expiry, expiry_date)
    where id = v_medicine.id
    returning quantity into v_new_qty;

    insert into public.inventory_transactions (
      pharmacy_id, medicine_id, type, quantity_change, quantity_after, reason, reference_type, reference_id, created_by
    ) values (
      p_pharmacy_id, v_medicine.id, 'purchase', v_qty, v_new_qty, 'Purchase ' || v_purchase_number, 'purchase', v_purchase.id, auth.uid()
    );

    v_total := v_total + v_line_total;
  end loop;

  update public.purchases
  set total_amount = v_total, amount_paid = coalesce(p_amount_paid, v_total)
  where id = v_purchase.id
  returning * into v_purchase;

  insert into public.notifications (pharmacy_id, type, title, message, reference_type, reference_id)
  values (
    p_pharmacy_id, 'purchase_recorded', 'Purchase recorded',
    v_purchase_number || ' added ' || jsonb_array_length(p_items) || ' item(s) to inventory',
    'purchase', v_purchase.id
  );

  return v_purchase;
end;
$$;

grant execute on function public.create_purchase(uuid, jsonb, uuid, date, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- adjust_stock — manual +/- correction (damage, loss, stock count, etc.)
-- ---------------------------------------------------------------------------

create or replace function public.adjust_stock(
  p_medicine_id uuid,
  p_quantity_change int,
  p_reason text default 'Manual adjustment'
)
returns public.medicines
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medicine public.medicines;
begin
  select * into v_medicine from public.medicines where id = p_medicine_id for update;
  if v_medicine.id is null then
    raise exception 'Medicine not found';
  end if;
  if not public.is_pharmacy_member(v_medicine.pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;
  if p_quantity_change = 0 then
    raise exception 'Quantity change cannot be zero';
  end if;
  if v_medicine.quantity + p_quantity_change < 0 then
    raise exception 'Stock cannot go below zero (currently %)', v_medicine.quantity;
  end if;

  update public.medicines set quantity = quantity + p_quantity_change where id = p_medicine_id returning * into v_medicine;

  insert into public.inventory_transactions (
    pharmacy_id, medicine_id, type, quantity_change, quantity_after, reason, reference_type, created_by
  ) values (
    v_medicine.pharmacy_id, v_medicine.id, 'adjustment', p_quantity_change, v_medicine.quantity, p_reason, 'manual', auth.uid()
  );

  return v_medicine;
end;
$$;

grant execute on function public.adjust_stock(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- record_purchase_payment — apply a payment against an outstanding supplier
-- purchase (amount_paid can never exceed the purchase total).
-- ---------------------------------------------------------------------------

create or replace function public.record_purchase_payment(p_purchase_id uuid, p_amount numeric)
returns public.purchases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_purchase public.purchases;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id for update;
  if v_purchase.id is null then
    raise exception 'Purchase not found';
  end if;
  if not public.is_pharmacy_member(v_purchase.pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if v_purchase.amount_paid + p_amount > v_purchase.total_amount then
    raise exception 'That would pay more than the % owed on this purchase', v_purchase.total_amount;
  end if;

  update public.purchases set amount_paid = amount_paid + p_amount where id = p_purchase_id returning * into v_purchase;
  return v_purchase;
end;
$$;

grant execute on function public.record_purchase_payment(uuid, numeric) to authenticated;
