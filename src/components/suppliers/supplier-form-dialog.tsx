"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createSupplier, updateSupplier, type SupplierInput } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/types/database";

const empty: SupplierInput = { name: "", company: "", phone: "", email: "", address: "", taxNumber: "", notes: "" };

export function SupplierFormDialog({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const isEdit = !!supplier;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SupplierInput>(
    supplier
      ? {
          name: supplier.name,
          company: supplier.company ?? "",
          phone: supplier.phone ?? "",
          email: supplier.email ?? "",
          address: supplier.address ?? "",
          taxNumber: supplier.tax_number ?? "",
          notes: supplier.notes ?? "",
        }
      : empty
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof SupplierInput>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit ? await updateSupplier(supplier!.id, values) : await createSupplier(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Supplier updated." : "Supplier added.");
      setOpen(false);
      if (!isEdit) setValues(empty);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}>
        {isEdit ? (
          <>
            <Pencil /> Edit
          </>
        ) : (
          <>
            <Plus /> Add Supplier
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit supplier" : "Add supplier"}</DialogTitle>
            <DialogDescription>Keep your supplier contact details up to date.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-name">Supplier name</Label>
              <Input id="s-name" required value={values.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-company">Company</Label>
              <Input id="s-company" value={values.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-address">Address</Label>
              <Input id="s-address" value={values.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-tax">Tax information</Label>
              <Input id="s-tax" value={values.taxNumber} onChange={(e) => update("taxNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-notes">Notes</Label>
              <Textarea id="s-notes" rows={3} value={values.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
