"use client"

import React, { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Paperclip, UploadCloud, Trash2, FileText, ImageIcon, FileSpreadsheet } from 'lucide-react'

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveFiles: (files: Array<{ name: string; type: string; size: number; data: string }>) => void
}

function decodeDataUrl(dataUrl: string) {
  try {
    const parts = dataUrl.split(',')
    if (parts.length < 2) return ''
    const meta = parts[0]
    const isBase64 = meta.indexOf(';base64') !== -1
    const payload = parts[1]
    if (isBase64) {
      try {
        return atob(payload)
      } catch {
        return ''
      }
    }
    return decodeURIComponent(payload)
  } catch {
    return ''
  }
}

export function FilesModal({
  open,
  onOpenChange,
  onSaveFiles,
}: FilesModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; type: string; size: number; data: string }>
  >([])
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFilesInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const read = await Promise.all(
      files.map(
        (f) =>
          new Promise<any>((res) => {
            const fr = new FileReader()
            fr.onload = () =>
              res({
                name: f.name,
                type: f.type,
                size: f.size,
                data: String(fr.result),
              })
            fr.readAsDataURL(f)
          })
      )
    )
    setUploadedFiles((cur) => [...cur, ...read])
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((cur) => {
      const copy = [...cur]
      copy.splice(index, 1)
      return copy
    })
    setSelectedPreviewIndex((cur) =>
      cur === index ? null : cur && cur > index ? cur - 1 : cur
    )
  }

  const handleSave = () => {
    if (uploadedFiles.length > 0) {
      onSaveFiles(uploadedFiles)
    }
    setUploadedFiles([])
    setSelectedPreviewIndex(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white rounded-2xl border border-[#dbe8de] p-6 shadow-xl">
        <DialogHeader className="pb-3 border-b border-[#edf2ed]">
          <DialogTitle className="text-base font-black text-[#163522] flex items-center gap-2">
            <Paperclip className="size-4.5 text-[#1F7D3E]" />
            <span>Añadir Archivos Adjuntos a la Matriz</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesInput}
          />

          {/* Upload Drop/Click Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-[#d1e2d6] bg-[#fbfdfb] hover:bg-[#f4f8f5] hover:border-[#1F7D3E] transition-all p-6 text-center cursor-pointer space-y-2"
          >
            <div className="size-11 rounded-2xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#163522]">
                Haz clic para examinar archivos
              </p>
              <p className="text-[11px] text-[#7a9182] mt-0.5">
                PDF, Excel, Word, imágenes o documentos de soporte
              </p>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider flex items-center justify-between">
              <span>Archivos seleccionados ({uploadedFiles.length})</span>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#7a9182] italic">
                Ningún archivo seleccionado todavía.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#f0f5f1]">
                {uploadedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 pt-1.5 first:pt-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewIndex(i)}
                      className="flex items-center gap-2.5 min-w-0 text-left flex-1 hover:text-[#1F7D3E]"
                    >
                      {f.type.startsWith('image/') ? (
                        <ImageIcon className="size-4 text-[#0284c7] shrink-0" />
                      ) : f.name.includes('.xls') || f.name.includes('.csv') ? (
                        <FileSpreadsheet className="size-4 text-[#1F7D3E] shrink-0" />
                      ) : (
                        <FileText className="size-4 text-[#7a9182] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#163522] truncate max-w-[320px]">
                          {f.name}
                        </div>
                        <div className="text-[10px] text-[#7a9182]">
                          {Math.round(f.size / 1024)} KB
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeUploadedFile(i)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Quitar de la lista"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Snippet if image/text */}
          {selectedPreviewIndex !== null && uploadedFiles[selectedPreviewIndex] && (
            <div className="rounded-xl border border-[#dfe9e2] bg-[#f8faf9] p-3 text-center">
              {uploadedFiles[selectedPreviewIndex].type.startsWith('image/') ? (
                <img
                  src={uploadedFiles[selectedPreviewIndex].data}
                  alt="preview"
                  className="max-h-36 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="text-xs text-[#5e6b62]">
                  Archivo listo para guardar con la matriz.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf2ed]">
            <Button
              variant="ghost"
              onClick={() => {
                setUploadedFiles([])
                onOpenChange(false)
              }}
              className="rounded-xl text-xs font-bold text-[#5e6b62]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploadedFiles.length === 0}
              className="rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-xs font-black text-white px-5 shadow-sm disabled:opacity-50"
            >
              Guardar Archivos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
