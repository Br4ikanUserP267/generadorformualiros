"use client"

import React from 'react'
import { FolderSearch, RotateCcw } from 'lucide-react'
import { MatrixCard } from './matrix-card'

interface MatrixListProps {
  matrices: any[]
  totalMatrices: number
  isLoading: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  setPageSize: (size: number) => void
  onPageChange: (page: number) => void
  onResetFilters: () => void
  onPreview: (id: string) => void
  onVersions: (id: string, title: string) => void
  onDownload: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function MatrixList({
  matrices,
  totalMatrices,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  setPageSize,
  onPageChange,
  onResetFilters,
  onPreview,
  onVersions,
  onDownload,
  onDuplicate,
  onDelete,
}: MatrixListProps) {
  return (
    <section className="space-y-4">
      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#163522]">
            {totalMatrices} {totalMatrices === 1 ? 'matriz encontrada' : 'matrices encontradas'}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5e6b62]">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-1 rounded-lg border border-[#e2e9e4] bg-white text-xs font-bold text-[#163522] focus:outline-none focus:border-[#1F7D3E] cursor-pointer shadow-2xs"
          >
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={30}>30 por pág.</option>
            <option value={50}>50 por pág.</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#e2e9e4] rounded-2xl p-5 shadow-xs animate-pulse flex flex-col xl:flex-row xl:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="size-12 rounded-2xl bg-[#eef5f0]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-60 rounded-md bg-[#eef5f0]" />
                  <div className="h-3 w-80 rounded-md bg-[#f4f8f5]" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-12 h-12 rounded-xl bg-[#f8faf9]" />
                  <div className="w-12 h-12 rounded-xl bg-[#f8faf9]" />
                  <div className="w-12 h-12 rounded-xl bg-[#f8faf9]" />
                  <div className="w-12 h-12 rounded-xl bg-[#f8faf9]" />
                </div>
                <div className="w-24 h-9 rounded-xl bg-[#eef5f0]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && matrices.length === 0 && (
        <div className="bg-white border border-dashed border-[#d1e2d6] rounded-2xl py-16 px-6 text-center space-y-3.5 shadow-xs">
          <div className="mx-auto size-12 rounded-2xl bg-[#f0f9f1] border border-[#d1e2d6] flex items-center justify-center text-[#1F7D3E]">
            <FolderSearch className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#163522]">
              No se encontraron matrices de riesgos
            </h3>
            <p className="text-xs text-[#5e6b62] max-w-md mx-auto">
              No hay matrices que coincidan con los criterios de búsqueda o filtros seleccionados.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f0f9f1] border border-[#d1e2d6] text-xs font-bold text-[#1F7D3E] hover:bg-white transition-all shadow-2xs"
          >
            <RotateCcw className="size-3.5" />
            <span>Restablecer todos los filtros</span>
          </button>
        </div>
      )}

      {/* Matrix Cards List */}
      {!isLoading && matrices.length > 0 && (
        <div className="space-y-3">
          {matrices.map((matrix) => (
            <MatrixCard
              key={matrix.id}
              matrix={matrix}
              onPreview={onPreview}
              onVersions={onVersions}
              onDownload={onDownload}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && totalMatrices > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e2e9e4]">
          <div className="text-xs font-bold text-[#5e6b62]">
            Página <span className="text-[#163522]">{currentPage}</span> de{' '}
            <span className="text-[#163522]">{totalPages}</span>
            <span className="mx-2 text-[#cbd5cf]">|</span>
            {totalMatrices} matrices en total
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              className="px-3 py-1.5 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#163522] hover:bg-[#f8faf9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Primera
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1.5 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#163522] hover:bg-[#f8faf9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Anterior
            </button>
            <span className="px-2 text-xs font-black text-[#1F7D3E]">
              {currentPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1.5 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#163522] hover:bg-[#f8faf9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Siguiente
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1.5 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#163522] hover:bg-[#f8faf9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Última
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
