import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageNav } from "@/components/shared/page-nav";
import { MedicineFilters } from "@/components/medicines/medicine-filters";
import { MedicineTable, type MedicineRow } from "@/components/medicines/medicine-table";
import { Button } from "@/components/ui/button";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { attachCategoryAndSupplier } from "@/lib/utils/attach-names";
import type { ExpiryStatus, MedicineStatusRow, StockStatus } from "@/lib/types/database";

export const metadata: Metadata = { title: "Medicines" };

const PAGE_SIZE = 15;

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "medicines")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("medicine_status")
    .select("*", { count: "exact" })
    .eq("pharmacy_id", context.pharmacy.id);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,barcode.ilike.%${params.q}%,generic_name.ilike.%${params.q}%`);
  }
  if (params.category) query = query.eq("category_id", params.category);
  if (params.status) query = query.eq("stock_status", params.status as StockStatus);
  if (params.expiry) query = query.eq("expiry_status", params.expiry as ExpiryStatus);

  const [{ data: medicines, count }, { data: categories }, { data: suppliers }] = await Promise.all([
    query.order("name").range(from, from + PAGE_SIZE - 1),
    supabase.from("categories").select("*").eq("pharmacy_id", context.pharmacy.id).order("name"),
    supabase.from("suppliers").select("id, name").eq("pharmacy_id", context.pharmacy.id),
  ]);

  const rows = attachCategoryAndSupplier((medicines ?? []) as unknown as MedicineStatusRow[], categories ?? [], suppliers ?? []);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hasFilters = !!(params.q || params.category || params.status || params.expiry);
  const canManage = canAccess(context.role, "medicines");

  return (
    <div>
      <PageHeader
        title="Medicines"
        description="Your full medicine catalogue — pricing, batches and stock in one place."
        actions={
          canManage && (
            <Button render={<Link href="/dashboard/medicines/new" />}>
              <Plus /> Add Medicine
            </Button>
          )
        }
      />

      <MedicineFilters categories={categories ?? []} />

      {!rows.length ? (
        <EmptyState
          icon={Pill}
          title={hasFilters ? "No medicines match your filters" : "No medicines added yet"}
          description={hasFilters ? "Try adjusting or clearing your filters." : "Add your first medicine to start tracking inventory."}
          action={
            !hasFilters &&
            canManage && (
              <Button render={<Link href="/dashboard/medicines/new" />}>
                <Plus /> Add Medicine
              </Button>
            )
          }
        />
      ) : (
        <>
          <MedicineTable medicines={rows as unknown as MedicineRow[]} currency={context.pharmacy.currency} canManage={canManage} />
          <PageNav page={page} totalPages={totalPages} basePath="/dashboard/medicines" searchParams={params} />
        </>
      )}
    </div>
  );
}
