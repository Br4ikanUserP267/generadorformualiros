"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/utils'

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
  { key: 'No Aceptable', label: 'Muy Alto', color: '#c0392b', icon: '🔴' },
  { key: 'Aceptable con Control Especifico', label: 'Alto', color: '#e67e22', icon: '🟠' },
  { key: 'Mejorable', label: 'Medio', color: '#f59e0b', icon: '🟡' },
  { key: 'Aceptable', label: 'Bajo', color: '#27ae60', icon: '🟢' },
] as const

function levelColor(label: string) {
  const norm = label.toLowerCase().trim()
  if (norm === 'muy alto' || norm === 'i') return '#c0392b'
  if (norm === 'alto' || norm === 'ii') return '#e67e22'
  if (norm === 'medio' || norm === 'iii') return '#f59e0b'
  if (norm === 'bajo' || norm === 'iv') return '#27ae60'
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
  const [items, setItems] = useState<PeligroReporteItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedAceptabilidad, setSelectedAceptabilidad] = useState<string[]>([])
  const [counts, setCounts] = useState<CountsResponse>({ muyAlto: 0, alto: 0, medio: 0, bajo: 0 })
  const [loading, setLoading] = useState(false)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

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
      if (selectedAceptabilidad.length > 0) params.set('aceptabilidad', selectedAceptabilidad.join(','))

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
    setSelectedAceptabilidad((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value)
      return [...prev, value]
    })
  }

  function clearFilters() {
    setSearch('')
    setSelectedAceptabilidad([])
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-[#dde8dd] bg-white p-4">
          <h1 className="text-xl font-semibold text-[#2d7a40]">Reporte de Peligros</h1>
          <p className="text-sm text-slate-600">Vista consolidada de peligros por nivel de riesgo y aceptabilidad.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ACEPTABILIDAD_LEVELS.map((card) => {
            const selected = selectedAceptabilidad.includes(card.key)
            const count =
              card.key === 'No Aceptable' ? counts.muyAlto :
              card.key === 'Aceptable con Control Especifico' ? counts.alto :
              card.key === 'Mejorable' ? counts.medio : counts.bajo

            return (
              <Card
                key={card.key}
                className={`cursor-pointer border-[#dde8dd] transition ${selected ? 'ring-2 ring-[#2d7a40]' : ''}`}
                onClick={() => toggleAceptabilidad(card.key)}
              >
                <CardHeader className="rounded-t-xl bg-[#2d7a40] py-3">
                  <CardTitle className="text-sm text-white">{card.icon} {card.label}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-semibold" style={{ color: card.color }}>{count}</div>
                  <div className="text-xs text-slate-500">aceptabilidad: {card.key}</div>
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
                  const aceptabilidadLevel = aceptabilidadToLevel(item.aceptabilidad)
                  const aceptabilidadColor = levelColor(aceptabilidadLevel)

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
                          <Link href={`/matriz-riesgos/${item.matrizId}`} className="text-[#2d7a40] underline-offset-2 hover:underline">
                            {item.nombreMatriz}
                          </Link>
                        ) : (
                          item.nombreMatriz
                        )}
                      </td>
                      <td className="px-4 py-3">{item.actividad}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 text-white" style={{ backgroundColor: aceptabilidadColor }}>
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
