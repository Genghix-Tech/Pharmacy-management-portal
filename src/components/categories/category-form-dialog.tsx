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
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { Category } from "@/lib/types/database";

export function CategoryFormDialog({ category }: { category?: Category }) {
  const router = useRouter();
  const isEdit = !!category;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category!.id, { name, description })
        : await createCategory({ name, description });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Category updated." : "Category added.");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setDescription("");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "icon-sm" : "default"} />}>
        {isEdit ? (
          <>
            <Pencil />
            <span className="sr-only">Edit category</span>
          </>
        ) : (
          <>
            <Plus /> Add Category
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update this medicine category." : "Create a new category to organize your medicines."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Antibiotics" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-description">Description (optional)</Label>
              <Textarea id="cat-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={3} />
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
