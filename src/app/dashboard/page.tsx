"use client";

import { signout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Upload, BarChart3, Users } from "lucide-react";
import Link from "next/link";

/**
 * IMPL-20260129-SPRINT1
 * Página del dashboard - Shell del panel de control
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 */

export default function DashboardPage() {
  const handleSignout = async () => {
    await signout();
  };

  const navItems = [
    {
      title: "Inventario",
      description: "Gestionar existencias, precios y ubicaciones",
      href: "/dashboard/inventory",
      icon: Package,
    },
    {
      title: "Importar Excel",
      description: "Carga masiva de productos desde .xlsx/.csv",
      href: "/dashboard/inventory/import",
      icon: Upload,
    },
    {
      title: "Reportes",
      description: "Ver métricas y movimientos (Próximamente)",
      href: "/dashboard",
      icon: BarChart3,
      disabled: true,
    },
    {
      title: "Usuarios",
      description: "Administrar perfiles y accesos (Próximamente)",
      href: "/dashboard",
      icon: Users,
      disabled: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
          <p className="text-muted-foreground mt-1">
            Bienvenido a Roda Llantas. Selecciona una acción para comenzar.
          </p>
        </div>
        <Button variant="ghost" onClick={handleSignout} className="text-red-500 hover:text-red-700 hover:bg-red-50">
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {navItems.map((item) => (
          <Link 
            key={item.title} 
            href={item.disabled ? "#" : item.href}
            className={item.disabled ? "pointer-events-none" : "block"}
          >
            <Card className={`h-full transition-all hover:shadow-md ${item.disabled ? "opacity-50 bg-muted" : "hover:border-primary/50"}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>✅ <strong>Autenticación:</strong> Activa (Supabase Auth)</p>
            <p>✅ <strong>Base de Datos:</strong> Conectada</p>
            <p>⚠️ <strong>UI/UX:</strong> En desarrollo activo (Sprint 3 en curso)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
