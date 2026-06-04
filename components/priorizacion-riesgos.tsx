"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'

type EvaluationData = {
  nd: number | null
  ne: number | null
  nc: number | null
  np: number | null
  nr: number | null
  interp_np: string
  interp_nr: string
  aceptabilidad: string
}

type RiskPrioritizationItem = {
  id: string
  matrizId: string
  descripcion: string
  clasificacion: string
  area: string
  proceso: string
  zona: string
  actividad: string
  evaluacion: EvaluationData
  evaluacionPost: EvaluationData | null
  intervencion: {
    eliminacion: string
    sustitucion: string
    controles_ingenieria: string
    controles_administrativos: string
    epp: string
    responsable: string
    fecha_ejecucion: string
  }
}

function interpProbabilidad(np: number) {
  if (!np) return { label: '', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#198754' }     // Green
  if (np <= 8) return { label: 'Medio', color: '#EAB308' }    // Yellow
  if (np <= 20) return { label: 'Alto', color: '#ef4444' }     // Red
  return { label: 'Muy Alto', color: '#a50000' } // Deep Red
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV', color: '#198754' }     // IV = Green
  if (nr <= 120) return { label: 'III', color: '#198754' }    // III = Green
  if (nr <= 500) return { label: 'II', color: '#EAB308' }    // II = Yellow
  return { label: 'I', color: '#ef4444' }    // I = Red
}

function aceptabilidadFromNivel(label: string) {
  if (!label) return ''
  switch (label) {
    case 'IV': return 'Aceptable'
    case 'III': return 'Mejorable'
    case 'II': return 'Aceptable con Control Especifico'
    case 'I': return 'No Aceptable'
    default: return ''
  }
}

function aceptabilidadColor(text: string) {
  if (!text) return '#9CA3AF'
  if (text.includes('No Aceptable')) return '#dc3545' // Rojo
  if (text.includes('Control Especifico')) return '#EAB308' // Amarillo
  if (text.includes('Mejorable')) return '#198754' // Verde
  if (text.includes('Aceptable')) return '#198754' // Verde profundo
  return '#9CA3AF'
}

export function PriorizacionRiesgos() {
  const router = useRouter()
  const { user } = useAuth()
  const [risks, setRisks] = useState<RiskPrioritizationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRisk, setSelectedRisk] = useState<RiskPrioritizationItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  // Form State
  const [formIntervencion, setFormIntervencion] = useState<any>({})
  const [formEvalPost, setFormEvalPost] = useState<any>({ nd: '', ne: '', nc: '' })

  const loadRisks = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/priorizacion')
      if (!res.ok) throw new Error('Error al cargar riesgos')
      const data = await res.json()
      setRisks(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', variant: 'destructive', description: 'No se pudieron cargar los riesgos prioritarios' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRisks()
  }, [])

  const filteredRisks = useMemo(() => {
    if (!search.trim()) return risks
    const s = search.toLowerCase()
    return risks.filter(r => 
      r.descripcion.toLowerCase().includes(s) || 
      r.area.toLowerCase().includes(s) || 
      r.proceso.toLowerCase().includes(s)
    )
  }, [risks, search])

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRisks.length / ITEMS_PER_PAGE))
  }, [filteredRisks])

  const paginatedRisks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRisks.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRisks, currentPage])

  const openIntervention = (risk: RiskPrioritizationItem) => {
    setSelectedRisk(risk)
    setFormIntervencion({ ...risk.intervencion })
    setFormEvalPost({
      nd: risk.evaluacionPost?.nd || '',
      ne: risk.evaluacionPost?.ne || '',
      nc: risk.evaluacionPost?.nc || ''
    })
    setShowModal(true)
  }

  const postEvalResult = useMemo(() => {
    const nd = Number(formEvalPost.nd || 0)
    const ne = Number(formEvalPost.ne || 0)
    const nc = Number(formEvalPost.nc || 0)
    const np = (!nd || !ne) ? 0 : nd * ne
    const nr = (!np || !nc) ? 0 : np * nc
    
    const prob = interpProbabilidad(np)
    const riesgo = interpNivelRiesgo(nr)
    
    return {
      np,
      nr,
      interp_np: prob.label,
      interp_nr: riesgo.label,
      aceptabilidad: aceptabilidadFromNivel(riesgo.label),
      probColor: prob.color,
      riesgoColor: riesgo.color
    }
  }, [formEvalPost])

  const saveIntervention = async () => {
    if (!selectedRisk) return
    
    try {
      const payload = {
        peligroId: selectedRisk.id,
        intervencion: formIntervencion,
        evaluacionPost: {
          nd: formEvalPost.nd,
          ne: formEvalPost.ne,
          nc: formEvalPost.nc,
          np: postEvalResult.np,
          nr: postEvalResult.nr,
          interp_np: postEvalResult.interp_np,
          interp_nr: postEvalResult.interp_nr,
          aceptabilidad: postEvalResult.aceptabilidad
        }
      }

      const res = await apiFetch('/api/priorizacion/intervencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast({ title: 'Éxito', description: 'Intervención guardada correctamente' })
      setShowModal(false)
      loadRisks() // Refresh list (will remove if Bajo)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', variant: 'destructive', description: 'No se pudo guardar la intervención' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#2c3630]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e2e9e4] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold text-[#1F7D3E]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver
          </button>
          <div className="w-[1px] h-6 bg-[#e2e9e4]" />
          <h1 className="text-lg font-bold text-[#1F7D3E]">Priorización de Riesgos</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#5e6b62] leading-tight">{user?.nombre}</p>
            <p className="text-[10px] font-bold text-[#8aa08f] uppercase tracking-wider">Gestión de Intervenciones</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1F7D3E] tracking-tight">Riesgos por Intervenir</h2>
            <p className="text-sm font-medium text-[#5e6b62]">Mostrando riesgos con probabilidad Media, Alta o Muy Alta que aún no han sido mitigados.</p>
          </div>
          <div className="w-full md:w-72">
            <Input 
              placeholder="Buscar riesgo, área o proceso..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border-[#e2e9e4] rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-[#5e6b62] font-medium">Cargando riesgos prioritarios...</div>
        ) : (
          <div className="bg-white border border-[#e2e9e4] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-[#f8faf9] border-b border-[#e2e9e4]">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Peligro / Descripción</th>
                    <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Clasificación</th>
                    <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Área / Proceso</th>
                    <th className="px-6 py-4 text-center font-bold text-[#5e6b62] uppercase tracking-wider">Estado Inicial</th>
                    <th className="px-6 py-4 text-center font-bold text-[#5e6b62] uppercase tracking-wider">Estado Post</th>
                    <th className="px-6 py-4 text-right font-bold text-[#5e6b62] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e9e4]/50">
                  {paginatedRisks.map(risk => (
                    <tr key={risk.id} className="hover:bg-[#f0f9f1]/20 transition-colors group">
                      <td className="px-6 py-4 max-w-xs">
                        <div 
                          className="font-bold text-[#2c3630] line-clamp-2 cursor-pointer hover:text-[#1F7D3E] hover:underline transition-all flex items-center gap-1.5"
                          onClick={() => router.push(`/matriz/${risk.matrizId}?peligroId=${risk.id}`)}
                          title="Click para ver en la matriz"
                        >
                          {risk.descripcion}
                          <svg className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1F7D3E]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </div>
                        <div className="text-[10px] text-[#8aa08f] mt-0.5">{risk.actividad}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-[#f8faf9] text-[#5e6b62] border-[#e2e9e4] text-[10px] uppercase">{risk.clasificacion}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#2c3630]">{risk.area}</div>
                        <div className="text-[11px] text-[#5e6b62]">{risk.proceso}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="px-3 py-1 rounded-full text-[10px] font-black text-white shadow-sm uppercase tracking-tight"
                          style={{ backgroundColor: interpProbabilidad(risk.evaluacion.np || 0).color }}
                        >
                          {risk.evaluacion.interp_np}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {risk.evaluacionPost ? (
                          <span 
                            className="px-3 py-1 rounded-full text-[10px] font-black text-white shadow-sm uppercase tracking-tight"
                            style={{ backgroundColor: interpProbabilidad(risk.evaluacionPost.np || 0).color }}
                          >
                            {risk.evaluacionPost.interp_np}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 italic uppercase">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          onClick={() => openIntervention(risk)}
                          className="bg-[#1F7D3E] hover:bg-[#186331] text-white font-bold rounded-xl px-4 py-1 h-8"
                        >
                          Intervenir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredRisks.length > 0 && (
              <div className="px-6 py-4 border-t border-[#e2e9e4] bg-[#fcfdfc] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-semibold text-[#5e6b62]">
                  Mostrando <span className="font-bold text-[#1F7D3E]">{Math.min(filteredRisks.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> a{" "}
                  <span className="font-bold text-[#1F7D3E]">{Math.min(filteredRisks.length, currentPage * ITEMS_PER_PAGE)}</span> de{" "}
                  <span className="font-bold text-[#1F7D3E]">{filteredRisks.length}</span> riesgos
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 border-[#e2e9e4] hover:bg-white text-xs font-bold text-[#5e6b62] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        )
                      })
                      .map((page, index, array) => {
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-1.5 text-gray-400 text-xs">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-8 w-8 text-xs font-bold rounded-lg p-0 transition-all ${
                                currentPage === page
                                  ? "bg-[#1F7D3E] hover:bg-[#186331] text-white border-none shadow-sm"
                                  : "border-[#e2e9e4] hover:bg-white text-[#5e6b62]"
                              }`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="h-8 border-[#e2e9e4] hover:bg-white text-xs font-bold text-[#5e6b62] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    Siguiente
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Button>
                </div>
              </div>
            )}
            
            {filteredRisks.length === 0 && (
              <div className="py-20 text-center bg-white border-t border-[#e2e9e4]">
                <p className="text-sm font-medium text-[#5e6b62]">No hay riesgos que requieran priorización en este momento.</p>
                <p className="text-xs text-gray-400 mt-1">Todos los riesgos críticos han sido mitigados o no se encontraron coincidencias.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] sm:max-w-5xl md:max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1F7D3E]">Intervención de Riesgo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            <div className="bg-[#fcfdfc] border border-[#e2e9e4] rounded-xl p-4 space-y-2 shadow-sm">
              <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-widest">Riesgo Original</h4>
              <p className="text-base font-bold text-[#2c3630] leading-relaxed">{selectedRisk?.descripcion}</p>
              <div className="flex flex-wrap gap-2 items-center mt-2">
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-[#f4f7f5] border-[#d2dfd6] text-[#425046]">{selectedRisk?.area}</Badge>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-[#f4f7f5] border-[#d2dfd6] text-[#425046]">{selectedRisk?.proceso}</Badge>
                <Badge className="text-xs font-extrabold px-3 py-0.5 text-white border-none" style={{ backgroundColor: interpProbabilidad(selectedRisk?.evaluacion.np || 0).color }}>
                  NP: {selectedRisk?.evaluacion.interp_np}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Intervention Actions */}
              <div className="space-y-5">
                <h4 className="text-base font-black text-[#1F7D3E] flex items-center gap-2.5 border-b border-[#e2e9e4] pb-2">
                  <span className="w-7 h-7 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-sm font-black">1</span>
                  Medidas de Intervención
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider mb-1.5 block">Eliminación / Sustitución</label>
                    <Textarea 
                      placeholder="Acciones específicas para eliminar o sustituir el riesgo..."
                      value={formIntervencion.eliminacion || ''}
                      onChange={e => setFormIntervencion({...formIntervencion, eliminacion: e.target.value})}
                      className="text-xs min-h-[75px] p-3 rounded-xl border-[#e2e9e4] focus-visible:ring-[#1F7D3E] leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider mb-1.5 block">Controles de Ingeniería / Admin</label>
                    <Textarea 
                      placeholder="Controles técnicos, de ingeniería o administrativos a implementar..."
                      value={formIntervencion.controles_ingenieria || ''}
                      onChange={e => setFormIntervencion({...formIntervencion, controles_ingenieria: e.target.value})}
                      className="text-xs min-h-[75px] p-3 rounded-xl border-[#e2e9e4] focus-visible:ring-[#1F7D3E] leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider mb-1.5 block">EPP</label>
                      <Input 
                        placeholder="Ninguno o EPP específico..."
                        value={formIntervencion.epp || ''}
                        onChange={e => setFormIntervencion({...formIntervencion, epp: e.target.value})}
                        className="text-xs h-10 p-3 rounded-xl border-[#e2e9e4] focus-visible:ring-[#1F7D3E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider mb-1.5 block">Responsable</label>
                      <Input 
                        placeholder="Nombre o rol del responsable..."
                        value={formIntervencion.responsable || ''}
                        onChange={e => setFormIntervencion({...formIntervencion, responsable: e.target.value})}
                        className="text-xs h-10 p-3 rounded-xl border-[#e2e9e4] focus-visible:ring-[#1F7D3E]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Re-evaluation */}
              <div className="space-y-5 bg-[#f8faf9] p-5 rounded-xl border border-[#e2e9e4] shadow-sm">
                <h4 className="text-base font-black text-[#1F7D3E] flex items-center gap-2.5 border-b border-[#e2e9e4] pb-2">
                  <span className="w-7 h-7 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-sm font-black">2</span>
                  Evaluación Post-Intervención
                </h4>

                <div className="space-y-4">
                  {/* EVALUACIÓN DEL RIESGO */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-[#1F7D3E]/80 uppercase tracking-widest">
                      EVALUACIÓN DEL RIESGO
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nivel Deficiencia */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Nivel Deficiencia
                        </label>
                        <select 
                          value={formEvalPost.nd}
                          onChange={e => setFormEvalPost({...formEvalPost, nd: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs font-bold bg-white border-[#e2e9e4] focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E] outline-none"
                        >
                          <option value="">— Seleccionar —</option>
                          <option value="10">10</option>
                          <option value="6">6</option>
                          <option value="2">2</option>
                        </select>
                      </div>

                      {/* Nivel Exposición */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Nivel Exposición
                        </label>
                        <select 
                          value={formEvalPost.ne}
                          onChange={e => setFormEvalPost({...formEvalPost, ne: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs font-bold bg-white border-[#e2e9e4] focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E] outline-none"
                        >
                          <option value="">— Seleccionar —</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </div>

                      {/* Nivel Probabilidad */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Nivel Probabilidad
                        </label>
                        <div className="w-full p-2.5 border rounded-lg text-xs font-bold bg-slate-50 border-[#e2e9e4]">
                          {postEvalResult.np || '—'}
                        </div>
                      </div>

                      {/* Interpretación Nivel Probabilidad */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Interpretación Nivel Probabilidad
                        </label>
                        {postEvalResult.interp_np ? (
                          <div
                            className="w-full p-2 rounded-lg text-xs font-black text-center text-white"
                            style={{ backgroundColor: postEvalResult.probColor }}
                          >
                            {postEvalResult.interp_np}
                          </div>
                        ) : (
                          <div className="w-full p-2.5 border rounded-lg text-xs font-bold bg-slate-50 border-[#e2e9e4] text-gray-400">
                            —
                          </div>
                        )}
                      </div>

                      {/* Nivel Consecuencia */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Nivel Consecuencia
                        </label>
                        <select 
                          value={formEvalPost.nc}
                          onChange={e => setFormEvalPost({...formEvalPost, nc: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs font-bold bg-white border-[#e2e9e4] focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E] outline-none"
                        >
                          <option value="">— Seleccionar —</option>
                          <option value="100">100</option>
                          <option value="60">60</option>
                          <option value="25">25</option>
                          <option value="10">10</option>
                        </select>
                      </div>

                      {/* Nivel Riesgo */}
                      <div>
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Nivel Riesgo
                        </label>
                        <div className="w-full p-2.5 border rounded-lg text-xs font-bold bg-slate-50 border-[#e2e9e4]">
                          {postEvalResult.nr || '—'}
                        </div>
                      </div>

                      {/* Interpretación Nivel Riesgo */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                          Interpretación Nivel Riesgo
                        </label>
                        {postEvalResult.interp_nr ? (
                          <div
                            className="w-full p-2 rounded-lg text-xs font-black text-center text-white"
                            style={{ backgroundColor: postEvalResult.riesgoColor }}
                          >
                            {postEvalResult.interp_nr}
                          </div>
                        ) : (
                          <div className="w-full p-2.5 border rounded-lg text-xs font-bold bg-slate-50 border-[#e2e9e4] text-gray-400">
                            —
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VALORACIÓN DEL RIESGO */}
                  <div className="space-y-3 pt-2 border-t border-[#e2e9e4]">
                    <div className="text-[11px] font-black text-[#1F7D3E]/80 uppercase tracking-widest">
                      VALORACIÓN DEL RIESGO
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Aceptabilidad Del Riesgo
                      </label>
                      {postEvalResult.aceptabilidad ? (
                        <div
                          className="w-full p-2 rounded-lg text-xs font-black text-center text-white"
                          style={{ backgroundColor: aceptabilidadColor(postEvalResult.aceptabilidad) }}
                        >
                          {postEvalResult.aceptabilidad}
                        </div>
                      ) : (
                        <div className="w-full p-2.5 border rounded-lg text-xs font-bold bg-slate-50 border-[#e2e9e4] text-gray-400">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {postEvalResult.interp_np === 'Bajo' && (
                  <div className="mt-4 p-3 bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl flex items-center gap-2.5 text-[#1F7D3E] shadow-sm animate-pulse">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-xs font-black uppercase tracking-wider">¡Riesgo mitigado! Se removerá de la lista.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="font-bold text-gray-500">Cancelar</Button>
            <Button onClick={saveIntervention} className="bg-[#1F7D3E] hover:bg-[#186331] text-white font-bold px-8">Guardar Intervención</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
