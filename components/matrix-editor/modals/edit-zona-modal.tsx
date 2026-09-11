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
import { MapPin } from 'lucide-react'

interface EditZonaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zona: { id?: string; nombre?: string } | null
  onSave: (name: string) => void
}

export function EditZonaModal({
  open,
  onOpenChange,
  zona,
  onSave,
}: EditZonaModalProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName(zona?.nombre || '')
    }
  }, [open, zona])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim())
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-white rounded-2xl border border-[#dbe8de] p-6 shadow-xl">
        <DialogHeader className="pb-3 border-b border-[#edf2ed]">
          <DialogTitle className="text-base font-black text-[#163522] flex items-center gap-2">
            <MapPin className="size-4.5 text-[#0d9488]" />
            <span>{zona ? 'Editar Zona / Lugar' : 'Nueva Zona / Lugar'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
              Nombre de la Zona o Lugar
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Estar De Enfermería / Estar Médico, Cuarto de Preparación..."
              className="h-10 rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white text-sm font-semibold text-[#163522]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf2ed]">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold text-[#5e6b62]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-xs font-black text-white px-5 shadow-sm"
            >
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
