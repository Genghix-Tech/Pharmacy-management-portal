import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccessDenied } from "@/components/shared/access-denied";
import { Button } from "@/components/ui/button";
import { MedicineForm } from "@/components/medicines/medicine-form";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";

export const metadata: Metadata = { title: "Edit Medicine" };

export default async function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "medicines")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: medicine }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("medicines").select("*").eq("id", id).eq("pharmacy_id", context.pharmacy.id).maybeSingle(),
    supabase.from("categories").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
    supabase.from("suppliers").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
  ]);

  if (!medicine) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/medicines/${id}`} />} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to medicine
      </Button>
      <PageHeader title={`Edit ${medicine.name}`} />
      <MedicineForm medicine={medicine} categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
