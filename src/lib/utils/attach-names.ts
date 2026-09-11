/**
 * Attaches { categories: {name}, suppliers: {name} } onto rows from the
 * `medicine_status` view by joining in application code rather than via a
 * PostgREST embed. Embeds are well-supported on real tables (used freely
 * elsewhere in this app), but embedding through a view that itself joins
 * another table is a PostgREST edge case we'd rather not depend on for a
 * page this central — a plain JS join is a few extra lines and always works.
 */
export function attachCategoryAndSupplier<
  T extends { category_id: string | null; supplier_id: string | null },
>(
  rows: T[],
  categories: { id: string; name: string }[],
  suppliers: { id: string; name: string }[]
): (T & { categories: { name: string } | null; suppliers: { name: string } | null })[] {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const supMap = new Map(suppliers.map((s) => [s.id, s.name]));

  return rows.map((r) => ({
    ...r,
    categories: r.category_id && catMap.has(r.category_id) ? { name: catMap.get(r.category_id)! } : null,
    suppliers: r.supplier_id && supMap.has(r.supplier_id) ? { name: supMap.get(r.supplier_id)! } : null,
  }));
}
