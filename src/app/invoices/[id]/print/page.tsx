import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");

  const supabase = await createClient();
  const [{ data: sale }, { data: items }, { data: invoice }] = await Promise.all([
    supabase.from("sales").select("*").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase.from("sale_items").select("*").eq("sale_id", id),
    supabase.from("invoices").select("*").eq("sale_id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
  ]);

  if (!sale || !invoice) notFound();

  return <InvoiceDocument sale={sale} items={items ?? []} invoice={invoice} />;
}
