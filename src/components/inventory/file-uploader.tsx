'use client';

import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * @fileoverview FileUploader - Componente de carga de archivos Excel
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 */

export interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string;
}

export function FileUploader({
  onFileSelect,
  isLoading = false,
  error,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const acceptedFormats = ['.xlsx', '.xls', '.csv'];
  const acceptAttribute = acceptedFormats.join(',');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      alert('Por favor selecciona un archivo .xlsx, .xls o .csv');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Arrastra tu archivo aquí
            </p>
            <p className="text-xs text-gray-500">o</p>
          </div>
          <label>
            <input
              type="file"
              accept={acceptAttribute}
              onChange={handleFileInput}
              disabled={isLoading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                e.currentTarget.parentElement?.querySelector('input')?.click();
              }}
            >
              Selecciona un archivo
            </Button>
          </label>
          <p className="text-xs text-gray-500">
            Formatos soportados: .xlsx, .xls, .csv
          </p>
        </div>
      </div>

      {fileName && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800">{fileName}</span>
          <span className="text-xs text-green-600">Listo para procesar</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
