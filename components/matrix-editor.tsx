"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, TrashIcon, CopyIcon } from 'lucide-react'

function makeId(prefix = '') { return prefix + Math.random().toString(36).slice(2,9) }

// risk interpretation helpers (GTC-45 rules)
function interpProbabilidad(np: number) {
  if (!np) return { label: '—', color: '#9CA3AF' }
  if (np >= 24 && np <= 40) return { label: 'Muy Alto', color: '#c0392b' }
  if (np >= 10 && np <= 23) return { label: 'Alto', color: '#c0392b' }
  if (np >= 6 && np <= 9) return { label: 'Medio', color: '#f59e0b' }
  if (np >= 2 && np <= 5) return { label: 'Bajo', color: '#27ae60' }
  return { label: String(np), color: '#9CA3AF' }
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '—', color: '#9CA3AF' }
  if (nr >= 4000 && nr <= 6000) return { label: 'I', color: '#c0392b' }
  if (nr >= 150 && nr <= 500) return { label: 'II', color: '#f59e0b' }
  if (nr >= 40 && nr <= 120) return { label: 'III', color: '#27ae60' }
  if (nr >= 10 && nr <= 20) return { label: 'IV', color: '#27ae60' }
  // catch-all mapping
  if (nr >= 501) return { label: 'I', color: '#c0392b' }
  if (nr >= 121 && nr <= 500) return { label: 'II', color: '#f59e0b' }
  return { label: String(nr), color: '#9CA3AF' }
}

function renderPeligroBadge(nrVal: number) {
  if (!nrVal) return null;
  const label = interpNivelRiesgo(nrVal).label;
  if (label === 'I') return { dot: '#a50000', bg: '#fce8e8', text: 'Muy alto' };
  if (label === 'II') return { dot: '#dc3545', bg: '#fdecea', text: 'Alto' };
  if (label === 'III') return { dot: '#fd7e14', bg: '#fff3e0', text: 'Medio' };
  if (label === 'IV') return { dot: '#198754', bg: '#e8f5e9', text: 'Bajo' };
  return null;
}

function aceptabilidadFromNivel(label: string) {
  switch (label) {
    case 'I': return 'No Aceptable'
    case 'II': return 'Aceptable con Control Especifico'
    case 'III': return 'Mejorable'
    case 'IV': return 'Aceptable'
    default: return '—'
  }
}

function aceptabilidadColor(text: string) {
  if (text.includes('No Aceptable')) return '#c0392b' // Rojo
  if (text.includes('Control Especifico')) return '#f59e0b' // Amarillo
  if (text.includes('Mejorable') || text.includes('Aceptable')) return '#27ae60' // Verde
  return '#9CA3AF'
}

function shortFileName(n: string, maxBase = 12) {
  if (!n) return ''
  const idx = n.lastIndexOf('.')
  const ext = idx > 0 ? n.slice(idx) : ''
  const base = idx > 0 ? n.slice(0, idx) : n
  if (base.length > maxBase) return base.slice(0, maxBase - 2) + '…' + ext
  return base + ext
}

export default function MatrixEditor({ id }: { id?: string }) {
  const router = useRouter()
  const [matrix, setMatrix] = useState<any>(null)
  const [selected, setSelected] = useState<{procesoId?: string, zonaId?: string, actividadId?: string}>({})

  useEffect(() => {
    if (id && id !== 'nuevo') {
      fetch(`/api/riesgos/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            toast({ title: 'Error', variant: 'destructive', description: data.error })
            router.push('/dashboard')
          } else {
            setMatrix(data)
            const p = data.procesos?.[0]
            const z = p?.zonas?.[0]
            const a = z?.actividades?.[0]
            setSelected({ procesoId: p?.id, zonaId: z?.id, actividadId: a?.id })
          }
        })
        .catch(e => {
          toast({ title: 'Error', variant: 'destructive', description: 'No se pudo cargar la matriz' })
          router.push('/dashboard')
        })
    } else {
      setMatrix({
        id: makeId('m-'),
        area: '',
        responsable: '',
        fecha_elaboracion: new Date().toISOString().split('T')[0],
        fecha_actualizacion: new Date().toISOString().split('T')[0],
        procesos: []
      })
    }
  }, [id, router])

  const [showProcesoModal, setShowProcesoModal] = useState(false)
  const [editingProceso, setEditingProceso] = useState<any>(null)
  const [showActividadModal, setShowActividadModal] = useState(false)
  const [editingActividad, setEditingActividad] = useState<any>(null)
  const [actividadTarget, setActividadTarget] = useState<{procesoId?:string,zonaId?:string}|null>(null)
  const [showZonaModal, setShowZonaModal] = useState(false)
  const [editingZona, setEditingZona] = useState<any>(null)
  const [zonaParentProcesoId, setZonaParentProcesoId] = useState<string | null>(null)
  const [zonaModalName, setZonaModalName] = useState('')
  const [zonaModalCargo, setZonaModalCargo] = useState('')
  const [zonaModalRutinario, setZonaModalRutinario] = useState(false)
  const [zonaModalActivities, setZonaModalActivities] = useState<Array<{id:string,nombre:string,tareas:string}>>([])
  const [expandedZonaIds, setExpandedZonaIds] = useState<Record<string, boolean>>({})
  const [showFilesModal, setShowFilesModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name:string,type:string,size:number,data:string}>>([])
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // helpers to mutate matrix immutably
  function updateMatrix(fn: (m: any) => any) {
    setMatrix((m: any) => {
      const next = fn(JSON.parse(JSON.stringify(m)))
      return next
    })
  }

  function addProceso() {
    setEditingProceso(null)
    setShowProcesoModal(true)
  }

  function saveProceso(name: string) {
    if (!name) return setShowProcesoModal(false)
    if (editingProceso && editingProceso.id) {
      updateMatrix((m: any) => {
        m.procesos = m.procesos.map((p: any) => p.id === editingProceso.id ? { ...p, nombre: name } : p)
        return m
      })
      setShowProcesoModal(false)
      return
    }

    const newProcesoId = makeId('p-')
    updateMatrix((m: any) => {
      m.procesos.push({ id: newProcesoId, nombre: name, zonas: [] })
      return m
    })
    // select the new proceso so user can add zonas
    setSelected({ procesoId: newProcesoId, zonaId: undefined, actividadId: undefined })
    setShowProcesoModal(false)
  }

  function editProceso(p: any) { setEditingProceso(p); setShowProcesoModal(true) }

  function addZona(procesoId: string) {
    // open Zona creation modal so user can fill name, cargo and add actividades
    const p = matrix?.procesos?.find((x: any) => x.id === procesoId)
    setEditingZona(null)
    setZonaParentProcesoId(procesoId)
    setZonaModalName(`Zona ${ (p?.zonas?.length||0) + 1 }`)
    setZonaModalCargo('')
    setZonaModalRutinario(false)
    setZonaModalActivities([])
    setShowZonaModal(true)
  }

  function editZonaItem(procesoId: string, z: any) {
    setEditingZona(z)
    setZonaParentProcesoId(procesoId)
    setZonaModalName(z.nombre || '')
    setZonaModalCargo(z.cargo || '')
    setZonaModalRutinario(!!z.rutinario)
    setZonaModalActivities([]) // We don't edit child activities here
    setShowZonaModal(true)
  }

  function addActividadToZonaModal(name = '', tareas = '') {
    setZonaModalActivities((cur) => [...cur, { id: makeId('ma-'), nombre: name || `Actividad ${cur.length+1}`, tareas: tareas || '' }])
  }

  function removeActividadFromZonaModal(id: string) {
    setZonaModalActivities((cur) => cur.filter(a => a.id !== id))
  }

  function saveZonaModal() {
    if (!zonaParentProcesoId) { setShowZonaModal(false); return }
    
    if (editingZona) {
      updateMatrix((m: any) => {
        const p = m.procesos.find((x: any) => x.id === zonaParentProcesoId)
        const z = p.zonas.find((x: any) => x.id === editingZona.id)
        if (z) {
          z.nombre = zonaModalName
          z.cargo = zonaModalCargo
          z.rutinario = !!zonaModalRutinario
        }
        return m
      })
      setShowZonaModal(false)
      setZonaParentProcesoId(null)
      setEditingZona(null)
      return
    }

    const newZonaId = makeId('z-')
    const actividadIds = (zonaModalActivities||[]).map(a => ({ id: makeId('a-'), nombre: a.nombre, tareas: a.tareas || '' }))
    updateMatrix((m: any) => {
      const p = m.procesos.find((x: any) => x.id === zonaParentProcesoId)
      const newZona = { id: newZonaId, nombre: zonaModalName || `Zona ${ (p?.zonas?.length||0) + 1 }`, cargo: zonaModalCargo || '', actividades: actividadIds.map(a => ({ id: a.id, nombre: a.nombre, tareas: a.tareas || '', cargo: '', rutinario: false, peligros: [] })), rutinario: !!zonaModalRutinario }
      p.zonas.push(newZona)
      return m
    })
    // do NOT select the new zona yet; user should add/select an actividad to edit details
    setSelected({ procesoId: zonaParentProcesoId })
    setShowZonaModal(false)
    setZonaParentProcesoId(null)
    setZonaModalActivities([])
  }

  function removeProceso(procesoId: string) {
    if (!confirm('Eliminar proceso?')) return
    updateMatrix((m: any) => {
      m.procesos = m.procesos.filter((p: any) => p.id !== procesoId)
      if (selected.procesoId === procesoId) {
        const np = m.procesos[0]
        const nz = np?.zonas?.[0]
        const na = nz?.actividades?.[0]
        setSelected({ procesoId: np?.id, zonaId: nz?.id, actividadId: na?.id })
      }
      return m
    })
  }

  function removeZona(procesoId: string, zonaId: string) {
    if (!confirm('Eliminar zona?')) return
    updateMatrix((m: any) => {
      const p = m.procesos.find((x: any) => x.id === procesoId)
      p.zonas = p.zonas.filter((z: any) => z.id !== zonaId)
      if (selected.zonaId === zonaId) setSelected({ procesoId, zonaId: p.zonas?.[0]?.id })
      return m
    })
  }

  function openAddActividadModal(procesoId: string, zonaId: string) {
    // create actividad automatically with default name (Actividad N)
    const newId = makeId('a-')
    updateMatrix((m: any) => {
      const z = m.procesos.find((x:any)=>x.id===procesoId).zonas.find((y:any)=>y.id===zonaId)
      z.actividades = z.actividades || []
      const nueva = { id: newId, nombre: `Actividad ${ (z.actividades.length||0) + 1 }`, descripcion: '', tareas:'', cargo:'', rutinario:false, peligros: [] }
      z.actividades.push(nueva)
      return m
    })
    setExpandedZonaIds(s=>({...s, [zonaId]: true}))
    setSelected({ procesoId, zonaId, actividadId: newId })
  }

  function saveActividad(name: string) {
    if (!actividadTarget) return setShowActividadModal(false)
    const { procesoId, zonaId } = actividadTarget
    const newActividadId = makeId('a-')
    updateMatrix((m: any) => {
      const z = m.procesos.find((x:any)=>x.id===procesoId).zonas.find((y:any)=>y.id===zonaId)
      const nueva = { id: newActividadId, nombre: name || `Actividad ${ (z.actividades?.length||0)+1 }`, descripcion:'', tareas:'', cargo:'', rutinario:false, peligros: [ ] }
      z.actividades = z.actividades || []
      z.actividades.push(nueva)
      return m
    })
    // select the new actividad immediately
    setSelected({ procesoId: actividadTarget.procesoId, zonaId: actividadTarget.zonaId, actividadId: newActividadId })
    setShowActividadModal(false)
    setActividadTarget(null)
  }

  function editActividad(procesoId: string, zonaId: string, actividad: any) {
    setEditingActividad({ ...actividad, procesoId, zonaId })
    setActividadTarget({procesoId, zonaId})
    setShowActividadModal(true)
  }

  function saveEditedActividad(name: string) {
    if (!editingActividad) return setShowActividadModal(false)
    updateMatrix((m:any)=>{
      const z = m.procesos.find((x:any)=>x.id===editingActividad.procesoId).zonas.find((y:any)=>y.id===editingActividad.zonaId)
      const a = z.actividades.find((aa:any)=>aa.id===editingActividad.id)
      if (a) a.nombre = name
      return m
    })
    setShowActividadModal(false)
    setEditingActividad(null)
    setActividadTarget(null)
  }

  function addPeligro(procesoId: string, zonaId: string, actividadId: string) {
    updateMatrix((m: any) => {
      const a = m.procesos.find((x: any)=> x.id===procesoId).zonas.find((y:any)=>y.id===zonaId).actividades.find((aa:any)=>aa.id===actividadId)
      a.peligros.push({ id: makeId('r-'), descripcion: '', clasificacion: '', efectos: '', controles: { fuente:'', medio:'', individuo:'' }, evaluacion: { nd: null, ne: null, nc: null, np: null, nr: null, interp_np: '', interp_nr: '', nivel_riesgo: '', aceptabilidad: '' }, criterios: { num_expuestos: null, peor_consecuencia: '', requisito_legal: false }, intervencion: { eliminacion:'', sustitucion:'', controles_ingenieria:'', controles_administrativos:'', epp:'', responsable:'', fecha_ejecucion:'' }, _ui: { expanded: true, activeTab: 0 } })
      return m
    })
  }

  function removePeligro(procesoId: string, zonaId: string, actividadId: string, peligroId: string) {
    if (!confirm('Eliminar peligro?')) return
    updateMatrix((m: any) => {
      const a = m.procesos.find((x: any)=> x.id===procesoId).zonas.find((y:any)=>y.id===zonaId).actividades.find((aa:any)=>aa.id===actividadId)
      a.peligros = a.peligros.filter((p: any) => p.id !== peligroId)
      return m
    })
  }
  function duplicatePeligro(procesoId: string, zonaId: string, actividadId: string, peligroId: string) {
    updateMatrix((m:any)=>{
      const a = m.procesos.find((x:any)=>x.id===procesoId).zonas.find((y:any)=>y.id===zonaId).actividades.find((aa:any)=>aa.id===actividadId)
      const peligroToDuplicate = a.peligros.find((p:any)=> p.id === peligroId)
      if (!peligroToDuplicate) return m
      const newPeligro = JSON.parse(JSON.stringify(peligroToDuplicate))
      newPeligro.id = makeId('r-')
      newPeligro._ui = { expanded: false, activeTab: 0 }
      a.peligros.push(newPeligro)
      return m
    })
    toast({ title: 'Éxito', description: 'Peligro duplicado correctamente' })
  }  function updatePeligroField(procesoId: string, zonaId: string, actividadId: string, riesgoId: string, path: string[], value: any) {
    updateMatrix((m: any) => {
      const a = m.procesos.find((x: any)=> x.id===procesoId).zonas.find((y:any)=>y.id===zonaId).actividades.find((aa:any)=>aa.id===actividadId)
      const r = a.peligros.find((p: any) => p.id === riesgoId)
      let cur: any = r
      for (let i=0;i<path.length-1;i++) { cur = cur[path[i]] }
      cur[path[path.length-1]] = value

      // If evaluation fields updated, recalc
      const nd = Number(r.evaluacion.nd || 0)
      const ne = Number(r.evaluacion.ne || 0)
      const nc = Number(r.evaluacion.nc || 0)
      const np = (!nd || !ne) ? 0 : nd * ne
      const nr = (!np || !nc) ? 0 : np * nc
      r.evaluacion.np = np
      r.evaluacion.nr = nr
      r.evaluacion.interp_np = interpProbabilidad(np).label
      r.evaluacion.interp_nr = interpNivelRiesgo(nr).label
      r.evaluacion.nivel_riesgo = interpNivelRiesgo(nr).label
      // compute aceptabilidad from nivel
      const nivelLabel = interpNivelRiesgo(nr).label
      r.evaluacion.aceptabilidad = nivelLabel ? aceptabilidadFromNivel(nivelLabel) : ''
      return m
    })
  }

  function removeActividad(procesoId: string, zonaId: string, actividadId: string) {
    if (!confirm('Eliminar actividad?')) return
    updateMatrix((m:any)=>{
      const z = m.procesos.find((x:any)=>x.id===procesoId).zonas.find((y:any)=>y.id===zonaId)
      z.actividades = z.actividades.filter((a:any)=> a.id !== actividadId)
      if (selected.actividadId === actividadId) setSelected({ procesoId, zonaId, actividadId: z.actividades?.[0]?.id })
      return m
    })
  }

  const stats = useMemo(() => {
    if (!matrix) return { zonas: 0, peligros: 0 }
    const zonas = (matrix.procesos || []).reduce((acc: number, p: any) => acc + (p.zonas?.length||0), 0)
    const peligros = (matrix.procesos || []).reduce((acc: number, p: any) => acc + (p.zonas?.reduce((a:number,z:any)=> a + (z.actividades?.reduce((aa:number,act:any)=> aa + (act.peligros?.length||0),0)||0),0)||0), 0)
    return { zonas, peligros }
  }, [matrix])

  async function saveMatrix() {
    try {
      const isNew = String(matrix.id).startsWith('m-') || id === 'nuevo'
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/riesgos' : `/api/riesgos/${matrix.id}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix)
      })

      if (!res.ok) {
        throw new Error('Error al guardar en el servidor')
      }

      toast({ title: 'Éxito', description: 'La matriz se ha guardado correctamente en la base de datos.' })
      router.push('/dashboard')
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', variant: 'destructive', description: err.message || 'No se pudo guardar la matriz' })
    }
  }

  async function handleExportMatrix() {
    try {
      if (!matrix.id || String(matrix.id).startsWith('m-')) {
        toast({ title: 'Aviso', description: 'Por favor, guarda la matriz primero antes de exportar.' })
        return
      }
      
      // Fetch the full matrix data from API
      const res = await fetch(`/api/riesgos/${matrix.id}`)
      if (!res.ok) throw new Error('No se pudo obtener los datos de la matriz')
      const matrizData = await res.json()
      
      // Export to Excel
      await exportMatrizToExcel(matrizData)
      toast({ title: 'Éxito', description: 'La matriz se ha exportado correctamente a Excel.' })
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', variant: 'destructive', description: err.message || 'No se pudo exportar la matriz' })
    }
  }

  function exportJson() { const s = JSON.stringify(matrix, null, 2); const blob = new Blob([s], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `matrix_${matrix.id}.json`; a.click(); URL.revokeObjectURL(url) }

  async function handleFilesInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const read = await Promise.all(files.map((f) => new Promise<any>((res) => {
      const fr = new FileReader()
      fr.onload = () => res({ name: f.name, type: f.type, size: f.size, data: String(fr.result) })
      fr.readAsDataURL(f)
    })))
    setUploadedFiles((cur) => [...cur, ...read])
  }

  function removeUploadedFile(index: number) {
    setUploadedFiles((cur) => {
      const copy = [...cur]
      copy.splice(index, 1)
      return copy
    })
    setSelectedPreviewIndex((cur) => (cur === index ? null : cur && cur > index ? cur - 1 : cur))
  }

  function decodeDataUrl(dataUrl: string) {
    try {
      const parts = dataUrl.split(',')
      if (parts.length < 2) return ''
      const meta = parts[0]
      const isBase64 = meta.indexOf(';base64') !== -1
      const payload = parts[1]
      if (isBase64) {
        // atob may throw for very large binaries; wrap in try
        try { return atob(payload) } catch (e) { return '' }
      }
      return decodeURIComponent(payload)
    } catch (e) { return '' }
  }

  function getPreviewSnippet(f: {name:string,type:string,size:number,data:string}) {
    if (!f.data) return null
    if (f.type.startsWith('image/')) return null
    if (f.type.startsWith('text/') || f.type === 'application/json') {
      const txt = decodeDataUrl(f.data)
      return txt ? txt.slice(0, 1000) : null
    }
    return null
  }

  function saveFilesToMatrix() {
    if (!uploadedFiles || uploadedFiles.length === 0) { setShowFilesModal(false); return }
    updateMatrix((m:any)=>{
      m.files = m.files || []
      m.files = m.files.concat(uploadedFiles)
      return m
    })
    setUploadedFiles([])
    setShowFilesModal(false)
  }

  const currentProceso = matrix?.procesos?.find((p: any) => p.id === selected.procesoId)
  const currentZona = currentProceso?.zonas?.find((z: any) => z.id === selected.zonaId)
  const currentActividad = currentZona?.actividades?.find((a: any) => a.id === selected.actividadId)

  if (!matrix) {
    return (
      <div className="flex bg-white items-center justify-center p-8 text-slate-500 h-screen w-full">
        Cargando matriz de riesgos...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-800">
      {/* Top bar */}
      <div className="sticky top-0 px-4 py-3 flex items-center gap-4 z-10" style={{background:'#ffffff', borderBottom: '0.5px solid #d4e8d4'}}>
        <div className="flex items-center gap-2">
          <img src="/csmLOGO_1_.png" style={{ height: '38px', objectFit: 'contain' }} alt="Logo" />
          <div style={{ width: '0.5px', height: '30px', background: '#c8dfc8', margin: '0 4px' }} />
          <Button variant="ghost" style={{color: '#1a5c2a'}} onClick={() => router.push('/dashboard')}>Volver</Button>
        </div>
        <div className="flex-1 flex items-center gap-3 justify-center text-[#1a5c2a]">
            <div className="text-xs font-medium">Área / Proceso</div>
            <Input style={{background: '#f4faf4', border: '0.5px solid #c8dfc8', color: '#1a5c2a'}} value={matrix.area} onChange={(e:any)=> updateMatrix((m:any)=>{ m.area = e.target.value; return m })} />
            <div className="text-xs font-medium">Responsable</div>
            <Input style={{background: '#f4faf4', border: '0.5px solid #c8dfc8', color: '#1a5c2a'}} value={matrix.responsable} onChange={(e:any)=> updateMatrix((m:any)=>{ m.responsable = e.target.value; return m })} />
            <div className="text-xs font-medium">Fecha Elaboración</div>
            <Input type="date" style={{background: '#f4faf4', border: '0.5px solid #c8dfc8', color: '#1a5c2a'}} value={matrix.fecha_elaboracion} onChange={(e:any)=> updateMatrix((m:any)=>{ m.fecha_elaboracion = e.target.value; return m })} />
            <div className="text-xs font-medium">Fecha Actualización</div>
            <Input type="date" style={{background: '#f4faf4', border: '0.5px solid #c8dfc8', color: '#1a5c2a'}} value={matrix.fecha_actualizacion} onChange={(e:any)=> updateMatrix((m:any)=>{ m.fecha_actualizacion = e.target.value; return m })} />
        
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={saveMatrix}>Guardar</Button>
          <Button onClick={handleExportMatrix} variant="outline">Exportar Excel</Button>
        </div>
      </div>

                <div className="p-4 flex items-start gap-6">
                  <aside className="w-80 mr-6">
                    <div style={{ border: '0.5px solid #dde8dd', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#2d7a40', color: '#fff' }}>
                        <div className="font-semibold text-sm">Procesos</div>
                        <Button size="sm" variant="secondary" className="bg-white text-[#2d7a40] hover:bg-slate-100" onClick={addProceso}>+ Proceso</Button>
                      </div>
                      <div className="p-4 space-y-3">
                    { (matrix.procesos || []).map((p: any) => (
                      <div key={p.id} className="border rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium bg-[#2d7a40] text-white px-2 py-1 rounded">{p.nombre}</div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={()=>addZona(p.id)}>+ Zona</Button>
                            <button onClick={()=>editProceso(p)} className="text-slate-500 hover:text-slate-700" aria-label="Editar proceso"><PencilIcon size={14} /></button>
                            <button onClick={()=>removeProceso(p.id)} className="text-red-400 hover:text-red-700" aria-label="Eliminar proceso"><TrashIcon size={14} /></button>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          {(p.zonas||[]).map((z: any) => {
                            const worst = (z.peligros||[]).reduce((acc:number, r:any) => Math.max(acc, Number(r.evaluacion?.nr||0)), 0)
                            const pill = interpNivelRiesgo(worst)
                            const expanded = !!expandedZonaIds[z.id]
                            return (
                              <div key={z.id} className={`border rounded ${selected.zonaId===z.id? 'bg-slate-50':''}`}>
                                <div className={`flex items-center justify-between p-2 cursor-pointer ${selected.zonaId===z.id? 'bg-slate-100':''}`} onClick={() => setSelected({ procesoId: p.id, zonaId: z.id })}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="text-sm bg-[#2d7a40] text-white px-2 py-1 rounded cursor-pointer"
                                        onClick={(e:any) => { e.stopPropagation(); setExpandedZonaIds(s=>({...s, [z.id]: !expanded})); setSelected({ procesoId: p.id, zonaId: z.id }) }}
                                        title={expanded ? 'Ocultar actividades' : 'Mostrar actividades'}
                                      >
                                        {z.nombre}
                                      </div>
                                      <button onClick={(e:any)=>{ e.stopPropagation(); editZonaItem(p.id, z) }} className="text-slate-400 hover:text-slate-700 ml-1" title="Editar zona">
                                        <PencilIcon size={12} />
                                      </button>
                                      <button onClick={(e:any)=>{ e.stopPropagation(); removeZona(p.id, z.id) }} className="text-red-400 hover:text-red-700 ml-1" title="Eliminar zona">
                                        <TrashIcon size={12} />
                                      </button>
                                    </div>
                                </div>
                                {expanded && (
                                  <div className="pl-6 pr-2 pb-2">
                                    <div className="space-y-1">
                                      {(z.actividades||[]).map((a: any) => (
                                        <div key={a.id} className={`flex items-center justify-between p-2 rounded cursor-pointer ${selected.actividadId===a.id? 'bg-slate-100':''}`} onClick={() => setSelected({ procesoId: p.id, zonaId: z.id, actividadId: a.id })}>
                                          <div className="flex items-center gap-2">
                                            <div className="text-sm">{a.nombre}</div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button aria-label="Editar actividad" className="text-slate-500 text-sm" onClick={(e:any)=>{ e.stopPropagation(); editActividad(p.id, z.id, a) }}>
                                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9"></path>
                                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                                              </svg>
                                            </button>
                                            <button aria-label="Eliminar actividad" className="text-red-400 hover:text-red-600 text-sm ml-1" onClick={(e:any)=>{ e.stopPropagation(); removeActividad(p.id, z.id, a.id) }}>
                                              <TrashIcon size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="pt-1">
                                        <button className="w-full text-left text-sm text-slate-600 p-2 rounded border" onClick={(e:any)=>{ e.stopPropagation(); openAddActividadModal(p.id, z.id) }}>+ Agregar actividad</button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )) }
                  </div>
                </div>
                  

          <div className="mt-6 pt-4">
            <div style={{ border: '0.5px solid #dde8dd', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
              <div className="flex flex-row items-center justify-between px-4 py-2" style={{ background: '#2d7a40', color: '#fff' }}>
                <div className="font-semibold text-sm">Archivos</div>
                <Button size="sm" variant="outline" style={{border: '0.5px solid #b2d8b2', color: '#1a5c2a', background: '#e8f5e9'}} onClick={()=> setShowFilesModal(true)}>Añadir Archivos</Button>
              </div>
              <div className="p-4">
                {(!(matrix.files && matrix.files.length)) ? (
                  <div className="text-sm text-slate-500">No hay archivos adjuntos a esta matriz.</div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(matrix.files || []).map((f: any, i: number) => (
                      <div key={i} className="w-28 p-2 flex flex-col items-center bg-white rounded shadow-sm border relative group">
                        <button onClick={() => updateMatrix((m:any)=>{ m.files.splice(i,1); return m })} className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200" title="Eliminar archivo">
                          <TrashIcon size={12} />
                        </button>
                        {f.type?.startsWith('image/') ? (
                          <img src={f.data} alt={f.name} className="w-20 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-20 h-14 flex items-center justify-center bg-slate-100 rounded text-xs font-medium">{(f.name||'FILE').split('.').pop()?.toUpperCase() || 'FILE'}</div>
                        )}
                        <div className="text-xs mt-2 text-center text-slate-700 truncate w-full">{shortFileName(f.name)}</div>
                        <div className="mt-1 flex gap-2">
                          <a href={f.data} download={f.name} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">Descargar</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {!currentActividad ? (
            <div className="h-60 flex items-center justify-center border-dashed border-2 rounded text-slate-500">Selecciona una actividad del panel izquierdo para comenzar.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">{currentProceso?.nombre} › {currentZona?.nombre} › {currentActividad?.nombre}</div>
                <div><Button variant="destructive" onClick={() => removeActividad(currentProceso.id, currentZona.id, currentActividad.id)}>Eliminar actividad</Button></div>
              </div>

                      <Card className="flex flex-col gap-0 overflow-hidden p-0 border border-[#dde8dd] shadow-sm">
                        <CardHeader className="flex items-center bg-[#2d7a40] text-white px-4 py-3 mt-0 min-h-[48px]"><CardTitle className="text-sm font-semibold">Información de la Actividad</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 mt-0">
                    <div className="col-span-2">
                      <div style={{ color: '#2d7a40', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">Actividades</div>
                      <Textarea rows={3} value={currentActividad.descripcion||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updateMatrix((m:any)=>{ const a = m.procesos.find((p:any)=>p.id===currentProceso.id).zonas.find((zz:any)=>zz.id===currentZona.id).actividades.find((aa:any)=>aa.id===currentActividad.id); if (a) a.descripcion = e.target.value; return m })} />
                    </div>
                    <div className="col-span-2">
                      <div style={{ color: '#2d7a40', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">Tareas</div>
                      <Textarea rows={2} value={currentActividad.tareas||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updateMatrix((m:any)=>{ const a = m.procesos.find((p:any)=>p.id===currentProceso.id).zonas.find((zz:any)=>zz.id===currentZona.id).actividades.find((aa:any)=>aa.id===currentActividad.id); if (a) a.tareas = e.target.value; return m })} />
                    </div>
                    <div>
                      <div style={{ color: '#2d7a40', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">Cargo</div>
                      <Input value={currentActividad.cargo||''} onChange={(e:any)=> updateMatrix((m:any)=>{ const a = m.procesos.find((p:any)=>p.id===currentProceso.id).zonas.find((zz:any)=>zz.id===currentZona.id).actividades.find((aa:any)=>aa.id===currentActividad.id); if (a) a.cargo = e.target.value; return m })} />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <div style={{ color: '#2d7a40', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">Rutinario</div>
                      <div className="flex items-center gap-2">
                        <Switch checked={!!currentActividad.rutinario} onCheckedChange={(v:boolean)=> updateMatrix((m:any)=>{ const a = m.procesos.find((p:any)=>p.id===currentProceso.id).zonas.find((zz:any)=>zz.id===currentZona.id).actividades.find((aa:any)=>aa.id===currentActividad.id); if (a) a.rutinario = v; return m })} />
                        <div>{currentActividad.rutinario ? 'Sí' : 'No'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

                  <Card className="flex flex-col gap-0 overflow-hidden p-0 border border-[#dde8dd] shadow-sm">
                <CardHeader className="flex items-center justify-between bg-[#2d7a40] text-white px-4 py-3 mt-0 min-h-[48px]"><CardTitle className="text-sm font-semibold">Peligros</CardTitle><div><Badge className="bg-white/20 hover:bg-white/30 text-white">{currentActividad?.peligros?.length||0}</Badge> <Button size="sm" variant="secondary" className="bg-white text-[#2d7a40] hover:bg-slate-100 ml-2" onClick={() => addPeligro(currentProceso.id, currentZona.id, currentActividad?.id)}>+ Agregar peligro</Button></div></CardHeader>
                <CardContent className="p-4">
                  {(!currentActividad || !currentActividad.peligros || currentActividad.peligros.length===0) ? (
                    <div className="p-6 border-dashed border rounded text-slate-500">No hay peligros en esta actividad.</div>
                  ) : (
                    <div className="space-y-3">
                      {currentActividad.peligros.map((r: any, idx: number) => (
                        <div key={r.id} className="border rounded bg-[#fafcfa]">
                          <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['_ui','expanded'], !r._ui?.expanded)}>
                            <div className="flex items-center gap-3">
                              <div className="font-medium">Peligro {idx+1}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div style={{width:14,height:14,background: interpNivelRiesgo(Number(r.evaluacion?.nr||0)).color, borderRadius:999}}></div>
                              <button onClick={(e:any)=>{ e.stopPropagation(); duplicatePeligro(currentProceso.id, currentZona.id, currentActividad.id, r.id) }} className="text-slate-500 hover:text-slate-700" aria-label="Duplicar peligro"><CopyIcon size={14} /></button>
                              <button onClick={(e:any)=>{ e.stopPropagation(); removePeligro(currentProceso.id, currentZona.id, currentActividad.id, r.id) }} className="text-red-400 hover:text-red-700" aria-label="Eliminar peligro"><TrashIcon size={14} /></button>
                            </div>
                          </div>

                          {r._ui?.expanded && (
                            <div className="p-3 border-t">
                              <div className="flex gap-2 mb-3">
                                {['Descripción & Controles','Evaluación','Criterios','Intervención'].map((t, i) => (
                                  <button key={t} onClick={()=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['_ui','activeTab'], i)} className={`px-3 py-1 rounded ${r._ui?.activeTab===i? 'bg-green-600 text-white':'bg-background border'}`}>{t}</button>
                                ))}
                              </div>

                              {r._ui?.activeTab===0 && (
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <div className="text-xs">Descripción</div>
                                    <Textarea rows={3} value={r.descripcion||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['descripcion'], e.target.value)} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs">Clasificación</div>
                                      <Input placeholder="Ej: Físico, Químico..." value={r.clasificacion||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['clasificacion'], e.target.value)} />
                                    </div>
                                    <div>
                                      <div className="text-xs">Efectos posibles</div>
                                      <Textarea rows={2} value={r.efectos||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['efectos'], e.target.value)} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs font-medium">Controles existentes</div>
                                    <div className="grid grid-cols-1 gap-2">
                                      <Input placeholder="Fuente" value={r.controles?.fuente||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['controles','fuente'], e.target.value)} />
                                      <Textarea rows={2} placeholder="Medio" value={r.controles?.medio||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['controles','medio'], e.target.value)} />
                                      <Textarea rows={2} placeholder="Individuo" value={r.controles?.individuo||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['controles','individuo'], e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {r._ui?.activeTab===1 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-xs">Nivel Deficiencia (ND)</div>
                                    <select value={r.evaluacion?.nd ?? ''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['evaluacion','nd'], e.target.value?Number(e.target.value):null)} className="w-full p-2 border rounded">
                                      <option value="">Seleccionar</option>
                                      <option value={10}>10 (Muy alto)</option>
                                      <option value={6}>6 (Alto)</option>
                                      <option value={2}>2 (Medio)</option>
                                      <option value={1}>1 (Bajo)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <div className="text-xs">Nivel Exposición (NE)</div>
                                    <select value={r.evaluacion?.ne ?? ''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['evaluacion','ne'], e.target.value?Number(e.target.value):null)} className="w-full p-2 border rounded">
                                      <option value="">Seleccionar</option>
                                      <option value={4}>4 (Continua)</option>
                                      <option value={3}>3 (Frecuente)</option>
                                      <option value={2}>2 (Ocasional)</option>
                                      <option value={1}>1 (Esporádica)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <div className="text-xs">Nivel Probabilidad (NP)</div>
                                    <Input readOnly value={String(r.evaluacion?.np ?? '')} />
                                  </div>

                                  <div>
                                    <div className="text-xs">Nivel Consecuencia (NC)</div>
                                    <select value={r.evaluacion?.nc ?? ''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['evaluacion','nc'], e.target.value?Number(e.target.value):null)} className="w-full p-2 border rounded">
                                      <option value="">Seleccionar</option>
                                      <option value={100}>100 (Mortal o catastrófico)</option>
                                      <option value={60}>60 (Muy grave)</option>
                                      <option value={25}>25 (Grave)</option>
                                      <option value={10}>10 (Leve)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <div className="text-xs">Nivel Riesgo (NR)</div>
                                    <Input readOnly value={String(r.evaluacion?.nr ?? '')} />
                                  </div>

                                  <div className="md:col-span-3 mt-3 p-3 bg-slate-50 rounded">
                                    <div className="text-xs font-medium">Aceptabilidad Del Riesgo</div>
                                    <div className="mt-2 grid md:grid-cols-3 gap-4 items-center">
                                      <div className="flex flex-col">
                                        <div className="text-xs text-slate-600">Interpretación Nivel Probabilidad</div>
                                        <div className="mt-2"><span className="px-2 py-1 rounded" style={{background: interpProbabilidad(Number(r.evaluacion?.np||0)).color, color:'#fff'}}>{interpProbabilidad(Number(r.evaluacion?.np||0)).label}</span></div>
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="text-xs text-slate-600">Interpretación Nivel Riesgo</div>
                                        <div className="mt-2"><span className="px-2 py-1 rounded" style={{background: interpNivelRiesgo(Number(r.evaluacion?.nr||0)).color, color:'#fff'}}>{interpNivelRiesgo(Number(r.evaluacion?.nr||0)).label}</span></div>
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="text-xs text-slate-600">Aceptabilidad Del Riesgo</div>
                                        <div className="mt-2">
                                          {(() => {
                                            const aceptabilidadText = aceptabilidadFromNivel(r.evaluacion?.nivel_riesgo || interpNivelRiesgo(Number(r.evaluacion?.nr||0)).label)
                                            return <span className="px-2 py-1 rounded" style={{background: aceptabilidadColor(aceptabilidadText), color:'#fff'}}>{aceptabilidadText}</span>
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {r._ui?.activeTab===2 && (
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs">Número de Expuestos</div>
                                      <Input type="number" value={r.criterios?.num_expuestos||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['criterios','num_expuestos'], e.target.value?Number(e.target.value):null)} />
                                    </div>
                                    <div>
                                      <div className="text-xs">Existencia de Requisito Legal</div>
                                      <div className="flex items-center gap-2">
                                        <Switch checked={!!r.criterios?.requisito_legal} onCheckedChange={(v:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['criterios','requisito_legal'], !!v)} />
                                        <div>{r.criterios?.requisito_legal ? 'Sí' : 'No'}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs">Peor Consecuencia</div>
                                    <Textarea rows={2} value={r.criterios?.peor_consecuencia||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['criterios','peor_consecuencia'], e.target.value)} />
                                  </div>
                                </div>
                              )}

                              {r._ui?.activeTab===3 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs">Eliminación</div>
                                    <Input value={r.intervencion?.eliminacion||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','eliminacion'], e.target.value)} />
                                  </div>
                                  <div>
                                    <div className="text-xs">Sustitución</div>
                                    <Input value={r.intervencion?.sustitucion||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','sustitucion'], e.target.value)} />
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-xs">Controles de Ingeniería</div>
                                    <Textarea rows={2} value={r.intervencion?.controles_ingenieria||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','controles_ingenieria'], e.target.value)} />
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-xs">Señalización, Advertencia, Controles Administrativos</div>
                                    <Textarea rows={2} value={r.intervencion?.controles_administrativos||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','controles_administrativos'], e.target.value)} />
                                  </div>
                                  <div>
                                    <div className="text-xs">Equipos / Elementos de Protección Personal</div>
                                    <Textarea rows={2} value={r.intervencion?.epp||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','epp'], e.target.value)} />
                                  </div>
                                  <div>
                                    <div className="text-xs">Intervención</div>
                                    <Textarea rows={2} value={r.intervencion?.responsable||''}  onInput={(e:any) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','responsable'], e.target.value)} />
                                  </div>
                                  <div>
                                    <div className="text-xs">Fecha de ejecución</div>
                                    <Input type="date" value={r.intervencion?.fecha_ejecucion||''} onChange={(e:any)=> updatePeligroField(currentProceso.id, currentZona.id, currentActividad.id, r.id, ['intervencion','fecha_ejecucion'], e.target.value)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        </div>

      <Dialog open={showProcesoModal} onOpenChange={setShowProcesoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProceso ? 'Editar Proceso' : 'Nuevo Proceso'}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <Input defaultValue={editingProceso?.nombre||''} id="procesoName" />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={()=>setShowProcesoModal(false)}>Cancelar</Button>
              <Button onClick={()=>{ const el = (document.getElementById('procesoName') as HTMLInputElement); saveProceso(el?.value||'') }}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showActividadModal} onOpenChange={setShowActividadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <Input defaultValue={editingActividad?.nombre||''} id="actividadName" />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={()=>{ setShowActividadModal(false); setEditingActividad(null); setActividadTarget(null) }}>Cancelar</Button>
              <Button onClick={()=>{ const el = (document.getElementById('actividadName') as HTMLInputElement); const val = el?.value||''; if (editingActividad) saveEditedActividad(val); else saveActividad(val) }}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showZonaModal} onOpenChange={(open) => { setShowZonaModal(open); if(!open) setEditingZona(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZona ? 'Editar Zona / Lugar' : 'Nueva Zona / Lugar'}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <div>
              <div className="text-xs">Nombre de la zona</div>
              <Input value={zonaModalName} onChange={(e:any)=> setZonaModalName(e.target.value)} />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={()=> setShowZonaModal(false)}>Cancelar</Button>
              <Button onClick={saveZonaModal}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showFilesModal} onOpenChange={setShowFilesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Archivos a la Matriz</DialogTitle>
          </DialogHeader>
          <div className="p-2">
              <div className="flex flex-col gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesInput} />
              <div className="flex items-center gap-3">
                <Button onClick={() => fileInputRef.current?.click()}>Examinar...</Button>
                <div className="text-sm text-slate-600">{uploadedFiles.length > 0 ? `${uploadedFiles.length} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado'}</div>
              </div>
              <div className="text-sm text-slate-600">Archivos añadidos:</div>
              <div className="max-h-44 overflow-auto border rounded p-2 bg-white">
                {uploadedFiles.length === 0 ? (
                  <div className="text-xs text-slate-500">Ningún archivo seleccionado</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-1 rounded hover:bg-slate-50">
                        <button onClick={() => setSelectedPreviewIndex(i)} className="flex items-center gap-2 flex-1 text-left">
                          {f.type.startsWith('image/') ? (
                            <img src={f.data} alt={f.name} className="w-16 h-12 object-cover rounded border" />
                          ) : (
                            <div className="w-16 h-12 flex items-center justify-center bg-slate-100 rounded border text-xs text-slate-600">{f.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{f.name}</div>
                            <div className="text-xs text-slate-500">{Math.round(f.size/1024)} KB</div>
                          </div>
                        </button>
                        <div>
                          <button onClick={() => removeUploadedFile(i)} className="text-red-600 text-sm px-2">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="mt-3">
                {selectedPreviewIndex === null ? (
                  <div className="text-xs text-slate-500">Selecciona un archivo para previsualizar</div>
                ) : (() => {
                  const f = uploadedFiles[selectedPreviewIndex as number]
                  if (!f) return <div className="text-xs text-slate-500">Archivo no disponible</div>
                  if (f.type.startsWith('image/')) {
                    return <img src={f.data} alt={f.name} className="max-h-56 w-auto rounded border" />
                  }
                  const snippet = getPreviewSnippet(f)
                  if (snippet) {
                    return <pre className="max-h-56 overflow-auto text-xs bg-slate-50 p-2 rounded border">{snippet}</pre>
                  }
                  return <div className="text-sm text-slate-600">Sin previsualización disponible para este tipo de archivo.</div>
                })()}
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={()=>{ setShowFilesModal(false); setUploadedFiles([]) }}>Cancelar</Button>
              <Button onClick={saveFilesToMatrix}>Guardar archivos</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

