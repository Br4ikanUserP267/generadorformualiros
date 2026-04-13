"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/utils'

type PreviewError = {
  row: number
  field: string
  message: string
}

type PreviewRow = {
  proceso: string
  zona: string
  actividad: string
  peligro: string
  clasificacion: string
  efectos: string
  nd: number | null
  ne: number | null
  nc: number | null
}

type PreviewResponse = {
  importId: string
  totalRows: number
  validRows: number
  errors: PreviewError[]
  preview: PreviewRow[]
}

type Step = 'upload' | 'preview' | 'result'

export function ImportMatrizModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultError, setResultError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(true)
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [createdMatrizId, setCreatedMatrizId] = useState<string | null>(null)

  const hasErrors = useMemo(() => (previewData?.errors?.length || 0) > 0, [previewData])

  function resetState() {
    setStep('upload')
    setIsLoading(false)
    setError(null)
    setResultError(null)
    setShowErrors(true)
    setPreviewData(null)
    setCreatedMatrizId(null)
  }

  async function uploadFile(file: File) {
    const ext = file.name.toLowerCase()
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      setError('Solo se permiten archivos .xlsx o .xls')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await apiFetch('/api/riesgos/import/preview', {
        method: 'POST',
        body: formData,
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = body?.error || 'Error procesando archivo'
        const missing = Array.isArray(body?.missing) && body.missing.length > 0
          ? ` (${body.missing.join(', ')})`
          : ''
        throw new Error(msg + missing)
      }

      setPreviewData(body as PreviewResponse)
      setStep('preview')
    } catch (e: any) {
      setError(e?.message || 'No se pudo procesar el archivo')
    } finally {
      setIsLoading(false)
    }
  }

  async function confirmImport() {
    if (!previewData?.importId) return

    setResultError(null)
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/riesgos/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: previewData.importId }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.details || body?.error || 'Error importando matriz')
      }

      setCreatedMatrizId(body.id)
      setStep('result')
    } catch (e: any) {
      setResultError(e?.message || 'Error importando matriz')
      setStep('result')
    } finally {
      setIsLoading(false)
    }
  }

  const previewRows = previewData?.preview || []

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetState()
      }}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar matriz desde Excel</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) uploadFile(file)
              }}
            >
              <div className="text-sm text-slate-600">Arrastra y suelta tu archivo .xlsx/.xls aquí</div>
              <div className="text-xs text-slate-500 mt-1">o selecciónalo desde tu equipo</div>
              <div className="mt-4 flex justify-center">
                <label className="inline-flex items-center">
                  <Input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file)
                    }}
                  />
                  <span className="px-4 py-2 rounded-md bg-[#2d7a40] text-white cursor-pointer">Seleccionar archivo</span>
                </label>
              </div>

              {isLoading && <div className="mt-4 text-sm text-slate-600">Cargando y validando archivo...</div>}
              {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
            </div>

          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              {previewData.totalRows} filas encontradas, {previewData.errors.length} errores.
            </div>

            {hasErrors && (
              <div className="text-sm p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
                Se detectaron errores en algunas filas. Solo se importarán las filas válidas.
              </div>
            )}

            <div className="overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Proceso</th>
                    <th className="text-left p-2">Zona</th>
                    <th className="text-left p-2">Actividad</th>
                    <th className="text-left p-2">Peligro</th>
                    <th className="text-left p-2">Clasificación</th>
                    <th className="text-left p-2">Efectos</th>
                    <th className="text-left p-2">ND</th>
                    <th className="text-left p-2">NE</th>
                    <th className="text-left p-2">NC</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{row.proceso}</td>
                      <td className="p-2">{row.zona}</td>
                      <td className="p-2">{row.actividad}</td>
                      <td className="p-2">{row.peligro}</td>
                      <td className="p-2">{row.clasificacion}</td>
                      <td className="p-2">{row.efectos}</td>
                      <td className="p-2">{row.nd ?? ''}</td>
                      <td className="p-2">{row.ne ?? ''}</td>
                      <td className="p-2">{row.nc ?? ''}</td>
                    </tr>
                  ))}
                  {previewRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-500">No hay filas válidas para previsualizar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border rounded">
              <button
                className="w-full text-left px-3 py-2 text-sm bg-slate-50"
                onClick={() => setShowErrors((s) => !s)}
              >
                Errores por fila ({previewData.errors.length})
              </button>
              {showErrors && (
                <div className="max-h-40 overflow-auto p-3 text-sm">
                  {previewData.errors.length === 0 ? (
                    <div className="text-slate-500">Sin errores.</div>
                  ) : (
                    <ul className="space-y-1">
                      {previewData.errors.map((e, idx) => (
                        <li key={`${e.row}-${e.field}-${idx}`}>
                          Fila {e.row}: {e.message} ({e.field})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>Cancelar</Button>
              <Button onClick={confirmImport} disabled={isLoading || previewData.validRows === 0}>
                {isLoading ? 'Importando...' : 'Confirmar importación'}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            {!resultError && createdMatrizId ? (
              <>
                <div className="text-sm text-green-700">Matriz importada correctamente.</div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetState}>Cerrar</Button>
                  <Button
                    onClick={() => {
                      onOpenChange(false)
                      resetState()
                      router.push(`/matriz/${createdMatrizId}`)
                    }}
                  >
                    Ver matriz
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-red-600">{resultError || 'Ocurrió un error durante la importación.'}</div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetState}>Volver</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
