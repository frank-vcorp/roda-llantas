"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * @id FIX-20260604-06
 * @respaldo /workspaces/roda-llantas/context/clientes/DEAC-ARCH-20260604-01.md
 */
function shouldTriggerPublicSearch(term: string) {
  const cleanTerm = term.replace(/[^a-z0-9]/gi, "");

  if (!cleanTerm) {
    return false;
  }

  const minimumLength = /\d/.test(cleanTerm) ? 2 : 3;
  return cleanTerm.length >= minimumLength;
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const isPublicCatalogSearch = pathname === "/";

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    const trimmedTerm = term.trim();
    const shouldSearch = isPublicCatalogSearch ? shouldTriggerPublicSearch(trimmedTerm) : Boolean(trimmedTerm);
    
    // Al buscar, reiniciar a la página 1
    params.set("page", "1");
    
    if (shouldSearch) {
      params.set("query", trimmedTerm);
    } else {
      params.delete("query");
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        className="pl-8 w-full max-w-md"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
    </div>
  );
}
