/**
 * Componente: RoleGate
 *
 * Renderiza contenido solo si el usuario tiene el rol requerido.
 * Usado en componentes del cliente (UI condicional).
 *
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 * @ref context/SPEC-ROLES-MOBILE.md
 */

"use client";

import React, { ReactNode } from "react";
import { UserRole } from "@/lib/types";

interface RoleGateProps {
  role: UserRole;
  userRole: UserRole | null;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * RoleGate: Renderiza children si userRole === role
 * @param role - Rol requerido para mostrar el contenido
 * @param userRole - Rol del usuario actual
 * @param children - Contenido a mostrar si autorizado
 * @param fallback - Contenido alternativo si no autorizado (default: null)
 */
export function RoleGate({ role, userRole, children, fallback = null }: RoleGateProps) {
  if (userRole === role) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
