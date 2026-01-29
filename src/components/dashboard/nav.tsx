"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, Package, FileText, Users } from "lucide-react";

/**
 * DashboardNav
 *
 * Navegación del dashboard con enlaces a:
 * - Inventario
 * - Cotizaciones
 * - Clientes (CRM)
 * - Configuración de Precios
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03
 * @ref context/SPEC-CRM-LITE.md
 */

export function DashboardNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard/inventory",
      label: "Inventario",
      icon: Package,
    },
    {
      href: "/dashboard/quotes",
      label: "Cotizaciones",
      icon: FileText,
    },
    {
      href: "/dashboard/customers",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/dashboard/settings/pricing",
      label: "Configuración de Precios",
      icon: Settings,
    },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
              isActive ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
