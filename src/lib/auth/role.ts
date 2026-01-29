/**
 * Helper: Gestión de Roles y Control de Acceso
 *
 * - `getUserRole(userId)`: Obtiene el rol del usuario desde DB
 * - `verifyRole(userId, required)`: Verifica si el usuario tiene el rol requerido
 * - `getLoggedInUserRole()`: Obtiene el rol del usuario logged-in (desde sesión)
 *
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 * @ref context/SPEC-ROLES-MOBILE.md
 */

import { createClient } from "@/lib/supabase/server";
import { UserRole, UserProfile } from "@/lib/types";

/**
 * Obtiene el rol del usuario desde la tabla profiles
 * @param userId ID del usuario
 * @returns Role del usuario ('admin' | 'seller')
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return (data?.role as UserRole) || "seller";
  } catch (error) {
    console.error("[getUserRole] Error fetching user role:", error);
    return "seller"; // Default role si hay error
  }
}

/**
 * Obtiene el perfil completo del usuario
 * @param userId ID del usuario
 * @returns UserProfile completo
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data as UserProfile;
  } catch (error) {
    console.error("[getUserProfile] Error fetching user profile:", error);
    return null;
  }
}

/**
 * Verifica si el usuario tiene el rol requerido
 * @param userId ID del usuario
 * @param requiredRole Rol requerido
 * @returns true si el usuario tiene el rol, false en caso contrario
 */
export async function verifyRole(
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === requiredRole;
}

/**
 * Verifica si el usuario es admin
 * @param userId ID del usuario
 * @returns true si es admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return verifyRole(userId, "admin");
}

/**
 * Guard para Server Actions: Lanza error si el usuario no es admin
 * @param userId ID del usuario
 * @throws Error si el usuario no es admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const isAdminUser = await isAdmin(userId);
  if (!isAdminUser) {
    throw new Error("Unauthorized: Admin role required");
  }
}
