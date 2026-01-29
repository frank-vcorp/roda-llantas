/**
 * Componente ProductCombobox
 *
 * Autocomplete para seleccionar productos del inventario.
 * Usa Popover + Command (cmdk) de shadcn/ui.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PURCHASES-01
 * @ref context/SPEC-PURCHASES.md
 */

"use client";

import * as React from "react";
import { useTransition } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
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

export interface InventoryProduct {
  id: string;
  brand: string;
  model: string;
  medida_full: string;
  stock: number;
  cost_price: number;
}

interface ProductComboboxProps {
  /** Producto actualmente seleccionado */
  value?: InventoryProduct | null;
  /** Callback cuando se selecciona un producto */
  onSelectProduct: (product: InventoryProduct) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Desabilitar el componente */
  disabled?: boolean;
}

/**
 * Busca productos en el inventario
 */
async function searchInventoryProducts(query: string): Promise<InventoryProduct[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("[ProductCombobox] Search error:", error);
    return [];
  }
}

export function ProductCombobox({
  value,
  onSelectProduct,
  placeholder = "Buscar producto...",
  disabled = false,
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [products, setProducts] = React.useState<InventoryProduct[]>([]);
  const [isPending, startTransition] = useTransition();

  // Buscar productos cuando cambia la query
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setProducts([]);
      return;
    }

    startTransition(async () => {
      const result = await searchInventoryProducts(searchQuery);
      setProducts(result);
    });
  }, [searchQuery]);

  /**
   * Manejar selección de producto
   */
  const handleSelectProduct = (product: InventoryProduct) => {
    onSelectProduct(product);
    setSearchQuery("");
    setOpen(false);
    setProducts([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isPending}
        >
          <span className={cn("flex-1 text-left text-sm", !value && "text-muted-foreground")}>
            {value ? (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {value.brand} {value.model}
                </span>
                <span className="text-xs text-muted-foreground">{value.medida_full}</span>
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
            disabled={isPending}
          />

          <CommandList>
            <CommandEmpty>
              {isPending ? "Buscando..." : searchQuery.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron productos"}
            </CommandEmpty>

            {/* Resultados de búsqueda */}
            {products.length > 0 && (
              <CommandGroup heading="Productos">
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelectProduct(product)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {product.brand} {product.model}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{product.medida_full}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
