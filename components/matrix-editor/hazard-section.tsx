"use client"

import React from 'react'
import { Plus, ShieldAlert, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HazardItem } from './hazard-item'

interface HazardSectionProps {
  peligros: any[]
  highlightPeligroId?: string | null
  dragOverPeligroId?: string | null
  dragOverPeligroEdge?: 'before' | 'after' | null
  onAddPeligro: () => void
  onOpenCatalog?: () => void
  onToggleExpand: (peligroId: string) => void
  onChangeTab: (peligroId: string, tabIndex: number) => void
  onUpdateField: (peligroId: string, path: string[], value: any) => void
  onDuplicate: (peligroId: string) => void
  onDelete: (peligroId: string) => void
  onDragStart: (e: React.DragEvent, peligroId: string) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, peligroId: string | null) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, targetPeligroId: string | null) => void
}

export function HazardSection({
  peligros,
  highlightPeligroId = null,
  dragOverPeligroId = null,
  dragOverPeligroEdge = null,
  onAddPeligro,
  onOpenCatalog,
  onToggleExpand,
  onChangeTab,
  onUpdateField,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: HazardSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header bar: Title + Count + Add Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#dfe9e2]">
        <div className="flex items-center gap-2.5">
          <span className="size-6 rounded-lg bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
            <ShieldAlert className="size-3.5" />
          </span>
          <h3 className="text-sm font-black text-[#163522] tracking-tight">
            Peligros Identificados
          </h3>
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] text-xs font-black">
            {peligros.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCatalog && (
            <Button
              type="button"
              onClick={onOpenCatalog}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-xs font-black text-white h-8.5 px-3.5 shadow-md shadow-[#1F7D3E]/20 cursor-pointer"
            >
              <Flame className="size-3.5 mr-1.5 text-white" />
              Seleccionar del Catálogo
            </Button>
          )}
        </div>
      </div>

      {/* Hazards List */}
      {peligros.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe9e2] bg-white p-8 text-center space-y-3">
          <div className="size-10 rounded-2xl bg-[#f8faf9] text-[#a3b8aa] flex items-center justify-center mx-auto border border-[#dfe9e2]">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#355244]">
              No hay peligros registrados en esta actividad
            </p>
            <p className="text-[11px] text-[#7a9182] mt-0.5">
              Los peligros institucionales se vinculan seleccionándolos directamente desde el catálogo maestro.
            </p>
          </div>
          {onOpenCatalog && (
            <Button
              type="button"
              onClick={onOpenCatalog}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-xs font-black text-white h-8.5 px-3.5 shadow-md shadow-[#1F7D3E]/20 cursor-pointer mx-auto"
            >
              <Flame className="size-3.5 mr-1.5" />
              Seleccionar del Catálogo
            </Button>
          )}
        </div>
      ) : (
        <div
          className="space-y-3"
          onDragLeave={onDragLeave}
        >
          {peligros.map((hazard, idx) => (
            <div
              key={hazard.id}
              onDragOver={(e) => {
                e.preventDefault()
                onDragOver(e, hazard.id)
              }}
              onDrop={(e) => onDrop(e, hazard.id)}
            >
              <HazardItem
                hazard={hazard}
                hazardIndex={idx}
                isHighlighted={highlightPeligroId === hazard.id}
                isTargetEdge={dragOverPeligroId === hazard.id ? dragOverPeligroEdge : null}
                onToggleExpand={() => onToggleExpand(hazard.id)}
                onChangeTab={(tabIdx) => onChangeTab(hazard.id, tabIdx)}
                onUpdateField={(path, val) => onUpdateField(hazard.id, path, val)}
                onDuplicate={() => onDuplicate(hazard.id)}
                onDelete={() => onDelete(hazard.id)}
                onDragStart={(e) => onDragStart(e, hazard.id)}
                onDragEnd={onDragEnd}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
