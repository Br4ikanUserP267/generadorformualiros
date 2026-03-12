"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Riesgo } from "@/lib/types"
import { mockRiesgos, mockConfiguracion } from "@/lib/mock-data"
import { calcularNivelRiesgo } from "@/lib/types"
import { RiskTable } from "./risk-table"
import { RiskFormPage } from "./risk-form-page"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  LogOut, 
  User, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileText,
  Users
} from "lucide-react"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [riesgos, setRiesgos] = useState<Riesgo[]>(mockRiesgos)
  const [selectedRiesgo, setSelectedRiesgo] = useState<Riesgo | null>(null)
  const [formPageOpen, setFormPageOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [riesgoToDelete, setRiesgoToDelete] = useState<number | null>(null)

  // Calculate statistics
  const stats = riesgos.reduce((acc, r) => {
    const { nivel } = calcularNivelRiesgo(r.deficiencia, r.exposicion, r.consecuencia)
    acc[nivel] = (acc[nivel] || 0) + 1
    acc.total++
    return acc
  }, { bajo: 0, medio: 0, alto: 0, critico: 0, total: 0 })

  // Statistics (expuestos removed)

  const handleEdit = (riesgo: Riesgo) => {
    setSelectedRiesgo(riesgo)
    setFormPageOpen(true)
  }

  const handleAdd = () => {
    setSelectedRiesgo(null)
    setFormPageOpen(true)
  }

  const handleDelete = (id: number) => {
    setRiesgoToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (riesgoToDelete !== null) {
      setRiesgos(prev => prev.filter(r => r.id !== riesgoToDelete))
      setRiesgoToDelete(null)
      setDeleteModalOpen(false)
    }
  }

  const handleSave = (data: Partial<Riesgo>) => {
    if (selectedRiesgo) {
      // Update existing
      setRiesgos(prev => prev.map(r => 
        r.id === selectedRiesgo.id ? { ...r, ...data } : r
      ))
    } else {
      // Create new
      const newId = Math.max(...riesgos.map(r => r.id), 0) + 1
      setRiesgos(prev => [...prev, { ...data, id: newId } as Riesgo])
    }
    setFormPageOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ScJPjpOXSkIGZHkl7FFCE7fq1ZwfXt.png"
                alt="Clínica Santa María S.A.S"
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">Matriz de Riesgos</h1>
                <p className="text-xs text-muted-foreground">
                  {mockConfiguracion.codigo} v{mockConfiguracion.version}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{user?.cargo}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.nombre}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <StatCard
            title="Total Riesgos"
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            title="Riesgo Bajo"
            value={stats.bajo}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="text-[oklch(0.45_0.12_145)]"
            bgColor="bg-[oklch(0.7_0.15_145)]/20"
          />
          <StatCard
            title="Riesgo Medio"
            value={stats.medio}
            icon={<AlertCircle className="h-5 w-5" />}
            color="text-[oklch(0.45_0.12_85)]"
            bgColor="bg-[oklch(0.75_0.18_85)]/20"
          />
          <StatCard
            title="Riesgo Alto"
            value={stats.alto}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="text-[oklch(0.45_0.15_50)]"
            bgColor="bg-[oklch(0.65_0.20_50)]/20"
          />
          <StatCard
            title="Riesgo Crítico"
            value={stats.critico}
            icon={<XCircle className="h-5 w-5" />}
            color="text-destructive"
            bgColor="bg-destructive/10"
          />
        </div>

        {/* Filters moved into RiskTable (next to search) */}

        {/* Risk Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground">Registro de Riesgos</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskTable
              riesgos={riesgos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Full Page Form for New Risk */}
      {formPageOpen && (
        <div className="fixed inset-0 z-[100] bg-background overflow-x-hidden">
          <RiskFormPage
            riesgo={selectedRiesgo}
            onCancel={() => setFormPageOpen(false)}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <span className={color}>{icon}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
