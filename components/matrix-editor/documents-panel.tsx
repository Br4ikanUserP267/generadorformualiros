"use client"

import React from 'react'
import { Paperclip, Plus, FileText, Download, Trash2, ImageIcon, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentsPanelProps {
  files: any[]
  onOpenAddFiles: () => void
  onDeleteFile: (index: number) => void
}

function shortFileName(n: string, maxBase = 16) {
  if (!n) return ''
  const idx = n.lastIndexOf('.')
  const ext = idx > 0 ? n.slice(idx) : ''
  const base = idx > 0 ? n.slice(0, idx) : n
  if (base.length > maxBase) return base.slice(0, maxBase - 2) + '…' + ext
  return base + ext
}

export function DocumentsPanel({
  files = [],
  onOpenAddFiles,
  onDeleteFile,
}: DocumentsPanelProps) {
  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[linear-gradient(180deg,#fcfdfc_0%,#f5f9f6_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-[#1F7D3E]" />
          <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider">
            Documentos ({files.length})
          </h4>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenAddFiles}
          className="rounded-lg border-[#d1e2d6] text-[#1F7D3E] hover:bg-[#eef7f0] hover:border-[#1F7D3E] text-[11px] font-bold h-7 px-2.5 shadow-2xs"
        >
          <Plus className="size-3 mr-1" />
          Añadir archivos
        </Button>
      </div>

      {/* Files Content */}
      <div className="p-3.5 sm:p-4">
        {files.length === 0 ? (
          <div className="text-center py-5 text-xs text-[#7a9182] italic">
            No hay archivos adjuntos a esta matriz.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {files.map((file, i) => (
              <div
                key={i}
                className="group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-[#edf2ed] bg-[#fcfdfc] hover:bg-white hover:border-[#d1e2d6] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="size-8 rounded-lg bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d1e2d6]">
                    {file.type?.startsWith('image/') ? (
                      <ImageIcon className="size-4 text-[#0284c7]" />
                    ) : (file.name || '').includes('.xls') || (file.name || '').includes('.csv') ? (
                      <FileSpreadsheet className="size-4 text-[#1F7D3E]" />
                    ) : (
                      <FileText className="size-4 text-[#7a9182]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-bold text-[#163522] truncate"
                      title={file.name || 'Archivo'}
                    >
                      {shortFileName(file.name || 'Archivo')}
                    </div>
                    {file.size && (
                      <div className="text-[10px] text-[#7a9182]">
                        {Math.round(file.size / 1024)} KB
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {file.data && (
                    <a
                      href={file.data}
                      download={file.name || 'documento'}
                      className="p-1 rounded-md text-[#1F7D3E] hover:bg-[#eef7f0] transition-colors"
                      title="Descargar archivo"
                    >
                      <Download className="size-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteFile(i)}
                    className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
