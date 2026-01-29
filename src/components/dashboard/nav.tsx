"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, Package, FileText, Users, TrendingDown } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

/**
 * DashboardNav
 *
 * Navegación del dashboard con enlaces a:
 * - Inventario
 * - Cotizaciones
 * - Clientes (CRM)
 * - Ventas Perdidas (Admin)
 * - Configuración de Precios (Admin)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03, IMPL-20260129-ROLES-MOBILE
 * @ref context/SPEC-CRM-LITE.md, context/SPEC-ROLES-MOBILE.md
 */

interface DashboardNavProps {
  userRole?: "admin" | "seller" | null;
}

export function DashboardNav({ userRole = null }: DashboardNavProps) {
  const pathname = usePathname();

  const links: NavLink[] = [
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
      href: "/dashboard/analytics/lost-sales",
      label: "Ventas Perdidas",
      icon: TrendingDown,
      adminOnly: true,
    },
    {
      href: "/dashboard/settings/pricing",
      label: "Configuración de Precios",
      icon: Settings,
      adminOnly: true,
    },
  ];

  // Filtrar enlaces según rol
  const visibleLinks = links.filter(link => {
    if (link.adminOnly && userRole !== "admin") {
      return false;
    }
    return true;
  });

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {visibleLinks.map((link) => {
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
