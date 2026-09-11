"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Please try again. If the problem keeps happening, contact your pharmacy owner or support.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" render={<Link href="/dashboard" />}>Back to dashboard</Button>
        <Button onClick={reset}>
          <RotateCw /> Try again
        </Button>
      </div>
    </div>
  );
}
