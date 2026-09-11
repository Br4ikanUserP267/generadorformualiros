"use client"

import React, { useState } from 'react'
import {
  FileText,
  User,
  RotateCcw,
  ListTodo,
  Trash2,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface ActivityHeaderProps {
  activity: {
    id: string
    nombre: string
    descripcion?: string
    tareas?: string
    cargo?: string
    rutinario?: boolean
    peligros?: any[]
  }
  activityIndex?: number
  matrixArea?: string
  procesoNombre?: string
  zonaNombre?: string
  tasksCount: number
  onUpdateField: (field: string, value: any) => void
  onDeleteActivity: () => void
}

export function ActivityHeader({
  activity,
  activityIndex = 0,
  matrixArea = '',
  procesoNombre = '',
  zonaNombre = '',
  tasksCount = 0,
  onUpdateField,
  onDeleteActivity,
}: ActivityHeaderProps) {
  const [isEditingCargo, setIsEditingCargo] = useState(false)
  const [cargoDraft, setCargoDraft] = useState(activity.cargo || '')

  const handleSaveCargo = () => {
    onUpdateField('cargo', cargoDraft.trim())
    setIsEditingCargo(false)
  }

  const handleCancelCargo = () => {
    setCargoDraft(activity.cargo || '')
    setIsEditingCargo(false)
  }

  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Icon + Title + Breadcrumb */}
        <div className="flex items-start gap-3.5 min-w-0">
          <span className="size-10 rounded-2xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d1e2d6] mt-0.5">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#163522] tracking-tight">
                Actividad {activityIndex + 1}: {activity.nombre || 'Sin nombre'}
              </h2>
              <span className="inline-flex items-center rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                Activa
              </span>
            </div>
            <div className="text-xs text-[#7a9182] font-medium flex items-center gap-1.5 truncate">
              <span className="truncate">{matrixArea || 'Matriz'}</span>
              <span>›</span>
              <span className="truncate">{procesoNombre || 'Proceso'}</span>
              <span>›</span>
              <span className="font-semibold text-[#355244] truncate">{zonaNombre || 'Zona'}</span>
            </div>
          </div>
        </div>

        {/* Right: Cargo, Rutinario, Tareas count + Delete Action */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap self-start lg:self-center">
          {/* Cargo Box */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-2 sm:px-3 sm:py-1.5 flex items-center gap-2">
            <span className="size-7 rounded-lg bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
              <User className="size-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Cargo
              </div>
              {isEditingCargo ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    value={cargoDraft}
                    onChange={(e) => setCargoDraft(e.target.value)}
                    placeholder="Ej: Enfermero coordinador"
                    className="h-7 text-xs font-bold text-[#163522] w-36 px-1.5 rounded-lg border-[#d1e2d6] bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCargo()
                      if (e.key === 'Escape') handleCancelCargo()
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCargo}
                    className="p-1 rounded bg-[#1F7D3E] text-white hover:bg-[#186331]"
                    title="Guardar cargo"
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCargo}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                    title="Cancelar"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCargoDraft(activity.cargo || '')
                    setIsEditingCargo(true)
                  }}
                  className="text-xs font-bold text-[#163522] hover:text-[#1F7D3E] flex items-center gap-1 group transition-colors"
                  title="Clic para editar cargo"
                >
                  <span className="truncate max-w-[140px]">
                    {activity.cargo || 'Sin cargo'}
                  </span>
                  <Pencil className="size-2.5 opacity-0 group-hover:opacity-100 text-[#1F7D3E] transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* Rutinario Toggle Box */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-2 sm:px-3 sm:py-1.5 flex items-center gap-2.5">
            <span className="size-7 rounded-lg bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
              <RotateCcw className="size-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Rutinario
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Switch
                  checked={!!activity.rutinario}
                  onCheckedChange={(v) => onUpdateField('rutinario', v)}
                  className="data-[state=checked]:bg-[#1F7D3E] scale-75 origin-left"
                />
                <span className="text-xs font-bold text-[#163522]">
                  {activity.rutinario ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Tareas Count Box */}
          <div className="rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] p-2 sm:px-3 sm:py-1.5 flex items-center gap-2">
            <span className="size-7 rounded-lg bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center shrink-0">
              <ListTodo className="size-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-[#7a9182] uppercase tracking-wider">
                Tareas
              </div>
              <div className="text-xs font-bold text-[#163522]">
                {tasksCount} {tasksCount === 1 ? 'tarea registrada' : 'tareas registradas'}
              </div>
            </div>
          </div>

          {/* Delete Activity Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onDeleteActivity}
            className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold h-9 px-2.5"
            title="Eliminar esta actividad"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
