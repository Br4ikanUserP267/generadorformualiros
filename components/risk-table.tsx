"use client"

import { useState } from "react"
import type { Riesgo } from "@/lib/types"
import { calcularNivelRiesgo, getRiskColor, getRiskTextColor } from "@/lib/types"
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
  Edit,
  Trash2,
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

    // Fecha range filter
    if (fechaDesde) {
      if (new Date(r.fecha) < new Date(fechaDesde)) return false
    }
    if (fechaHasta) {
      if (new Date(r.fecha) > new Date(fechaHasta)) return false
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
    <div className="space-y-4">
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

          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="bg-background h-9 w-36"
            placeholder="Desde"
          />
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="bg-background h-9 w-36"
            placeholder="Hasta"
          />
        </div>

        <Button onClick={onAdd} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo Riesgo
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
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
                  className="cursor-pointer hover:bg-muted/80 text-foreground font-semibold text-xs hidden md:table-cell"
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
                <TableHead className="text-foreground font-semibold text-xs hidden lg:table-cell">
                  Cargo
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs text-center">
                  Nivel
                </TableHead>
                <TableHead className="text-foreground font-semibold text-xs hidden xl:table-cell">
                  Fecha
                </TableHead>
                <TableHead className="text-right text-foreground font-semibold text-xs w-24">
                  Acciones
                </TableHead>
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
                      <TableCell className="text-foreground text-sm hidden md:table-cell">
                        {truncate(riesgo.zona, 20)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/70 text-secondary-foreground text-xs font-normal">
                          {truncate(riesgo.clasificacion, 15)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                        {truncate(riesgo.cargo, 18)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={`${getRiskColor(nivel)} ${getRiskTextColor(nivel)} border-0 text-xs font-medium px-2 py-0.5`}
                        >
                          {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                        </Badge>
                      </TableCell>
                      {/* 'expuestos' removed */}
                      <TableCell className="text-muted-foreground text-xs hidden xl:table-cell">
                        {riesgo.fecha}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => onEdit(riesgo)}
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(riesgo.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
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
