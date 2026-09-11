"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserRound, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types/database";

export function CustomerPicker({
  customers,
  value,
  onChange,
}: {
  customers: Pick<Customer, "id" | "name" | "phone">[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
        <span className="flex items-center gap-2 truncate">
          <UserRound className="size-4 text-muted-foreground" />
          {selected ? selected.name : "Walk-in customer"}
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search customers…" />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="walk-in-none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <UserRoundX className="text-muted-foreground" /> Walk-in customer
                {!value && <Check className="ml-auto" />}
              </CommandItem>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.phone ?? ""}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <span className={cn("truncate", value === c.id && "font-medium")}>{c.name}</span>
                  {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                  {value === c.id && <Check className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
