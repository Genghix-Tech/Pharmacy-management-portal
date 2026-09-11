"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedDemoData } from "@/lib/actions/demo";

export function SeedDemoDataButton({ pharmacyId }: { pharmacyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await seedDemoData(pharmacyId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Demo data loaded — your dashboard is ready to explore.");
      router.refresh();
    });
  }

  return (
    <Button onClick={onClick} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {isPending ? "Loading demo data…" : "Load demo data"}
    </Button>
  );
}
