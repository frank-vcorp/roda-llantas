'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/inventory/file-uploader';
import { parseInventoryExcel, InventoryItem } from '@/lib/logic/excel-parser';
import { insertInventoryItems } from '@/app/dashboard/inventory/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Info, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MasterPriceList } from './master-list-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWarehouses, Warehouse } from '@/app/dashboard/inventory/warehouse-actions';
import { useEffect } from 'react';

/**
 * @fileoverview Página de importación de inventario
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 */

/**
 * @fileoverview Página de importación de inventario
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 */

interface UIState {
  step: 'upload' | 'preview' | 'success';
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

export default function InventoryImportPage() {
  const [state, setState] = useState<UIState>({
    step: 'upload',
    isLoading: false,
    error: null,
    successMessage: null,
  });

  const [previewData, setPreviewData] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [updatePricesOnly, setUpdatePricesOnly] = useState<boolean>(false); // IMPL-20260218-PRICE-MODE

  console.log("RENDER IMPORT PAGE", { updatePricesOnly });

  useEffect(() => {
    getWarehouses().then(setWarehouses);
  }, []);

  const handleFileSelect = async (file: File) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const items = await parseInventoryExcel(file);
      setPreviewData(items);
      setState((prev) => ({
        ...prev,
        step: 'preview',
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error al procesar archivo',
      }));
    }
  };

  const handleSaveToDatabase = async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Si NO es solo precios, obligar almacén. Si ES solo precios, el almacén es opcional (pero recomendable para consistencia)
      if (!selectedWarehouse && !updatePricesOnly) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Por favor selecciona un almacén de destino",
        }));
        return;
      }

      const result = await insertInventoryItems(previewData, selectedWarehouse, updatePricesOnly);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          step: 'success',
          isLoading: false,
          successMessage: result.message,
        }));
        setPreviewData([]);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'upload',
      isLoading: false,
      error: null,
      successMessage: null,
    });
    setPreviewData([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="w-full px-4 md:px-8 pt-6">
        <div className="mb-8">
          <Link href="/dashboard/inventory" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Importación de Inventario</h1>
              <p className="text-gray-500 mt-1">Carga masiva de productos vía Excel/CSV</p>
            </div>
            {/* Steps Indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <span className={`px-3 py-1 rounded-full ${state.step === 'upload' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500'}`}>1. Carga</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className={`px-3 py-1 rounded-full ${state.step === 'preview' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500'}`}>2. Vista Previa</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className={`px-3 py-1 rounded-full ${state.step === 'saving' || state.step === 'success' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500'}`}>3. Guardar</span>
            </div>
          </div>
        </div>

        {/* IMPORT SECTION */}
        {state.step === 'upload' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: INSTRUCTIONS & WAREHOUSE */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">1. Almacén de Destino</h3>
                  <div className="space-y-4">
                    <Select
                      value={selectedWarehouse}
                      onValueChange={setSelectedWarehouse}
                      disabled={state.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un almacén..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} ({w.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Las existencias cargadas se sumarán a este almacén.
                    </p>
                  </div>
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 text-sm">Formato Requerido</h3>
                      <p className="text-xs text-blue-800 mt-1 mb-2">Columnas necesarias en Excel/CSV:</p>
                      <ul className="list-disc list-inside text-xs text-blue-800 space-y-0.5">
                        <li>Marca, Modelo, Medida</li>
                        <li><strong>Costo</strong> (Precio de compra)</li>
                        <li><strong>Stock</strong> (Cantidad)</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {/* RIGHT: UPLOAD AREA */}
              <div className="lg:col-span-2">
                <Card className="p-8 h-full">
                  <h3 className="text-lg font-medium mb-4">2. Carga de Archivo</h3>
                  <FileUploader
                    onFileSelect={handleFileSelect}
                    isLoading={state.isLoading}
                    error={state.error || undefined}
                  />

                  <div className="mt-6 flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      id="priceOnly"
                      className="mt-1 h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                      checked={updatePricesOnly}
                      onChange={(e) => setUpdatePricesOnly(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="priceOnly" className="block text-sm font-medium text-amber-900 cursor-pointer">
                        Modo "Actualización de Costos"
                      </label>
                      <p className="text-xs text-amber-800 mt-1">
                        Si activas esto, <strong>solo se actualizarán los Precios de Costo</strong> y detalles del producto.
                        <u>No se modificará el Stock</u> de ningún almacén. Ideal para cargar listas de precios de proveedores (Mane).
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200 mt-8">
              <MasterPriceList />
            </div>
          </div>
        )}

        {/* PREVIEW STEP */}
        {state.step === 'preview' && previewData.length > 0 && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se procesaron {previewData.length} items. Revisa los datos antes
                de guardar.
              </AlertDescription>
            </Alert>

            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Card className="overflow-x-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Vista Previa de Datos
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Clave
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Descripción (Original)
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">
                          Costo
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                            {item.sku || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.description || item.medida_full}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-slate-900 text-white p-3 max-w-xs shadow-xl z-50">
                                    <div className="text-xs space-y-1">
                                      <p className="font-bold border-b pb-1 mb-1 border-gray-600">Datos Detectados</p>
                                      <p><strong>Marca:</strong> {item.brand}</p>
                                      <p><strong>Modelo:</strong> {item.model}</p>
                                      <p><strong>Medida:</strong> {item.medida_full}</p>
                                      <p><strong>Ancho:</strong> {item.width} mm</p>
                                      <p><strong>Perfil:</strong> {item.aspect_ratio}%</p>
                                      <p><strong>Rin:</strong> {item.rim}"</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-semibold text-right">
                            ${item.cost_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-right">
                            {item.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={state.isLoading}
              >
                Cargar otro archivo
              </Button>
              <Button
                onClick={handleSaveToDatabase}
                disabled={state.isLoading}
                className="gap-2"
              >
                {state.isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Guardar en Base de Datos
              </Button>
            </div>
          </div>
        )
        }

        {/* Success Step */}
        {
          state.step === 'success' && state.successMessage && (
            <div className="space-y-6">
              <Card className="p-8 border-green-200 bg-green-50">
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-900">
                      ¡Éxito!
                    </h2>
                    <p className="text-green-800 mt-2">{state.successMessage}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-center">
                <Button onClick={handleReset} size="lg">
                  Importar otro archivo
                </Button>
              </div>
            </div>
          )
        }

        {/* Error handling */}
        {
          state.error && state.step !== 'upload' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )
        }
      </div >
      );
}
