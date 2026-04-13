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
  descripcionActividad: string
  tareas: string
  cargo: string
  rutinario: string
  peligro: string
  clasificacion: string
  efectos: string
  controlFuente: string
  controlMedio: string
  controlIndividuo: string
  nd: number | null
  ne: number | null
  nc: number | null
  nivelProbabilidad: number | null
  interpretacionProbabilidad: string
  nivelRiesgo: number | null
  interpretacionNivelRiesgo: string
  valoracionRiesgo: string
  numeroExpuestos: number | null
  peorConsecuencia: string
  requisitoLegal: string
  eliminacion: string
  sustitucion: string
  controlesIngenieria: string
  controlesAdministrativos: string
  epp: string
  responsableIntervencion: string
  fechaEjecucion: string | null
}

type PreviewMetadata = {
  area: string
  responsable: string
  fechaElaboracion: string
  fechaActualizacion: string
}

type PreviewResponse = {
  importId: string
  totalRows: number
  validRows: number
  errors: PreviewError[]
  preview: PreviewRow[]
  metadata: PreviewMetadata
}

const PREVIEW_COLUMNS: Array<{ key: keyof PreviewRow; label: string }> = [
  { key: 'proceso', label: 'Proceso' },
  { key: 'zona', label: 'Zona / Lugar' },
  { key: 'actividad', label: 'Actividad' },
  { key: 'descripcionActividad', label: 'Descripción de la Actividad' },
  { key: 'tareas', label: 'Tareas' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'rutinario', label: 'Rutinario' },
  { key: 'peligro', label: 'Peligro' },
  { key: 'clasificacion', label: 'Clasificación del Peligro' },
  { key: 'efectos', label: 'Efectos Posibles' },
  { key: 'controlFuente', label: 'Control Fuente' },
  { key: 'controlMedio', label: 'Control Medio' },
  { key: 'controlIndividuo', label: 'Control Individuo' },
  { key: 'nd', label: 'ND' },
  { key: 'ne', label: 'NE' },
  { key: 'nivelProbabilidad', label: 'NP' },
  { key: 'interpretacionProbabilidad', label: 'Interpretación NP' },
  { key: 'nc', label: 'NC' },
  { key: 'nivelRiesgo', label: 'NR' },
  { key: 'interpretacionNivelRiesgo', label: 'Interpretación NR' },
  { key: 'valoracionRiesgo', label: 'Valoración del Riesgo' },
  { key: 'numeroExpuestos', label: 'N° Expuestos' },
  { key: 'peorConsecuencia', label: 'Peor Consecuencia' },
  { key: 'requisitoLegal', label: 'Requisito Legal' },
  { key: 'eliminacion', label: 'Eliminación' },
  { key: 'sustitucion', label: 'Sustitución' },
  { key: 'controlesIngenieria', label: 'Controles de Ingeniería' },
  { key: 'controlesAdministrativos', label: 'Controles Administrativos' },
  { key: 'epp', label: 'EPP' },
  { key: 'responsableIntervencion', label: 'Intervención' },
  { key: 'fechaEjecucion', label: 'Fecha de Ejecución' },
]

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
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-hidden p-0">
        <div className="p-6 overflow-y-auto max-h-[92vh]">
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
              {previewData.totalRows} filas encontradas, {previewData.errors.length} errores. Mostrando primeras {previewRows.length} filas con todas las columnas.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border rounded p-3 bg-slate-50">
              <div><span className="font-medium">Área / Proceso:</span> {previewData.metadata?.area || '—'}</div>
              <div><span className="font-medium">Responsable:</span> {previewData.metadata?.responsable || '—'}</div>
              <div><span className="font-medium">Fecha Elaboración:</span> {previewData.metadata?.fechaElaboracion || '—'}</div>
              <div><span className="font-medium">Fecha Actualización:</span> {previewData.metadata?.fechaActualizacion || '—'}</div>
            </div>

            {hasErrors && (
              <div className="text-sm p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
                Se detectaron errores en algunas filas. Solo se importarán las filas válidas.
              </div>
            )}

            <div className="overflow-auto border rounded max-h-[42vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {PREVIEW_COLUMNS.map((column) => (
                      <th key={column.key} className="text-left p-2 whitespace-nowrap">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {PREVIEW_COLUMNS.map((column) => {
                        const value = row[column.key]
                        return <td key={column.key} className="p-2 whitespace-nowrap">{value ?? ''}</td>
                      })}
                    </tr>
                  ))}
                  {previewRows.length === 0 && (
                    <tr>
                      <td colSpan={PREVIEW_COLUMNS.length} className="p-4 text-center text-slate-500">No hay filas válidas para previsualizar.</td>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
