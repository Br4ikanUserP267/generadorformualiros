const fs = require('fs');
const content = `"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ConfirmModal from './confirm-modal'

const Icons = {
  asistencial: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.1"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  administrativo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M4 2.5V4M8 2.5V4M1.5 5.5h9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  apoyo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5l1.2 2.4 2.6.4-1.9 1.8.45 2.6L6 7.4l-2.35 1.3.45-2.6L2.2 4.3l2.6-.4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  diagnostico: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h2l1.5-3 2 6 1.5-3H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  infraestructura: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10.5h9M3 10.5V6l3-3.5 3 3.5v4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><rect x="4.5" y="7.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1"/></svg>
}

function getIcon(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')
  if(t.includes('asist')) return Icons.asistencial
  if(t.includes('admin')) return Icons.administrativo
  if(t.includes('apoyo')) return Icons.apoyo
  if(t.includes('diag')) return Icons.diagnostico
  if(t.includes('infra')) return Icons.infraestructura
  return Icons.apoyo
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/riesgos')
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
              if (parts.length === 3) d = \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`
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

  const handleNew = async () => {
    try {
      const res = await fetch('/api/riesgos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: 'Nueva Matriz', procesos: [] })
      })
      if (res.ok) {
        const { id } = await res.json()
        router.push(\`/matriz/\${id}\`)
      }
    } catch(e) {}
  }

  function confirmDeleteAction() {
    if (!deleteTarget) return
    fetch(\`/api/riesgos/\${deleteTarget}\`, { method: 'DELETE' }).then(() => { 
      setMatrices((prev) => prev.filter(p => p.id !== deleteTarget))
      setConfirmOpen(false)
      setDeleteTarget(null)
    }).catch(() => {
      setConfirmOpen(false)
      setDeleteTarget(null)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <style dangerouslySetInnerHTML={{__html: \`
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
        .html-wrapper { width:100%; max-width: 1200px; margin: 0 auto; border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden; background: var(--color-background-tertiary); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .topbar {background:#1a5c2a;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0}
        .logo {display:flex;align-items:center;gap:10px}
        .logo-badge {width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500}
        .logo-text {font-size:14px;font-weight:500}
        .logo-sub {font-size:11px;opacity:.6}
        .user-pill {display:flex;align-items:center;gap:6px;font-size:12px;opacity:.85}
        .user-dot {width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;text-transform:uppercase;}
        
        .page {background:var(--color-background-tertiary);padding:14px;border:0.5px solid var(--color-border-tertiary);border-top:none;border-radius:0 0 var(--border-radius-lg) var(--border-radius-lg)}
        
        .stat-row {display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:14px}
        @media (max-width: 768px) { .stat-row { grid-template-columns:repeat(3,1fr); } }
        @media (max-width: 480px) { .stat-row { grid-template-columns:1fr 1fr; } }
        .scard {background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:10px 12px;display:flex;flex-direction:column;gap:3px}
        .scard-num {font-size:22px;font-weight:500;line-height:1}
        .scard-lbl {font-size:10px;color:var(--color-text-secondary)}
        .scard-bar {height:3px;border-radius:2px;margin-top:5px}
        
        .filters {background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:10px 12px;margin-bottom:12px}
        .filter-row {display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .fi {position:relative;display:flex;align-items:center}
        .fi svg {position:absolute;left:8px;pointer-events:none;opacity:.35;top:50%;transform:translateY(-50%)}
        .fi input {padding:6px 8px 6px 26px;font-size:12px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-primary);width:170px;outline:none}
        .fi input::placeholder {color:var(--color-text-tertiary)}
        .fsel {padding:6px 8px;font-size:12px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-secondary);cursor:pointer;outline:none;appearance:auto}
        .fdate {padding:6px 8px;font-size:12px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-secondary);width:120px;outline:none}
        .flabel {font-size:11px;color:var(--color-text-secondary);white-space:nowrap}
        .new-btn {margin-left:auto;padding:7px 16px;font-size:12px;border-radius:var(--border-radius-md);border:none;background:#1a5c2a;color:#fff;cursor:pointer;font-weight:500;white-space:nowrap;transition:opacity 0.2s;}
        .new-btn:hover {opacity:0.9;}
        
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
      \`}} />

      <div className="html-wrapper">
        <div className="topbar">
          <div className="logo">
            <div className="logo-badge">MR</div>
            <div>
              <div className="logo-text">Matriz de Riesgos</div>
              <div className="logo-sub">{(user as any)?.organizacion || 'Organización'} — v1</div>
            </div>
          </div>
          <div className="user-pill">
            <div className="user-dot">{(user?.nombre||'U')[0]}</div>
            <span>{user?.nombre || 'Usuario'} &nbsp;·&nbsp; {user?.cargo || 'Rol'}</span>
            <span style={{opacity:'.3', margin:'0 4px'}}>|</span>
            <span style={{cursor:'pointer', opacity:'.7'}} onClick={() => { logout(); router.push('/') }}>Cerrar sesión</span>
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
              <span className="scard-lbl">Total peligros</span>
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
            <div className="scard" style={{border:'none',background:'transparent',display:'flex',flexDirection:'column',justifyContent:'center',padding:0}}>
              <button className="new-btn" style={{margin:0, width:'100%'}} onClick={handleNew}>+ Nueva matriz</button>
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
              <select className="fsel" value={clasFilter} onChange={e=>setClasFilter(e.target.value)}>
                <option value="">Clasificación: Todas</option>
                <option value="Biológico">Biológico</option>
                <option value="Químico">Químico</option>
                <option value="Mecánico">Mecánico</option>
                <option value="Psicosocial">Psicosocial</option>
                <option value="Físico">Físico</option>
              </select>
              <select className="fsel" value={tipoFilter} onChange={e=>setTipoFilter(e.target.value)}>
                <option value="">Tipo: Todos</option>
                <option value="Asistencial">Asistencial</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Apoyo">Apoyo</option>
                <option value="Diagnóstico">Diagnóstico</option>
                <option value="Infraestructura">Infraestructura</option>
              </select>
            </div>
          </div>

          <div className="results-label">{filtered.length} matri{filtered.length === 1 ? 'z' : 'ces'}</div>
          
          <div className="mlist">
            {filtered.map(m => (
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
                  <button className="ibt" title="Ver" onClick={(e) => { e.stopPropagation(); router.push('/matriz/' + m.id) }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6c0 0 2-4 5-4s5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/></svg>
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
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDeleteAction}
        title="Eliminar Matriz"
        message="¿Estás seguro de que deseas eliminar esta matriz? Esta acción no se puede deshacer y borrará todos los procesos, actividades y peligros asociados."
      />
    </div>
  )
}
`;
fs.writeFileSync('components/dashboard.tsx', content);
