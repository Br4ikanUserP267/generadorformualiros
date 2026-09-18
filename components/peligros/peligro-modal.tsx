"use client"

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Loader2,
  Flame,
  Shield,
  Calculator,
  Sliders,
  AlertTriangle,
  Info,
  Tag,
} from 'lucide-react'
import {
  CLASIFICACIONES_RIESGO,
  calculateGtc45,
  interpProbabilidad,
  interpNivelRiesgo,
} from '@/lib/gtc45-utils'
import { apiFetch } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ClasificacionCombobox } from './clasificacion-combobox'

interface PeligroModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peligro?: any | null
  onSaved: () => void
}

export function PeligroModal({
  open,
  onOpenChange,
  peligro,
  onSaved,
}: PeligroModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  // Form State
  const [codigo, setCodigo] = useState('')
  const [generatingCode, setGeneratingCode] = useState(false)
  const [clasificacion, setClasificacion] = useState('BIOLÓGICO')
  const [descripcion, setDescripcion] = useState('')
  const [efectosPosibles, setEfectosPosibles] = useState('')

  const [controlFuente, setControlFuente] = useState('')
  const [controlMedio, setControlMedio] = useState('')
  const [controlIndividuo, setControlIndividuo] = useState('')

  // GTC 45 Evaluation
  const [nivelDeficiencia, setNivelDeficiencia] = useState<number | ''>('')
  const [nivelExposicion, setNivelExposicion] = useState<number | ''>('')
  const [nivelConsecuencia, setNivelConsecuencia] = useState<number | ''>('')

  // Criteria & Intervention
  const [numExpuestos, setNumExpuestos] = useState<number | ''>('')
  const [peorConsecuencia, setPeorConsecuencia] = useState('')
  const [requisitoLegal, setRequisitoLegal] = useState(false)

  const [eliminacion, setEliminacion] = useState('')
  const [sustitucion, setSustitucion] = useState('')
  const [controlesIngenieria, setControlesIngenieria] = useState('')
  const [controlesAdministrativos, setControlesAdministrativos] = useState('')
  const [epp, setEpp] = useState('')

  const generateCodeForClasificacion = async (targetClasif: string) => {
    if (!targetClasif) return
    try {
      setGeneratingCode(true)
      const res = await apiFetch(`/api/peligros/next-code?clasificacion=${encodeURIComponent(targetClasif)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.nextCode) {
          setCodigo(data.nextCode)
        }
      }
    } catch (err) {
      console.error('Error generating auto code:', err)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleClasificacionChange = (newClasif: string) => {
    setClasificacion(newClasif)
    if (!peligro) {
      generateCodeForClasificacion(newClasif)
    }
  }

  useEffect(() => {
    if (peligro) {
      setCodigo(peligro.codigo || '')
      setClasificacion(peligro.clasificacion || 'BIOLÓGICO')
      setDescripcion(peligro.descripcion || '')
      setEfectosPosibles(peligro.efectosPosibles || '')
      setControlFuente(peligro.controlFuente || '')
      setControlMedio(peligro.controlMedio || '')
      setControlIndividuo(peligro.controlIndividuo || '')
      setNivelDeficiencia(peligro.nivelDeficiencia ?? '')
      setNivelExposicion(peligro.nivelExposicion ?? '')
      setNivelConsecuencia(peligro.nivelConsecuencia ?? '')
      setNumExpuestos(peligro.numExpuestos ?? '')
      setPeorConsecuencia(peligro.peorConsecuencia || '')
      setRequisitoLegal(Boolean(peligro.requisitoLegal))
      setEliminacion(peligro.eliminacion || '')
      setSustitucion(peligro.sustitucion || '')
      setControlesIngenieria(peligro.controlesIngenieria || '')
      setControlesAdministrativos(peligro.controlesAdministrativos || '')
      setEpp(peligro.epp || '')
    } else {
      setClasificacion('BIOLÓGICO')
      setDescripcion('')
      setEfectosPosibles('')
      setControlFuente('')
      setControlMedio('')
      setControlIndividuo('')
      setNivelDeficiencia('')
      setNivelExposicion('')
      setNivelConsecuencia('')
      setNumExpuestos('')
      setPeorConsecuencia('')
      setRequisitoLegal(false)
      setEliminacion('')
      setSustitucion('')
      setControlesIngenieria('')
      setControlesAdministrativos('')
      setEpp('')
      if (open) {
        generateCodeForClasificacion('BIOLÓGICO')
      }
    }
    setActiveTab(0)
  }, [peligro, open])

  // Real-time calculation
  const ndNum = nivelDeficiencia === '' ? null : Number(nivelDeficiencia)
  const neNum = nivelExposicion === '' ? null : Number(nivelExposicion)
  const ncNum = nivelConsecuencia === '' ? null : Number(nivelConsecuencia)
  const evalCalc = calculateGtc45(ndNum, neNum, ncNum)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) {
      toast({
        title: 'Campo Requerido',
        description: 'La descripción del peligro es obligatoria.',
        variant: 'destructive',
      })
      setActiveTab(0)
      return
    }

    setSaving(true)
    try {
      const payload = {
        codigo: codigo.trim() || null,
        clasificacion,
        descripcion: descripcion.trim(),
        efectosPosibles: efectosPosibles.trim() || null,
        controlFuente: controlFuente.trim() || null,
        controlMedio: controlMedio.trim() || null,
        controlIndividuo: controlIndividuo.trim() || null,
        nivelDeficiencia: ndNum,
        nivelExposicion: neNum,
        nivelConsecuencia: ncNum,
        numExpuestos: numExpuestos === '' ? null : Number(numExpuestos),
        peorConsecuencia: peorConsecuencia.trim() || null,
        requisitoLegal,
        eliminacion: eliminacion.trim() || null,
        sustitucion: sustitucion.trim() || null,
        controlesIngenieria: controlesIngenieria.trim() || null,
        controlesAdministrativos: controlesAdministrativos.trim() || null,
        epp: epp.trim() || null,
      }

      const url = peligro?.id ? `/api/peligros/${peligro.id}` : '/api/peligros'
      const method = peligro?.id ? 'PUT' : 'POST'

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar el peligro')
      }

      toast({
        title: 'Éxito',
        description: peligro?.id
          ? 'Peligro actualizado correctamente en el catálogo.'
          : 'Peligro registrado exitosamente en el catálogo maestro.',
      })

      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'No fue posible guardar el peligro.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const tabs = [
    { id: 0, label: 'Identificación', icon: Flame },
    { id: 1, label: 'Controles Base', icon: Shield },
    { id: 2, label: 'Evaluación GTC 45', icon: Calculator },
    { id: 3, label: 'Medidas de Intervención', icon: Sliders },
  ]

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[88vh]">
        {/* Header */}
        <header className="px-6 py-3.5 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-9 sm:size-10 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
              <Flame className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full inline-block">
                CATÁLOGO MAESTRO DE PELIGROS
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#163522] tracking-tight truncate">
                {peligro?.id ? 'Editar Peligro Estándar' : 'Nuevo Peligro Estándar'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 sm:size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#7a9182] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Tab Selector */}
        <div className="px-6 pt-2 bg-white border-b border-[#dfe9e2] flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#1F7D3E] text-[#1F7D3E] bg-[#eef7f0]/60'
                    : 'border-transparent text-[#7a9182] hover:text-[#163522] hover:bg-[#f4f8f5]'
                }`}
              >
                <Icon className="size-4" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col min-h-0">
          {/* Content Body - Hugs content with max-height to avoid empty void */}
          <div className="overflow-y-auto max-h-[66vh] p-6 space-y-4">
            {/* TAB 0: Identificación y Criterios */}
            {activeTab === 0 && (
              <div className="space-y-4">
                {/* Código + Clasificación */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {/* Código de Peligro (Referencia no editable) */}
                  <div className="sm:col-span-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#163522]">Código de Peligro</label>
                      <span className="text-[9.5px] font-semibold text-[#5a7c65]">Referencia</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={generatingCode ? 'Calculando...' : (codigo || '---')}
                        readOnly
                        tabIndex={-1}
                        title="Código generado automáticamente para referencia interna"
                        className="w-full text-xs font-bold font-mono uppercase rounded-xl border border-[#dfe9e2] bg-[#f2f6f3] text-[#163522] cursor-not-allowed select-all px-3 py-2.5 focus:outline-none"
                      />
                      {generatingCode && (
                        <Loader2 className="size-3.5 animate-spin text-[#1F7D3E] absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  {/* Clasificación del Factor de Riesgo */}
                  <div className="sm:col-span-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#163522]">
                        Clasificación del Factor de Riesgo *
                      </label>
                      <span className="text-[9.5px] font-medium text-[#7a9182]">
                        Buscar o escribir
                      </span>
                    </div>
                    <ClasificacionCombobox
                      value={clasificacion}
                      onChange={handleClasificacionChange}
                    />
                  </div>
                </div>

                {/* Descripción del Peligro */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163522]">
                    Descripción del Peligro *
                  </label>
                  <textarea
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe detalladamente la condición, fuente o situación de peligro..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] focus:bg-white px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[68px] leading-relaxed"
                    required
                  />
                </div>

                {/* Efectos Posibles */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#163522]">Efectos Posibles a la Salud o Seguridad</label>
                  <textarea
                    rows={2}
                    value={efectosPosibles}
                    onChange={(e) => setEfectosPosibles(e.target.value)}
                    placeholder="Enfermedades, lesiones, consecuencias inmediatas..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] focus:bg-white px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[56px] leading-relaxed"
                  />
                </div>

                {/* Criterios Base de Severidad */}
                <div className="p-4 rounded-2xl bg-[#f8faf9] border border-[#dfe9e2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-[#163522] flex items-center gap-2">
                      <Sliders className="size-3.5 text-[#1F7D3E]" />
                      <span>Criterios para Establecer Controles (GTC 45)</span>
                    </div>
                    <span className="text-[9.5px] font-bold text-[#7a9182] bg-white border border-[#dfe9e2] px-2 py-0.5 rounded-md">
                      Numeral 3.3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[10.5px] font-bold text-[#163522]">Nº Expuestos Base</label>
                      <input
                        type="number"
                        value={numExpuestos}
                        onChange={(e) => setNumExpuestos(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ej: 5"
                        className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white px-3 py-2 focus:border-[#1F7D3E] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10.5px] font-bold text-[#163522]">Peor Consecuencia Esperada</label>
                      <input
                        type="text"
                        value={peorConsecuencia}
                        onChange={(e) => setPeorConsecuencia(e.target.value)}
                        placeholder="Ej: Muerte, invalidez permanente, amputación..."
                        className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white px-3 py-2 focus:border-[#1F7D3E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="reqLegalTab0"
                      checked={requisitoLegal}
                      onChange={(e) => setRequisitoLegal(e.target.checked)}
                      className="size-4 text-[#1F7D3E] rounded border-[#dfe9e2] focus:ring-[#1F7D3E] cursor-pointer"
                    />
                    <label htmlFor="reqLegalTab0" className="text-xs font-bold text-[#163522] cursor-pointer select-none">
                      Existe Requisito Legal Específico Asociado (Resolución, Decreto o Norma Técnica)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: Controles Base (Pestaña propia - diseño idéntico a Image 2) */}
            {activeTab === 1 && (
              <div className="p-5 rounded-2xl bg-[#fcfdfc] border border-[#d6ebd9] shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Shield className="size-5 text-[#1F7D3E]" />
                    <h3 className="text-sm sm:text-base font-black text-[#163522]">
                      Controles Base Existentes
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full">
                    RECOMENDADOS
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#5e6b62] font-medium leading-relaxed">
                  Controles estándar sugeridos por defecto cuando este peligro sea seleccionado en matrices.
                </p>

                {/* Control en la Fuente */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#1F7D3E]" />
                    <span>Control en la Fuente</span>
                  </label>
                  <textarea
                    rows={2}
                    value={controlFuente}
                    onChange={(e) => setControlFuente(e.target.value)}
                    placeholder="Ej: Mantenimiento preventivo, aislamiento, guardas..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* Control en el Medio */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#0284c7]" />
                    <span>Control en el Medio</span>
                  </label>
                  <textarea
                    rows={2}
                    value={controlMedio}
                    onChange={(e) => setControlMedio(e.target.value)}
                    placeholder="Ej: Ventilación forzada, señalización, barreras..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* Control en el Individuo */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#7c3aed]" />
                    <span>Control en el Individuo</span>
                  </label>
                  <textarea
                    rows={2}
                    value={controlIndividuo}
                    onChange={(e) => setControlIndividuo(e.target.value)}
                    placeholder="Ej: Capacitación, vacunación, pausas activas..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Evaluación GTC 45 Base */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f0f7ff] border border-[#d8eaff] flex items-start gap-3">
                  <Calculator className="size-5 text-[#0284c7] shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-[13px] text-[#0369a1] font-medium leading-relaxed">
                    Ingresa los valores base de la evaluación cualitativa GTC 45 (Deficiencia, Exposición y Consecuencia). El sistema calcula en tiempo real el Nivel de Probabilidad (NP), Nivel de Riesgo (NR) y Aceptabilidad.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* ND */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#163522]">
                      Nivel de Deficiencia (ND)
                    </label>
                    <select
                      value={nivelDeficiencia}
                      onChange={(e) => setNivelDeficiencia(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs sm:text-sm font-bold text-[#163522] rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] focus:bg-white px-3 py-2.5 focus:border-[#1F7D3E] focus:outline-none"
                    >
                      <option value="">Sin evaluar</option>
                      <option value="10">10 - Muy Alto</option>
                      <option value="6">6 - Alto</option>
                      <option value="2">2 - Medio</option>
                      <option value="0">0 - Bajo / Controlado</option>
                    </select>
                  </div>

                  {/* NE */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#163522]">
                      Nivel de Exposición (NE)
                    </label>
                    <select
                      value={nivelExposicion}
                      onChange={(e) => setNivelExposicion(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs sm:text-sm font-bold text-[#163522] rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] focus:bg-white px-3 py-2.5 focus:border-[#1F7D3E] focus:outline-none"
                    >
                      <option value="">Sin evaluar</option>
                      <option value="4">4 - Continua</option>
                      <option value="3">3 - Frecuente</option>
                      <option value="2">2 - Ocasional</option>
                      <option value="1">1 - Esporádica</option>
                    </select>
                  </div>

                  {/* NC */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#163522]">
                      Nivel de Consecuencia (NC)
                    </label>
                    <select
                      value={nivelConsecuencia}
                      onChange={(e) => setNivelConsecuencia(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs sm:text-sm font-bold text-[#163522] rounded-xl border border-[#dfe9e2] bg-[#fcfdfc] focus:bg-white px-3 py-2.5 focus:border-[#1F7D3E] focus:outline-none"
                    >
                      <option value="">Sin evaluar</option>
                      <option value="100">100 - Mortal / Catastrófico</option>
                      <option value="60">60 - Muy Grave</option>
                      <option value="25">25 - Grave</option>
                      <option value="10">10 - Leve</option>
                    </select>
                  </div>
                </div>

                {/* Calculated Results Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] shadow-2xs">
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-[#7a9182]">Nivel Probabilidad (NP)</div>
                    <div className="text-xl sm:text-2xl font-black text-[#163522] mt-1">
                      {evalCalc.np ?? '—'}
                    </div>
                    <div className="text-[10.5px] font-bold text-[#5e6b62] truncate mt-0.5">
                      {evalCalc.interpNp || 'Sin cálculo'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] shadow-2xs">
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-[#7a9182]">Nivel Riesgo (NR)</div>
                    <div className="text-xl sm:text-2xl font-black text-[#163522] mt-1">
                      {evalCalc.nr ?? '—'}
                    </div>
                    <div className="text-[10.5px] font-bold text-[#5e6b62] truncate mt-0.5">
                      {evalCalc.interpNr || 'Sin cálculo'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] shadow-2xs">
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-[#7a9182]">Clasificación GTC 45</div>
                    <div className="text-xl sm:text-2xl font-black text-[#163522] mt-1">
                      {evalCalc.nivelRiesgo ? `Nivel ${evalCalc.nivelRiesgo}` : '—'}
                    </div>
                    <div className="text-[10.5px] font-bold text-[#7a9182] mt-0.5 truncate">
                      {evalCalc.nivelRiesgo === 'I' ? 'Crítico / No Aceptable' : evalCalc.nivelRiesgo === 'II' ? 'Alto / Corregir' : evalCalc.nivelRiesgo === 'III' ? 'Medio / Mejorable' : evalCalc.nivelRiesgo === 'IV' ? 'Bajo / Mantener' : 'Estándar'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] shadow-2xs">
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-[#7a9182]">Aceptabilidad</div>
                    <div className="text-sm font-black text-[#163522] mt-1.5 truncate">
                      {evalCalc.aceptabilidad || '—'}
                    </div>
                    <div className="text-[10px] font-bold text-[#7a9182] mt-0.5">Valoración del Riesgo</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Medidas de Intervención */}
            {activeTab === 3 && (
              <div className="space-y-4">
                {/* 1. Eliminación */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">1</span>
                    <span>Eliminación</span>
                  </label>
                  <textarea
                    rows={2}
                    value={eliminacion}
                    onChange={(e) => setEliminacion(e.target.value)}
                    placeholder="Medidas para suprimir totalmente el peligro..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* 2. Sustitución */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">2</span>
                    <span>Sustitución</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sustitucion}
                    onChange={(e) => setSustitucion(e.target.value)}
                    placeholder="Sustituir por insumo, químico o proceso menos riesgoso..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* 3. Controles de Ingeniería */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">3</span>
                    <span>Controles de Ingeniería</span>
                  </label>
                  <textarea
                    rows={2}
                    value={controlesIngenieria}
                    onChange={(e) => setControlesIngenieria(e.target.value)}
                    placeholder="Cabinas de bioseguridad, extractores, sensores..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* 4. Controles Administrativos */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">4</span>
                    <span>Controles Administrativos</span>
                  </label>
                  <textarea
                    rows={2}
                    value={controlesAdministrativos}
                    onChange={(e) => setControlesAdministrativos(e.target.value)}
                    placeholder="Capacitaciones, rotación de personal, señalización..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>

                {/* 5. Equipos y Elementos de Protección Personal (EPP) */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-[#163522] flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">5</span>
                    <span>Equipos y Elementos de Protección Personal (EPP)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={epp}
                    onChange={(e) => setEpp(e.target.value)}
                    placeholder="Guantes de nitrilo, mascarilla N95, protección ocular, bata impermeable..."
                    className="w-full text-xs sm:text-sm font-medium rounded-xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] px-3.5 py-2.5 focus:border-[#1F7D3E] focus:outline-none resize-y min-h-[58px] leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <footer className="px-6 py-3.5 bg-[#fcfdfc] border-t border-[#dfe9e2] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4.5 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#5e6b62] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2.5">
              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  ← Anterior
                </button>
              )}

              {activeTab < tabs.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => prev + 1)}
                  className="px-4 py-2.5 rounded-xl border border-[#cbe5cf] bg-[#eef7f0] hover:bg-[#e0f1e3] text-[#1F7D3E] text-xs sm:text-sm font-black transition-colors cursor-pointer"
                >
                  Siguiente Pestaña →
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs sm:text-sm font-black shadow-sm shadow-[#1F7D3E]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                <span>{peligro?.id ? 'Actualizar Peligro' : 'Guardar Peligro en Catálogo'}</span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
