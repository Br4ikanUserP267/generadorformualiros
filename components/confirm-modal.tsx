"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const isDelete = confirmLabel.toLowerCase().includes('eliminar')

  return (
    <Dialog
      open={open}
      onOpenChange={(v: any) => {
        if (!v) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-[440px] rounded-3xl border border-[#dfe9e2] bg-white p-6 shadow-xl space-y-4">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDelete
                  ? 'bg-rose-50 border-rose-200/70 text-rose-600'
                  : 'bg-amber-50 border-amber-200/70 text-amber-600'
              }`}
            >
              {isDelete ? (
                <Trash2 className="size-5.5 text-rose-600" />
              ) : (
                <AlertTriangle className="size-5.5 text-amber-600" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-black text-[#163522] tracking-tight">
                {title || 'Confirmar acción'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5e6b62] leading-relaxed">
                {message || '¿Estás seguro de que deseas continuar? Esta acción no se puede deshacer.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f2f6f3] text-[#5e6b62] hover:text-[#163522] text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4.5 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-[#1F7D3E] hover:bg-[#186331] shadow-[#1F7D3E]/20'
            }`}
          >
            {isDelete && <Trash2 className="size-3.5 text-white" />}
            <span>{confirmLabel}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
