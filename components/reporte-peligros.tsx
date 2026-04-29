"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

type PeligroReporteItem = {
  id: string
  peligro: string
  clasificacion: string
  nivelRiesgo: number | null
  interpRiesgo: string
  aceptabilidad: string
  interpProbabilidad: string
  nombreMatriz: string
  matrizId: string
  actividad: string
}

type PeligrosResponse = {
  data: PeligroReporteItem[]
  total: number
  page: number
  pageSize: number
}

type CountsResponse = {
  muyAlto: number
  alto: number
  medio: number
  bajo: number
}

const ACEPTABILIDAD_LEVELS = [
  { key: 'Muy Alto', color: '#a50000', icon: '🔴' },
  { key: 'Alto', color: '#ef4444', icon: '🔴' },
  { key: 'Medio', color: '#EAB308', icon: '🟡' },
  { key: 'Bajo', color: '#198754', icon: '🟢' },
] as const

function levelColor(label: string) {
  const norm = label.toLowerCase().trim()
  if (norm === 'muy alto') return '#a50000'              // NP: Muy Alto = Deep Red
  if (norm === 'alto' || norm === 'i') return '#ef4444'   // NP: Alto = Red, NR: I = Red
  if (norm === 'medio' || norm === 'ii') return '#EAB308' // NP: Medio = Yellow, NR: II = Yellow
  if (norm === 'bajo' || norm === 'iii' || norm === 'iv') return '#198754' // Green
  return '#64748b'
}

function aceptabilidadColor(aceptabilidad: string) {
  if (aceptabilidad === 'No Aceptable') return '#ef4444'                    // Red
  if (aceptabilidad === 'Aceptable con Control Especifico') return '#EAB308' // Yellow
  if (aceptabilidad === 'Mejorable') return '#198754'                        // Green
  if (aceptabilidad === 'Aceptable') return '#198754'                       // Green
  return '#64748b'
}

function interpretacionNP(item: PeligroReporteItem) {
  return (item as any).interpProbabilidad || 'Sin clasificación'
}

export function ReportePeligros() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [items, setItems] = useState<PeligroReporteItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(12)
  const [search, setSearch] = useState('')
  const [selectedAceptabilidad, setSelectedAceptabilidad] = useState<string | null>(null)
  const [counts, setCounts] = useState<CountsResponse>({ muyAlto: 0, alto: 0, medio: 0, bajo: 0 })
  const [loading, setLoading] = useState(false)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const totalCardsCount = useMemo(() => counts.muyAlto + counts.alto + counts.medio + counts.bajo, [counts])

  async function loadCounts() {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())

    const res = await apiFetch(`/api/reporte/peligros/counts?${params.toString()}`)
    if (!res.ok) return
    const body = await res.json().catch(() => ({}))
    setCounts({
      muyAlto: Number(body?.muyAlto || 0),
      alto: Number(body?.alto || 0),
      medio: Number(body?.medio || 0),
      bajo: Number(body?.bajo || 0),
    })
  }

  async function loadData(nextPage = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('pageSize', String(pageSize))
      if (search.trim()) params.set('search', search.trim())
      if (selectedAceptabilidad) params.set('aceptabilidad', selectedAceptabilidad)

      const res = await apiFetch(`/api/reporte/peligros?${params.toString()}`)
      if (!res.ok) throw new Error('No se pudo cargar el reporte')

      const body = await res.json() as PeligrosResponse
      setItems(Array.isArray(body.data) ? body.data : [])
      setTotal(Number(body.total || 0))
      setPage(Number(body.page || 0))
    } catch (error) {
      console.error(error)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCounts()
  }, [search])

  useEffect(() => {
    setPage(0)
  }, [search, selectedAceptabilidad])

  useEffect(() => {
    void loadData(page)
  }, [page, pageSize, search, selectedAceptabilidad])

  function toggleAceptabilidad(value: string) {
    setSelectedAceptabilidad((prev) => (prev === value ? null : value))
  }

  function clearFilters() {
    setSearch('')
    setSelectedAceptabilidad(null)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#2c3630]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e2e9e4] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold text-[#1F7D3E]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver
            </button>
            <div className="w-[1px] h-6 bg-[#e2e9e4]" />
            <img src="/matriz-riesgos/csm_logo_long.png" alt="CSM" className="h-6 object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm font-bold text-[#1F7D3E] hover:underline px-4 py-2 bg-white border border-[#e2e9e4] rounded-xl shadow-sm transition-all hover:bg-[#f0f9f1]"
          >
            Matriz de Riesgos
          </button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-[#5e6b62] leading-tight">{user?.nombre || 'Usuario'}</span>
            <span className="text-[10px] font-bold text-[#8aa08f] uppercase tracking-wider">{user?.cargo || 'Colaborador'}</span>
          </div>
          
          <button 
            onClick={() => { logout(); router.push('/') }}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#1F7D3E] tracking-tight">Reporte General de Riesgos</h1>
            <p className="text-sm font-medium text-[#5e6b62]">Análisis consolidado de peligros y niveles de aceptabilidad</p>
          </div>
          <Button onClick={clearFilters} variant="outline" className="border-[#1F7D3E] text-[#1F7D3E] hover:bg-[#f0f9f1]">Limpiar filtros</Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACEPTABILIDAD_LEVELS.map((card) => {
            const selected = selectedAceptabilidad === card.key
            const count =
              card.key === 'Muy Alto' ? counts.muyAlto :
              card.key === 'Alto' ? counts.alto :
              card.key === 'Medio' ? counts.medio : counts.bajo
            const percentage = totalCardsCount > 0 ? Math.round((count / totalCardsCount) * 100) : 0

            return (
              <div 
                key={card.key}
                onClick={() => toggleAceptabilidad(card.key)}
                className={`bg-white border transition-all cursor-pointer rounded-2xl p-5 shadow-sm space-y-3 ${selected ? 'ring-2 ring-[#1F7D3E] border-[#1F7D3E]' : 'border-[#e2e9e4] hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold block leading-none" style={{ color: card.color }}>{count}</span>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block leading-tight whitespace-normal">{card.key}</span>
                    <span className="text-[10px] font-bold text-gray-400">{percentage}% del total</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: card.color }}
                  />
                </div>
                {selected && <div className="text-[10px] font-bold text-[#1F7D3E] uppercase tracking-widest text-center mt-2">Filtro Activo</div>}
              </div>
            )
          })}
        </div>

        {/* Table & Controls Section */}
        <div className="bg-white border border-[#e2e9e4] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e2e9e4] flex flex-wrap items-center gap-4 bg-[#f8faf9]/30">
            <div className="flex-1 min-w-[300px] relative">
              <input 
                type="text" 
                placeholder="Buscar por descripción de peligro..." 
                className="w-full pl-4 pr-10 py-2 rounded-xl border border-[#e2e9e4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20 focus:border-[#1F7D3E] transition-all"
                value={search} 
                onChange={e=>setSearch(e.target.value)} 
              />
            </div>
            <div className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">{total} peligros encontrados</div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-[#f8faf9] sticky top-0 z-10 border-b border-[#e2e9e4]">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Peligro</th>
                  <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Clasificación</th>
                  <th className="px-6 py-4 text-center font-bold text-[#5e6b62] uppercase tracking-wider">NP (Prob.)</th>
                  <th className="px-6 py-4 text-center font-bold text-[#5e6b62] uppercase tracking-wider">NR (Nivel)</th>
                  <th className="px-6 py-4 text-left font-bold text-[#5e6b62] uppercase tracking-wider">Origen (Matriz)</th>
                  <th className="px-6 py-4 text-center font-bold text-[#5e6b62] uppercase tracking-wider">Aceptabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e9e4]/50">
                {items.map((item) => {
                  const aColor = aceptabilidadColor(item.aceptabilidad)

                  return (
                    <tr key={item.id} className="hover:bg-[#f0f9f1]/20 transition-colors group">
                      <td className="px-6 py-4 font-medium text-[#2c3630]">{item.peligro}</td>
                      <td className="px-6 py-4"><span className="text-[#5e6b62]">{item.clasificacion || '—'}</span></td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: levelColor(item.interpProbabilidad || '') }}
                        >
                          {item.interpProbabilidad || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: levelColor(item.interpRiesgo || '') }}
                        >
                          {item.interpRiesgo || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.matrizId ? (
                          <Link href={`/matriz/${item.matrizId}?peligroId=${item.id}`} className="text-[#1F7D3E] font-bold hover:underline decoration-2 underline-offset-2">
                            {item.nombreMatriz}
                          </Link>
                        ) : (
                          <span className="text-gray-400">{item.nombreMatriz}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm whitespace-nowrap"
                          style={{ backgroundColor: aColor }}
                        >
                          {item.aceptabilidad || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!loading && items.length === 0 && (
                  <tr>
                    <td className="px-6 py-20 text-center text-[#5e6b62] font-semibold italic bg-gray-50/30" colSpan={6}>No se encontraron peligros que coincidan con los filtros.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td className="px-6 py-20 text-center text-[#5e6b62]" colSpan={6}>Actualizando información...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#e2e9e4] flex items-center justify-between bg-[#f8faf9]/30">
             <div className="text-[11px] font-bold text-[#8aa08f] uppercase tracking-widest">
              Página {Math.min(page + 1, totalPages)} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#e2e9e4] text-[#1F7D3E] font-bold rounded-xl"
                disabled={page <= 0} 
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#e2e9e4] text-[#1F7D3E] font-bold rounded-xl"
                disabled={page + 1 >= totalPages} 
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
