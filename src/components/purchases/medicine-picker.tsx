"use client";

import { useState } from "react";
import { ChevronsUpDown, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Medicine } from "@/lib/types/database";

export function MedicinePicker({
  medicines,
  onSelect,
}: {
  medicines: Pick<Medicine, "id" | "name" | "sku" | "purchase_price" | "unit_type">[];
  onSelect: (medicine: Pick<Medicine, "id" | "name" | "sku" | "purchase_price" | "unit_type">) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal sm:w-72" />}>
        <span className="flex items-center gap-2 text-muted-foreground">
          <PlusCircle className="size-4" /> Add a medicine to this purchase
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search medicines…" />
          <CommandList>
            <CommandEmpty>No medicine found.</CommandEmpty>
            <CommandGroup>
              {medicines.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name} ${m.sku ?? ""}`}
                  onSelect={() => {
                    onSelect(m);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{m.name}</span>
                  {m.sku && <span className="ml-auto text-xs text-muted-foreground">{m.sku}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
