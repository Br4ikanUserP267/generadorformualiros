"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ConfirmModal from './confirm-modal'
import { ImportMatrizModal } from './ImportMatrizModal'
import { MatrixPreview } from './matrix-preview'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import type { Riesgo } from '@/lib/types'
import { apiFetch } from '@/lib/utils'

const Icons = {
  asistencial: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.1"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  administrativo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M4 2.5V4M8 2.5V4M1.5 5.5h9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  apoyo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5l1.2 2.4 2.6.4-1.9 1.8.45 2.6L6 7.4l-2.35 1.3.45-2.6L2.2 4.3l2.6-.4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  diagnostico: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h2l1.5-3 2 6 1.5-3H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  infraestructura: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10.5h9M3 10.5V6l3-3.5 3 3.5v4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><rect x="4.5" y="7.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1"/></svg>
}

function getIcon(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  if(t.includes('asist')) return Icons.asistencial
  if(t.includes('admin')) return Icons.administrativo
  if(t.includes('apoyo')) return Icons.apoyo
  if(t.includes('diag')) return Icons.diagnostico
  if(t.includes('infra')) return Icons.infraestructura
  return Icons.apoyo
}

// Helper function to flatten matrix data into Riesgo array for export
function flattenMatrixToRiesgos(matrix: any): Riesgo[] {
  const riesgos: Riesgo[] = []
  const procesos = matrix.procesos || []
  
  for (const proceso of procesos) {
    const zonas = proceso.zonas || []
    for (const zona of zonas) {
      const actividades = zona.actividades || []
      for (const actividad of actividades) {
        const peligros = actividad.peligros || []
        for (const peligro of peligros) {
          const nd = peligro.evaluacion?.nd || 0
          const ne = peligro.evaluacion?.ne || 0
          const nc = peligro.evaluacion?.nc || 0
          const nr = (nd * ne) * nc
          
          // Build controls string from individual control fields
          const controlsArray = [
            peligro.controles?.fuente || '',
            peligro.controles?.medio || '',
            peligro.controles?.individuo || ''
          ].filter(Boolean)
          const controlsStr = controlsArray.join(', ')
          
          riesgos.push({
            id: peligro.id,
            area: matrix.area || '',
            proceso: proceso.nombre || '',
            responsable: matrix.responsable || '',
            individuo: actividad.cargo || '',
            zona: zona.nombre || '',
            actividad: actividad.nombre || '',
            tarea: actividad.tareas || '',
            cargo: actividad.cargo || '',
            rutinario: actividad.rutinario || false,
            clasificacion: peligro.clasificacion || '',
            peligro_desc: peligro.descripcion || '',
            efectos: peligro.efectos || '',
            deficiencia: nd,
            exposicion: ne,
            consecuencia: nc,
            controles: controlsStr,
            control_eliminacion: peligro.intervencion?.eliminacion || '',
            control_sustitucion: peligro.intervencion?.sustitucion || '',
            control_ingenieria: peligro.intervencion?.controles_ingenieria || '',
            control_admin: peligro.intervencion?.controles_administrativos || '',
            epp: peligro.intervencion?.epp || '',
            intervencion: peligro.intervencion?.descripcion || '',
            fecha: matrix.fecha_elaboracion || '',
            fecha_ejecucion: peligro.intervencion?.fecha_ejecucion || '',
            seguimiento: peligro.seguimiento || '',
            num_expuestos: peligro.criterios?.num_expuestos,
            peor_consecuencia: peligro.criterios?.peor_consecuencia || '',
            requisito_legal: peligro.criterios?.requisito_legal ? 'Sí' : 'No',
            interpretacion_nivel_riesgo: peligro.evaluacion?.interp_nr || '',
            aceptabilidad: peligro.evaluacion?.aceptabilidad || ''
          })
        }
      }
    }
  }
  
  return riesgos
}

const COLORS = [
  {bg:'#fce8e8',txt:'#a50000',lbl:'Muy alto'},
  {bg:'#fdecea',txt:'#dc3545',lbl:'Alto'},
  {bg:'#fff3e0',txt:'#fd7e14',lbl:'Medio'},
  {bg:'#e8f5e9',txt:'#198754',lbl:'Bajo'},
]

export function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [matrices, setMatrices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [dateDesde, setDateDesde] = useState('')
  const [dateHasta, setDateHasta] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [clasFilter, setClasFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [duplicateSuccess, setDuplicateSuccess] = useState(false)
  const [duplicateSuccessTitle, setDuplicateSuccessTitle] = useState('')
  const [previewMatrixId, setPreviewMatrixId] = useState<string|null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const PAGE_SIZE = 10

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/riesgos')
        if (res.ok) {
          const js = await res.json()
          const mapped = (js || []).map((m: any) => {
            const tagsSet = new Set<string>()
            const clasifSet = new Set<string>()
            let counts = [0, 0, 0, 0]
            let totalPeligros = 0
            
            if (m.procesos) {
              m.procesos.forEach((p:any) => {
                if (p.nombre) tagsSet.add(p.nombre)
                p.zonas?.forEach((z:any) => {
                  z.actividades?.forEach((a:any) => {
                    a.peligros?.forEach((pel:any) => {
                      totalPeligros++
                      if (pel.clasificacion) clasifSet.add(pel.clasificacion)
                      
                      const nd = Number(pel.evaluacion?.nd || pel.evaluacion?.deficiencia || 0)
                      const ne = Number(pel.evaluacion?.ne || pel.evaluacion?.exposicion || 0)
                      const nc = Number(pel.evaluacion?.nc || pel.evaluacion?.consecuencia || 0)
                      const nr = (nd * ne) * nc
                      
                      if (!nr || nr === 0) { counts[3]++ } // consider unconfigured as Bajo
                      else if (nr >= 4000) counts[0]++
                      else if (nr >= 501) counts[0]++
                      else if (nr >= 121) counts[1]++
                      else if (nr >= 40) counts[2]++
                      else counts[3]++
                    })
                  })
                })
              })
            }

            const isoDate = m.fecha_elaboracion || m.fecha_actualizacion || ''
            let d = isoDate || ''
            if (isoDate && isoDate.includes('-')) {
              const parts = isoDate.split('T')[0].split('-')
              if (parts.length === 3) d = `${parts[2]}/${parts[1]}/${parts[0]}`
            }

            return {
              id: m.id,
              title: m.area || m.responsable || 'Matriz sin área',
              date: d,
              isoDate: isoDate ? isoDate.split('T')[0] : '',
              tipos: Array.from(tagsSet),
              clasificaciones: Array.from(clasifSet),
              counts,
              totalPeligros
            }
          })
          setMatrices(mapped)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const tiposList = useMemo(() => {
    const set = new Set<string>()
    matrices.forEach(m => {
      m.tipos.forEach((t: string) => { if (t) set.add(t) })
    })
    return Array.from(set).sort()
  }, [matrices])

  const filtered = useMemo(() => {
    return matrices.filter(m => {
      if (search) {
        const q = search.toLowerCase()
        const matchText = m.title.toLowerCase().includes(q) || m.tipos.join(' ').toLowerCase().includes(q)
        if (!matchText) return false
      }
      if (clasFilter && !m.clasificaciones.includes(clasFilter)) return false
      if (tipoFilter && !m.tipos.some((t:any) => t === tipoFilter)) return false
      if (dateDesde && m.isoDate && m.isoDate < dateDesde) return false
      if (dateHasta && m.isoDate && m.isoDate > dateHasta) return false
      return true
    })
  }, [matrices, search, clasFilter, tipoFilter, dateDesde, dateHasta])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, clasFilter, tipoFilter, dateDesde, dateHasta])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  }, [filtered.length])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const stats = useMemo(() => {
    let totP = 0, ma = 0, al = 0, me = 0, ba = 0
    for (const m of filtered) {
      totP += m.totalPeligros
      ma += m.counts[0]
      al += m.counts[1]
      me += m.counts[2]
      ba += m.counts[3]
    }
    return {
      totM: filtered.length,
      totP, ma, al, me, ba
    }
  }, [filtered])

  const handleNew = () => {
    router.push('/matriz/nuevo')
  }

  const handleOpenImport = () => {
    setImportOpen(true)
  }

  function confirmDeleteAction() {
    if (!deleteTarget) return
    apiFetch(`/api/riesgos/${deleteTarget}`, { method: 'DELETE' }).then(() => { 
      setMatrices((prev) => prev.filter(p => p.id !== deleteTarget))
      setConfirmOpen(false)
      setDeleteTarget(null)
    }).catch(() => {
      setConfirmOpen(false)
      setDeleteTarget(null)
    })
  }

  async function handleDownloadMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('Failed to fetch matrix')
      const matrizData = await res.json()
      
      // Export directly with nested structure
      await exportMatrizToExcel(matrizData)
    } catch (error) {
      console.error('Error downloading matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al descargar la matriz: ${errorMsg}`)
    }
  }

  async function handleDuplicateMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('No se pudo obtener la matriz')
      const matrizData = await res.json()

      const duplicateData = {
        area: `${matrizData.area} (Copia)`,
        responsable: matrizData.responsable,
        fecha_elaboracion: new Date().toISOString().split('T')[0],
        fecha_actualizacion: '',
        files: matrizData.files || [],
        procesos: matrizData.procesos || []
      }

      const createRes = await apiFetch('/api/riesgos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })

      if (!createRes.ok) throw new Error('No se pudo crear la copia')
      
      // Reload matrices list to ensure all fields are properly structured
      const reloadRes = await apiFetch('/api/riesgos')
      if (reloadRes.ok) {
        const js = await reloadRes.json()
        // Use same mapping logic as initial load
        const mapped = (js || []).map((m: any) => {
          const tagsSet = new Set<string>()
          const clasifSet = new Set<string>()
          let counts = [0, 0, 0, 0]
          let totalPeligros = 0
          
          if (m.procesos) {
            m.procesos.forEach((p:any) => {
              if (p.nombre) tagsSet.add(p.nombre)
              p.zonas?.forEach((z:any) => {
                z.actividades?.forEach((a:any) => {
                  a.peligros?.forEach((pel:any) => {
                    totalPeligros++
                    if (pel.clasificacion) clasifSet.add(pel.clasificacion)
                    
                    const nd = Number(pel.evaluacion?.nd || pel.evaluacion?.deficiencia || 0)
                    const ne = Number(pel.evaluacion?.ne || pel.evaluacion?.exposicion || 0)
                    const nc = Number(pel.evaluacion?.nc || pel.evaluacion?.consecuencia || 0)
                    const nr = (nd * ne) * nc
                    
                    if (!nr || nr === 0) { counts[3]++ }
                    else if (nr >= 4000) counts[0]++
                    else if (nr >= 501) counts[0]++
                    else if (nr >= 121) counts[1]++
                    else if (nr >= 40) counts[2]++
                    else counts[3]++
                  })
                })
              })
            })
          }

          const isoDate = m.fecha_elaboracion || m.fecha_actualizacion || ''
          let d = isoDate || ''
          if (isoDate && isoDate.includes('-')) {
            const parts = isoDate.split('T')[0].split('-')
            if (parts.length === 3) d = `${parts[2]}/${parts[1]}/${parts[0]}`
          }

          return {
            id: m.id,
            title: m.area || m.responsable || 'Matriz sin área',
            date: d,
            isoDate: isoDate ? isoDate.split('T')[0] : '',
            responsable: m.responsable || '',
            tipos: Array.from(tagsSet),
            clasificaciones: Array.from(clasifSet),
            counts,
            totalPeligros
          }
        })
        setMatrices(mapped)
      }
      
      // Show success with modal style
      setDuplicateSuccessTitle(`${duplicateData.area}`)
      setDuplicateSuccess(true)
    } catch (error) {
      console.error('Error duplicating matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al duplicar la matriz: ${errorMsg}`)
    }
  }

  return (
    <div className="min-h-screen bg-var-background-tertiary">
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --color-background-primary: #ffffff;
          --color-background-secondary: #f8fafc;
          --color-background-tertiary: #f1f5f9;
          --color-border-primary: #cbd5e1;
          --color-border-secondary: #e2e8f0;
          --color-border-tertiary: #e2e8f0;
          --color-text-primary: #0f172a;
          --color-text-secondary: #64748b;
          --color-text-tertiary: #94a3b8;
          --border-radius-lg: 12px;
          --border-radius-md: 8px;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --color-background-primary: #1e293b;
            --color-background-secondary: #0f172a;
            --color-background-tertiary: #020617;
            --color-border-primary: #475569;
            --color-border-secondary: #334155;
            --color-border-tertiary: #1e293b;
            --color-text-primary: #f8fafc;
            --color-text-secondary: #cbd5e1;
            --color-text-tertiary: #64748b;
          }
        }
        .html-wrapper * { box-sizing:border-box;margin:0;padding:0;font-family:inherit; }
        .html-wrapper { width:100%; min-height: 100vh; display: flex; flex-direction: column; background: var(--color-background-tertiary); }
        .topbar {background:#ffffff;border-bottom: 0.5px solid #d4e8d4;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;}
        .logo {display:flex;align-items:center;gap:12px}
        .logo-divider {width: 0.5px; height: 30px; background: #c8dfc8;}
        .logo-text {font-size:16px;font-weight:600;color:#1a5c2a}
        .logo-sub {font-size:12px;color:#7aaa7a}
        .user-pill {display:flex;align-items:center;gap:8px;font-size:13px;color:#555}
        .user-dot {width:32px;height:32px;border-radius:50%;background:#e8f5e9;color:#1a5c2a;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;text-transform:uppercase;}
        
        .page {flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%;}
        
        .stat-row {display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:16px}
        @media (max-width: 768px) { .stat-row { grid-template-columns:repeat(3,1fr); } }
        @media (max-width: 480px) { .stat-row { grid-template-columns:1fr 1fr; } }
        .scard {background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:16px 20px;display:flex;flex-direction:column;gap:6px}
        .scard-num {font-size:28px;font-weight:600;line-height:1}
        .scard-lbl {font-size:12px;color:var(--color-text-secondary);font-weight:500;}
        .scard-bar {height:4px;border-radius:2px;margin-top:5px}
        
        .filters {background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:14px 16px;margin-bottom:16px}
        .filter-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .fi {position:relative;display:flex;align-items:center}
        .fi svg {position:absolute;left:8px;pointer-events:none;opacity:.35;top:50%;transform:translateY(-50%)}
        .fi input {padding:8px 10px 8px 30px;font-size:13px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-primary);width:200px;outline:none}
        .fi input::placeholder {color:var(--color-text-tertiary)}
        .fsel {padding:8px 12px;font-size:13px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-secondary);cursor:pointer;outline:none;appearance:auto}
        .fdate {padding:8px 12px;font-size:13px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-secondary);width:130px;outline:none}
        .flabel {font-size:13px;color:var(--color-text-secondary);white-space:nowrap}
        .new-menu-wrap {margin-left:auto;position:relative}
        .new-btn {padding:9px 20px;font-size:13px;border-radius:var(--border-radius-md);border:none;background:#1a5c2a;color:#fff;cursor:pointer;font-weight:600;white-space:nowrap;transition:opacity 0.2s;}
        .new-btn:hover {opacity:0.9;}
        .new-menu {position:absolute;right:0;top:calc(100% + 6px);min-width:230px;background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);box-shadow:0 8px 30px rgba(0,0,0,.08);padding:6px;display:none;z-index:20}
        .new-menu-wrap:hover .new-menu, .new-menu-wrap:focus-within .new-menu {display:block}
        .new-menu-item {display:block;width:100%;text-align:left;background:transparent;border:none;padding:9px 10px;font-size:13px;border-radius:8px;color:var(--color-text-primary);cursor:pointer}
        .new-menu-item:hover {background:var(--color-background-secondary)}
        
        .results-label {font-size:11px;color:var(--color-text-secondary);margin-bottom:8px}
        
        .mlist {display:flex;flex-direction:column;gap:8px}
        
        .mcard {background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:14px 16px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .15s}
        .mcard:hover {border-color:var(--color-border-primary); transform:translateY(-1px); box-shadow:0 4px 15px rgba(0,0,0,0.03)}
        
        .mcard-left {flex:1;min-width:0}
        .mcard-title {font-size:14px;font-weight:500;color:var(--color-text-primary);margin-bottom:2px}
        .mcard-date {font-size:11px;color:var(--color-text-secondary)}
        .mcard-tags {display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
        .proceso-tag {display:flex;align-items:center;gap:5px;padding:3px 9px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-tertiary);background:var(--color-background-secondary);font-size:11px;color:var(--color-text-secondary)}
        .proceso-tag svg {flex-shrink:0}
        
        .mcard-stats {display:flex;flex-direction:column;gap:6px;align-items:flex-end}
        @media (max-width: 600px) { .mcard-stats { display:none; } }
        .stat-nums {display:flex;gap:6px}
        .snum {display:flex;flex-direction:column;align-items:center;padding:6px 10px;border-radius:var(--border-radius-md);min-width:48px}
        .snum-val {font-size:18px;font-weight:500;line-height:1}
        .snum-lbl {font-size:9px;margin-top:2px;font-weight:500}
        
        .mcard-actions {display:flex;flex-direction:column;gap:4px;flex-shrink:0}
        .ibt {width:28px;height:28px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-tertiary);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);transition:all 0.15s;}
        .ibt:hover {background:var(--color-background-secondary);color:var(--color-text-primary);}

        .pagination {display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;flex-wrap:wrap}
        .pagination-info {font-size:12px;color:var(--color-text-secondary)}
        .pagination-actions {display:flex;align-items:center;gap:8px}
        .pbtn {padding:6px 10px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-tertiary);background:var(--color-background-primary);font-size:12px;cursor:pointer;color:var(--color-text-primary)}
        .pbtn:disabled {opacity:.45;cursor:not-allowed}
      `}} />

      <div className="html-wrapper">
        <div className="topbar">
          <div className="logo">
            <img src="/matriz-riesgos/csmLOGO_1_.png" alt="Logo" style={{height: '38px', objectFit: 'contain'}} />
            <div className="logo-divider"></div>
            <div>
              <div className="logo-text">Matriz de Riesgos</div>
              <div className="logo-sub">{(user as any)?.organizacion || 'Organización'} — v1</div>
            </div>
          </div>
            <div className="user-pill">
            <div className="user-dot">{(user?.nombre || 'U')[0]}</div>
            <span>
              {user?.nombre || ''}
              {user?.cargo ? <><>&nbsp;·&nbsp;</>{user.cargo}</> : null}
            </span>
            <span style={{opacity:'.3', margin:'0 4px', color:'#c8dfc8'}}>|</span>
            <span style={{cursor:'pointer', color:'#1a5c2a', fontWeight:500}} onClick={() => { logout(); router.push('/') }}>Cerrar sesión</span>
          </div>
        </div>

        <div className="page">
          <div className="stat-row">
            <div className="scard">
              <span className="scard-num" style={{color:'#1a5c2a'}}>{stats.totM}</span>
              <span className="scard-lbl">Total matrices</span>
              <div className="scard-bar" style={{background:'#1a5c2a'}}></div>
            </div>
            <div className="scard">
              <span className="scard-num" style={{color:'var(--color-text-primary)'}}>{stats.totP}</span>
              <span className="scard-lbl">Total riesgos</span>
              <div className="scard-bar" style={{background:'var(--color-border-secondary)'}}></div>
            </div>
            <div className="scard">
              <span className="scard-num" style={{color:'#a50000'}}>{stats.ma}</span>
              <span className="scard-lbl">Muy alto</span>
              <div className="scard-bar" style={{background:'#a50000'}}></div>
            </div>
            <div className="scard">
              <span className="scard-num" style={{color:'#dc3545'}}>{stats.al}</span>
              <span className="scard-lbl">Alto</span>
              <div className="scard-bar" style={{background:'#dc3545'}}></div>
            </div>
            <div className="scard">
              <span className="scard-num" style={{color:'#fd7e14'}}>{stats.me}</span>
              <span className="scard-lbl">Medio</span>
              <div className="scard-bar" style={{background:'#fd7e14'}}></div>
            </div>
            <div className="scard">
              <span className="scard-num" style={{color:'#198754'}}>{stats.ba}</span>
              <span className="scard-lbl">Bajo</span>
              <div className="scard-bar" style={{background:'#198754'}}></div>
            </div>
          </div>

          <div className="filters">
            <div className="filter-row">
              <div className="fi">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <input type="text" placeholder="Área / Proceso, Zona…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <span className="flabel">Desde</span>
              <input className="fdate" type="date" value={dateDesde} onChange={e=>setDateDesde(e.target.value)} />
              <span className="flabel">Hasta</span>
              <input className="fdate" type="date" value={dateHasta} onChange={e=>setDateHasta(e.target.value)} />
              <select className="fsel" value={tipoFilter} onChange={e=>setTipoFilter(e.target.value)}>
                <option value="">Tipo: Todos</option>
                {tiposList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="new-menu-wrap">
                <button className="new-btn">Nueva Matriz</button>
                <div className="new-menu">
                  <button className="new-menu-item" onClick={handleNew}>Crear Nueva Matriz</button>
                  <button className="new-menu-item" onClick={handleOpenImport}>Importar Matriz desde Excel</button>
                </div>
              </div>
            </div>
          </div>

          <div className="results-label">{filtered.length} matri{filtered.length === 1 ? 'z' : 'ces'}</div>
          
          <div className="mlist">
            {paginated.map(m => (
              <div key={m.id} className="mcard" onClick={() => router.push('/matriz/' + m.id)}>
                <div className="mcard-left">
                  <div className="mcard-title">{m.title}</div>
                  <div className="mcard-date">{m.date}</div>
                  <div className="mcard-tags">
                    {m.tipos.length === 0 ? (
                      <span className="proceso-tag">{getIcon('')}<span>General</span></span>
                    ) : (
                      m.tipos.map((t: string, i: number) => (
                        <span key={i} className="proceso-tag">{getIcon(t)}<span>{t}</span></span>
                      ))
                    )}
                  </div>
                </div>
                <div className="mcard-stats">
                  <div className="stat-nums">
                    {m.counts.map((c: number, idx: number) => (
                      <div key={idx} className="snum" style={{background: COLORS[idx].bg}}>
                        <span className="snum-val" style={{color: COLORS[idx].txt}}>{c}</span>
                        <span className="snum-lbl" style={{color: COLORS[idx].txt}}>{COLORS[idx].lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mcard-actions" onClick={e => e.stopPropagation()}>
                  <button className="ibt" title="Preview" onClick={(e) => { e.stopPropagation(); setPreviewMatrixId(m.id) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/></svg>
                  </button>
                  <button className="ibt" title="Descargar" onClick={(e) => { e.stopPropagation(); handleDownloadMatrix(m.id) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 8.5v-5M3.5 6L6 8.5l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                  <button className="ibt" title="Duplicar" onClick={(e) => { e.stopPropagation(); handleDuplicateMatrix(m.id) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 4h6v6H2V4zM4 2h6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button className="ibt" title="Editar" onClick={(e) => { e.stopPropagation(); router.push('/matriz/' + m.id) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M8 2l2 2-6 6H2V8l6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  </button>
                  <button className="ibt" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(m.id); setConfirmOpen(true) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 3v7h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-slate-500">
                No se encontraron matrices que coincidan con los filtros.
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Página {currentPage} de {totalPages} · Mostrando {paginated.length} de {filtered.length}
              </div>
              <div className="pagination-actions">
                <button className="pbtn" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>Primera</button>
                <button className="pbtn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Anterior</button>
                <button className="pbtn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Siguiente</button>
                <button className="pbtn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>Última</button>
              </div>
            </div>
          )}
        </div>
      </div>

        <ImportMatrizModal open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDeleteAction}
        title="Eliminar Matriz"
        message="¿Estás seguro de que deseas eliminar esta matriz? Esta acción no se puede deshacer y borrará todos los procesos, actividades y peligros asociados."
      />

      <ConfirmModal
        open={duplicateSuccess}
        onCancel={() => setDuplicateSuccess(false)}
        onConfirm={() => setDuplicateSuccess(false)}
        title="Matriz Duplicada"
        message={`La matriz "${duplicateSuccessTitle}" ha sido duplicada exitosamente.`}
        confirmLabel="Aceptar"
      />

      {previewMatrixId && (
        <MatrixPreview
          matrizId={previewMatrixId}
          onClose={() => setPreviewMatrixId(null)}
        />
      )}
    </div>
  )
}
