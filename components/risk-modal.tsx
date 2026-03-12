"use client"

import type { Riesgo } from "@/lib/types"
import { calcularNivelRiesgo, getRiskColor, getRiskTextColor } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface RiskModalProps {
  riesgo: Riesgo | null
  open: boolean
  onClose: () => void
}

export function RiskModal({ riesgo, open, onClose }: RiskModalProps) {
  if (!riesgo) return null

  const { nivel, valor } = calcularNivelRiesgo(
    riesgo.deficiencia,
    riesgo.exposicion,
    riesgo.consecuencia
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-card">
        <DialogHeader className="p-6 pb-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-xl">
            {riesgo.proceso} - {riesgo.zona}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            ID del Riesgo: {riesgo.id} | Clasificación: {riesgo.clasificacion}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Risk Level Badge */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Nivel de Riesgo:</span>
              <Badge className={`${getRiskColor(nivel)} ${getRiskTextColor(nivel)} text-sm px-3 py-1 border-0`}>
                {nivel.toUpperCase()} - Valor: {valor}
              </Badge>
            </div>

            <Separator />

            {/* General Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Actividad" value={riesgo.actividad} />
              <InfoItem label="Tarea" value={riesgo.tarea} />
              <InfoItem label="Cargo" value={riesgo.cargo} />
              <InfoItem label="Rutinario" value={riesgo.rutinario ? "Sí" : "No"} />
              <InfoItem label="Fecha" value={riesgo.fecha} />
            </div>

            <Separator />

            {/* Risk Assessment Values */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Evaluación del Riesgo</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <div className="text-2xl font-bold text-primary">{riesgo.deficiencia}</div>
                  <div className="text-xs text-muted-foreground mt-1">Deficiencia (ND)</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <div className="text-2xl font-bold text-primary">{riesgo.exposicion}</div>
                  <div className="text-xs text-muted-foreground mt-1">Exposición (NE)</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <div className="text-2xl font-bold text-primary">{riesgo.consecuencia}</div>
                  <div className="text-xs text-muted-foreground mt-1">Consecuencia (NC)</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Long text sections */}
            <LongTextSection 
              title="Descripción del Peligro" 
              content={riesgo.peligro_desc} 
            />

            <LongTextSection 
              title="Efectos Posibles" 
              content={riesgo.efectos} 
            />

            <LongTextSection 
              title="Controles Existentes" 
              content={riesgo.controles} 
            />

            <LongTextSection 
              title="Medidas de Intervención" 
              content={riesgo.intervencion} 
            />

            {riesgo.seguimiento && (
              <LongTextSection 
                title="Seguimiento" 
                content={riesgo.seguimiento} 
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function LongTextSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <div className="p-4 rounded-lg bg-muted">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  )
}
