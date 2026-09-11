"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarcodeScannerButton } from "@/components/shared/barcode-scanner";
import { CustomerPicker } from "@/components/pos/customer-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { createClient } from "@/lib/supabase/client";
import { createSale } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/utils/status";
import type { Customer, Invoice, MedicineStatusRow, PaymentMethod, Sale, SaleItem } from "@/lib/types/database";

type SearchResult = Pick<
  MedicineStatusRow,
  "id" | "name" | "generic_name" | "sku" | "barcode" | "selling_price" | "quantity" | "tax_rate" | "unit_type" | "stock_status"
>;

interface CartItem {
  medicineId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  taxRate: number;
  availableStock: number;
  unitType: string;
}

export function PosClient({
  pharmacyId,
  currency,
  initialMedicines,
  customers,
}: {
  pharmacyId: string;
  currency: string;
  initialMedicines: SearchResult[];
  customers: Pick<Customer, "id" | "name" | "phone">[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>(initialMedicines);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, startSubmit] = useTransition();
  const [receipt, setReceipt] = useState<{ sale: Sale; items: SaleItem[]; invoice: Invoice } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults(initialMedicines);
        return;
      }
      setSearching(true);
      const like = `%${query.trim()}%`;
      const { data } = await supabase
        .from("medicine_status")
        .select("id, name, generic_name, sku, barcode, selling_price, quantity, tax_rate, unit_type, stock_status")
        .eq("pharmacy_id", pharmacyId)
        .eq("status", "active")
        .or(`name.ilike.${like},sku.ilike.${like},barcode.ilike.${like},generic_name.ilike.${like}`)
        .order("name")
        .limit(12);
      if (!cancelled) {
        setResults((data as SearchResult[]) ?? []);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pharmacyId]);

  function addToCart(m: SearchResult) {
    if (m.quantity <= 0) {
      toast.error(`${m.name} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.medicineId === m.id);
      if (existing) {
        if (existing.quantity >= m.quantity) {
          toast.error(`Only ${m.quantity} ${m.unit_type}(s) of ${m.name} in stock.`);
          return prev;
        }
        return prev.map((c) => (c.medicineId === m.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          medicineId: m.id,
          name: m.name,
          sku: m.sku,
          unitPrice: Number(m.selling_price),
          quantity: 1,
          discountAmount: 0,
          taxRate: Number(m.tax_rate),
          availableStock: m.quantity,
          unitType: m.unit_type,
        },
      ];
    });
  }

  async function handleBarcodeScan(code: string) {
    const { data } = await supabase
      .from("medicine_status")
      .select("id, name, generic_name, sku, barcode, selling_price, quantity, tax_rate, unit_type, stock_status")
      .eq("pharmacy_id", pharmacyId)
      .eq("barcode", code)
      .maybeSingle();
    if (!data) {
      toast.error(`No medicine found with barcode ${code}.`);
      return;
    }
    addToCart(data as SearchResult);
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.medicineId !== id) return c;
        const clamped = Math.max(1, Math.min(quantity, c.availableStock));
        return { ...c, quantity: clamped };
      })
    );
  }

  function updateDiscount(id: string, discountAmount: number) {
    setCart((prev) => prev.map((c) => (c.medicineId === id ? { ...c, discountAmount: Math.max(0, discountAmount) } : c)));
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.medicineId !== id));
  }

  const lines = useMemo(
    () =>
      cart.map((c) => {
        const lineSubtotal = c.unitPrice * c.quantity;
        const discount = Math.min(c.discountAmount, lineSubtotal);
        const tax = Math.round((lineSubtotal - discount) * (c.taxRate / 100) * 100) / 100;
        return { ...c, lineSubtotal, discount, tax, lineTotal: lineSubtotal - discount + tax };
      }),
    [cart]
  );

  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const discountTotal = lines.reduce((s, l) => s + l.discount, 0);
  const taxTotal = lines.reduce((s, l) => s + l.tax, 0);
  const grandTotal = subtotal - discountTotal + taxTotal;

  function handleCheckout() {
    if (cart.length === 0) return;
    startSubmit(async () => {
      const result = await createSale({
        items: lines.map((l) => ({
          medicineId: l.medicineId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: l.discount,
          taxAmount: l.tax,
        })),
        customerId: customerId ?? undefined,
        paymentMethod,
        notes: notes || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const sale = result.data;
      const [{ data: saleItems }, { data: invoice }] = await Promise.all([
        supabase.from("sale_items").select("*").eq("sale_id", sale.id),
        supabase.from("invoices").select("*").eq("sale_id", sale.id).maybeSingle(),
      ]);

      if (invoice) {
        setReceipt({ sale, items: saleItems ?? [], invoice });
      } else {
        // Sale still succeeded — just couldn't load the invoice preview.
        toast.success(`Sale completed — Invoice ${sale.invoice_number}`);
      }
      setCart([]);
      setCustomerId(null);
      setNotes("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-9"
              placeholder="Search medicine by name, SKU or barcode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <BarcodeScannerButton onScan={handleBarcodeScan} />
        </div>

        {results.length === 0 ? (
          <EmptyState icon={Search} title={searching ? "Searching…" : "No medicines found"} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => addToCart(m)}
                disabled={m.quantity <= 0}
                className="flex flex-col items-start gap-1.5 rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="line-clamp-2 text-sm font-medium">{m.name}</p>
                {m.generic_name && <p className="line-clamp-1 text-xs text-muted-foreground">{m.generic_name}</p>}
                <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-1 pt-1">
                  <span className="font-semibold tabular-nums">{formatCurrency(m.selling_price, currency)}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {m.quantity} {m.unit_type}(s)
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <ShoppingCart className="size-4" /> Cart
          </h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="xs" onClick={() => setCart([])} className="text-muted-foreground">
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: "40vh" }}>
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cart is empty. Add medicines to start a sale.</p>
          ) : (
            lines.map((l) => (
              <div key={l.medicineId} className="space-y-1.5 border-b pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{l.name}</p>
                  <button type="button" onClick={() => removeItem(l.medicineId)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon-xs" onClick={() => updateQuantity(l.medicineId, l.quantity - 1)}>
                      <Minus />
                    </Button>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={l.availableStock}
                      step={1}
                      value={l.quantity}
                      onChange={(e) => updateQuantity(l.medicineId, Math.trunc(Number(e.target.value)) || 1)}
                      className="h-6 w-12 px-1 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button type="button" variant="outline" size="icon-xs" onClick={() => updateQuantity(l.medicineId, l.quantity + 1)}>
                      <Plus />
                    </Button>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(l.lineTotal, currency)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Discount</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.discountAmount || ""}
                    onChange={(e) => updateDiscount(l.medicineId, Number(e.target.value) || 0)}
                    className="h-6 w-20 px-1.5 text-xs"
                    placeholder="0.00"
                  />
                  {l.tax > 0 && <span className="ml-auto">Tax {formatCurrency(l.tax, currency)}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment method</Label>
            <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Notes (optional)" rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatCurrency(subtotal, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">-{formatCurrency(discountTotal, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="tabular-nums">{formatCurrency(taxTotal, currency)}</dd></div>
            <div className="flex justify-between border-t pt-1.5 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatCurrency(grandTotal, currency)}</dd></div>
          </dl>

          <Button className="w-full" size="lg" disabled={cart.length === 0 || isSubmitting} onClick={handleCheckout}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Complete Sale — {formatCurrency(grandTotal, currency)}
          </Button>
        </div>
      </div>

      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-h-[85vh] w-full max-w-3xl gap-0 overflow-y-auto p-0 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Sale completed</DialogTitle>
            <DialogDescription>
              Invoice {receipt?.invoice.invoice_number} — {receipt && formatCurrency(receipt.sale.total_amount, currency)}
            </DialogDescription>
          </DialogHeader>
          {receipt && (
            <InvoiceDocument
              sale={receipt.sale}
              items={receipt.items}
              invoice={receipt.invoice}
              extraActions={
                <Button onClick={() => setReceipt(null)}>
                  <ShoppingCart /> New sale
                </Button>
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
