"use client"

import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Table as TableIcon,
  RefreshCw,
} from 'lucide-react'
import { apiFetch } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ImportPeligrosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ImportPeligrosModal({
  open,
  onOpenChange,
  onImported,
}: ImportPeligrosModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')

  if (!open) return null

  const handleDownloadTemplate = () => {
    window.location.href = '/api/peligros/template'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setParsing(true)
    setParsedRows([])

    try {
      const formData = new FormData()
      formData.append('file', selected)

      const res = await fetch('/api/peligros/import/preview', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Error al procesar el archivo Excel')
      }

      const data = await res.json()
      if (data.rows && data.rows.length > 0) {
        setParsedRows(data.rows)
        toast({
          title: 'Archivo analizado con éxito',
          description: `Se detectaron ${data.rows.length} peligros listos para importar.`,
        })
      } else {
        toast({
          title: 'Sin datos válidos',
          description: 'No se encontraron filas con descripción de peligro en el archivo.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err)
      toast({
        title: 'Error al leer Excel',
        description: err.message || 'Verifica que el archivo sea un Excel (.xlsx o .xls) válido.',
        variant: 'destructive',
      })
    } finally {
      setParsing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return

    setImporting(true)
    try {
      const res = await apiFetch('/api/peligros/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: parsedRows,
          mode,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al guardar peligros')
      }

      const result = await res.json()
      toast({
        title: '¡Importación completada!',
        description: `Se crearon ${result.createdCount} peligros nuevos y se actualizaron ${result.updatedCount}.`,
      })

      onImported()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Error en la importación',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fakeEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
              <Upload className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#163522]">
                Importar Peligros desde Excel
              </h3>
              <p className="text-xs text-[#7a9182] font-medium">
                Carga masiva de catálogo institucional de peligros estandarizados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-xl text-[#7a9182] hover:text-[#163522] hover:bg-[#eef7f0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Download Template */}
          <div className="p-4 rounded-2xl bg-[#f0f7ff] border border-[#d8eaff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-5 text-[#0284c7] shrink-0" />
              <div>
                <div className="text-xs font-black text-[#0369a1]">
                  ¿Tienes tu archivo en otro formato?
                </div>
                <div className="text-[11px] text-[#0284c7] font-medium">
                  Descarga la plantilla con las columnas estandarizadas de la GTC 45 y controles.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#e0f0fe] text-[#0369a1] border border-[#bae0fd] text-xs font-black transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Descargar Plantilla (.xlsx)</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#cfe0d5] hover:border-[#1F7D3E] bg-[#fbfdfb] hover:bg-[#f2f8f4] transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="size-14 rounded-2xl bg-[#eef7f0] group-hover:scale-105 transition-transform flex items-center justify-center text-[#1F7D3E] shadow-2xs border border-[#d6ebd9]">
              {parsing ? (
                <Loader2 className="size-7 animate-spin text-[#1F7D3E]" />
              ) : (
                <FileSpreadsheet className="size-7" />
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-[#163522]">
                {file ? file.name : 'Haz clic o arrastra tu archivo Excel aquí'}
              </h4>
              <p className="text-xs text-[#7a9182] font-medium">
                Soporta formatos <span className="font-bold text-[#163522]">.XLSX</span> o <span className="font-bold text-[#163522]">.XLS</span>
              </p>
            </div>
          </div>

          {/* Preview of Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="size-4 text-[#1F7D3E]" />
                  <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider">
                    Vista Previa de Registros ({parsedRows.length})
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#5e6b62]">Modo de carga:</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#163522] cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="merge"
                      checked={mode === 'merge'}
                      onChange={() => setMode('merge')}
                      className="accent-[#1F7D3E]"
                    />
                    <span>Combinar / Actualizar</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="replace"
                      checked={mode === 'replace'}
                      onChange={() => setMode('replace')}
                      className="accent-rose-600"
                    />
                    <span>Reemplazar catálogo</span>
                  </label>
                </div>
              </div>

              <div className="border border-[#dfe9e2] rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#f4f8f5] text-[#163522] font-black border-b border-[#dfe9e2]">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Clasificación</th>
                      <th className="px-3 py-2">Descripción del Peligro</th>
                      <th className="px-3 py-2 text-center">GTC 45 (ND×NE=NP)</th>
                      <th className="px-3 py-2 text-center">NR</th>
                      <th className="px-3 py-2">Controles Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8efe9]">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#fafcfa]">
                        <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#1F7D3E]">
                          {row.codigo || '—'}
                        </td>
                        <td className="px-3 py-2 font-black text-[#355244] uppercase text-[10px]">
                          {row.clasificacion}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#163522] max-w-xs truncate">
                          {row.descripcion}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-[#5e6b62]">
                          {row.nd ?? '—'} × {row.ne ?? '—'} = {row.np ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {row.nr ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#eef7f0] text-[#1F7D3E] border border-[#d6ebd9]">
                              {row.nr}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#5e6b62] max-w-xs truncate">
                          {row.controlFuente || row.fuente || row.controlMedio || row.medio || row.controlIndividuo || row.individuo || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[11px] text-[#7a9182] italic text-right">
                  Mostrando primeros 50 de {parsedRows.length} registros.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fcfdfc] border-t border-[#dfe9e2] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || importing || parsing}
            onClick={handleConfirmImport}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-sm shadow-[#1F7D3E]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            <span>Confirmar e Importar {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
