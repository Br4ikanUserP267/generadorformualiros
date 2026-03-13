"use client"

import { useState, useEffect } from "react"
import type { Riesgo } from "@/lib/types"
import { /* calcularNivelRiesgo, getRiskColor, getRiskTextColor */ } from "@/lib/types"
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

  // Calculate derived fields: Probabilidad = Deficiencia * Exposición
  useEffect(() => {
    const nd = Number(formData.deficiencia || 0)
    const ne = Number(formData.exposicion || 0)
    const prob = nd * ne
    const interpretProb = (p: number) => {
      if (p === 0) return ""
      if (p <= 4) return "Bajo"
      if (p <= 8) return "Medio"
      if (p <= 20) return "Alto"
      return "Muy Alto"
    }
    setFormData(prev => ({ ...prev, probabilidad: prob, interpretacion_probabilidad: interpretProb(prob) }))
  }, [formData.deficiencia, formData.exposicion])

  // Nivel Riesgo = Probabilidad * Consecuencia
  useEffect(() => {
    const prob = Number(formData.probabilidad || 0)
    const nc = Number(formData.consecuencia || 0)
    const nivel = prob * nc
    // interpretation mapping
    const interpret = (val: number) => {
      if (val === 0) return ""
      if (val <= 20) return "IV"
      if (val <= 120) return "III"
      if (val <= 500) return "II"
      if (val <= 4000) return "I"
      return "I"
    }
    setFormData(prev => ({ ...prev, nivel_riesgo: nivel, interpretacion_nivel_riesgo: interpret(nivel) }))
  }, [formData.probabilidad, formData.consecuencia])

  // Aceptabilidad based on interpretación nivel riesgo
  useEffect(() => {
    const interp = formData.interpretacion_nivel_riesgo as string | undefined
    const mapAceptabilidad = (i?: string) => {
      if (!i) return ""
      switch (i) {
        case "IV": return "Aceptable"
        case "III": return "Mejorable"
        case "II": return "Aceptable con Control Especifico"
        case "I": return "No Aceptable"
        default: return ""
      }
    }
    setFormData(prev => ({ ...prev, aceptabilidad: mapAceptabilidad(interp) }))
  }, [formData.interpretacion_nivel_riesgo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))

    const today = new Date().toISOString().split('T')[0]
    const payload: Partial<Riesgo> = { ...formData }
    if (riesgo) {
      // If user set a fecha_ejecucion keep it; otherwise default to today
      payload.fecha_ejecucion = payload.fecha_ejecucion || today
    } else {
      payload.fecha = payload.fecha || today
    }

    onSave(payload)
    setIsSaving(false)
    onClose()
  }

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
            {/* Document Header */}
            <div className="p-4 bg-card border border-border rounded-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">SISTEMAS INTEGRADOS GESTIÓN</div>
                  <div className="text-xs">CLINICA SANTA MARIA S.A.S.</div>
                  <div className="text-xs font-medium mt-2">MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS</div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div>Codigo: 45.17-FOR-38</div>
                  <div>Versión: 02</div>
                  <div>Fecha: 26/4/2019</div>
                  <div>Pagina: 1 de 1</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <Input value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} placeholder="Área / Proceso" />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ELABORACIÓN</div>
                    <Input type="date" value={formData.fecha || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <Input value={(formData.individuo as string) || ""} onChange={(e) => handleChange("individuo", e.target.value)} placeholder="Responsable" />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ACTUALIZACIÓN</div>
                    <Input type="date" value={(formData.fecha_ejecucion as string) || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>
            {/* Header removed: Nivel de Riesgo Calculado */}

            {/* Información General */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Información General</h3>
              <div className="grid gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="proceso">Proceso</FieldLabel>
                    <Input id="proceso" value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} placeholder="Área / Proceso" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="zona">Zona / Lugar</FieldLabel>
                    <Input id="zona" value={formData.zona || ""} onChange={(e) => handleChange("zona", e.target.value)} placeholder="Zona / Lugar" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="actividad">Actividades</FieldLabel>
                    <Textarea id="actividad" value={formData.actividad || ""} onChange={(e) => handleChange("actividad", e.target.value)} placeholder="Describa las actividades..." rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tarea">Tarea</FieldLabel>
                    <Textarea id="tarea" value={formData.tarea || ""} onChange={(e) => handleChange("tarea", e.target.value)} placeholder="Describa la tarea específica..." rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="cargo">Cargo</FieldLabel>
                      <Input id="cargo" value={formData.cargo || ""} onChange={(e) => handleChange("cargo", e.target.value)} placeholder="Cargo" className="bg-background" />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="rutinario">Actividad Rutinaria</FieldLabel>
                      <div className="flex items-center h-10 gap-2">
                        <Switch id="rutinario" checked={!!formData.rutinario} onCheckedChange={(checked) => handleChange("rutinario", checked)} />
                        <span className="text-sm text-muted-foreground">{formData.rutinario ? "Sí" : "No"}</span>
                      </div>
                    </Field>
                  </FieldGroup>
                </div>

                {/* Fecha removed as requested */}
              </div>
            </div>
            {/* Información del Peligro */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Información del Peligro</h3>
              <div className="space-y-4">
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
                    <FieldLabel htmlFor="clasificacion">Clasificación del Peligro *</FieldLabel>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                        <SelectTrigger className="bg-background w-full sm:w-auto">
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
              </div>
            </div>

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
                {/* Mostrar Probabilidad como bloque no editable para evitar que el usuario intente escribir */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="probabilidad">Nivel Probabilidad (NP)</FieldLabel>
                    <div id="probabilidad" className="inline-block"><Badge>{String(formData.probabilidad ?? "")}</Badge></div>
                  </Field>
                </FieldGroup>

                {/* Consecuencia (NC) ahora después de NP */}
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
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="interpretacion_probabilidad">Interpretación Nivel Probabilidad</FieldLabel>
                    <div id="interpretacion_probabilidad" className="inline-block">
                      <Badge>{(formData.interpretacion_probabilidad as string) || ""}</Badge>
                    </div>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="nivel_riesgo">Nivel Riesgo (valor)</FieldLabel>
                    <div id="nivel_riesgo" className="bg-background border border-border rounded px-3 py-2">{String(formData.nivel_riesgo ?? "")}</div>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="interpretacion_nivel_riesgo">Interpretación Nivel Riesgo</FieldLabel>
                    <div id="interpretacion_nivel_riesgo">
                      <Badge>{(formData.interpretacion_nivel_riesgo as string) || ""}</Badge>
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FieldGroup>
                  <Field>
                      <FieldLabel htmlFor="aceptabilidad">Aceptabilidad Del Riesgo</FieldLabel>
                      <div id="aceptabilidad" className="bg-background border border-border rounded px-3 py-2">{(formData.aceptabilidad as string) || ""}</div>
                    </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Controles Existentes (tercer cuadro) */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Controles Existentes</h3>
              <div className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="fuente">Fuente</FieldLabel>
                    <Input id="fuente" value={(formData.fuente as string) || ""} onChange={(e) => handleChange("fuente", e.target.value)} placeholder="Fuente del control" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="medio">Medio</FieldLabel>
                    <Textarea id="medio" value={(formData.medio as string) || ""} onChange={(e) => handleChange("medio", e.target.value)} placeholder="Describa medios o recursos" rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="individuo">Individuo</FieldLabel>
                    <Textarea id="individuo" value={(formData.individuo as string) || ""} onChange={(e) => handleChange("individuo", e.target.value)} placeholder="Persona(s) responsables / expuestas" rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Quinto cuadro: Criterios para Establecer Controles */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Criterios para Establecer Controles</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="num_expuestos">Número de Expuestos</FieldLabel>
                    <Input id="num_expuestos" type="number" min={0} value={String(formData.num_expuestos ?? "")} onChange={(e) => handleChange("num_expuestos", parseInt(e.target.value || "0"))} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup className="sm:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="peor_consecuencia">Peor Consecuencia</FieldLabel>
                    <Textarea id="peor_consecuencia" value={(formData.peor_consecuencia as string) || ""} onChange={(e) => handleChange("peor_consecuencia", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>
              <div className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="requisito_legal">Existencia de Requisito Legal o Específico</FieldLabel>
                    <Select value={(formData.requisito_legal as string) || "none"} onValueChange={(v) => handleChange("requisito_legal", v === "none" ? "" : v)}>
                      <SelectTrigger className="bg-background w-full"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Sexto cuadro: Medidas de Intervención */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Medidas de Intervención</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_eliminacion">Eliminación</FieldLabel>
                    <Input id="control_eliminacion" value={(formData.control_eliminacion as string) || ""} onChange={(e) => handleChange("control_eliminacion", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_sustitucion">Sustitución</FieldLabel>
                    <Input id="control_sustitucion" value={(formData.control_sustitucion as string) || ""} onChange={(e) => handleChange("control_sustitucion", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_ingenieria">Controles de Ingeniería</FieldLabel>
                    <Textarea id="control_ingenieria" value={(formData.control_ingenieria as string) || ""} onChange={(e) => handleChange("control_ingenieria", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="senalizacion">Señalización / Advertencia</FieldLabel>
                    <Input id="senalizacion" value={(formData.control_admin as string) || ""} onChange={(e) => handleChange("control_admin", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_admin">Controles Administrativos</FieldLabel>
                    <Textarea id="control_admin_text" value={(formData.control_admin as string) || ""} onChange={(e) => handleChange("control_admin", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="epp">Equipos / EPP</FieldLabel>
                    <Textarea id="epp" value={(formData.epp as string) || ""} onChange={(e) => handleChange("epp", e.target.value)} rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium">Seguimiento Medidas De Intervención</h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="intervencion">Intervención</FieldLabel>
                      <Textarea id="intervencion" value={formData.intervencion || ""} onChange={(e) => handleChange("intervencion", e.target.value)} rows={2} className="bg-background resize-y" />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="fecha_ejecucion">Fecha de Ejecución</FieldLabel>
                      <Input id="fecha_ejecucion" type="date" value={(formData.fecha_ejecucion as string) || ""} onChange={(e) => handleChange("fecha_ejecucion", e.target.value)} className="bg-background" />
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>
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
