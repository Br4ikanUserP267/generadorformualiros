"use client"

import React from 'react'
import {
  Eye,
  History,
  MoreVertical,
  Pencil,
  Download,
  Copy,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MatrixActionsMenuProps {
  onPreview: () => void
  onVersions: () => void
  onEdit: () => void
  onDownload: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function MatrixActionsMenu({
  onPreview,
  onVersions,
  onEdit,
  onDownload,
  onDuplicate,
  onDelete,
}: MatrixActionsMenuProps) {
  return (
    <div
      className="flex items-center gap-1.5 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Visible Primary Action: Vista previa */}
      <button
        type="button"
        title="Vista previa de la matriz"
        onClick={onPreview}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e9e4] bg-white text-[#163522] text-xs font-bold hover:bg-[#f0f9f1] hover:border-[#b9d2bf] hover:text-[#1F7D3E] transition-all shadow-2xs"
      >
        <Eye className="size-3.5 text-[#1F7D3E]" />
        <span className="hidden sm:inline">Vista previa</span>
      </button>

      {/* 2. Visible Secondary Action: Versiones */}
      <button
        type="button"
        title="Historial de versiones y auditoría"
        onClick={onVersions}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#d1e2d6] bg-[#f8faf9] text-[#1F7D3E] text-xs font-bold hover:bg-[#f0f9f1] hover:border-[#b9d2bf] transition-all shadow-2xs"
      >
        <History className="size-3.5" />
        <span className="hidden sm:inline">Versiones</span>
      </button>

      {/* 3. Overflow dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Más opciones"
            aria-label="Más opciones"
            className="size-9 rounded-xl border border-[#e2e9e4] bg-white text-[#5e6b62] hover:bg-[#f0f9f1] hover:text-[#1F7D3E] hover:border-[#d1e2d6] flex items-center justify-center transition-all shadow-2xs"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1.5 bg-white border border-[#e2e9e4] rounded-2xl shadow-xl">
          <DropdownMenuItem
            onClick={onEdit}
            className="p-2 text-xs font-semibold text-[#163522] hover:bg-[#f0f9f1] rounded-xl cursor-pointer flex items-center gap-2.5"
          >
            <Pencil className="size-3.5 text-[#1F7D3E]" />
            <span>Editar matriz</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDownload}
            className="p-2 text-xs font-semibold text-[#163522] hover:bg-[#f0f9f1] rounded-xl cursor-pointer flex items-center gap-2.5"
          >
            <Download className="size-3.5 text-[#1F7D3E]" />
            <span>Descargar Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDuplicate}
            className="p-2 text-xs font-semibold text-[#163522] hover:bg-[#f0f9f1] rounded-xl cursor-pointer flex items-center gap-2.5"
          >
            <Copy className="size-3.5 text-[#8aa08f]" />
            <span>Duplicar</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#e2e9e4]" />
          <DropdownMenuItem
            onClick={onDelete}
            className="p-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl cursor-pointer flex items-center gap-2.5"
          >
            <Trash2 className="size-3.5" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
