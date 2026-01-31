"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, Package, FileText, Users, TrendingDown, DollarSign } from "lucide-react";

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
  className?: string;
  variant?: "sidebar" | "mobile";
}

export function DashboardNav({ userRole = null, className, variant = "sidebar" }: DashboardNavProps) {
  const pathname = usePathname();

  const links: NavLink[] = [
    {
      href: "/dashboard",
      label: "Inicio",
      icon: LayoutDashboard,
    },
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
      label: "Oportunidades",
      icon: TrendingDown,
      adminOnly: true,
    },
    {
      href: "/dashboard/settings",
      label: "Configuración",
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

  if (variant === "mobile") {
    return (
      <nav className={cn("flex items-center justify-around w-full px-2", className)}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground opacity-60 hover:opacity-100"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[3px]")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("grid gap-2", className)}>
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 rounded-2xl",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
