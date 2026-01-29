import { getInventoryItemById } from "@/lib/services/inventory";
import { EditInventoryForm } from "@/components/inventory/edit-inventory-form";
import { notFound } from "next/navigation";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInventoryPage(props: EditPageProps) {
  const params = await props.params;
  const item = await getInventoryItemById(params.id);

  if (!item) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Producto</h1>
      <EditInventoryForm item={item} />
    </div>
  );
}
