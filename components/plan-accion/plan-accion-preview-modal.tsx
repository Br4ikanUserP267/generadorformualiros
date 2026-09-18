"use client"

import React from 'react'
import {
  X,
  ClipboardList,
  Calendar,
  User,
  MapPin,
  HelpCircle,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Flame,
} from 'lucide-react'
import { getClasificacionStyle } from '@/lib/gtc45-utils'

interface PlanAccionPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  danger: any | null
  onEdit?: () => void
}

export function PlanAccionPreviewModal({
  open,
  onOpenChange,
  danger,
  onEdit,
}: PlanAccionPreviewModalProps) {
  if (!open || !danger) return null

  const badgeStyle = getClasificacionStyle(danger.clasificacion || '')
  const actions: any[] = danger.planesAccion || []

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
        {/* Header */}
        <header className="px-6 py-3.5 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
              <ClipboardList className="size-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full inline-block">
                PLAN DE ACCIÓN 5W2H REGISTRADO
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#163522] tracking-tight truncate">
                {danger.descripcion}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#7a9182] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Danger Badges Bar */}
        <div className="px-6 py-2.5 bg-[#fbfdfb] border-b border-[#dfe9e2] flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {danger.codigo && (
              <span className="font-mono font-black text-[#5a7c65] bg-[#f2f6f3] border border-[#dfe9e2] px-2 py-0.5 rounded-md text-[10.5px]">
                {danger.codigo}
              </span>
            )}
            <span
              className="px-2.5 py-0.5 rounded-lg font-black text-[11px] border"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                borderColor: badgeStyle.border,
              }}
            >
              {danger.clasificacion}
            </span>
            {danger.interpRiesgo && (
              <span className="px-2.5 py-0.5 rounded-lg font-black text-[11px] bg-red-50 text-red-700 border border-red-200">
                GTC 45: Nivel {danger.interpRiesgo} {danger.aceptabilidad ? `(${danger.aceptabilidad})` : ''}
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-[#163522]">
            {actions.length} {actions.length === 1 ? 'acción' : 'acciones'} registradas
          </span>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-4 max-h-[62vh]">
          {actions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[#dfe9e2] bg-[#fcfdfc] space-y-2">
              <Clock className="size-8 text-[#7a9182] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#163522]">No hay acciones 5W2H registradas para este peligro aún.</p>
              <p className="text-[11px] text-[#7a9182]">Puedes crear el plan de acción desde el módulo de Plan de Acción o haciendo clic en Editar.</p>
            </div>
          ) : (
            actions.map((act, index) => (
              <div
                key={act.id || index}
                className="p-4 rounded-2xl border border-[#dfe9e2] bg-[#fcfdfc] space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#eef3f0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-md bg-[#1F7D3E] text-white flex items-center justify-center text-[10.5px] font-black">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-[#163522]">{act.que}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {act.porQue && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿POR QUÉ?</span>
                      <span className="text-[#163522] font-medium">{act.porQue}</span>
                    </div>
                  )}

                  {act.donde && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿DÓNDE?</span>
                      <span className="text-[#163522] font-medium">{act.donde}</span>
                    </div>
                  )}

                  {(act.cuandoInicio || act.cuandoFin) && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿CUÁNDO?</span>
                      <span className="text-[#163522] font-medium">
                        {act.cuandoInicio ? act.cuandoInicio.split('T')[0] : '—'} hasta {act.cuandoFin ? act.cuandoFin.split('T')[0] : '—'}
                      </span>
                    </div>
                  )}

                  {act.responsable && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿QUIÉN?</span>
                      <span className="text-[#163522] font-medium">{act.responsable}</span>
                    </div>
                  )}

                  {act.como && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿CÓMO?</span>
                      <span className="text-[#163522] font-medium">{act.como}</span>
                    </div>
                  )}

                  {act.cuanto && (
                    <div>
                      <span className="text-[10px] font-black text-[#7a9182] block">¿CUÁNTO?</span>
                      <span className="text-[#163522] font-medium">{act.cuanto}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 bg-[#fcfdfc] border-t border-[#dfe9e2] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#5e6b62] text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onEdit()
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <span>Editar Plan 5W2H</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
