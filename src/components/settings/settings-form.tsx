/**
 * Componente: SettingsForm
 *
 * Formulario para editar configuración de organización
 *
 * @id IMPL-20260130-WHITELABEL
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { OrganizationSettings } from "@/lib/types";
import { updateOrganizationSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface SettingsFormProps {
  initialData: OrganizationSettings | null;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || "");
  const [logoPreview, setLogoPreview] = useState(initialData?.logo_url || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Partial<OrganizationSettings>>({
    defaultValues: {
      name: initialData?.name || "Roda Llantas",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      website: initialData?.website || "",
      logo_url: initialData?.logo_url || "",
      ticket_footer_message:
        initialData?.ticket_footer_message || "¡Gracias por su compra!",
    },
  });

  // Manejar cambio de URL de logo
  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    // Validar que sea una URL válida
    try {
      new URL(url);
      setLogoPreview(url);
    } catch {
      // Si no es URL válida, no actualizar preview
    }
  };

  // Manejar subida de logo (por ahora solo URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Crear preview local
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      // Por ahora solo guardamos la preview local
      // En una versión futura, subiríamos a Supabase Storage
      toast("Nota: Subida de archivo en Supabase Storage disponible en próxima versión. Usa URL por ahora.");
    };
    reader.readAsDataURL(file);
  };

  // Manejar envío del formulario
  const onSubmit = async (data: Partial<OrganizationSettings>) => {
    setIsLoading(true);
    try {
      const result = await updateOrganizationSettings({
        ...data,
        logo_url: logoUrl || undefined,
      });

      if (result.success) {
        toast.success("Configuración actualizada correctamente");
        reset(result.data);
      } else {
        toast.error(result.error || "Error al actualizar configuración");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error inesperado"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sección: Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Nombre del Negocio
            </label>
            <input
              {...register("name", {
                required: "El nombre es requerido",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
              })}
              type="text"
              placeholder="Ej. Roda Llantas"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Teléfono
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="Ej. +57 300 123 4567"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Dirección
            </label>
            <input
              {...register("address")}
              type="text"
              placeholder="Ej. Calle 123 #45-67, Bogotá"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Sitio Web */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Sitio Web
            </label>
            <input
              {...register("website")}
              type="url"
              placeholder="Ej. https://example.com"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección: Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo de Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview del Logo */}
          {logoPreview && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <div className="relative w-48 h-24">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Upload File */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Subir Logo (Imagen)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              O usa una URL de imagen pública (próximo paso)
            </p>
          </div>

          {/* URL del Logo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              URL del Logo (Alternativa)
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa una URL pública de tu logo. Se mostrará en las cotizaciones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sección: Mensaje de Pie de Página */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mensaje en Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Mensaje de Pie de Página
            </label>
            <textarea
              {...register("ticket_footer_message")}
              placeholder="Ej. ¡Gracias por su compra! / Síguenos en Instagram @rodallantaspro"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Este mensaje aparecerá al final de todas tus cotizaciones
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="gap-2 flex-1"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
