"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/utils/errors";

export function ConfirmDeleteButton({
  onConfirm,
  title = "Delete this record?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  successMessage = "Deleted successfully.",
  trigger,
}: {
  /**
   * A Server Action reference — pass the action directly, binding any
   * arguments with `.bind(null, id)` (e.g. `deleteMedicine.bind(null, m.id)`).
   * Don't wrap it in a new arrow function like `() => deleteMedicine(m.id)`:
   * that's an ordinary closure, and when this component is used from a
   * Server Component (most list pages), React can't send an ordinary
   * closure across the server/client boundary — only a real action
   * reference (bound or not) survives that trip. Called with no arguments
   * from inside this (client) component either way.
   */
  onConfirm: () => Promise<ActionResult<unknown>>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={trigger ?? <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" />}
      >
        {!trigger && (
          <>
            <Trash2 />
            <span className="sr-only">Delete</span>
          </>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
