"use client"

import { useState } from "react"
import type { Riesgo } from "@/lib/types"
import { calcularNivelRiesgo, getRiskColor, getRiskTextColor, interpretacionFromValor, getInterpretacionColor, getInterpretacionTextColor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClasificaciones } from "@/hooks/use-clasificaciones"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  ChevronDown, 
  ChevronUp, 
  Search,
  Plus,
  Download
} from "lucide-react"
import { exportRisksToExcel } from '@/lib/export-to-excel'

interface RiskTableProps {
  riesgos: Riesgo[]
  onEdit: (riesgo: Riesgo) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

export function RiskTable({ riesgos, onEdit, onDelete, onAdd }: RiskTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Riesgo>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [nivelFilter, setNivelFilter] = useState<string>("all")
  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")
  const { clasificaciones, addClasificacion } = useClasificaciones()

  const filteredRiesgos = riesgos.filter(r => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      r.proceso.toLowerCase().includes(q) ||
      r.zona.toLowerCase().includes(q) ||
      r.clasificacion.toLowerCase().includes(q) ||
      (r.tipo_proceso || '').toString().toLowerCase().includes(q) ||
      r.cargo.toLowerCase().includes(q)

    if (!matchesSearch) return false

    // Nivel filter
    if (nivelFilter !== "all") {
      const { nivel } = calcularNivelRiesgo(r.deficiencia, r.exposicion, r.consecuencia)
      if (nivel !== nivelFilter) return false
    }

    // Fecha range filter: include if either creation (`fecha`) or update (`fecha_ejecucion`) falls within range
    if (fechaDesde) {
      const desde = new Date(fechaDesde)
      const fechaElab = new Date(r.fecha)
      const fechaAct = r.fecha_ejecucion ? new Date(r.fecha_ejecucion) : null
      if (fechaElab < desde && (!fechaAct || fechaAct < desde)) return false
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      const fechaElab = new Date(r.fecha)
      const fechaAct = r.fecha_ejecucion ? new Date(r.fecha_ejecucion) : null
      if (fechaElab > hasta && (!fechaAct || fechaAct > hasta)) return false
    }

    return true
  })

  const sortedRiesgos = [...filteredRiesgos].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    }
    
    return 0
  })

  const handleSort = (field: keyof Riesgo) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: keyof Riesgo }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? 
      <ChevronUp className="h-3 w-3 inline ml-1" /> : 
      <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const downloadBlob = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const formatAsList = (text?: string) => {
    if (!text) return ""
    return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => `<li>${s}</li>`).join("")
  }

  const generateIndividualHtml = (r: Riesgo) => {
    const { nivel, valor } = calcularNivelRiesgo(r.deficiencia, r.exposicion, r.consecuencia)
    const interp = (r.interpretacion_nivel_riesgo as string) || interpretacionFromValor(valor)
    return `<!doctype html><html><head><meta charset="utf-8" /><title>Informe de Riesgo - ${r.id}</title>
    <style>
      body{font-family:Arial, Helvetica, sans-serif;color:#111827;margin:28px;line-height:1.35}
      h2{font-size:14px;margin:18px 0 8px;color:#0f172a}
      h3{font-size:12px;margin:12px 0 6px}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th,td{padding:8px 10px;text-align:left;vertical-align:top;border:1px solid #e6e7eb;font-size:12px}
      th{background:#fff;font-weight:600;width:30%}
      .bullet{margin:6px 0 0 18px}
      .section{margin-top:10px;page-break-inside:avoid}
    </style>
    </head><body>
    <h2>Información general</h2>
    <table>
      <tr><th>Área / Proceso</th><td>${r.proceso || '-'}</td></tr>
      <tr><th>Zona / Lugar</th><td>${r.zona || '-'}</td></tr>
      <tr><th>Responsable / Cargo</th><td>${r.individuo || '-'} — ${r.cargo || '-'}</td></tr>
      <tr><th>Fecha elaboración</th><td>${r.fecha || '-'}</td></tr>
      <tr><th>Fecha actualización</th><td>${r.fecha_ejecucion || '-'}</td></tr>
    </table>

    <h2>Clasificación del riesgo</h2>
    <table>
      <tr><th>Clasificación</th><td>${r.clasificacion || '-'}</td></tr>
      <tr><th>Deficiencia · Exposición · Consecuencia</th><td>${r.deficiencia ?? '-'} · ${r.exposicion ?? '-'} · ${r.consecuencia ?? '-'}</td></tr>
      <tr><th>Nivel calculado</th><td>${nivel} (${valor}) — Interpretación: ${r.interpretacion_nivel_riesgo || interp}</td></tr>
      <tr><th>Aceptabilidad</th><td>${r.aceptabilidad || '-'}</td></tr>
    </table>

    <div class="section">
      <h2>Descripción del peligro</h2>
      <ul class="bullet">${formatAsList(r.peligro_desc)}</ul>
      <h3>Efectos</h3>
      <ul class="bullet">${formatAsList(r.efectos)}</ul>
    </div>

    <div class="section">
      <h2>Controles existentes</h2>
      <p>${r.controles || '-'}</p>
      <h2>Medidas de intervención / Seguimiento</h2>
      <p>${r.intervencion || r.seguimiento || '-'}</p>
    </div>

    <div class="section">
      <h2>Datos complementarios</h2>
      <table>
        <tr><th>Número de expuestos</th><td>${r.num_expuestos ?? '-'}</td></tr>
        <tr><th>Peor consecuencia</th><td>${r.peor_consecuencia || '-'}</td></tr>
        <tr><th>Requisito legal</th><td>${r.requisito_legal || '-'}</td></tr>
        <tr><th>Controles específicos</th><td>Eliminación: ${r.control_eliminacion || '-'}<br/>Sustitución: ${r.control_sustitucion || '-'}<br/>Ingeniería: ${r.control_ingenieria || '-'}<br/>Admin.: ${r.control_admin || '-'} · EPP: ${r.epp || '-'}</td></tr>
      </table>
    </div>

    ${r.archivos && r.archivos.length ? `<div class="section"><h2>Archivos adjuntos (${r.archivos.length})</h2><ul class="bullet">${r.archivos.map(a => `<li>${a.nombre} — ${Math.round(a.tamano/1024)} KB</li>`).join('')}</ul></div>` : ''}

    </body></html>`
  }

  const generateByAreasHtml = (riesgosList: Riesgo[]) => {
    const grouped = riesgosList.reduce<Record<string, Riesgo[]>>((acc, cur) => {
      const key = cur.zona || "Sin área"
      acc[key] = acc[key] || []
      acc[key].push(cur)
      return acc
    }, {})
    let body = `<!doctype html><html><head><meta charset="utf-8" /><title>Informe por Áreas</title>
    <style>
      body{font-family:Arial, Helvetica, sans-serif;color:#111827;margin:28px;line-height:1.35}
      h2{font-size:14px;margin:18px 0 8px;color:#0f172a}
      h3{font-size:12px;margin:12px 0 6px}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th,td{padding:8px 10px;text-align:left;vertical-align:top;border:1px solid #e6e7eb;font-size:12px}
      th{background:#fff;font-weight:600;width:30%}
      .bullet{margin:6px 0 0 18px}
      .section{margin-top:10px;page-break-inside:avoid}
      .risk-block{padding:12px;margin:10px 0;page-break-inside:avoid;background:#fff}
    </style>
    </head><body><h1>INFORME POR ÁREAS</h1>

    `

    for (const area of Object.keys(grouped)) {
      body += `<h2>Área: ${area} (${grouped[area].length} registros)</h2>`

      for (const r of grouped[area]) {
        const { nivel, valor } = calcularNivelRiesgo(r.deficiencia, r.exposicion, r.consecuencia)
        const interp = (r.interpretacion_nivel_riesgo as string) || interpretacionFromValor(valor)
        body += `<div class="risk-block">`
        body += `<h3>#${r.id} — ${r.proceso} / ${r.zona}</h3>`
        body += `<p><strong>Clasificación:</strong> ${r.clasificacion || '-'} | <strong>Cargo:</strong> ${r.cargo || '-'} | <strong>Responsable:</strong> ${r.individuo || '-'}</p>`
        body += `<h4>Descripción del Peligro</h4><p>${r.peligro_desc || '-'}</p>`
        body += `<h4>Efectos</h4><p>${r.efectos || '-'}</p>`
        body += `<h4>Evaluación</h4>`
        body += `<p><strong>Deficiencia (ND):</strong> ${r.deficiencia ?? '-'} &nbsp; <strong>Exposición (NE):</strong> ${r.exposicion ?? '-'} &nbsp; <strong>Consecuencia (NC):</strong> ${r.consecuencia ?? '-'}</p>`
        body += `<p><strong>Probabilidad (NP):</strong> ${r.probabilidad ?? '-'} &nbsp; <strong>Nivel Riesgo:</strong> ${nivel} (${valor}) &nbsp; <strong>Interpretación:</strong> ${interp}</p>`
        body += `<p><strong>Aceptabilidad:</strong> ${r.aceptabilidad ?? '-'} &nbsp; <strong>Número Expuestos:</strong> ${r.num_expuestos ?? '-'}</p>`
        body += `<h4>Controles Existentes</h4><p>${r.controles || '-'}</p>`
        body += `<h4>Medidas de Intervención</h4><p>${r.intervencion || '-'}</p>`
        body += `<h4>Controles específicos</h4><p><strong>Eliminación:</strong> ${r.control_eliminacion || '-'} | <strong>Sustitución:</strong> ${r.control_sustitucion || '-'} | <strong>Ingeniería:</strong> ${r.control_ingenieria || '-'}</p>`
        body += `<p><strong>Administrativos:</strong> ${r.control_admin || '-'} | <strong>EPP:</strong> ${r.epp || '-'}</p>`
        body += `<h4>Fechas</h4><p><strong>Fecha elaboración:</strong> ${r.fecha || '-'} &nbsp; <strong>Fecha ejecución/actualización:</strong> ${r.fecha_ejecucion || '-'}</p>`
        if (r.archivos && r.archivos.length > 0) {
          body += `<h4>Archivos Adjuntos (${r.archivos.length})</h4><ul>`
          for (const f of r.archivos) {
            body += `<li>${f.nombre} (${f.tipo}) — ${Math.round(f.tamano/1024)} KB</li>`
          }
          body += `</ul>`
        }
        body += `</div>`
      }
    }

    body += `<div class="footer"><img src="/assets/footer.png" alt="footer" /><img src="/assets/footer.png" alt="footer" /></div>`
    body += `</body></html>`
    return body
  }

  const downloadIndividual = (e: React.MouseEvent, r: Riesgo) => {
    e.stopPropagation()
    const html = generateIndividualHtml(r)
    downloadBlob(html, `informe_riesgo_${r.id}.doc`)
  }

  const downloadByAreas = (riesgosList: Riesgo[]) => {
    const html = generateByAreasHtml(riesgosList)
    downloadBlob(html, `informe_por_areas.doc`)
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="min-w-max">
      {/* Search, filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card h-9 text-sm"
            />
          </div>
          {/* allow creating a classification from the search box if not exists */}
          {searchTerm.trim().length > 0 && !clasificaciones.some(c => c.toLowerCase() === searchTerm.trim().toLowerCase()) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const v = searchTerm.trim()
                addClasificacion(v)
                // optional: clear search or notify
              }}
              className="h-9"
            >
              Crear categoría "{searchTerm.trim()}"
            </Button>
          )}

          <Select value={nivelFilter} onValueChange={(v) => setNivelFilter(v)}>
            <SelectTrigger className="w-40 bg-background h-9">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="bajo">Bajo</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-background h-9 w-36"
              placeholder="Desde"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-background h-9 w-36"
              placeholder="Hasta"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => downloadByAreas(sortedRiesgos)} size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Download className="h-4 w-4 mr-1.5" />
            Descargar (Áreas)
          </Button>
          <Button onClick={() => exportRisksToExcel(sortedRiesgos)} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Download className="h-4 w-4 mr-1.5" />
            Exportar Excel
          </Button>
          <Button onClick={onAdd} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Riesgo
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead 
                  className="cursor-pointer hover:bg-muted/80 text-foreground font-semibold text-xs w-16"
                  onClick={() => handleSort("id")}
                >
                  ID <SortIcon field="id" />
                </TableHead>
                  <TableHead className="text-foreground font-semibold text-xs">Tipo</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/80 text-foreground font-semibold text-xs"
                  onClick={() => handleSort("proceso")}
                >
                  Proceso <SortIcon field="proceso" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/80 text-foreground font-semibold text-xs"
                  onClick={() => handleSort("zona")}
                >
                  Zona <SortIcon field="zona" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/80 text-foreground font-semibold text-xs"
                  onClick={() => handleSort("clasificacion")}
                >
                  Clasificacion <SortIcon field="clasificacion" />
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs">
                  Cargo
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs text-center">
                  Interpretación Nivel Riesgo
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs">
                  Fecha Elaboración
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs">
                  Fecha Actualización
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs text-center">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {sortedRiesgos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                sortedRiesgos.map((riesgo) => {
                  const { nivel, valor } = calcularNivelRiesgo(
                    riesgo.deficiencia, 
                    riesgo.exposicion, 
                    riesgo.consecuencia
                  )
                  const interp = (riesgo.interpretacion_nivel_riesgo as string) || interpretacionFromValor(valor)
                  return (
                    <TableRow 
                      key={riesgo.id} 
                      className="hover:bg-muted/30 cursor-pointer group"
                      onClick={() => onEdit(riesgo)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{riesgo.id}
                      </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{riesgo.tipo_proceso || '-'}</TableCell>
                      <TableCell className="font-medium text-foreground text-sm">
                        {truncate(riesgo.proceso, 25)}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        {truncate(riesgo.zona, 20)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground text-xs font-normal">
                          {truncate(riesgo.clasificacion, 15)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {truncate(riesgo.cargo, 18)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={`${getInterpretacionColor(interp)} ${getInterpretacionTextColor(interp)} border-0 text-xs font-medium px-2 py-0.5`}
                        >
                          {interp}
                        </Badge>
                      </TableCell>
                      {/* 'expuestos' removed */}
                      <TableCell className="text-muted-foreground text-xs">
                        {riesgo.fecha}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {riesgo.fecha_ejecucion || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => downloadIndividual(e, riesgo)}
                          className="h-8"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sortedRiesgos.length} de {riesgos.length} registros
        </span>
        <span className="hidden sm:inline">
          Clic en una fila para editar
        </span>
      </div>
    </div>
  )
}
