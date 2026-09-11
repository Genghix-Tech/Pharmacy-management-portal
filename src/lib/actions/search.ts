"use server";

import { createClient } from "@/lib/supabase/server";

export interface GlobalSearchResult {
  medicines: { id: string; name: string; sku: string | null }[];
  customers: { id: string; name: string; phone: string | null }[];
  suppliers: { id: string; name: string; company: string | null }[];
  sales: { id: string; invoice_number: string; total_amount: number }[];
}

const EMPTY: GlobalSearchResult = { medicines: [], customers: [], suppliers: [], sales: [] };

export async function globalSearch(pharmacyId: string, query: string): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const supabase = await createClient();
  const like = `%${q}%`;

  const [medicines, customers, suppliers, sales] = await Promise.all([
    supabase
      .from("medicines")
      .select("id,name,sku")
      .eq("pharmacy_id", pharmacyId)
      .or(`name.ilike.${like},sku.ilike.${like},barcode.ilike.${like},generic_name.ilike.${like}`)
      .limit(6),
    supabase
      .from("customers")
      .select("id,name,phone")
      .eq("pharmacy_id", pharmacyId)
      .or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
      .limit(6),
    supabase
      .from("suppliers")
      .select("id,name,company")
      .eq("pharmacy_id", pharmacyId)
      .or(`name.ilike.${like},company.ilike.${like}`)
      .limit(6),
    supabase
      .from("sales")
      .select("id,invoice_number,total_amount")
      .eq("pharmacy_id", pharmacyId)
      .ilike("invoice_number", like)
      .limit(6),
  ]);

  return {
    medicines: medicines.data ?? [],
    customers: customers.data ?? [],
    suppliers: suppliers.data ?? [],
    sales: sales.data ?? [],
  };
}
