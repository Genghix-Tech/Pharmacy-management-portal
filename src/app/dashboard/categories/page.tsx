import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Tags } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccessDenied } from "@/components/shared/access-denied";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { CategoryGrid } from "@/components/categories/category-grid";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";
import type { Category } from "@/lib/types/database";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "categories")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*, medicines(count)")
    .eq("pharmacy_id", context.pharmacy.id)
    .order("name");

  const categories = (data ?? []) as unknown as (Category & { medicines: { count: number }[] })[];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your medicines into categories for faster browsing and reporting."
        actions={<CategoryFormDialog />}
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories added yet"
          description="Categories like Antibiotics, Pain Relief or Vitamins help you organize inventory and reports."
          action={<CategoryFormDialog />}
        />
      ) : (
        <CategoryGrid categories={categories} />
      )}
    </div>
  );
}
