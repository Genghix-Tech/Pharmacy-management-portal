import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageNav } from "@/components/shared/page-nav";
import { MedicineTable, type MedicineRow } from "@/components/medicines/medicine-table";
import { cn } from "@/lib/utils";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import { formatNumber } from "@/lib/utils/format";
import { attachCategoryAndSupplier } from "@/lib/utils/attach-names";
import type { MedicineStatusRow } from "@/lib/types/database";

export const metadata: Metadata = { title: "Inventory" };

const PAGE_SIZE = 15;

type FilterKey = "all" | "low_stock" | "out_of_stock" | "expiring_soon" | "expired";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; expiry?: string; page?: string }>;
}) {
  const params = await searchParams;
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "inventory")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const active: FilterKey = (params.status as FilterKey) || (params.expiry as FilterKey) || "all";

  const baseQuery = () =>
    supabase.from("medicine_status").select("*", { count: "exact" }).eq("pharmacy_id", context.pharmacy.id);

  const countQuery = () => supabase.from("medicine_status").select("id", { count: "exact", head: true }).eq("pharmacy_id", context.pharmacy.id);

  const [lowRes, outRes, expiringRes, expiredRes] = await Promise.all([
    countQuery().eq("stock_status", "low_stock"),
    countQuery().eq("stock_status", "out_of_stock"),
    countQuery().eq("expiry_status", "expiring_soon"),
    countQuery().eq("expiry_status", "expired"),
  ]);

  let query = baseQuery();
  if (active === "low_stock" || active === "out_of_stock") query = query.eq("stock_status", active);
  if (active === "expiring_soon" || active === "expired") query = query.eq("expiry_status", active);

  const [{ data: medicines, count }, { data: categories }, { data: suppliers }] = await Promise.all([
    query.order("name").range(from, from + PAGE_SIZE - 1),
    supabase.from("categories").select("id, name").eq("pharmacy_id", context.pharmacy.id),
    supabase.from("suppliers").select("id, name").eq("pharmacy_id", context.pharmacy.id),
  ]);
  const rows = attachCategoryAndSupplier((medicines ?? []) as unknown as MedicineStatusRow[], categories ?? [], suppliers ?? []);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const canManage = canAccess(context.role, "medicines");

  const tabs: { key: FilterKey; label: string; count?: number; href: string }[] = [
    { key: "all", label: "All", href: "/dashboard/inventory" },
    { key: "low_stock", label: "Low Stock", count: lowRes.count ?? 0, href: "/dashboard/inventory?status=low_stock" },
    { key: "out_of_stock", label: "Out of Stock", count: outRes.count ?? 0, href: "/dashboard/inventory?status=out_of_stock" },
    { key: "expiring_soon", label: "Expiring Soon", count: expiringRes.count ?? 0, href: "/dashboard/inventory?expiry=expiring_soon" },
    { key: "expired", label: "Expired", count: expiredRes.count ?? 0, href: "/dashboard/inventory?expiry=expired" },
  ];

  return (
    <div>
      <PageHeader title="Inventory" description={`Stock health for all ${count ?? ""} medicines — alerts update automatically.`} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active === tab.key ? "bg-primary/20" : "bg-muted")}>
                {formatNumber(tab.count)}
              </span>
            )}
          </Link>
        ))}
      </div>

      {!rows.length ? (
        <EmptyState icon={Boxes} title="Nothing here" description="No medicines match this filter right now." />
      ) : (
        <>
          <MedicineTable medicines={rows as unknown as MedicineRow[]} currency={context.pharmacy.currency} canManage={canManage} />
          <PageNav page={page} totalPages={totalPages} basePath="/dashboard/inventory" searchParams={params} />
        </>
      )}
    </div>
  );
}
