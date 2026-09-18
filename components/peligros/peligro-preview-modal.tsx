"use client"

import React from 'react'
import {
  X,
  Flame,
  Shield,
  Calculator,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  FileText,
  Building,
} from 'lucide-react'
import {
  interpProbabilidad,
  interpNivelRiesgo,
  normalizeClasificacion,
  getClasificacionStyle,
} from '@/lib/gtc45-utils'

interface PeligroPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peligro: any | null
}

export function PeligroPreviewModal({
  open,
  onOpenChange,
  peligro,
}: PeligroPreviewModalProps) {
  if (!open || !peligro) return null

  const probInfo = interpProbabilidad(Number(peligro.nivelProbabilidad || 0))
  const riskInfo = interpNivelRiesgo(Number(peligro.nivelRiesgo || 0))
  const matricesCount = peligro._count?.peligrosMatriz || 0

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
              <Flame className="size-5.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {peligro.codigo && (
                  <span className="font-mono text-[11px] font-black text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2 py-0.5 rounded-md">
                    {peligro.codigo}
                  </span>
                )}
                {(() => {
                  const style = getClasificacionStyle(peligro.clasificacion)
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} border ${style.border} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider`}
                    >
                      <span className={`size-1.5 rounded-full ${style.dot}`} />
                      <span>{normalizeClasificacion(peligro.clasificacion)}</span>
                      <span className="text-[9px] opacity-75 font-mono">[{style.prefix}]</span>
                    </span>
                  )
                })()}
                {riskInfo.label && (
                  <span
                    className="text-[10px] font-black text-white px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: riskInfo.color }}
                  >
                    NR: {peligro.nivelRiesgo} • {riskInfo.label}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#163522] tracking-tight truncate mt-0.5">
                Vista Previa del Peligro
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#7a9182] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="size-4.5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[#fcfdfc]">
          {/* Section 1: Descripción y Efectos */}
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
              <FileText className="size-4" />
              <span>Identificación del Peligro</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182] block mb-1">
                  Descripción
                </label>
                <div className="text-sm font-bold text-[#163522] leading-relaxed bg-[#fbfdfb] p-3.5 rounded-xl border border-[#e2ece5]">
                  {peligro.descripcion}
                </div>
              </div>

              {peligro.efectosPosibles && (
                <div>
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182] block mb-1">
                    Efectos Posibles en la Salud
                  </label>
                  <div className="text-xs font-medium text-[#355244] leading-relaxed bg-[#fbfdfb] p-3 rounded-xl border border-[#e2ece5]">
                    {peligro.efectosPosibles}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Controles Base Existentes */}
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
              <Shield className="size-4" />
              <span>Controles Base Existentes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-[#fbfdfb] border border-[#e2ece5] space-y-1">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#2c4033]">
                  En la Fuente
                </span>
                <p className="text-xs font-medium text-[#163522] leading-relaxed">
                  {peligro.controlFuente || 'No especificado (Ninguno)'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#fbfdfb] border border-[#e2ece5] space-y-1">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#2c4033]">
                  En el Medio
                </span>
                <p className="text-xs font-medium text-[#163522] leading-relaxed">
                  {peligro.controlMedio || 'No especificado (Ninguno)'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#fbfdfb] border border-[#e2ece5] space-y-1">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#2c4033]">
                  En el Individuo
                </span>
                <p className="text-xs font-medium text-[#163522] leading-relaxed">
                  {peligro.controlIndividuo || 'No especificado (Ninguno)'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Evaluación Inicial GTC 45 */}
          <div className="rounded-2xl border border-[#dfe9e2] bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
              <Calculator className="size-4" />
              <span>Evaluación Inicial GTC 45 (Antes de Intervención)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2]">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">ND</div>
                <div className="text-lg font-black text-[#163522]">{peligro.nivelDeficiencia ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2]">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">NE</div>
                <div className="text-lg font-black text-[#163522]">{peligro.nivelExposicion ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2]">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">NP (ND×NE)</div>
                <div className="text-lg font-black text-[#1F7D3E]">{peligro.nivelProbabilidad ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2]">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">NC</div>
                <div className="text-lg font-black text-[#163522]">{peligro.nivelConsecuencia ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2]">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">NR (NP×NC)</div>
                <div className="text-lg font-black text-[#163522]">{peligro.nivelRiesgo ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#dfe9e2] col-span-2 sm:col-span-2">
                <div className="text-[9.5px] font-black text-[#7a9182] uppercase">Aceptabilidad</div>
                <div
                  className="text-xs font-black px-2 py-1 rounded-lg text-white mt-1"
                  style={{ backgroundColor: riskInfo.color || '#1F7D3E' }}
                >
                  {peligro.aceptabilidad || riskInfo.label || 'Aceptable'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Criterios e Intervención */}
          {(peligro.eliminacion ||
            peligro.sustitucion ||
            peligro.controlesIngenieria ||
            peligro.controlesAdministrativos ||
            peligro.epp ||
            peligro.peorConsecuencia) && (
            <div className="rounded-2xl border border-[#dfe9e2] bg-white p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
                <Sliders className="size-4" />
                <span>Medidas de Intervención Recomendadas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {peligro.eliminacion && (
                  <div className="p-3 rounded-xl bg-[#fbfdfb] border border-[#e2ece5]">
                    <strong className="text-[#163522] block font-black mb-0.5">Eliminación:</strong>
                    <span className="text-[#355244]">{peligro.eliminacion}</span>
                  </div>
                )}
                {peligro.sustitucion && (
                  <div className="p-3 rounded-xl bg-[#fbfdfb] border border-[#e2ece5]">
                    <strong className="text-[#163522] block font-black mb-0.5">Sustitución:</strong>
                    <span className="text-[#355244]">{peligro.sustitucion}</span>
                  </div>
                )}
                {peligro.controlesIngenieria && (
                  <div className="p-3 rounded-xl bg-[#fbfdfb] border border-[#e2ece5]">
                    <strong className="text-[#163522] block font-black mb-0.5">Controles de Ingeniería:</strong>
                    <span className="text-[#355244]">{peligro.controlesIngenieria}</span>
                  </div>
                )}
                {peligro.controlesAdministrativos && (
                  <div className="p-3 rounded-xl bg-[#fbfdfb] border border-[#e2ece5]">
                    <strong className="text-[#163522] block font-black mb-0.5">Controles Administrativos:</strong>
                    <span className="text-[#355244]">{peligro.controlesAdministrativos}</span>
                  </div>
                )}
                {peligro.epp && (
                  <div className="p-3 rounded-xl bg-[#fbfdfb] border border-[#e2ece5] sm:col-span-2">
                    <strong className="text-[#163522] block font-black mb-0.5">EPP Recomendado:</strong>
                    <span className="text-[#355244]">{peligro.epp}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Estadísticas de Uso */}
          {matricesCount > 0 && (
            <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#d6ebd9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="size-5 text-[#1F7D3E]" />
                <div>
                  <div className="text-xs font-black text-[#163522]">
                    Utilizado en la Institución
                  </div>
                  <div className="text-[11px] text-[#355244]">
                    Este peligro estándar se encuentra incorporado en {matricesCount} {matricesCount === 1 ? 'actividad de matrices de riesgo' : 'actividades de matrices de riesgo'}.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 bg-white border-t border-[#dfe9e2] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black transition-all cursor-pointer shadow-sm shadow-[#1F7D3E]/20"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}
