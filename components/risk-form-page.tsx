"use client"

import { useState, useEffect, useRef } from "react"
import type { Riesgo, ArchivoAdjunto } from "@/lib/types"
import { /* calcularNivelRiesgo, getRiskColor, getRiskTextColor */ } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useClasificaciones } from "@/hooks/use-clasificaciones"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Save, X, Upload, FileText, Image, File, Trash2 } from "lucide-react"

interface RiskFormPageProps {
  riesgo: Riesgo | null
  onCancel: () => void
  onSave: (riesgo: Partial<Riesgo>) => void
}

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

export function RiskFormPage({ riesgo, onCancel, onSave }: RiskFormPageProps) {
  const [formData, setFormData] = useState<Partial<Riesgo>>(DEFAULT_RIESGO)
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { clasificaciones, addClasificacion } = useClasificaciones()
  const [addingClasificacion, setAddingClasificacion] = useState(false)
  const [newClasificacion, setNewClasificacion] = useState("")

  useEffect(() => {
    if (riesgo) {
      setFormData(riesgo)
      setArchivos(riesgo.archivos || [])
    } else {
      setFormData(DEFAULT_RIESGO)
      setArchivos([])
    }
  }, [riesgo])

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

  // Nivel Riesgo = Probabilidad * Consecuencia and interpretation
  useEffect(() => {
    const prob = Number(formData.probabilidad || 0)
    const nc = Number(formData.consecuencia || 0)
    const nivel = prob * nc
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const newArchivos: ArchivoAdjunto[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: file.name,
      tipo: file.type,
      tamano: file.size,
      url: URL.createObjectURL(file),
      fechaSubida: new Date().toISOString()
    }))
    
    setArchivos(prev => [...prev, ...newArchivos])
  }

  const handleRemoveFile = (id: string) => {
    setArchivos(prev => prev.filter(a => a.id !== id))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="h-5 w-5" />
    if (tipo.includes('pdf')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))

    const today = new Date().toISOString().split('T')[0]
    const payload: Partial<Riesgo> = { ...formData, archivos }
    if (riesgo) {
      // Preserve user-edited fecha_ejecucion if provided, otherwise default to today
      payload.fecha_ejecucion = payload.fecha_ejecucion || today
    } else {
      payload.fecha = payload.fecha || today
    }

    onSave(payload)
    setIsSaving(false)
  }

  return (
    <div className="bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-primary shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-primary-foreground/30" />
              <h1 className="text-lg font-semibold text-primary-foreground">
                {riesgo ? "Editar Riesgo" : "Nuevo Registro de Riesgo"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                disabled={isSaving}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                {isSaving ? (
                  <>
                    <Spinner className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {riesgo ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
          
          {/* Document Header */}
          <Card className="border-border bg-card">
            <CardContent>
              <div className="grid grid-cols-2 gap-4 items-center">
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
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">ÁREA / PROCESO</div>
                  <Input value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ELABORACIÓN</div>
                    <Input type="date" value={formData.fecha || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <div className="font-medium">RESPONSABLE</div>
                  <Input value={formData.individuo || ""} onChange={(e) => handleChange("individuo", e.target.value)} />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ACTUALIZACIÓN</div>
                    <Input type="date" value={formData.fecha_ejecucion || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nivel de Riesgo Calculado removed as requested */}

          {/* Basic Info Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Informacion General</CardTitle>
              <CardDescription>Datos basicos del proceso y la actividad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="font-medium">Proceso</div>
                    <Input id="proceso" value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} placeholder="Ej: Atención al Paciente" className="bg-background" />
                  </div>
                  <div>
                    <div className="font-medium">Zona / Lugar</div>
                    <Input id="zona" value={formData.zona || ""} onChange={(e) => handleChange("zona", e.target.value)} placeholder="Ej: Urgencias" className="bg-background" />
                  </div>
                </div>

                <div>
                  <div className="font-medium">Actividades</div>
                  <Textarea id="actividad" value={formData.actividad || ""} onChange={(e) => handleChange("actividad", e.target.value)} placeholder="Describa las actividades..." rows={3} className="bg-background resize-y" />
                </div>

                <div>
                  <div className="font-medium">Tarea</div>
                  <Textarea id="tarea" value={formData.tarea || ""} onChange={(e) => handleChange("tarea", e.target.value)} placeholder="Describa la tarea específica..." rows={2} className="bg-background resize-y" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="font-medium">Cargo</div>
                    <Input id="cargo" value={formData.cargo || ""} onChange={(e) => handleChange("cargo", e.target.value)} placeholder="Cargo" className="bg-background" />
                  </div>
                  <div>
                    <div className="font-medium">Actividad Rutinaria</div>
                    <div className="flex items-center h-10 gap-2">
                      <Switch id="rutinario" checked={!!formData.rutinario} onCheckedChange={(checked) => handleChange("rutinario", checked)} />
                      <span className="text-sm text-muted-foreground">{formData.rutinario ? "Sí" : "No"}</span>
                    </div>
                  </div>
                </div>

                {/* Fecha removed as requested */}
              </div>
            </CardContent>
          </Card>

          {/* Información del Peligro (Segundo cuadro) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Información del Peligro</CardTitle>
              <CardDescription>Descripción, clasificación y efectos posibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="peligro_desc">Descripción del Peligro *</FieldLabel>
                  <Textarea
                    id="peligro_desc"
                    value={formData.peligro_desc || ""}
                    onChange={(e) => handleChange("peligro_desc", e.target.value)}
                    placeholder="Describa detalladamente el peligro identificado..."
                    required
                    rows={5}
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
                    rows={4}
                    className="bg-background resize-y"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>



          {/* Controls and Interventions Section (tercer cuadro) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Controles Existentes</CardTitle>
              <CardDescription>Información de controles: fuente, medio e individuo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fuente">Fuente</FieldLabel>
                  <Input id="fuente" value={(formData.fuente as string) || ""} onChange={(e) => handleChange("fuente", e.target.value)} className="bg-background" />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="medio">Medio</FieldLabel>
                  <Textarea id="medio" value={(formData.medio as string) || ""} onChange={(e) => handleChange("medio", e.target.value)} rows={3} className="bg-background resize-y" />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="individuo">Individuo</FieldLabel>
                  <Textarea id="individuo" value={(formData.individuo as string) || ""} onChange={(e) => handleChange("individuo", e.target.value)} rows={2} className="bg-background resize-y" />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Evaluacion del Riesgo (cuarto cuadro) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Evaluacion del Riesgo</CardTitle>
              <CardDescription>Califique el nivel de deficiencia, exposicion y consecuencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="deficiencia">Nivel Deficiencia (ND)</FieldLabel>
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
                    <FieldLabel htmlFor="exposicion">Nivel Exposicion (NE)</FieldLabel>
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
                {/* Mostrar Probabilidad (NP) como Badge para mejor visualización */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="probabilidad">Nivel Probabilidad (NP)</FieldLabel>
                    <div id="probabilidad" className="inline-block"><Badge>{String(formData.probabilidad ?? "")}</Badge></div>
                  </Field>
                </FieldGroup>

                {/* Consecuencia (NC) ahora después de NP */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="consecuencia">Nivel Consecuencia (NC)</FieldLabel>
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
            </CardContent>
          </Card>

          {/* Quinto cuadro: Criterios para Establecer Controles */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Criterios para Establecer Controles</CardTitle>
              <CardDescription>Número de expuestos, peor consecuencia y requisito legal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="font-medium">Número de Expuestos</div>
                  <Input id="num_expuestos" type="number" min={0} value={String(formData.num_expuestos ?? "")} onChange={(e) => handleChange("num_expuestos", parseInt(e.target.value || "0"))} className="bg-background" />
                </div>
                <div className="sm:col-span-2">
                  <div className="font-medium">Peor Consecuencia</div>
                  <Textarea id="peor_consecuencia" value={(formData.peor_consecuencia as string) || ""} onChange={(e) => handleChange("peor_consecuencia", e.target.value)} rows={3} className="bg-background resize-y" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-medium">Existencia de Requisito Legal o Específico</div>
                <Select value={(formData.requisito_legal as string) || "none"} onValueChange={(v) => handleChange("requisito_legal", v === "none" ? "" : v)}>
                  <SelectTrigger className="bg-background w-40"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">--</SelectItem>
                    <SelectItem value="Si">Si</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sexto cuadro: Medidas de Intervención */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Medidas de Intervención</CardTitle>
              <CardDescription>Acciones para reducir o controlar el riesgo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="font-medium">Eliminación</div>
                  <Input id="control_eliminacion" value={(formData.control_eliminacion as string) || ""} onChange={(e) => handleChange("control_eliminacion", e.target.value)} className="bg-background" />
                </div>
                <div>
                  <div className="font-medium">Sustitución</div>
                  <Input id="control_sustitucion" value={(formData.control_sustitucion as string) || ""} onChange={(e) => handleChange("control_sustitucion", e.target.value)} className="bg-background" />
                </div>
                <div>
                  <div className="font-medium">Controles de Ingeniería</div>
                  <Textarea id="control_ingenieria" value={(formData.control_ingenieria as string) || ""} onChange={(e) => handleChange("control_ingenieria", e.target.value)} rows={3} className="bg-background resize-y" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="font-medium">Señalización</div>
                  <Input id="senalizacion" value={(formData.senalizacion as string) || ""} onChange={(e) => handleChange("senalizacion", e.target.value)} className="bg-background" />
                </div>
                <div>
                  <div className="font-medium">Advertencia</div>
                  <Input id="advertencia" value={(formData.advertencia as string) || ""} onChange={(e) => handleChange("advertencia", e.target.value)} className="bg-background" />
                </div>
                <div>
                  <div className="font-medium">Controles Administrativos</div>
                  <Textarea id="control_admin" value={(formData.control_admin as string) || ""} onChange={(e) => handleChange("control_admin", e.target.value)} rows={3} className="bg-background resize-y" />
                </div>
              </div>

              <div className="mt-4">
                <div className="font-medium">Equipos / Elementos de Protección Personal</div>
                <Textarea id="epp" value={(formData.epp as string) || ""} onChange={(e) => handleChange("epp", e.target.value)} rows={2} className="bg-background resize-y" />
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium">Seguimiento Medidas De Intervención</h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="font-medium">Intervención</div>
                    <Textarea id="intervencion" value={formData.intervencion || ""} onChange={(e) => handleChange("intervencion", e.target.value)} rows={2} className="bg-background resize-y" />
                  </div>
                  <div>
                      <div className="font-medium">Fecha de Ejecución</div>
                      <Input id="fecha_ejecucion" type="date" value={(formData.fecha_ejecucion as string) || ""} onChange={(e) => handleChange("fecha_ejecucion", e.target.value)} className="bg-background" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          

          {/* File Attachments Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Archivos Adjuntos</CardTitle>
              <CardDescription>Suba documentos, imagenes o evidencias relacionadas con el riesgo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={
                  `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium text-foreground mb-1">Arrastre archivos aqui o haga clic para seleccionar</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel, imagenes (max 10MB por archivo)</p>
              </div>

              {/* File List */}
              {archivos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Archivos seleccionados ({archivos.length})</p>
                  <div className="space-y-2">
                    {archivos.map((archivo) => (
                      <div key={archivo.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary">{getFileIcon(archivo.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{archivo.nombre}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(archivo.tamano)}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(archivo.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons (Mobile) */}
          <div className="flex gap-3 sm:hidden pb-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                riesgo ? "Actualizar" : "Guardar"
              )}
            </Button>
          </div>

          <div className="h-8" />
        </form>
      </main>
    </div>
  )
}
