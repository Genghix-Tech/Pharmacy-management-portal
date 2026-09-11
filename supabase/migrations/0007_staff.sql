-- ============================================================================
-- PharmaFlow — 0007: staff management
--
-- add_staff_by_email looks the account up in auth.users directly (via
-- SECURITY DEFINER) so the app never needs a service-role key just to add a
-- teammate. The owner must ask the person to sign up first — there is no
-- account provisioning here, only linking an existing one to the pharmacy.
-- ============================================================================

create or replace function public.add_staff_by_email(p_pharmacy_id uuid, p_email text, p_role text)
returns public.pharmacy_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(trim(p_email));
  v_row public.pharmacy_users;
begin
  if not public.is_pharmacy_owner(p_pharmacy_id) then
    raise exception 'Only the pharmacy owner can add staff';
  end if;
  if p_role not in ('manager', 'cashier', 'inventory_manager') then
    raise exception 'Invalid role';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email limit 1;
  if v_user_id is null then
    raise exception 'No PharmaFlow account found for %. Ask them to sign up first, then add them here.', p_email;
  end if;

  if v_user_id = (select owner_id from public.pharmacies where id = p_pharmacy_id) then
    raise exception '% is already the owner of this pharmacy', p_email;
  end if;

  insert into public.profiles (id, full_name, email)
  values (v_user_id, split_part(p_email, '@', 1), v_email)
  on conflict (id) do update set email = excluded.email;

  insert into public.pharmacy_users (pharmacy_id, user_id, role)
  values (p_pharmacy_id, v_user_id, p_role)
  on conflict (pharmacy_id, user_id) do update set role = excluded.role, status = 'active'
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.add_staff_by_email(uuid, text, text) to authenticated;

create or replace function public.update_staff_role(p_pharmacy_id uuid, p_user_id uuid, p_role text)
returns public.pharmacy_users
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.pharmacy_users;
begin
  if not public.is_pharmacy_owner(p_pharmacy_id) then
    raise exception 'Only the pharmacy owner can change staff roles';
  end if;
  if p_role not in ('manager', 'cashier', 'inventory_manager') then
    raise exception 'Invalid role';
  end if;

  update public.pharmacy_users set role = p_role
  where pharmacy_id = p_pharmacy_id and user_id = p_user_id and role <> 'owner'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Staff member not found';
  end if;

  return v_row;
end;
$$;

grant execute on function public.update_staff_role(uuid, uuid, text) to authenticated;
