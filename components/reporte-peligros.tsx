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
  { key: 'No Aceptable', color: '#a50000', icon: '🔴' },
  { key: 'Aceptable con Control Especifico', color: '#f59e0b', icon: '🟠' },
  { key: 'Mejorable', color: '#22c55e', icon: '🟢' },
  { key: 'Aceptable', color: '#198754', icon: '🟢' },
] as const

function levelColor(label: string) {
  const norm = label.toLowerCase().trim()
  if (norm === 'i' || norm === 'muy alto') return '#dc3545'
  if (norm === 'ii' || norm === 'medio') return '#f59e0b'
  if (norm === 'iii' || norm === 'alto') return '#22c55e'
  if (norm === 'iv' || norm === 'bajo') return '#198754'
  return '#64748b'
}

function aceptabilidadColor(aceptabilidad: string) {
  if (aceptabilidad === 'No Aceptable') return '#dc3545'
  if (aceptabilidad === 'Aceptable con Control Especifico') return '#f59e0b'
  if (aceptabilidad === 'Mejorable') return '#22c55e'
  if (aceptabilidad === 'Aceptable') return '#198754'
  return '#64748b'
}

function aceptabilidadToLevel(aceptabilidad: string) {
  if (aceptabilidad === 'No Aceptable') return 'Muy Alto'
  if (aceptabilidad === 'Aceptable con Control Especifico') return 'Alto'
  if (aceptabilidad === 'Mejorable') return 'Medio'
  if (aceptabilidad === 'Aceptable') return 'Bajo'
  return aceptabilidad || 'Sin clasificación'
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
    <div className="min-h-screen bg-[#f5f8f5]">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white" style={{ borderBottom: '0.5px solid #d4e8d4', padding: '16px 24px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <Button asChild variant="ghost" className="h-auto px-0 text-[13px] font-medium text-[#1a5c2a] hover:bg-transparent hover:text-[#1a5c2a]">
            <Link href="/dashboard">Volver</Link>
          </Button>
          <div style={{ width: '0.5px', height: '30px', background: '#c8dfc8' }}></div>
          <div className="text-[16px] font-semibold text-[#1a5c2a]">Reporte de Riesgos</div>
        </div>
        <div className="flex items-center" style={{ gap: '8px', fontSize: '13px', color: '#555' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5e9] text-[13px] font-semibold uppercase text-[#1a5c2a]">
            {(user?.nombre || 'U')[0]}
          </div>
          <span>
            {user?.nombre || ''}
            {user?.cargo ? <><>&nbsp;·&nbsp;</>{user.cargo}</> : null}
          </span>
          <span style={{opacity:'.3', margin:'0 4px', color:'#c8dfc8'}}>|</span>
          <button
            type="button"
            className="font-medium text-[#1a5c2a] hover:underline"
            onClick={() => {
              logout()
              router.push('/')
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ACEPTABILIDAD_LEVELS.map((card) => {
            const selected = selectedAceptabilidad === card.key
            const count =
              card.key === 'No Aceptable' ? counts.muyAlto :
              card.key === 'Aceptable con Control Especifico' ? counts.alto :
              card.key === 'Mejorable' ? counts.medio : counts.bajo
            const percentage = totalCardsCount > 0 ? Math.round((count / totalCardsCount) * 100) : 0

            return (
              <Card
                key={card.key}
                className={`cursor-pointer overflow-hidden border-[#dde8dd] py-0 gap-0 transition min-h-[170px] ${selected ? 'ring-2 ring-[#2d7a40]' : ''}`}
                onClick={() => toggleAceptabilidad(card.key)}
              >
                <CardHeader className="rounded-none bg-[#2d7a40] py-3">
                  <CardTitle className="text-sm text-white">{card.icon} {card.key}</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 pb-5">
                  <div className="text-3xl font-semibold" style={{ color: card.color }}>{count}</div>
                  <div className="mt-1 text-xs text-slate-500">{percentage}% del total</div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: card.color }}
                    />
                  </div>
                  {selected && <div className="mt-2 text-xs font-medium text-[#2d7a40]">Filtro activo</div>}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="rounded-xl border border-[#dde8dd] bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descripción de peligro..."
              className="max-w-md border-[#dde8dd]"
            />
            <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#dde8dd] bg-white">
          <div className="bg-[#2d7a40] px-4 py-3 text-sm font-medium text-white">Resultados</div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f7fbf7] text-left">
                <tr>
                  <th className="px-4 py-3">Peligro</th>
                  <th className="px-4 py-3">Clasificación</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Nombre Matriz</th>
                  <th className="px-4 py-3">Actividad</th>
                  <th className="px-4 py-3">Aceptabilidad</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const nivelLabel = item.interpRiesgo || aceptabilidadToLevel(item.aceptabilidad)
                  const nivelColor = levelColor(nivelLabel)
                  const colorAceptabilidad = aceptabilidadColor(item.aceptabilidad)

                  return (
                    <tr key={item.id} className="border-t border-[#edf3ed]">
                      <td className="px-4 py-3">{item.peligro}</td>
                      <td className="px-4 py-3">{item.clasificacion || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 text-white" style={{ backgroundColor: nivelColor }}>
                          {nivelLabel || 'Sin nivel'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.matrizId ? (
                          <Link href={`/matriz/${item.matrizId}?peligroId=${item.id}`} className="text-[#2d7a40] underline-offset-2 hover:underline">
                            {item.nombreMatriz}
                          </Link>
                        ) : (
                          item.nombreMatriz
                        )}
                      </td>
                      <td className="px-4 py-3">{item.actividad}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 text-white" style={{ backgroundColor: colorAceptabilidad }}>
                          {item.aceptabilidad || 'Sin aceptabilidad'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {!loading && items.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>No se encontraron peligros.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>Cargando reporte...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf3ed] px-4 py-3 text-sm text-slate-600">
            <div>{total} peligros encontrados</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
              <span>Página {Math.min(page + 1, totalPages)} de {totalPages}</span>
              <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
