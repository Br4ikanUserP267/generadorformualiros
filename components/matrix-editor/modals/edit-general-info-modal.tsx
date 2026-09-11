"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Building2, User, Calendar } from 'lucide-react'

interface EditGeneralInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  area: string
  responsable: string
  fechaElaboracion: string
  onSave: (data: { area: string; responsable: string; fecha_elaboracion: string }) => void
}

function formatDateDisplay(value: string) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
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

export function EditGeneralInfoModal({
  open,
  onOpenChange,
  area,
  responsable,
  fechaElaboracion,
  onSave,
}: EditGeneralInfoModalProps) {
  const [localArea, setLocalArea] = useState(area)
  const [localResponsable, setLocalResponsable] = useState(responsable)
  const [localFechaElab, setLocalFechaElab] = useState(fechaElaboracion)
  const [displayDate, setDisplayDate] = useState(() => formatDateDisplay(fechaElaboracion))

  useEffect(() => {
    if (open) {
      setLocalArea(area || '')
      setLocalResponsable(responsable || '')
      setLocalFechaElab(fechaElaboracion || '')
      setDisplayDate(formatDateDisplay(fechaElaboracion || ''))
    }
  }, [open, area, responsable, fechaElaboracion])

  const handleSave = () => {
    onSave({
      area: localArea.trim(),
      responsable: localResponsable.trim(),
      fecha_elaboracion: localFechaElab,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl border border-[#dbe8de] p-6 shadow-xl">
        <DialogHeader className="pb-3 border-b border-[#edf2ed]">
          <DialogTitle className="text-base font-black text-[#163522] flex items-center gap-2">
            <Building2 className="size-4.5 text-[#1F7D3E]" />
            <span>Editar Información General de la Matriz</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Área / Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="size-3.5 text-[#1F7D3E]" />
              Área / Proceso
            </label>
            <Input
              value={localArea}
              onChange={(e) => setLocalArea(e.target.value)}
              placeholder="Ej: UCI DIVINA MISERICORDIA - PEDIÁTRICA"
              className="h-10 rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white text-sm font-semibold text-[#163522] focus:ring-[#1F7D3E]/20"
            />
          </div>

          {/* Responsable */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-[#0284c7]" />
              Responsable
            </label>
            <Input
              value={localResponsable}
              onChange={(e) => setLocalResponsable(e.target.value)}
              placeholder="Ej: Erika Novoa Hernandez"
              className="h-10 rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white text-sm font-semibold text-[#163522] focus:ring-[#1F7D3E]/20"
            />
          </div>

          {/* Fecha Elaboración */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#ca8a04]" />
              Fecha de Elaboración
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={displayDate}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/[^\d/]/g, '').slice(0, 10)
                setDisplayDate(nextValue)
                const parsedValue = parseDateDisplay(nextValue)
                if (parsedValue) setLocalFechaElab(parsedValue)
              }}
              onBlur={() => setDisplayDate(formatDateDisplay(localFechaElab))}
              className="h-10 rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white text-sm font-semibold text-[#163522] focus:ring-[#1F7D3E]/20"
            />
          </div>

          <p className="text-[11px] text-[#7a9182] pt-1">
            * La fecha de última actualización se calcula automáticamente cada vez que se guarda la matriz.
          </p>

          <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-[#edf2ed]">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold text-[#5e6b62] hover:bg-[#f4f8f5]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-xs font-black text-white px-5 shadow-sm"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
