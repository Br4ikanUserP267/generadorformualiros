"use client"

import React from 'react'
import { Search, RotateCcw, Plus, FileSpreadsheet, FilePlus2, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MatrixFiltersProps {
  search: string
  setSearch: (value: string) => void
  dateDesde: string
  setDateDesde: (value: string) => void
  dateHasta: string
  setDateHasta: (value: string) => void
  tipoFilter: string
  setTipoFilter: (value: string) => void
  tiposList: string[]
  onResetFilters: () => void
  onNewMatrix: () => void
  onOpenImport: () => void
}

export function MatrixFilters({
  search,
  setSearch,
  dateDesde,
  setDateDesde,
  dateHasta,
  setDateHasta,
  tipoFilter,
  setTipoFilter,
  tiposList,
  onResetFilters,
  onNewMatrix,
  onOpenImport,
}: MatrixFiltersProps) {
  const hasActiveFilters = Boolean(search || dateDesde || dateHasta || tipoFilter)

  return (
    <div className="bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8aa08f]">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Área, Proceso, Zona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm text-[#163522] placeholder:text-[#8aa08f] focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20 focus:border-[#1F7D3E] focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Date Filters + Type Select + Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Desde */}
          <div className="flex items-center gap-2 bg-[#f8faf9] border border-[#e2e9e4] px-3 py-1.5 rounded-xl flex-1 sm:flex-none">
            <span className="text-[10px] font-bold text-[#8aa08f] uppercase tracking-wider whitespace-nowrap">
              Desde
            </span>
            <input
              type="date"
              value={dateDesde}
              onChange={(e) => setDateDesde(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#163522] focus:outline-none cursor-pointer w-full sm:w-auto"
            />
          </div>

          {/* Hasta */}
          <div className="flex items-center gap-2 bg-[#f8faf9] border border-[#e2e9e4] px-3 py-1.5 rounded-xl flex-1 sm:flex-none">
            <span className="text-[10px] font-bold text-[#8aa08f] uppercase tracking-wider whitespace-nowrap">
              Hasta
            </span>
            <input
              type="date"
              value={dateHasta}
              onChange={(e) => setDateHasta(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#163522] focus:outline-none cursor-pointer w-full sm:w-auto"
            />
          </div>

          {/* Tipo Filter */}
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-xs font-bold text-[#2c3630] cursor-pointer focus:outline-none focus:border-[#1F7D3E] focus:ring-2 focus:ring-[#1F7D3E]/20 flex-1 sm:flex-none"
          >
            <option value="">Tipo: Todos</option>
            {tiposList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Limpiar Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#5e6b62] hover:bg-[#f8faf9] hover:text-[#163522] transition-colors"
            >
              <RotateCcw className="size-3.5 text-[#8aa08f]" />
              <span>Limpiar</span>
            </button>
          )}

          {/* + Nueva Matriz Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#1F7D3E] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#1F7D3E]/20 hover:bg-[#186331] active:scale-[0.99] transition-all cursor-pointer flex-1 sm:flex-none"
              >
                <Plus className="size-4 stroke-[3]" />
                <span>Nueva Matriz</span>
                <ChevronDown className="size-3.5 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white border border-[#e2e9e4] rounded-2xl shadow-xl">
              <DropdownMenuItem
                onClick={onNewMatrix}
                className="p-2.5 rounded-xl cursor-pointer hover:bg-[#f0f9f1] focus:bg-[#f0f9f1] text-[#163522] flex items-center gap-2.5"
              >
                <div className="size-7 rounded-lg bg-[#f0f9f1] text-[#1F7D3E] flex items-center justify-center">
                  <FilePlus2 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#163522]">Crear desde cero</span>
                  <span className="text-[10px] text-[#8aa08f]">Diseñar una matriz vacía</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenImport}
                className="p-2.5 rounded-xl cursor-pointer hover:bg-[#f0f9f1] focus:bg-[#f0f9f1] text-[#163522] flex items-center gap-2.5"
              >
                <div className="size-7 rounded-lg bg-[#f0f9f1] text-[#1F7D3E] flex items-center justify-center">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#163522]">Importar desde Excel</span>
                  <span className="text-[10px] text-[#8aa08f]">Cargar archivo oficial .xlsx</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
