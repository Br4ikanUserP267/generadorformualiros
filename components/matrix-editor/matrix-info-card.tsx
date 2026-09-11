"use client"

import React, { useState, useEffect } from 'react'
import {
  Building2,
  User,
  Calendar,
  Clock,
  Pencil,
  Check,
  X,
  FileSpreadsheet,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MatrixInfoCardProps {
  matrix: {
    id: string
    area?: string
    responsable?: string
    fecha_elaboracion?: string
    fecha_actualizacion?: string
  }
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  onUpdateGeneralInfo: (data: { area: string; responsable: string; fecha_elaboracion: string }) => void
  onExport: () => void
  onSave: () => void
}

function formatDateDisplay(value: string | undefined) {
  if (!value) return 'Sin fecha'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return value
}

function parseDateDisplay(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return ''
  }
  return `${year}-${month}-${day}`
}

export function MatrixInfoCard({
  matrix,
  isSaving = false,
  hasUnsavedChanges = false,
  onUpdateGeneralInfo,
  onExport,
  onSave,
}: MatrixInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftArea, setDraftArea] = useState(matrix.area || '')
  const [draftResponsable, setDraftResponsable] = useState(matrix.responsable || '')
  const [draftFechaElab, setDraftFechaElab] = useState(matrix.fecha_elaboracion || '')
  const [displayDate, setDisplayDate] = useState(() => formatDateDisplay(matrix.fecha_elaboracion))

  // Sync draft values when matrix prop updates or edit mode toggles
  useEffect(() => {
    setDraftArea(matrix.area || '')
    setDraftResponsable(matrix.responsable || '')
    setDraftFechaElab(matrix.fecha_elaboracion || '')
    setDisplayDate(formatDateDisplay(matrix.fecha_elaboracion))
  }, [matrix.area, matrix.responsable, matrix.fecha_elaboracion, isEditing])

  const handleSave = () => {
    onUpdateGeneralInfo({
      area: draftArea.trim(),
      responsable: draftResponsable.trim(),
      fecha_elaboracion: draftFechaElab,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraftArea(matrix.area || '')
    setDraftResponsable(matrix.responsable || '')
    setDraftFechaElab(matrix.fecha_elaboracion || '')
    setDisplayDate(formatDateDisplay(matrix.fecha_elaboracion))
    setIsEditing(false)
  }

  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 sm:p-5 shadow-2xs transition-all space-y-4">
      {/* Top Header Row: Section Label & Title on Left, Actions + Edit on Right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#edf2ed]">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-lg bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
              <Building2 className="size-3" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5e6b62]">
              Información de la matriz
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-[#163522] tracking-tight">
              {matrix.area || 'Nueva Matriz de Riesgos'}
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Activa
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="rounded-xl text-xs font-bold text-[#5e6b62] hover:bg-[#f4f8f5] h-9 px-3.5"
            >
              <X className="size-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black h-9 px-4 shadow-sm"
            >
              <Check className="size-4 mr-1" />
              Guardar Cambios
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-start lg:self-center shrink-0">
            {/* Edit Icon Button */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="size-9 rounded-xl border border-[#d1e2d6] bg-[#fbfdfb] hover:bg-[#eef7f0] hover:border-[#1F7D3E] text-[#1F7D3E] flex items-center justify-center shadow-xs transition-all"
              title="Editar información de la matriz"
              aria-label="Editar información de la matriz"
            >
              <Pencil className="size-4" />
            </button>

            {/* Save Status */}
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Cambios sin guardar</span>
                <span className="sm:hidden">Sin guardar</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F7D3E] bg-[#eef7f0] px-2.5 py-1.5 rounded-xl border border-[#d1e2d6]">
                <CheckCircle2 className="size-3.5 text-[#1F7D3E]" />
                Guardado
              </span>
            )}

            {/* Export Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onExport}
              className="rounded-xl border-[#d1e2d6] text-[#1F7D3E] hover:bg-[#f0f9f1] hover:border-[#1F7D3E] font-bold text-xs h-9 px-3 sm:px-3.5 shadow-xs"
            >
              <FileSpreadsheet className="size-4 mr-1.5" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Excel</span>
            </Button>

            {/* Save Matrix Primary Button */}
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white font-black text-xs h-9 px-3.5 sm:px-4 shadow-md shadow-[#1F7D3E]/20 transition-all"
            >
              <Save className="size-4 mr-1.5" />
              {isSaving ? 'Guardando...' : 'Guardar Matriz'}
            </Button>
          </div>
        )}
      </div>

      {/* Content: READ MODE vs EDIT MODE */}
      {isEditing ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Nombre de la Matriz / Área */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-[11px] font-bold text-[#5e6b62] uppercase tracking-wider block">
                Nombre de la Matriz / Área
              </label>
              <Input
                value={draftArea}
                onChange={(e) => setDraftArea(e.target.value)}
                placeholder="Ej: UCI DIVINA MISERICORDIA - PEDIÁTRICA"
                className="h-9 text-xs font-bold text-[#163522] rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white"
                autoFocus
              />
            </div>

            {/* Responsable */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#5e6b62] uppercase tracking-wider block">
                Responsable
              </label>
              <Input
                value={draftResponsable}
                onChange={(e) => setDraftResponsable(e.target.value)}
                placeholder="Ej: Erika Novoa Hernandez"
                className="h-9 text-xs font-bold text-[#163522] rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white"
              />
            </div>

            {/* Fecha Elaboración */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#5e6b62] uppercase tracking-wider block">
                Fecha de Elaboración
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                value={displayDate}
                onChange={(e) => {
                  const nextValue = e.target.value.replace(/[^\d/]/g, '').slice(0, 10)
                  setDisplayDate(nextValue)
                  const parsedValue = parseDateDisplay(nextValue)
                  if (parsedValue) setDraftFechaElab(parsedValue)
                }}
                onBlur={() => setDisplayDate(formatDateDisplay(draftFechaElab))}
                className="h-9 text-xs font-bold text-[#163522] rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#7a9182]">
            * La fecha de última actualización ({formatDateDisplay(matrix.fecha_actualizacion)}) se actualiza automáticamente al guardar cambios en la matriz.
          </p>
        </div>
      ) : (
        /* 3-Column Horizontal Metadata Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Responsable */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-3 flex items-center gap-3">
            <span className="size-8.5 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
              <User className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Responsable
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#163522] truncate" title={matrix.responsable || 'Sin asignar'}>
                {matrix.responsable || 'Sin asignar'}
              </div>
            </div>
          </div>

          {/* Fecha Elaboración */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-3 flex items-center gap-3">
            <span className="size-8.5 rounded-xl bg-[#fef9c3] text-[#ca8a04] flex items-center justify-center shrink-0">
              <Calendar className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Fecha de Elaboración
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#163522]">
                {formatDateDisplay(matrix.fecha_elaboracion)}
              </div>
            </div>
          </div>

          {/* Última Actualización */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-3 flex items-center gap-3 sm:col-span-2 lg:col-span-1">
            <span className="size-8.5 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
              <Clock className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Última Actualización
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#1F7D3E]">
                  {formatDateDisplay(matrix.fecha_actualizacion)}
                </span>
                <span className="text-[10px] text-[#7a9182] font-medium hidden xs:inline">
                  (Automática)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
