import { createClient } from "@/lib/supabase/server";

export interface ReportsData {
  sales: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    costOfGoods: number;
  };
  profit: {
    revenue: number;
    costOfGoods: number;
    expenses: number;
    netProfit: number;
  };
  inventory: {
    totalProducts: number;
    totalUnits: number;
    inventoryValue: number;
    lowStock: number;
    outOfStock: number;
    expired: number;
    expiringSoon: number;
  };
  purchases: {
    total: number;
    bySupplier: { supplier: string; amount: number }[];
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
}

export async function getReportsData(pharmacyId: string, from: string, to: string): Promise<ReportsData> {
  const supabase = await createClient();
  const toEnd = `${to}T23:59:59`;

  const [salesRes, expensesRes, purchasesRes, medicinesRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, cost_amount, status")
      .eq("pharmacy_id", pharmacyId)
      .gte("created_at", from)
      .lte("created_at", toEnd),
    supabase
      .from("expenses")
      .select("amount, category")
      .eq("pharmacy_id", pharmacyId)
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase
      .from("purchases")
      .select("total_amount, suppliers(name)")
      .eq("pharmacy_id", pharmacyId)
      .gte("purchase_date", from)
      .lte("purchase_date", to),
    supabase.from("medicine_status").select("quantity, purchase_price, stock_status, expiry_status").eq("pharmacy_id", pharmacyId),
  ]);

  const completedSales = (salesRes.data ?? []).filter((s) => s.status !== "refunded");
  const revenue = completedSales.reduce((s, r) => s + Number(r.total_amount), 0);
  const costOfGoods = completedSales.reduce((s, r) => s + Number(r.cost_amount), 0);
  const orders = completedSales.length;

  const expensesTotal = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const expenseCategoryMap = new Map<string, number>();
  for (const e of expensesRes.data ?? []) {
    expenseCategoryMap.set(e.category, (expenseCategoryMap.get(e.category) ?? 0) + Number(e.amount));
  }

  const purchasesTotal = (purchasesRes.data ?? []).reduce((s, p) => s + Number(p.total_amount), 0);
  const supplierMap = new Map<string, number>();
  for (const p of (purchasesRes.data ?? []) as unknown as { total_amount: number; suppliers: { name: string } | null }[]) {
    const name = p.suppliers?.name ?? "Unknown supplier";
    supplierMap.set(name, (supplierMap.get(name) ?? 0) + Number(p.total_amount));
  }

  const medicines = medicinesRes.data ?? [];

  return {
    sales: {
      revenue,
      orders,
      avgOrderValue: orders > 0 ? revenue / orders : 0,
      costOfGoods,
    },
    profit: {
      revenue,
      costOfGoods,
      expenses: expensesTotal,
      netProfit: revenue - costOfGoods - expensesTotal,
    },
    inventory: {
      totalProducts: medicines.length,
      totalUnits: medicines.reduce((s, m) => s + Number(m.quantity), 0),
      inventoryValue: medicines.reduce((s, m) => s + Number(m.quantity) * Number(m.purchase_price), 0),
      lowStock: medicines.filter((m) => m.stock_status === "low_stock").length,
      outOfStock: medicines.filter((m) => m.stock_status === "out_of_stock").length,
      expired: medicines.filter((m) => m.expiry_status === "expired").length,
      expiringSoon: medicines.filter((m) => m.expiry_status === "expiring_soon").length,
    },
    purchases: {
      total: purchasesTotal,
      bySupplier: Array.from(supplierMap.entries()).map(([supplier, amount]) => ({ supplier, amount })).sort((a, b) => b.amount - a.amount),
    },
    expenses: {
      total: expensesTotal,
      byCategory: Array.from(expenseCategoryMap.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    },
  };
}
