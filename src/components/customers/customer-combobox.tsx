/**
 * Componente CustomerCombobox
 *
 * Autocomplete para seleccionar o crear clientes.
 * Usa Popover + Command (cmdk) de shadcn/ui.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-02
 * @ref context/SPEC-CRM-LITE.md
 * @modified 2026-01-29: Crear componente con búsqueda y opción de crear cliente inline
 */

"use client";

import * as React from "react";
import { useTransition } from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer } from "@/lib/types";
import { searchCustomers, createCustomer } from "@/app/dashboard/customers/actions";

interface CustomerComboboxProps {
  /** Cliente actualmente seleccionado */
  value?: Customer | null;
  /** Callback cuando se selecciona o crea un cliente */
  onSelectCustomer: (customer: Customer) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Desabilitar el componente */
  disabled?: boolean;
}

export function CustomerCombobox({
  value,
  onSelectCustomer,
  placeholder = "Buscar cliente...",
  disabled = false,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = React.useState(false);

  // Buscar clientes cuando cambia la query
  React.useEffect(() => {
    if (searchQuery.length === 0) {
      setCustomers([]);
      return;
    }

    startTransition(async () => {
      const result = await searchCustomers(searchQuery);
      if (result.success && result.customers) {
        setCustomers(result.customers);
      }
    });
  }, [searchQuery]);

  /**
   * Manejar creación de nuevo cliente
   */
  const handleCreateCustomer = async () => {
    if (!searchQuery.trim()) return;

    setIsCreating(true);
    try {
      const result = await createCustomer({
        full_name: searchQuery.trim(),
        phone: null,
        email: null,
        tax_id: null,
      });

      if (result.success && result.customer) {
        onSelectCustomer(result.customer);
        setSearchQuery("");
        setOpen(false);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error creando cliente:", error);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Manejar selección de cliente
   */
  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery("");
    setOpen(false);
    setCustomers([]);
  };

  // Verificar si el query es un nuevo cliente potencial
  const hasSearchQuery = searchQuery.trim().length > 0;
  const isNewCustomer =
    hasSearchQuery && !customers.some((c) => c.full_name === searchQuery.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isPending || isCreating}
        >
          <span className={cn("flex-1 text-left", !value && "text-muted-foreground")}>
            {value ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{value.full_name}</span>
                {value.phone && (
                  <span className="text-xs text-muted-foreground">{value.phone}</span>
                )}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={isPending || isCreating}
          />

          <CommandList>
            <CommandEmpty>
              {isPending ? "Buscando..." : "No se encontraron clientes"}
            </CommandEmpty>

            {/* Resultados de búsqueda */}
            {customers.length > 0 && (
              <CommandGroup heading="Clientes">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{customer.full_name}</div>
                      {customer.phone && (
                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Opción de crear nuevo cliente */}
            {isNewCustomer && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateCustomer}
                  className="cursor-pointer text-primary"
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>
                    Crear cliente &quot;{searchQuery.trim()}&quot;
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
