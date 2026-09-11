import { createClient } from "@/lib/supabase/server";
import { formatISO, startOfDay, subDays } from "date-fns";

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayProfit: number;
  inventoryValue: number;
  totalMedicines: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalCustomers: number;
  totalSuppliers: number;
}

export interface DailyPoint {
  date: string;
  revenue: number;
  profit: number;
}

export interface TopMedicine {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  revenue: number;
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  salesTrend: DailyPoint[];
  topMedicines: TopMedicine[];
  categorySales: CategorySales[];
  hasAnyData: boolean;
}

export async function getDashboardAnalytics(pharmacyId: string): Promise<DashboardAnalytics> {
  const supabase = await createClient();
  const todayStart = startOfDay(new Date());
  const trendStart = subDays(todayStart, 13);
  const monthStart = subDays(todayStart, 29);

  const [
    todaySalesRes,
    medicinesRes,
    customersCountRes,
    suppliersCountRes,
    trendSalesRes,
    topItemsRes,
    categoryItemsRes,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, profit_amount")
      .eq("pharmacy_id", pharmacyId)
      .eq("status", "completed")
      .gte("created_at", formatISO(todayStart)),
    supabase
      .from("medicine_status")
      .select("quantity, purchase_price, stock_status, expiry_status")
      .eq("pharmacy_id", pharmacyId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("pharmacy_id", pharmacyId),
    supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("pharmacy_id", pharmacyId),
    supabase
      .from("sales")
      .select("created_at, total_amount, profit_amount")
      .eq("pharmacy_id", pharmacyId)
      .eq("status", "completed")
      .gte("created_at", formatISO(trendStart)),
    supabase
      .from("sale_items")
      .select("medicine_name, quantity, total, sales!inner(pharmacy_id, created_at, status)")
      .eq("sales.pharmacy_id", pharmacyId)
      .eq("sales.status", "completed")
      .gte("sales.created_at", formatISO(monthStart)),
    supabase
      .from("sale_items")
      .select("total, medicines(categories(name)), sales!inner(pharmacy_id, created_at, status)")
      .eq("sales.pharmacy_id", pharmacyId)
      .eq("sales.status", "completed")
      .gte("sales.created_at", formatISO(monthStart)),
  ]);

  const todaySales = (todaySalesRes.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const todayOrders = todaySalesRes.data?.length ?? 0;
  const todayProfit = (todaySalesRes.data ?? []).reduce((s, r) => s + Number(r.profit_amount), 0);

  const medicines = medicinesRes.data ?? [];
  const inventoryValue = medicines.reduce((s, m) => s + Number(m.quantity) * Number(m.purchase_price), 0);
  const lowStockCount = medicines.filter((m) => m.stock_status === "low_stock").length;
  const outOfStockCount = medicines.filter((m) => m.stock_status === "out_of_stock").length;
  const expiringSoonCount = medicines.filter((m) => m.expiry_status === "expiring_soon").length;
  const expiredCount = medicines.filter((m) => m.expiry_status === "expired").length;

  const trendMap = new Map<string, { revenue: number; profit: number }>();
  for (let i = 0; i < 14; i++) {
    const key = formatISO(subDays(todayStart, 13 - i), { representation: "date" });
    trendMap.set(key, { revenue: 0, profit: 0 });
  }
  for (const row of trendSalesRes.data ?? []) {
    const key = formatISO(new Date(row.created_at), { representation: "date" });
    const bucket = trendMap.get(key);
    if (bucket) {
      bucket.revenue += Number(row.total_amount);
      bucket.profit += Number(row.profit_amount);
    }
  }
  const salesTrend: DailyPoint[] = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  const topMap = new Map<string, TopMedicine>();
  for (const row of (topItemsRes.data ?? []) as unknown as { medicine_name: string; quantity: number; total: number }[]) {
    const existing = topMap.get(row.medicine_name) ?? { name: row.medicine_name, quantity: 0, revenue: 0 };
    existing.quantity += Number(row.quantity);
    existing.revenue += Number(row.total);
    topMap.set(row.medicine_name, existing);
  }
  const topMedicines = Array.from(topMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const categoryMap = new Map<string, number>();
  for (const row of (categoryItemsRes.data ?? []) as unknown as {
    total: number;
    medicines: { categories: { name: string } | null } | null;
  }[]) {
    const name = row.medicines?.categories?.name ?? "Uncategorized";
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + Number(row.total));
  }
  const categorySales = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const hasAnyData = medicines.length > 0;

  return {
    stats: {
      todaySales,
      todayOrders,
      todayProfit,
      inventoryValue,
      totalMedicines: medicines.length,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      expiredCount,
      totalCustomers: customersCountRes.count ?? 0,
      totalSuppliers: suppliersCountRes.count ?? 0,
    },
    salesTrend,
    topMedicines,
    categorySales,
    hasAnyData,
  };
}
