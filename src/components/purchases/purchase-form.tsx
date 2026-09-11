"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicinePicker } from "@/components/purchases/medicine-picker";
import { createPurchase } from "@/lib/actions/purchases";
import { formatCurrency } from "@/lib/utils/format";
import type { Medicine, Supplier } from "@/lib/types/database";

const NONE = "__none__";

interface Line {
  medicineId: string;
  name: string;
  unitType: string;
  quantity: number;
  purchasePrice: number;
  batchNumber: string;
  expiryDate: string;
}

export function PurchaseForm({
  suppliers,
  medicines,
  currency,
}: {
  suppliers: Supplier[];
  medicines: Pick<Medicine, "id" | "name" | "sku" | "purchase_price" | "unit_type">[];
  currency: string;
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [fullyPaid, setFullyPaid] = useState(true);
  const [amountPaid, setAmountPaid] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.purchasePrice, 0), [lines]);

  function addLine(m: Pick<Medicine, "id" | "name" | "sku" | "purchase_price" | "unit_type">) {
    if (lines.some((l) => l.medicineId === m.id)) {
      toast.info(`${m.name} is already in this purchase.`);
      return;
    }
    setLines((prev) => [
      ...prev,
      { medicineId: m.id, name: m.name, unitType: m.unit_type, quantity: 1, purchasePrice: Number(m.purchase_price), batchNumber: "", expiryDate: "" },
    ]);
  }

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.medicineId === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.medicineId !== id));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one medicine to this purchase.");
      return;
    }
    startTransition(async () => {
      const result = await createPurchase({
        supplierId: supplierId || undefined,
        purchaseDate,
        notes: notes || undefined,
        amountPaid: fullyPaid ? total : Number(amountPaid) || 0,
        items: lines.map((l) => ({
          medicineId: l.medicineId,
          quantity: l.quantity,
          purchasePrice: l.purchasePrice,
          batchNumber: l.batchNumber || undefined,
          expiryDate: l.expiryDate || undefined,
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(`Purchase ${result.data.purchase_number} recorded — inventory updated.`);
      router.push(`/dashboard/purchases/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select value={supplierId || NONE} onValueChange={(v) => setSupplierId(v && v !== NONE ? v : "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase-date">Purchase date</Label>
            <Input id="purchase-date" type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="p-notes">Notes</Label>
          <Textarea id="p-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Items</h2>
          <MedicinePicker medicines={medicines} onSelect={addLine} />
        </div>

        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No items added yet.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l.medicineId} className="grid grid-cols-2 items-end gap-3 border-b pb-3 last:border-b-0 sm:grid-cols-6">
                <div className="col-span-2 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Medicine</Label>
                  <p className="text-sm font-medium">{l.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input type="number" min="1" step="1" value={l.quantity} onChange={(e) => updateLine(l.medicineId, { quantity: Math.max(1, Number(e.target.value)) })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Purchase price</Label>
                  <Input type="number" min="0" step="0.01" value={l.purchasePrice} onChange={(e) => updateLine(l.medicineId, { purchasePrice: Math.max(0, Number(e.target.value)) })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Batch #</Label>
                  <Input value={l.batchNumber} onChange={(e) => updateLine(l.medicineId, { batchNumber: e.target.value })} />
                </div>
                <div className="flex items-end gap-1.5">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Expiry</Label>
                    <Input type="date" value={l.expiryDate} onChange={(e) => updateLine(l.medicineId, { expiryDate: e.target.value })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeLine(l.medicineId)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end border-t pt-4 text-base font-semibold">
          Total: {formatCurrency(total, currency)}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Payment</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={fullyPaid} onChange={() => setFullyPaid(true)} /> Paid in full now
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!fullyPaid} onChange={() => setFullyPaid(false)} /> Partially paid / on credit
          </label>
          {!fullyPaid && (
            <Input type="number" min="0" step="0.01" max={total} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-40" placeholder="Amount paid now" />
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isPending || lines.length === 0}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Record purchase
        </Button>
      </div>
    </form>
  );
}
