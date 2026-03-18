"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ConfirmModal({ open, title, message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', onConfirm, onCancel }: {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v:any)=> { if (!v) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || 'Confirmar'}</DialogTitle>
        </DialogHeader>
        <div className="py-2">{message || '¿Estás seguro?'}</div>
        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
            <Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
