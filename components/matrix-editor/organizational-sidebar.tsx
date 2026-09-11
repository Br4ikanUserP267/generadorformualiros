"use client"

import React from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Layers,
  FolderTree,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DocumentsPanel } from './documents-panel'

interface OrganizationalSidebarProps {
  procesos: any[]
  filteredProcesos: any[]
  searchTerm: string
  onSearchTermChange: (term: string) => void
  searchResults: Array<{ proceso: any; zona: any; actividad: any }>
  selected: { procesoId?: string; zonaId?: string; actividadId?: string }
  expandedZonaIds: Record<string, boolean>
  dragOverActividadId: string | null
  dragOverActividadEdge: 'before' | 'after' | null
  files: any[]
  onSelectActividad: (procesoId: string, zonaId: string, actividadId: string) => void
  onToggleExpandZona: (zonaId: string) => void
  onAddProceso: () => void
  onEditProceso: (proceso: any) => void
  onDeleteProceso: (procesoId: string) => void
  onAddZona: (procesoId: string) => void
  onEditZona: (procesoId: string, zona: any) => void
  onDeleteZona: (procesoId: string, zonaId: string) => void
  onAddActividad: (procesoId: string, zonaId: string) => void
  onEditActividad: (procesoId: string, zonaId: string, actividad: any) => void
  onDeleteActividad: (procesoId: string, zonaId: string, actividadId: string) => void
  onActividadDragStart: (e: React.DragEvent, procesoId: string, zonaId: string, actividadId: string) => void
  onActividadDragOver: (e: React.DragEvent, actividadId: string | null) => void
  onActividadDragLeave: () => void
  onActividadDrop: (e: React.DragEvent, procesoId: string, zonaId: string, targetActividadId: string | null) => void
  onOpenAddFiles: () => void
  onDeleteFile: (index: number) => void
}

function getStableActividadLabel(actividad: any, fallbackIndex: number) {
  const baseLabel = actividad.nombre || `Actividad ${fallbackIndex + 1}`
  if (actividad.descripcion) {
    const desc = actividad.descripcion.trim()
    const truncated = desc.length > 36 ? desc.slice(0, 36) + '...' : desc
    return `${baseLabel}: ${truncated}`
  }
  return baseLabel
}

export function OrganizationalSidebar({
  procesos,
  filteredProcesos,
  searchTerm,
  onSearchTermChange,
  searchResults,
  selected,
  expandedZonaIds,
  dragOverActividadId,
  dragOverActividadEdge,
  files,
  onSelectActividad,
  onToggleExpandZona,
  onAddProceso,
  onEditProceso,
  onDeleteProceso,
  onAddZona,
  onEditZona,
  onDeleteZona,
  onAddActividad,
  onEditActividad,
  onDeleteActividad,
  onActividadDragStart,
  onActividadDragOver,
  onActividadDragLeave,
  onActividadDrop,
  onOpenAddFiles,
  onDeleteFile,
}: OrganizationalSidebarProps) {
  return (
    <aside className="w-full lg:w-84 xl:w-92 shrink-0 space-y-5">
      {/* 1. Organizational Structure Card */}
      <div className="rounded-2xl border border-[#dfe9e2] bg-white shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#1F7D3E] text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderTree className="size-4" />
            <h3 className="font-black text-xs uppercase tracking-[0.14em]">
              Estructura Organizacional
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onAddProceso}
            className="h-7 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold"
          >
            <Plus className="size-3 mr-1" />
            Proceso
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#dfe9e2] bg-[#f8faf9]">
          <div className="relative">
            <Search className="size-3.5 text-[#7a9182] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar actividad, cargo, peligro..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-xl border-[#d1e2d6] bg-white focus:ring-[#1F7D3E]/20"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchTerm.trim() && (
            <div className="mt-2 p-2 rounded-xl bg-white border border-[#dfe9e2] shadow-sm max-h-48 overflow-y-auto space-y-1">
              <div className="text-[10px] font-black uppercase text-[#7a9182] tracking-wider px-1">
                Resultados ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="text-xs text-[#7a9182] p-1.5 italic">
                  Sin coincidencias para "{searchTerm}".
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSelectActividad(res.proceso.id, res.zona.id, res.actividad.id)
                      onSearchTermChange('')
                    }}
                    className="w-full text-left p-1.5 rounded-lg hover:bg-[#eef7f0] transition-colors"
                  >
                    <div className="text-xs font-bold text-[#1F7D3E] truncate">
                      {res.actividad.nombre}
                    </div>
                    <div className="text-[10px] text-[#7a9182] truncate">
                      {res.proceso.nombre} › {res.zona.nombre}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Processes Tree */}
        <div className="p-3 space-y-3 max-h-[calc(100vh-360px)] overflow-y-auto">
          {filteredProcesos.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7a9182] space-y-2">
              <Layers className="size-6 text-[#a3b8aa] mx-auto mb-1" />
              <p className="font-semibold">No hay procesos en la matriz.</p>
              <button
                type="button"
                onClick={onAddProceso}
                className="text-xs font-bold text-[#1F7D3E] hover:underline"
              >
                + Crear primer proceso
              </button>
            </div>
          ) : (
            filteredProcesos.map((p: any) => (
              <div
                key={p.id}
                className="rounded-xl border border-[#dfe9e2] bg-[#fbfdfb] overflow-hidden"
              >
                {/* Process Bar */}
                <div className="px-3 py-2 bg-[#f4f8f5] border-b border-[#dfe9e2] flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-black text-[#163522] truncate max-w-[130px] sm:max-w-[160px]"
                    title={p.nombre}
                  >
                    {p.nombre}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAddZona(p.id)}
                      className="px-2 py-0.5 rounded-md bg-[#1F7D3E] hover:bg-[#186331] text-white text-[10px] font-black transition-colors"
                      title="Agregar Zona / Lugar a este proceso"
                    >
                      + Zona
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProceso(p)}
                      className="p-1 rounded text-[#5e6b62] hover:text-[#1F7D3E]"
                      title="Editar proceso"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProceso(p.id)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700"
                      title="Eliminar proceso"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Zonas in Process */}
                <div className="p-2 space-y-1.5">
                  {(p.zonas || []).length === 0 ? (
                    <div className="text-[11px] text-[#7a9182] italic py-1 px-2">
                      Sin zonas. Haz clic en "+ Zona".
                    </div>
                  ) : (
                    (p.zonas || []).map((z: any) => {
                      const isExpanded = !!(expandedZonaIds[z.id] || (searchTerm && z._searchMatch))
                      const isSelectedZone = selected.zonaId === z.id
                      const totalAct = (z.actividades || []).length

                      return (
                        <div
                          key={z.id}
                          className={`rounded-lg border transition-all ${
                            isSelectedZone
                              ? 'border-[#1F7D3E]/40 bg-[#f0f9f1]'
                              : 'border-[#edf2ed] bg-white'
                          }`}
                        >
                          {/* Zona Bar */}
                          <div
                            onClick={() => onToggleExpandZona(z.id)}
                            className="px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-[#f5f9f6] transition-colors rounded-lg select-none"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[#5e6b62]">
                                {isExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </span>
                              <span
                                className="text-xs font-bold text-[#163522] truncate max-w-[110px] sm:max-w-[140px]"
                                title={z.nombre}
                              >
                                {z.nombre}
                              </span>
                              <span className="text-[10px] text-[#7a9182] font-semibold shrink-0">
                                ({totalAct})
                              </span>
                            </div>

                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => onEditZona(p.id, z)}
                                className="p-1 rounded text-[#5e6b62] hover:text-[#1F7D3E]"
                                title="Editar zona"
                              >
                                <Pencil className="size-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteZona(p.id, z.id)}
                                className="p-1 rounded text-rose-500 hover:text-rose-700"
                                title="Eliminar zona"
                              >
                                <Trash2 className="size-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Activities inside Zona */}
                          {isExpanded && (
                            <div
                              className="pl-3 pr-2 pb-2 pt-1 space-y-1 border-t border-[#f0f5f1]"
                              onDragOver={(e) => onActividadDragOver(e, null)}
                              onDrop={(e) => onActividadDrop(e, p.id, z.id, null)}
                            >
                              {(z.actividades || []).map((a: any, actIdx: number) => {
                                const isSelectedAct = selected.actividadId === a.id
                                const isDragTarget = dragOverActividadId === a.id

                                return (
                                  <div
                                    key={a.id}
                                    onClick={() => onSelectActividad(p.id, z.id, a.id)}
                                    onDragOver={(e) => {
                                      e.stopPropagation()
                                      onActividadDragOver(e, a.id)
                                    }}
                                    onDragLeave={onActividadDragLeave}
                                    onDrop={(e) => {
                                      e.stopPropagation()
                                      onActividadDrop(e, p.id, z.id, a.id)
                                    }}
                                    className={`group flex items-center justify-between gap-1.5 p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                                      isSelectedAct
                                        ? 'bg-[#eef7f0] border-l-3 border-l-[#1F7D3E] text-[#1F7D3E] font-black shadow-2xs'
                                        : 'hover:bg-[#f8faf9] text-[#355244] font-medium'
                                    } ${
                                      isDragTarget && dragOverActividadEdge === 'before'
                                        ? 'border-t-2 border-t-[#1F7D3E]'
                                        : ''
                                    } ${
                                      isDragTarget && dragOverActividadEdge === 'after'
                                        ? 'border-b-2 border-b-[#1F7D3E]'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {/* Drag Handle */}
                                      <div
                                        draggable
                                        onDragStart={(e) =>
                                          onActividadDragStart(e, p.id, z.id, a.id)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="p-0.5 rounded text-[#a3b8aa] hover:text-[#5e6b62] cursor-grab active:cursor-grabbing shrink-0"
                                        title="Reordenar actividad"
                                      >
                                        <GripVertical className="size-3" />
                                      </div>

                                      <span
                                        className="truncate text-[11px]"
                                        title={
                                          a.descripcion
                                            ? `${a.nombre}: ${a.descripcion}`
                                            : a.nombre
                                        }
                                      >
                                        {getStableActividadLabel(a, actIdx)}
                                      </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => onEditActividad(p.id, z.id, a)}
                                        className="p-0.5 rounded text-[#5e6b62] hover:text-[#1F7D3E]"
                                        title="Editar nombre de actividad"
                                      >
                                        <Pencil className="size-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDeleteActividad(p.id, z.id, a.id)}
                                        className="p-0.5 rounded text-rose-500 hover:text-rose-700"
                                        title="Eliminar actividad"
                                      >
                                        <Trash2 className="size-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}

                              {/* Add Activity Button inside Zone */}
                              <button
                                type="button"
                                onClick={() => onAddActividad(p.id, z.id)}
                                className="w-full text-center text-[11px] font-bold text-[#1F7D3E] py-1 rounded-md border border-dashed border-[#d1e2d6] bg-white hover:bg-[#eef7f0] transition-colors mt-1"
                              >
                                + Agregar actividad
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Documents Panel below Organizational Tree */}
      <DocumentsPanel
        files={files}
        onOpenAddFiles={onOpenAddFiles}
        onDeleteFile={onDeleteFile}
      />
    </aside>
  )
}
