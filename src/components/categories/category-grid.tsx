"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { deleteCategory } from "@/lib/actions/categories";
import { formatNumber } from "@/lib/utils/format";
import type { Category } from "@/lib/types/database";

type CategoryWithCount = Category & { medicines: { count: number }[] };

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search categories…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No categories match your search" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category) => (
            <Card key={category.id} className="flex flex-row items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{category.name}</p>
                {category.description && <p className="line-clamp-2 text-xs text-muted-foreground">{category.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {formatNumber(category.medicines?.[0]?.count ?? 0)} medicine{(category.medicines?.[0]?.count ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <CategoryFormDialog category={category} />
                <ConfirmDeleteButton
                  title={`Delete "${category.name}"?`}
                  description="Medicines in this category will keep their other details but lose this category tag."
                  onConfirm={() => deleteCategory(category.id)}
                  successMessage="Category deleted."
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
