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
  Plus
} from "lucide-react"

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

        <Button onClick={onAdd} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo Riesgo
        </Button>
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
                {/* Acciones column removed to simplify layout */}
              </TableRow>
            </TableHeader>
            <TableBody>
                {sortedRiesgos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
                      {/* Actions column removed; editing now via row click */}
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
