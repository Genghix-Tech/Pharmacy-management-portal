import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";

export const metadata: Metadata = { title: "Record Purchase" };

export default async function NewPurchasePage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "purchases")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: suppliers }, { data: medicines }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
    supabase.from("medicines").select("id, name, sku, purchase_price, unit_type").eq("pharmacy_id", context.pharmacy.id).order("name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/purchases" />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to purchases
      </Button>
      <PageHeader title="Record a purchase" description="Restocking from a supplier automatically increases your inventory." />
      <PurchaseForm suppliers={suppliers ?? []} medicines={medicines ?? []} currency={context.pharmacy.currency} />
    </div>
  );
}
