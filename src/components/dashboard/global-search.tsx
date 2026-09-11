"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Pill, Users, Truck, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatCurrency } from "@/lib/utils/format";
import { globalSearch, type GlobalSearchResult } from "@/lib/actions/search";

const EMPTY: GlobalSearchResult = { medicines: [], customers: [], suppliers: [], sales: [] };

export function GlobalSearch({ pharmacyId, currency }: { pharmacyId: string; currency: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      globalSearch(pharmacyId, query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open, pharmacyId]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasResults =
    results.medicines.length + results.customers.length + results.suppliers.length + results.sales.length > 0;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="sm:hidden">
        <Search />
        <span className="sr-only">Search</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-64 justify-start text-muted-foreground sm:flex md:w-72"
      >
        <Search />
        Search medicines, customers…
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search PharmaFlow" description="Search across your pharmacy's data">
        <CommandInput placeholder="Search medicines, customers, suppliers, invoices…" value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim().length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
          ) : loading ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : !hasResults ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {results.medicines.length > 0 && (
                <CommandGroup heading="Medicines">
                  {results.medicines.map((m) => (
                    <CommandItem key={m.id} value={`medicine-${m.id}`} onSelect={() => go(`/dashboard/medicines/${m.id}`)}>
                      <Pill /> {m.name} {m.sku && <span className="ml-auto text-xs text-muted-foreground">{m.sku}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} value={`customer-${c.id}`} onSelect={() => go(`/dashboard/customers/${c.id}`)}>
                      <Users /> {c.name} {c.phone && <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.suppliers.length > 0 && (
                <CommandGroup heading="Suppliers">
                  {results.suppliers.map((s) => (
                    <CommandItem key={s.id} value={`supplier-${s.id}`} onSelect={() => go(`/dashboard/suppliers/${s.id}`)}>
                      <Truck /> {s.name} {s.company && <span className="ml-auto text-xs text-muted-foreground">{s.company}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.sales.length > 0 && (
                <CommandGroup heading="Invoices">
                  {results.sales.map((s) => (
                    <CommandItem key={s.id} value={`sale-${s.id}`} onSelect={() => go(`/dashboard/sales/${s.id}`)}>
                      <Receipt /> {s.invoice_number}
                      <span className="ml-auto text-xs text-muted-foreground">{formatCurrency(s.total_amount, currency)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
