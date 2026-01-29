"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateInventoryItem } from "@/app/dashboard/inventory/actions";
import { InventoryItem } from "@/lib/types";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface EditInventoryFormProps {
  item: InventoryItem;
}

export function EditInventoryForm({ item: initialItem }: EditInventoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    description: initialItem.description,
    brand: initialItem.brand,
    model: initialItem.model,
    width: initialItem.width,
    aspect_ratio: initialItem.aspect_ratio,
    rim: initialItem.rim,
    cost_price: initialItem.cost_price,
    stock: initialItem.stock,
    sku: initialItem.sku,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        await updateInventoryItem(initialItem.id, formData);
        toast.success("Producto actualizado correctamente");
        router.push("/dashboard/inventory");
      } catch (error) {
        console.error(error);
        toast.error("Error al actualizar producto");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory">
           <Button variant="ghost" size="icon">
             <ArrowLeft className="h-4 w-4" />
           </Button>
        </Link>
        <span className="text-gray-500 text-sm">Volver al inventario</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow border">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Descripción (Original)</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU / Clave</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku || ""}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand || ""}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              name="model"
              value={formData.model || ""}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Ancho (mm)</Label>
            <Input
              id="width"
              name="width"
              type="number"
              value={formData.width || 0}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspect_ratio">Perfil / Aspect Ratio</Label>
            <Input
              id="aspect_ratio"
              name="aspect_ratio"
              type="number"
              value={formData.aspect_ratio || 0}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rim">Rin (Pulgadas)</Label>
            <Input
              id="rim"
              name="rim"
              type="number"
              step="0.1"
              value={formData.rim || 0}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_price">Precio Costo</Label>
            <Input
              id="cost_price"
              name="cost_price"
              type="number"
              value={formData.cost_price || 0}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock || 0}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Link href="/dashboard/inventory">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
               "Guardando..."
            ) : (
               <>
                 <Save className="mr-2 h-4 w-4" />
                 Guardar Cambios
               </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
