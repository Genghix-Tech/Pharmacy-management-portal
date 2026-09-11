import { Boxes, DollarSign, Receipt, TrendingUp } from "lucide-react";

const BARS = [38, 52, 46, 61, 58, 70, 65, 78, 72, 85, 80, 92];
const ROWS = [
  { name: "Amoxicillin 500mg", sku: "MED-0001", stock: "220 units", status: "In Stock" },
  { name: "Insulin Glargine 100IU", sku: "MED-0013", stock: "18 units", status: "Low Stock" },
  { name: "Ciprofloxacin 500mg", sku: "MED-0003", stock: "0 units", status: "Out of Stock" },
];

const STATUS_STYLES: Record<string, string> = {
  "In Stock": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  "Low Stock": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "Out of Stock": "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

/** A hand-built, static mock of the real dashboard UI — not a screenshot. */
export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">PharmaFlow — Dashboard</span>
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: DollarSign, label: "Today's Sales", value: "PKR 1,284" },
            { icon: Receipt, label: "Orders", value: "47" },
            { icon: Boxes, label: "Inventory Value", value: "PKR 38.2k" },
            { icon: TrendingUp, label: "Profit", value: "PKR 412" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-3">
              <s.icon className="mb-2 size-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold sm:text-base">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Sales over time</p>
          <div className="flex h-24 items-end gap-1.5">
            {BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-lg border bg-background sm:block">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Medicine</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.sku} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.sku}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.stock}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
