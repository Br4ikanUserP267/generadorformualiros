"use client"

import { useState, useEffect } from "react"
import type { Riesgo } from "@/lib/types"
import { calcularNivelRiesgo, getRiskColor, getRiskTextColor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
// removed ScrollArea to avoid nested scrollbars
import { Switch } from "@/components/ui/switch"
import { useClasificaciones } from "@/hooks/use-clasificaciones"
import { Spinner } from "@/components/ui/spinner"

interface RiskFormProps {
  riesgo: Riesgo | null
  open: boolean
  onClose: () => void
  onSave: (riesgo: Partial<Riesgo>) => void
}

const CLASIFICACIONES = [
  "Biológico",
  "Químico",
  "Físico",
  "Mecánico",
  "Ergonómico",
  "Eléctrico",
  "Psicosocial",
  "Locativo",
  "Natural"
]

const DEFAULT_RIESGO: Partial<Riesgo> = {
  proceso: "",
  zona: "",
  actividad: "",
  tarea: "",
  cargo: "",
  rutinario: true,
  clasificacion: "",
  peligro_desc: "",
  efectos: "",
  deficiencia: 0,
  exposicion: 0,
  consecuencia: 0,
  controles: "",
  intervencion: "",
  fecha: new Date().toISOString().split('T')[0],
  seguimiento: ""
}

export function RiskForm({ riesgo, open, onClose, onSave }: RiskFormProps) {
  const [formData, setFormData] = useState<Partial<Riesgo>>(DEFAULT_RIESGO)
  const [isSaving, setIsSaving] = useState(false)
  const { clasificaciones, addClasificacion } = useClasificaciones()
  const [addingClasificacion, setAddingClasificacion] = useState(false)
  const [newClasificacion, setNewClasificacion] = useState("")

  useEffect(() => {
    if (riesgo) {
      setFormData(riesgo)
    } else {
      setFormData(DEFAULT_RIESGO)
    }
  }, [riesgo, open])

  // ensure classification exists in persisted list when editing
  useEffect(() => {
    if (riesgo && riesgo.clasificacion) {
      addClasificacion(riesgo.clasificacion)
    }
  }, [riesgo, addClasificacion])

  const handleChange = (field: keyof Riesgo, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    onSave(formData)
    setIsSaving(false)
    onClose()
  }

  const { nivel, valor } = calcularNivelRiesgo(
    formData.deficiencia || 0,
    formData.exposicion || 0,
    formData.consecuencia || 0
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card">
        <DialogHeader className="p-6 pb-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-xl">
            {riesgo ? "Editar Riesgo" : "Nuevo Riesgo"}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            {riesgo 
              ? `Editando riesgo ID: ${riesgo.id}` 
              : "Complete el formulario para registrar un nuevo riesgo"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Risk Level Preview */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <span className="text-sm font-medium text-foreground">Nivel de Riesgo Calculado:</span>
              <Badge className={`${getRiskColor(nivel)} ${getRiskTextColor(nivel)} text-sm px-3 py-1 border-0`}>
                {nivel.toUpperCase()} - NR: {valor}
              </Badge>
              <span className="text-xs text-muted-foreground">
                (ND × NE × NC = {formData.deficiencia} × {formData.exposicion} × {formData.consecuencia})
              </span>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="proceso">Proceso *</FieldLabel>
                  <Input
                    id="proceso"
                    value={formData.proceso || ""}
                    onChange={(e) => handleChange("proceso", e.target.value)}
                    placeholder="Ej: Atención al Paciente"
                    required
                    className="bg-background"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="zona">Zona / Lugar *</FieldLabel>
                  <Input
                    id="zona"
                    value={formData.zona || ""}
                    onChange={(e) => handleChange("zona", e.target.value)}
                    placeholder="Ej: Urgencias"
                    required
                    className="bg-background"
                  />
                </Field>
              </FieldGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="actividad">Actividad *</FieldLabel>
                  <Input
                    id="actividad"
                    value={formData.actividad || ""}
                    onChange={(e) => handleChange("actividad", e.target.value)}
                    placeholder="Ej: Triage y evaluación inicial"
                    required
                    className="bg-background"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="cargo">Cargo *</FieldLabel>
                  <Input
                    id="cargo"
                    value={formData.cargo || ""}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    placeholder="Ej: Enfermero/a Jefe"
                    required
                    className="bg-background"
                  />
                </Field>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tarea">Tarea *</FieldLabel>
                <Textarea
                  id="tarea"
                  value={formData.tarea || ""}
                  onChange={(e) => handleChange("tarea", e.target.value)}
                  placeholder="Describa la tarea específica..."
                  required
                  rows={2}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>

            <div className="grid gap-4 sm:grid-cols-3">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="clasificacion">Clasificación del Peligro *</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.clasificacion || ""}
                      onValueChange={(value) => {
                        if (value === "__add__") {
                          setAddingClasificacion(true)
                          return
                        }
                        handleChange("clasificacion", value)
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clasificaciones.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="__add__">+ Agregar nueva categoría</SelectItem>
                      </SelectContent>
                    </Select>

                    {addingClasificacion && (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nueva categoría"
                          value={newClasificacion}
                          onChange={(e) => setNewClasificacion(e.target.value)}
                          className="bg-background"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const v = newClasificacion.trim()
                            if (!v) return
                            addClasificacion(v)
                            handleChange("clasificacion", v)
                            setNewClasificacion("")
                            setAddingClasificacion(false)
                          }}
                        >Agregar</Button>
                        <Button size="sm" variant="outline" onClick={() => setAddingClasificacion(false)}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fecha">Fecha *</FieldLabel>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha || ""}
                    onChange={(e) => handleChange("fecha", e.target.value)}
                    required
                    className="bg-background"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rutinario">Actividad Rutinaria</FieldLabel>
                  <div className="flex items-center h-10 gap-2">
                    <Switch
                      id="rutinario"
                      checked={formData.rutinario}
                      onCheckedChange={(checked) => handleChange("rutinario", checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.rutinario ? "Sí" : "No"}
                    </span>
                  </div>
                </Field>
              </FieldGroup>
            </div>

            {/* Danger Description */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="peligro_desc">Descripción del Peligro *</FieldLabel>
                <Textarea
                  id="peligro_desc"
                  value={formData.peligro_desc || ""}
                  onChange={(e) => handleChange("peligro_desc", e.target.value)}
                  placeholder="Describa detalladamente el peligro identificado..."
                  required
                  rows={4}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="efectos">Efectos Posibles *</FieldLabel>
                <Textarea
                  id="efectos"
                  value={formData.efectos || ""}
                  onChange={(e) => handleChange("efectos", e.target.value)}
                  placeholder="Describa los posibles efectos en la salud..."
                  required
                  rows={3}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>

            {/* Risk Assessment */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="font-semibold text-foreground mb-4">Evaluación del Riesgo</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="deficiencia">Deficiencia (ND)</FieldLabel>
                    <Input
                      id="deficiencia"
                      type="number"
                      min={0}
                      step={1}
                      value={String(formData.deficiencia ?? "")}
                      onChange={(e) => handleChange("deficiencia", parseInt(e.target.value || "0"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="exposicion">Exposición (NE)</FieldLabel>
                    <Input
                      id="exposicion"
                      type="number"
                      min={1}
                      max={4}
                      step={1}
                      value={String(formData.exposicion ?? "")}
                      onChange={(e) => handleChange("exposicion", parseInt(e.target.value || "1"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="consecuencia">Consecuencia (NC)</FieldLabel>
                    <Input
                      id="consecuencia"
                      type="number"
                      min={0}
                      step={1}
                      value={String(formData.consecuencia ?? "")}
                      onChange={(e) => handleChange("consecuencia", parseInt(e.target.value || "0"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    {/* 'expuestos' field removed */}
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Controls and Interventions */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="controles">Controles Existentes *</FieldLabel>
                <Textarea
                  id="controles"
                  value={formData.controles || ""}
                  onChange={(e) => handleChange("controles", e.target.value)}
                  placeholder="Describa los controles actuales implementados..."
                  required
                  rows={3}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="intervencion">Medidas de Intervención *</FieldLabel>
                <Textarea
                  id="intervencion"
                  value={formData.intervencion || ""}
                  onChange={(e) => handleChange("intervencion", e.target.value)}
                  placeholder="Describa las medidas de intervención propuestas..."
                  required
                  rows={3}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="seguimiento">Seguimiento</FieldLabel>
                <Textarea
                  id="seguimiento"
                  value={formData.seguimiento || ""}
                  onChange={(e) => handleChange("seguimiento", e.target.value)}
                  placeholder="Plan de seguimiento y verificación..."
                  rows={2}
                  className="bg-background resize-y"
                />
              </Field>
            </FieldGroup>
          </form>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/30">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              riesgo ? "Actualizar" : "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
