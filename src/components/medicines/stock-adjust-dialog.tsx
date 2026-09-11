"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adjustStock } from "@/lib/actions/medicines";

export function StockAdjustDialog({
  medicineId,
  currentQuantity,
  unitType,
  compact = false,
}: {
  medicineId: string;
  currentQuantity: number;
  unitType: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter a whole number greater than zero.");
      return;
    }
    const change = direction === "add" ? value : -value;
    startTransition(async () => {
      const result = await adjustStock(medicineId, change, reason);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Stock adjusted.");
      setOpen(false);
      setAmount("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size={compact ? "icon-sm" : "default"} />}>
        <PackageSearch />
        {compact ? <span className="sr-only">Adjust stock</span> : "Adjust stock"}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>Currently {currentQuantity} {unitType}(s) in stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs value={direction} onValueChange={(v) => setDirection(v as "add" | "remove")}>
              <TabsList className="w-full">
                <TabsTrigger value="add" className="flex-1">Add stock</TabsTrigger>
                <TabsTrigger value="remove" className="flex-1">Remove stock</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={direction === "add" ? "e.g. Stock count correction" : "e.g. Damaged goods"} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {direction === "add" ? "Add stock" : "Remove stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
