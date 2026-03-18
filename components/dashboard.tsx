"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table'
import ConfirmModal from './confirm-modal'
import { exportToExcel } from '@/lib/export-to-excel'
import { PencilIcon, DownloadIcon, Trash2 } from 'lucide-react'
import data from '@/data/riesgos.json'

type RecordType = any

function calcNivel(r: RecordType) {
  const nd = Number(r.deficiencia || r.nd || 0)
  const ne = Number(r.exposicion || r.ne || 0)
  const nc = Number(r.consecuencia || r.nc || 0)
  const np = nd * ne
  const nr = np * nc
  let label = ''
  if (!nr || nr === 0) label = ''
  else if (nr >= 4000) label = 'I'
  else if (nr >= 501) label = 'I'
  else if (nr >= 121) label = 'II'
  else if (nr >= 40) label = 'III'
  else label = 'IV'
  return { nr, label }
}

const levelInfo: Record<string, {color:string, text:string}> = {
  'I': { color: '#c0392b', text: 'Crítico' },
  'II': { color: '#e67e22', text: 'Alto' },
  'III': { color: '#f1c40f', text: 'Medio' },
  'IV': { color: '#27ae60', text: 'Bajo' },
}

export function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<RecordType[]>([])
  const [search, setSearch] = useState('')
  const [responsable, setResponsable] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [clasFilter, setClasFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState<string | null>(null)
  const [fechaHasta, setFechaHasta] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [sort, setSort] = useState<{col:string, dir: 'asc'|'desc'|null}>({col:'id', dir:null})
  const [deleteTarget, setDeleteTarget] = useState<RecordType|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(()=>{ setRows((data as any) || []) }, [])

  const tipos = useMemo(()=> Array.from(new Set(rows.map(r=>r.tipo_proceso).filter(Boolean))), [rows])
  const clasificaciones = useMemo(()=> Array.from(new Set(rows.map(r=>r.clasificacion).filter(Boolean))), [rows])

  const filtered = useMemo(()=>{
    const now = new Date()
    return rows.filter((r)=>{
      // periodo filter
      if (fechaDesde || fechaHasta) {
        const d = r.fecha ? new Date(r.fecha) : null
        if (!d) return false
        if (fechaDesde) {
          const desde = new Date(fechaDesde)
          if (d < desde) return false
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23,59,59,999)
          if (d > hasta) return false
        }
      }

      if (tipoFilter && r.tipo_proceso !== tipoFilter) return false
      if (clasFilter && r.clasificacion !== clasFilter) return false

      if (search) {
        const s = search.toLowerCase()
        const fields = [r.proceso, r.zona, r.cargo, r.clasificacion].map((f:any)=> (f||'').toString().toLowerCase())
        if (!fields.some(f=> f.includes(s))) return false
      }

      if (responsable) {
        const s = responsable.toLowerCase()
        const field = (r.responsable || r.responsable_nombre || '').toString().toLowerCase()
        if (!field.includes(s)) return false
      }

      if (activeLevel) {
        const { label } = calcNivel(r)
        if (label !== activeLevel) return false
      }

      return true
    })
  }, [rows, search, responsable, tipoFilter, clasFilter, fechaDesde, fechaHasta, activeLevel])

  const sorted = useMemo(()=>{
    if (!sort.dir) return filtered
    const s = [...filtered].sort((a,b)=>{
      const av = (a as any)[sort.col] ?? ''
      const bv = (b as any)[sort.col] ?? ''
      if (av === bv) return 0
      if (sort.dir === 'asc') return av > bv ? 1 : -1
      return av < bv ? 1 : -1
    })
    return s
  }, [filtered, sort])

  const counts = useMemo<{
    total: number
    I: number
    II: number
    III: number
    IV: number
  }>(()=>{
    const total = rows.length
    const map: Record<string, number> = { I:0, II:0, III:0, IV:0 }
    for (const r of rows) {
      const { label } = calcNivel(r)
      if (label && map.hasOwnProperty(label)) map[label] = (map[label]||0)+1
    }
    return { total, I: map.I||0, II: map.II||0, III: map.III||0, IV: map.IV||0 }
  }, [rows])

  function toggleLevel(lv: string) {
    setActiveLevel((cur)=> cur === lv ? null : lv)
  }

  function handleSort(col: string) {
    setSort((s)=> {
      if (s.col !== col) return { col, dir: 'asc' }
      if (s.dir === 'asc') return { col, dir: 'desc' }
      return { col, dir: null }
    })
  }

  function handleExportAll() { exportToExcel(rows) }
  function handleExportRow(r: RecordType) { exportToExcel(r) }

  function handleDelete(r: RecordType) { setDeleteTarget(r); setConfirmOpen(true) }
  function confirmDelete() {
    if (!deleteTarget) return
    setRows((prev)=> prev.filter(p=> p.id !== deleteTarget.id))
    setConfirmOpen(false)
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10" style={{background:'#1a5c2a'}}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">MR</div>
            <div>
              <div className="font-semibold">Matriz de Riesgos</div>
              <div className="text-xs opacity-80">{(user as any)?.organizacion || 'Organización'} — v1</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-medium">{(user?.nombre||'U').split(' ').map((p:string)=>p[0]).slice(0,2).join('')}</div>
            <div className="text-sm text-white text-right">
              <div className="font-medium">{user?.nombre || 'Usuario'}</div>
              <div className="text-xs opacity-80">{(user as any)?.rol || 'Rol'}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <CardKPI label={`Total Riesgos`} value={counts.total} active={activeLevel===null} onClick={()=>{ setActiveLevel(null) }} color="#06b6d4" percent={0} />
          <CardKPI label={`Riesgo Muy Alto — I`} value={counts.I} active={activeLevel==='I'} onClick={()=> toggleLevel('I')} color="#b71c1c" percent={counts.I/counts.total} />
          <CardKPI label={`Riesgo Alto — II`} value={counts.II} active={activeLevel==='II'} onClick={()=> toggleLevel('II')} color="#c0392b" percent={counts.II/counts.total} />
          <CardKPI label={`Riesgo Medio — III`} value={counts.III} active={activeLevel==='III'} onClick={()=> toggleLevel('III')} color="#f39c12" percent={counts.III/counts.total} />
          <CardKPI label={`Riesgo Bajo — IV`} value={counts.IV} active={activeLevel==='IV'} onClick={()=> toggleLevel('IV')} color="#27ae60" percent={counts.IV/counts.total} />
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-xs text-slate-500">Buscar</div>
              <Input placeholder="Buscar proceso, zona, cargo o clasificación" value={search} onChange={(e:any)=> setSearch(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-slate-500">Tipo</div>
              <select className="p-2 border rounded" value={tipoFilter} onChange={(e)=> setTipoFilter(e.target.value)}>
                <option value="">Tipo: Todos</option>
                {tipos.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-slate-500">Responsable</div>
              <Input placeholder="Responsable" value={responsable} onChange={(e:any)=> setResponsable(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-slate-500">Clasificación</div>
              <select className="p-2 border rounded" value={clasFilter} onChange={(e)=> setClasFilter(e.target.value)}>
                <option value="">Clasificación: Todas</option>
                {clasificaciones.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="text-xs text-slate-500">Desde</div>
                <Input type="date" value={fechaDesde||''} onChange={(e:any)=> setFechaDesde(e.target.value || null)} />
              </div>
              <div className="flex flex-col">
                <div className="text-xs text-slate-500">Hasta</div>
                <Input type="date" value={fechaHasta||''} onChange={(e:any)=> setFechaHasta(e.target.value || null)} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={()=> router.push('/matriz/nuevo')} style={{background:'#1a5c2a', color:'#fff'}}>+ Nuevo Riesgo</Button>
          </div>
        </div>

        {/* active filter chips */}
        <div className={`mb-4 ${(!search && !tipoFilter && !clasFilter && !fechaDesde && !fechaHasta && !activeLevel) ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2">
            {search && <FilterChip label={`Área/Proceso: ${search}`} onClear={()=> setSearch('')} /> }
            {responsable && <FilterChip label={`Responsable: ${responsable}`} onClear={()=> setResponsable('')} /> }
            {tipoFilter && <FilterChip label={`Tipo: ${tipoFilter}`} onClear={()=> setTipoFilter('')} /> }
            {clasFilter && <FilterChip label={`Clasificación: ${clasFilter}`} onClear={()=> setClasFilter('')} /> }
            {(fechaDesde || fechaHasta) && <FilterChip label={`Desde: ${fechaDesde || '—'} Hasta: ${fechaHasta || '—'}`} onClear={()=> { setFechaDesde(null); setFechaHasta(null) }} /> }
            {activeLevel && <FilterChip label={`Nivel: ${activeLevel}`} onClear={()=> setActiveLevel(null)} /> }
          </div>
        </div>

        <div className="bg-white border" style={{borderWidth:0.5, borderRadius:12}}>
          <Table>
            <TableHeader>
              <tr>
                <TableHead onClick={()=> handleSort('id')}>#</TableHead>
                <TableHead onClick={()=> handleSort('tipo_proceso')}>Tipo</TableHead>
                <TableHead onClick={()=> handleSort('proceso')}>Proceso</TableHead>
                <TableHead onClick={()=> handleSort('zona')}>Zona / Lugar</TableHead>
                <TableHead onClick={()=> handleSort('clasificacion')}>Clasificación</TableHead>
                <TableHead onClick={()=> handleSort('cargo')}>Cargo</TableHead>
                <TableHead onClick={()=> handleSort('nivel_riesgo')}>Nivel Riesgo</TableHead>
                <TableHead onClick={()=> handleSort('fecha')}>Fecha Elaboración</TableHead>
                <TableHead>Acciones</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sorted.map((r, idx)=>{
                const { label } = calcNivel(r)
                const level = label || (r.interpretacion_nivel_riesgo || '')
                const color = levelInfo[level]?.color || '#9CA3AF'
                return (
                  <TableRow key={r.id} onClick={(e:any)=> { if ((e.target as HTMLElement).closest('[data-action]')) return; router.push(`/matriz/${r.id || 'nuevo'}`) }}>
                    <TableCell>#{r.id ?? idx+1}</TableCell>
                    <TableCell><Badge variant="outline">{r.tipo_proceso || '—'}</Badge></TableCell>
                    <TableCell className="font-medium">{r.proceso || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{r.zona || '—'}</TableCell>
                    <TableCell><Badge>{r.clasificacion || '—'}</Badge></TableCell>
                    <TableCell title={r.cargo || ''} className="truncate max-w-[140px]">{r.cargo || '—'}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div style={{width:14,height:14,background:color,borderRadius:999}}></div><div>{level ? (levelInfo[level]?.text || level) : '—'}</div></div></TableCell>
                    <TableCell>{r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" data-action>
                        <button title="Editar" onClick={(e:any)=> { e.stopPropagation(); router.push(`/matriz/${r.id}`) }} className="text-slate-500 hover:text-green-600"><PencilIcon size={16} /></button>
                        <button title="Exportar" onClick={(e:any)=> { e.stopPropagation(); handleExportRow(r) }} className="text-slate-500 hover:text-blue-600"><DownloadIcon size={16} /></button>
                        <button title="Eliminar" onClick={(e:any)=> { e.stopPropagation(); handleDelete(r) }} className="text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <tr>
                <td colSpan={6} className="px-2 py-2">{sorted.length} de {rows.length} registros</td>
                <td colSpan={3} className="px-2 py-2 text-right">Clic en una fila para editar</td>
              </tr>
            </TableFooter>
          </Table>
        </div>

        <ConfirmModal open={confirmOpen} title="¿Eliminar este registro?" message="¿Eliminar este registro? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={()=> setConfirmOpen(false)} />
      </main>
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string, onClear: ()=>void }) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded px-2 py-1 text-sm">
      <div>{label}</div>
      <button onClick={onClear} className="text-slate-500">✕</button>
    </div>
  )
}

function CardKPI({ label, value, onClick, color, active, percent }: { label: string, value: number, onClick: ()=>void, color?: string, active?: boolean, percent?: number }) {
  return (
    <div onClick={onClick} className={`cursor-pointer p-4 bg-white border`} style={{borderWidth: active ? 2 : 0.5, borderColor: active ? color : '#e5e7eb', borderRadius:12, boxShadow: active ? `0 4px 16px ${color}33` : 'none'}}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      <div className="h-1 bg-slate-100 mt-3 rounded overflow-hidden">
        <div style={{width: `${Math.round((percent||0)*100)}%`, height: '100%', background: color}} />
      </div>
    </div>
  )
}
