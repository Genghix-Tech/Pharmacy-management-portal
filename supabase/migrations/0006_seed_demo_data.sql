-- ============================================================================
-- PharmaFlow — 0006: optional demo data
--
-- Lets a pharmacy owner populate a brand-new, empty pharmacy with a
-- realistic catalogue (24 medicines across every category, suppliers,
-- customers, ~45 historical sales, purchase history and expenses) so the
-- dashboard is immediately impressive instead of empty. Only runs once per
-- pharmacy — it refuses to touch one that already has medicines.
-- ============================================================================

create or replace function public.seed_demo_data(p_pharmacy_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_med_ids uuid[];
  v_cust_ids uuid[];
  v_sup_ids uuid[];
  v_cat_antibiotics uuid;
  v_cat_pain uuid;
  v_cat_vitamins uuid;
  v_cat_allergy uuid;
  v_cat_diabetes uuid;
  v_cat_bp uuid;
  v_cat_skin uuid;
  v_cat_coldflu uuid;
  v_cat_other uuid;
  i int;
begin
  if not public.is_pharmacy_member(p_pharmacy_id) then
    raise exception 'Not authorized for this pharmacy';
  end if;
  if exists (select 1 from public.medicines where pharmacy_id = p_pharmacy_id) then
    raise exception 'Demo data can only be loaded into an empty pharmacy';
  end if;

  insert into public.categories (pharmacy_id, name, description) values
    (p_pharmacy_id, 'Antibiotics', 'Prescription antibacterial medicines'),
    (p_pharmacy_id, 'Pain Relief', 'Analgesics and anti-inflammatories'),
    (p_pharmacy_id, 'Vitamins', 'Vitamins and dietary supplements'),
    (p_pharmacy_id, 'Allergy', 'Antihistamines and allergy relief'),
    (p_pharmacy_id, 'Diabetes', 'Blood glucose management'),
    (p_pharmacy_id, 'Blood Pressure', 'Cardiovascular and hypertension'),
    (p_pharmacy_id, 'Skin Care', 'Topical and dermatological'),
    (p_pharmacy_id, 'Cold & Flu', 'Cough, cold and flu relief'),
    (p_pharmacy_id, 'Other', 'Everything else');

  select id into v_cat_antibiotics from public.categories where pharmacy_id = p_pharmacy_id and name = 'Antibiotics';
  select id into v_cat_pain from public.categories where pharmacy_id = p_pharmacy_id and name = 'Pain Relief';
  select id into v_cat_vitamins from public.categories where pharmacy_id = p_pharmacy_id and name = 'Vitamins';
  select id into v_cat_allergy from public.categories where pharmacy_id = p_pharmacy_id and name = 'Allergy';
  select id into v_cat_diabetes from public.categories where pharmacy_id = p_pharmacy_id and name = 'Diabetes';
  select id into v_cat_bp from public.categories where pharmacy_id = p_pharmacy_id and name = 'Blood Pressure';
  select id into v_cat_skin from public.categories where pharmacy_id = p_pharmacy_id and name = 'Skin Care';
  select id into v_cat_coldflu from public.categories where pharmacy_id = p_pharmacy_id and name = 'Cold & Flu';
  select id into v_cat_other from public.categories where pharmacy_id = p_pharmacy_id and name = 'Other';

  insert into public.suppliers (pharmacy_id, name, company, phone, email, address, tax_number) values
    (p_pharmacy_id, 'Amir Khan', 'MediSource Distributors', '+92 300 1234567', 'sales@medisource.example', 'Plot 12, Industrial Area, Karachi', 'TX-10293'),
    (p_pharmacy_id, 'Sarah Malik', 'PharmaCare Wholesale', '+92 321 7654321', 'orders@pharmacare.example', '45 Trade Street, Lahore', 'TX-88213'),
    (p_pharmacy_id, 'Global Health Supplies', 'Global Health Supplies Ltd', '+92 42 111222333', 'contact@ghs.example', '9 Commerce Avenue, Lahore', 'TX-55210'),
    (p_pharmacy_id, 'David Chen', 'Chen Pharma Imports', '+92 300 9988776', 'david@chenpharma.example', '3 Harbor Road, Karachi', 'TX-33110');

  select array_agg(id) into v_sup_ids from public.suppliers where pharmacy_id = p_pharmacy_id;

  insert into public.customers (pharmacy_id, name, phone, email, address, date_of_birth) values
    (p_pharmacy_id, 'Ayesha Siddiqui', '+92 301 1112222', 'ayesha.s@example.com', 'House 4, Block C, Karachi', '1990-04-12'),
    (p_pharmacy_id, 'Bilal Ahmed', '+92 302 2223333', 'bilal.ahmed@example.com', '22 Model Town, Lahore', '1985-11-02'),
    (p_pharmacy_id, 'Fatima Noor', '+92 303 3334444', 'fatima.noor@example.com', '7 Garden Road, Islamabad', '1996-07-23'),
    (p_pharmacy_id, 'Hassan Raza', '+92 304 4445555', null, '18 Canal View, Faisalabad', null),
    (p_pharmacy_id, 'Mariam Yousaf', '+92 305 5556666', 'mariam.y@example.com', '5 Jinnah Road, Multan', '1978-02-15'),
    (p_pharmacy_id, 'Omar Farooq', '+92 306 6667777', null, '30 University Road, Peshawar', null),
    (p_pharmacy_id, 'Zainab Tariq', '+92 307 7778888', 'zainab.t@example.com', '11 Mall Road, Lahore', '2001-09-30'),
    (p_pharmacy_id, 'Imran Shah', '+92 308 8889999', null, '9 Sea View, Karachi', null);

  select array_agg(id) into v_cust_ids from public.customers where pharmacy_id = p_pharmacy_id;

  -- 24 medicines, quantities and dates deliberately spread across every
  -- stock/expiry alert state (healthy, low, out of stock, expiring, expired).
  insert into public.medicines (
    pharmacy_id, name, generic_name, brand, sku, barcode, category_id, manufacturer, supplier_id,
    batch_number, purchase_price, selling_price, quantity, min_stock_level, expiry_date, manufacturing_date,
    unit_type, tax_rate, discount_rate, description, status
  ) values
    (p_pharmacy_id,'Amoxicillin 500mg','Amoxicillin','Amoxil','MED-0001','8964000000011',v_cat_antibiotics,'GSK',v_sup_ids[1],'BATCH-A101',3.50,7.00,220,30,current_date+180,current_date-90,'capsule',5,0,'Broad-spectrum antibiotic capsules, box of 20','active'),
    (p_pharmacy_id,'Azithromycin 250mg','Azithromycin','Zithromax','MED-0002','8964000000028',v_cat_antibiotics,'Pfizer',v_sup_ids[1],'BATCH-A102',5.20,11.00,8,20,current_date+45,current_date-60,'tablet',5,0,'Antibiotic for respiratory infections','active'),
    (p_pharmacy_id,'Ciprofloxacin 500mg','Ciprofloxacin','Ciproxin','MED-0003','8964000000035',v_cat_antibiotics,'Bayer',v_sup_ids[2],'BATCH-A103',4.10,8.50,0,15,current_date+300,current_date-30,'tablet',5,0,'Fluoroquinolone antibiotic','active'),
    (p_pharmacy_id,'Paracetamol 500mg','Paracetamol','Panadol','MED-0004','8964000000042',v_cat_pain,'GSK',v_sup_ids[2],'BATCH-P101',0.80,2.00,540,50,current_date+400,current_date-20,'tablet',0,0,'Pain and fever relief, strip of 10','active'),
    (p_pharmacy_id,'Ibuprofen 400mg','Ibuprofen','Brufen','MED-0005','8964000000059',v_cat_pain,'Abbott',v_sup_ids[2],'BATCH-P102',1.10,2.80,340,40,current_date+250,current_date-40,'tablet',0,0,'NSAID for pain and inflammation','active'),
    (p_pharmacy_id,'Diclofenac Gel 1%','Diclofenac','Voltaren','MED-0006','8964000000066',v_cat_pain,'Novartis',v_sup_ids[3],'BATCH-P103',2.60,6.50,25,15,current_date+200,current_date-10,'tube',5,0,'Topical pain relief gel, 30g tube','active'),
    (p_pharmacy_id,'Vitamin C 1000mg','Ascorbic Acid','Cecon','MED-0007','8964000000073',v_cat_vitamins,'Bayer',v_sup_ids[3],'BATCH-V101',1.50,4.00,410,40,current_date+500,current_date-15,'tablet',0,0,'Immune support effervescent tablets','active'),
    (p_pharmacy_id,'Vitamin D3 1000IU','Cholecalciferol','D-Rise','MED-0008','8964000000080',v_cat_vitamins,'Abbott',v_sup_ids[3],'BATCH-V102',2.00,5.50,12,20,current_date+600,current_date-5,'capsule',0,0,'Bone health supplement, 30 capsules','active'),
    (p_pharmacy_id,'Multivitamin Complex','Multivitamin','Centrum','MED-0009','8964000000097',v_cat_vitamins,'Pfizer',v_sup_ids[4],'BATCH-V103',3.20,8.00,180,25,current_date+320,current_date-25,'tablet',0,0,'Daily multivitamin, 60 tablets','active'),
    (p_pharmacy_id,'Cetirizine 10mg','Cetirizine','Zyrtec','MED-0010','8964000000103',v_cat_allergy,'GSK',v_sup_ids[1],'BATCH-AL101',0.90,2.50,260,30,current_date+150,current_date-35,'tablet',5,0,'Non-drowsy antihistamine','active'),
    (p_pharmacy_id,'Loratadine 10mg','Loratadine','Claritin','MED-0011','8964000000110',v_cat_allergy,'Bayer',v_sup_ids[1],'BATCH-AL102',1.00,2.90,7,15,current_date+15,current_date-50,'tablet',5,0,'24-hour allergy relief','active'),
    (p_pharmacy_id,'Metformin 500mg','Metformin','Glucophage','MED-0012','8964000000127',v_cat_diabetes,'Merck',v_sup_ids[2],'BATCH-D101',1.30,3.20,300,35,current_date+280,current_date-45,'tablet',0,0,'Type 2 diabetes management','active'),
    (p_pharmacy_id,'Insulin Glargine 100IU','Insulin Glargine','Lantus','MED-0013','8964000000134',v_cat_diabetes,'Sanofi',v_sup_ids[4],'BATCH-D102',18.00,32.00,18,10,current_date+9,current_date-60,'vial',0,0,'Long-acting insulin, 10ml vial','active'),
    (p_pharmacy_id,'Glimepiride 2mg','Glimepiride','Amaryl','MED-0014','8964000000141',v_cat_diabetes,'Sanofi',v_sup_ids[4],'BATCH-D103',1.60,4.00,0,20,current_date-5,current_date-120,'tablet',0,0,'Sulfonylurea for blood sugar control','inactive'),
    (p_pharmacy_id,'Amlodipine 5mg','Amlodipine','Norvasc','MED-0015','8964000000158',v_cat_bp,'Pfizer',v_sup_ids[4],'BATCH-BP101',1.20,3.00,275,30,current_date+220,current_date-40,'tablet',0,0,'Calcium channel blocker','active'),
    (p_pharmacy_id,'Losartan 50mg','Losartan','Cozaar','MED-0016','8964000000165',v_cat_bp,'Merck',v_sup_ids[2],'BATCH-BP102',1.40,3.50,190,25,current_date+260,current_date-30,'tablet',0,0,'Angiotensin receptor blocker','active'),
    (p_pharmacy_id,'Atenolol 50mg','Atenolol','Tenormin','MED-0017','8964000000172',v_cat_bp,'AstraZeneca',v_sup_ids[3],'BATCH-BP103',1.00,2.70,9,20,current_date+40,current_date-55,'tablet',0,0,'Beta-blocker for hypertension','active'),
    (p_pharmacy_id,'Hydrocortisone Cream 1%','Hydrocortisone','Cortaid','MED-0018','8964000000189',v_cat_skin,'Pfizer',v_sup_ids[3],'BATCH-SK101',1.80,4.50,150,20,current_date+310,current_date-20,'tube',5,0,'Anti-itch topical cream, 20g','active'),
    (p_pharmacy_id,'Clotrimazole Cream 1%','Clotrimazole','Canesten','MED-0019','8964000000196',v_cat_skin,'Bayer',v_sup_ids[3],'BATCH-SK102',2.10,5.20,95,20,current_date+275,current_date-25,'tube',5,0,'Antifungal cream, 20g tube','active'),
    (p_pharmacy_id,'Benzoyl Peroxide Gel 5%','Benzoyl Peroxide','PanOxyl','MED-0020','8964000000202',v_cat_skin,'GSK',v_sup_ids[1],'BATCH-SK103',2.40,6.00,60,15,current_date+180,current_date-15,'tube',5,0,'Acne treatment gel, 40g','active'),
    (p_pharmacy_id,'Cough Syrup 100ml','Dextromethorphan','Benylin','MED-0021','8964000000219',v_cat_coldflu,'J&J',v_sup_ids[1],'BATCH-CF101',1.90,4.80,130,25,current_date+160,current_date-25,'bottle',5,0,'Cough suppressant syrup, 100ml','active'),
    (p_pharmacy_id,'Flu Relief Tablets','Paracetamol/Phenylephrine','Panadol Flu','MED-0022','8964000000226',v_cat_coldflu,'GSK',v_sup_ids[2],'BATCH-CF102',1.20,3.30,4,20,current_date+90,current_date-10,'tablet',0,0,'Combination cold & flu relief','active'),
    (p_pharmacy_id,'Throat Lozenges','Menthol','Strepsils','MED-0023','8964000000233',v_cat_coldflu,'Reckitt',v_sup_ids[4],'BATCH-CF103',0.60,1.80,210,30,current_date+2,current_date-30,'pack',0,0,'Sore throat relief lozenges, pack of 24','active'),
    (p_pharmacy_id,'Hand Sanitizer 250ml','Ethyl Alcohol 70%','CleanHands','MED-0024','8964000000240',v_cat_other,'Global Health',v_sup_ids[3],'BATCH-OT101',1.00,3.00,320,40,current_date+700,current_date-10,'bottle',0,0,'Antibacterial hand sanitizer, 250ml','active');

  select array_agg(id order by sku) into v_med_ids from public.medicines where pharmacy_id = p_pharmacy_id;

  insert into public.inventory_transactions (pharmacy_id, medicine_id, type, quantity_change, quantity_after, reason, created_by, created_at)
  select p_pharmacy_id, id, 'initial', quantity, quantity, 'Opening stock (demo data)', v_uid, created_at
  from public.medicines where pharmacy_id = p_pharmacy_id;

  -- Six historical purchases (illustrative restock history).
  for i in 1..6 loop
    declare
      v_purchase_id uuid;
      v_sup uuid := v_sup_ids[1 + (i % array_length(v_sup_ids, 1))];
      v_pdate date := current_date - (i * 9 + 3);
      v_pnum text := 'PO-' || to_char(v_pdate, 'YYYY') || '-' || lpad(i::text, 5, '0');
      v_m1 uuid := v_med_ids[1 + ((i * 3) % array_length(v_med_ids, 1))];
      v_m2 uuid := v_med_ids[1 + ((i * 3 + 1) % array_length(v_med_ids, 1))];
      v_p1 numeric;
      v_p2 numeric;
      v_q1 int := 20 + i * 5;
      v_q2 int := 15 + i * 3;
    begin
      select purchase_price into v_p1 from public.medicines where id = v_m1;
      select purchase_price into v_p2 from public.medicines where id = v_m2;

      insert into public.purchases (pharmacy_id, supplier_id, purchase_number, purchase_date, total_amount, amount_paid, notes, created_by, created_at)
      values (
        p_pharmacy_id, v_sup, v_pnum, v_pdate, (v_p1 * v_q1) + (v_p2 * v_q2),
        -- Most restocks are settled immediately; leave the most recent one
        -- partially paid so the supplier's outstanding balance isn't always zero.
        case when i = 1 then round(((v_p1 * v_q1) + (v_p2 * v_q2)) * 0.4, 2) else (v_p1 * v_q1) + (v_p2 * v_q2) end,
        'Routine restock', v_uid, v_pdate::timestamptz
      )
      returning id into v_purchase_id;

      insert into public.purchase_items (purchase_id, medicine_id, batch_number, quantity, purchase_price, expiry_date, total) values
        (v_purchase_id, v_m1, 'BATCH-R' || i || 'A', v_q1, v_p1, v_pdate + 300, v_p1 * v_q1),
        (v_purchase_id, v_m2, 'BATCH-R' || i || 'B', v_q2, v_p2, v_pdate + 240, v_p2 * v_q2);
    end;
  end loop;

  -- ~45 historical sales spread across the last 30 days (stock is not
  -- re-decremented — the quantities above already represent current stock).
  for i in 1..45 loop
    declare
      v_days_ago int := (i % 30);
      v_created timestamptz := (current_date - v_days_ago)::timestamptz + ((8 + (i % 10)) || ' hours')::interval;
      v_line_count int := 1 + (i % 3);
      v_sale_id uuid;
      v_inv text := 'DEMO-' || to_char(current_date - v_days_ago, 'YYYY') || '-' || lpad(i::text, 5, '0');
      v_cust uuid;
      v_subtotal numeric := 0;
      v_disc numeric := 0;
      v_tax numeric := 0;
      v_cost numeric := 0;
      j int;
      v_mid uuid;
      v_price numeric;
      v_pprice numeric;
      v_q int;
      v_line numeric;
      v_pm text;
    begin
      if i % 4 = 0 then
        v_cust := null;
      else
        v_cust := v_cust_ids[1 + (i % array_length(v_cust_ids, 1))];
      end if;
      v_pm := (array['cash', 'card', 'cash', 'bank_transfer', 'cash', 'card', 'other'])[1 + (i % 7)];

      insert into public.sales (
        pharmacy_id, invoice_number, customer_id, payment_method, status,
        subtotal, discount_amount, tax_amount, total_amount, cost_amount, profit_amount, created_by, created_at
      ) values (
        p_pharmacy_id, v_inv, v_cust, v_pm, 'completed', 0, 0, 0, 0, 0, 0, v_uid, v_created
      ) returning id into v_sale_id;

      for j in 1..v_line_count loop
        v_mid := v_med_ids[1 + ((i * 5 + j) % array_length(v_med_ids, 1))];
        select selling_price, purchase_price into v_price, v_pprice from public.medicines where id = v_mid;
        v_q := 1 + ((i + j) % 4);
        v_line := v_price * v_q;

        insert into public.sale_items (sale_id, medicine_id, medicine_name, quantity, unit_price, discount_amount, tax_amount, cost_price, total)
        select v_sale_id, v_mid, name, v_q, v_price, 0, 0, v_pprice, v_line from public.medicines where id = v_mid;

        v_subtotal := v_subtotal + v_line;
        v_cost := v_cost + (v_pprice * v_q);
      end loop;

      v_disc := round(v_subtotal * 0.02, 2);
      v_tax := round((v_subtotal - v_disc) * 0.03, 2);

      update public.sales set
        subtotal = v_subtotal,
        discount_amount = v_disc,
        tax_amount = v_tax,
        total_amount = v_subtotal - v_disc + v_tax,
        cost_amount = v_cost,
        profit_amount = (v_subtotal - v_disc + v_tax) - v_cost
      where id = v_sale_id;
    end;
  end loop;

  insert into public.expenses (pharmacy_id, title, category, amount, expense_date, payment_method, description, created_by) values
    (p_pharmacy_id,'Monthly shop rent','Rent',1200.00,current_date - 3,'bank_transfer','Rent for pharmacy premises',v_uid),
    (p_pharmacy_id,'Electricity bill','Electricity',180.50,current_date - 5,'cash','Monthly utility bill',v_uid),
    (p_pharmacy_id,'Staff salaries','Salaries',2600.00,current_date - 2,'bank_transfer','Salaries for 3 staff members',v_uid),
    (p_pharmacy_id,'Delivery van fuel','Transportation',95.00,current_date - 10,'cash','Fuel for supplier pickups',v_uid),
    (p_pharmacy_id,'AC maintenance','Maintenance',60.00,current_date - 14,'cash','Store air conditioning service',v_uid),
    (p_pharmacy_id,'Social media ads','Marketing',75.00,current_date - 20,'card','Promotion for new store hours',v_uid),
    (p_pharmacy_id,'Monthly shop rent','Rent',1200.00,current_date - 33,'bank_transfer','Rent for pharmacy premises',v_uid),
    (p_pharmacy_id,'Electricity bill','Electricity',165.00,current_date - 35,'cash','Monthly utility bill',v_uid),
    (p_pharmacy_id,'Staff salaries','Salaries',2600.00,current_date - 32,'bank_transfer','Salaries for 3 staff members',v_uid),
    (p_pharmacy_id,'Shelving & storage','Other',210.00,current_date - 40,'card','New storage shelving for backroom',v_uid);
end;
$$;

grant execute on function public.seed_demo_data(uuid) to authenticated;
