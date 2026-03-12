"use client"

import { useState, useEffect, useRef } from "react"
import type { Riesgo, ArchivoAdjunto } from "@/lib/types"
import { calcularNivelRiesgo, getRiskColor, getRiskTextColor } from "@/lib/types"
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
    
    onSave({ ...formData, archivos })
    setIsSaving(false)
  }

  const { nivel, valor } = calcularNivelRiesgo(
    formData.deficiencia || 0,
    formData.exposicion || 0,
    formData.consecuencia || 0
  )

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
          
          {/* Risk Level Preview Card */}
          <Card className="border-border bg-card">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-foreground">Nivel de Riesgo Calculado:</span>
                <Badge className={`${getRiskColor(nivel)} ${getRiskTextColor(nivel)} text-sm px-4 py-1.5 border-0`}>
                  {nivel.toUpperCase()} - NR: {valor}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  (ND: {formData.deficiencia} x NE: {formData.exposicion} x NC: {formData.consecuencia})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Informacion General</CardTitle>
              <CardDescription>Datos basicos del proceso y la actividad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="proceso">Proceso *</FieldLabel>
                    <Input
                      id="proceso"
                      value={formData.proceso || ""}
                      onChange={(e) => handleChange("proceso", e.target.value)}
                      placeholder="Ej: Atencion al Paciente"
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
                      placeholder="Ej: Triage y evaluacion inicial"
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
                    placeholder="Describa la tarea especifica..."
                    required
                    rows={3}
                    className="bg-background resize-y"
                  />
                </Field>
              </FieldGroup>

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="clasificacion">Clasificacion del Peligro *</FieldLabel>
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
                        {formData.rutinario ? "Si" : "No"}
                      </span>
                    </div>
                  </Field>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Danger Description Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Descripcion del Peligro</CardTitle>
              <CardDescription>Detalle el peligro identificado y sus posibles efectos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="peligro_desc">Descripcion del Peligro *</FieldLabel>
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

          {/* Risk Assessment Section */}
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
                <FieldGroup>
                  <Field>
                    {/* 'expuestos' field removed */}
                  </Field>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Controls and Interventions Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Controles e Intervenciones</CardTitle>
              <CardDescription>Medidas de control existentes y propuestas de intervencion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="controles">Controles Existentes *</FieldLabel>
                  <Textarea
                    id="controles"
                    value={formData.controles || ""}
                    onChange={(e) => handleChange("controles", e.target.value)}
                    placeholder="Describa los controles actuales implementados..."
                    required
                    rows={4}
                    className="bg-background resize-y"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="intervencion">Medidas de Intervencion *</FieldLabel>
                  <Textarea
                    id="intervencion"
                    value={formData.intervencion || ""}
                    onChange={(e) => handleChange("intervencion", e.target.value)}
                    placeholder="Describa las medidas de intervencion propuestas..."
                    required
                    rows={4}
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
                    placeholder="Plan de seguimiento y verificacion..."
                    rows={3}
                    className="bg-background resize-y"
                  />
                </Field>
              </FieldGroup>
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
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
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
                <p className="text-sm font-medium text-foreground mb-1">
                  Arrastre archivos aqui o haga clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel, imagenes (max 10MB por archivo)
                </p>
              </div>

              {/* File List */}
              {archivos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Archivos seleccionados ({archivos.length})
                  </p>
                  <div className="space-y-2">
                    {archivos.map((archivo) => (
                      <div
                        key={archivo.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary">
                          {getFileIcon(archivo.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {archivo.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(archivo.tamano)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(archivo.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
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
          </div>

          {/* Bottom spacer for scroll */}
          <div className="h-8" />
        </form>
      </main>
    </div>
  )
}
