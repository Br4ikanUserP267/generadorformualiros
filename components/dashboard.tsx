"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ConfirmModal from './confirm-modal'
import { ImportMatrizModal } from './ImportMatrizModal'
import { MatrixPreview } from './matrix-preview'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import type { Riesgo } from '@/lib/types'
import { apiFetch } from '@/lib/utils'
import { InstructionsModal } from './InstructionsModal'
import { ShieldCheck } from 'lucide-react'

// Modular Dashboard Subcomponents
import { AppSidebar } from './dashboard/app-sidebar'
import { DashboardHeader } from './dashboard/dashboard-header'
import { DashboardStats } from './dashboard/dashboard-stats'
import { MatrixFilters } from './dashboard/matrix-filters'
import { MatrixList } from './dashboard/matrix-list'
import {
  VersionHistoryModal,
  type MatrixVersionSummary,
  type MatrixVersionDetail,
} from './dashboard/version-history-modal'

export function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()

  // App Shell State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Data & Filter State
  const [matrices, setMatrices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [dateDesde, setDateDesde] = useState('')
  const [dateHasta, setDateHasta] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalMatrices, setTotalMatrices] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totals, setTotals] = useState({ totM: 0, totP: 0, ma: 0, al: 0, me: 0, ba: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [facetTipos, setFacetTipos] = useState<string[]>([])

  // Modals & Action State
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [duplicateSuccess, setDuplicateSuccess] = useState(false)
  const [duplicateSuccessTitle, setDuplicateSuccessTitle] = useState('')
  const [previewMatrixId, setPreviewMatrixId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Versions History State
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionDetailLoading, setVersionDetailLoading] = useState(false)
  const [versionsMatrixTitle, setVersionsMatrixTitle] = useState('')
  const [versionsMatrixId, setVersionsMatrixId] = useState('')
  const [versionEntries, setVersionEntries] = useState<MatrixVersionSummary[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [selectedVersionDetail, setSelectedVersionDetail] = useState<MatrixVersionDetail | null>(null)

  // Caching Refs
  const versionsCacheRef = useRef<Record<string, { title: string; versions: MatrixVersionSummary[] }>>({})
  const versionDetailCacheRef = useRef<Record<string, MatrixVersionDetail>>({})
  const summariesCacheRef = useRef<Record<string, any>>({})
  const prefetchTokenRef = useRef(0)
  const fetchTokenRef = useRef(0)

  const buildSummaryParams = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (search.trim()) params.set('search', search.trim())
    if (dateDesde) params.set('dateDesde', dateDesde)
    if (dateHasta) params.set('dateHasta', dateHasta)
    if (tipoFilter) params.set('tipo', tipoFilter)
    return params
  }

  const applySummaryPayload = (body: any, requestedPage: number) => {
    setMatrices(Array.isArray(body?.items) ? body.items : [])
    setTotalMatrices(Number(body?.total || 0))
    setTotalPages(Math.max(1, Number(body?.totalPages || 1)))

    if (body.totals) {
      setTotals({
        totP: Number(body.totals.totalPeligros || 0),
        ma: Number(body.totals.counts?.[0] || 0),
        al: Number(body.totals.counts?.[1] || 0),
        me: Number(body.totals.counts?.[2] || 0),
        ba: Number(body.totals.counts?.[3] || 0),
        totM: Number(body.totals.totalMatrices || 0),
      })
    }

    if (Number(body?.page) && Number(body.page) !== requestedPage) {
      setCurrentPage(Number(body.page))
    }
  }

  const prefetchRemainingPages = async (fromPage: number, maxPage: number, token: number) => {
    for (let p = fromPage; p <= maxPage; p++) {
      if (prefetchTokenRef.current !== token) return
      const params = buildSummaryParams(p)
      const key = params.toString()
      if (summariesCacheRef.current[key]) continue
      try {
        const res = await apiFetch(`/api/riesgos/summary?${key}`)
        if (!res.ok) return
        const body = await res.json()
        summariesCacheRef.current[key] = body
      } catch {
        return
      }
    }
  }

  const loadSummaries = async (page = 1) => {
    setIsLoading(true)
    const currentToken = ++fetchTokenRef.current
    try {
      const params = buildSummaryParams(page)
      const key = params.toString()
      const cached = summariesCacheRef.current[key]
      if (cached) {
        if (currentToken === fetchTokenRef.current) applySummaryPayload(cached, page)
      } else {
        const res = await apiFetch(`/api/riesgos/summary?${key}`)
        if (!res.ok) throw new Error('No se pudo cargar el resumen')
        const body = await res.json()
        summariesCacheRef.current[key] = body
        if (currentToken === fetchTokenRef.current) applySummaryPayload(body, page)
      }

      if (currentToken === fetchTokenRef.current) {
        const currentBody = summariesCacheRef.current[key]
        const maxPage = Number(currentBody?.totalPages || 1)
        if (page === 1 && maxPage > 1) {
          const token = ++prefetchTokenRef.current
          void prefetchRemainingPages(2, maxPage, token)
        }
      }
    } catch (error) {
      console.error('Error loading matrix summaries:', error)
    } finally {
      if (currentToken === fetchTokenRef.current) setIsLoading(false)
    }
  }

  const loadFacets = async () => {
    try {
      const res = await apiFetch('/api/riesgos/facets')
      if (!res.ok) return
      const body = await res.json().catch(() => ({}))
      setFacetTipos(Array.isArray(body?.tipos) ? body.tipos : [])
    } catch (error) {
      console.error('Error loading risk facets:', error)
    }
  }

  useEffect(() => {
    void loadSummaries(currentPage)
  }, [currentPage, search, dateDesde, dateHasta, tipoFilter, pageSize])

  useEffect(() => {
    void loadFacets()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    summariesCacheRef.current = {}
    prefetchTokenRef.current += 1
  }, [search, dateDesde, dateHasta, tipoFilter, pageSize])

  const handleResetFilters = () => {
    setSearch('')
    setDateDesde('')
    setDateHasta('')
    setTipoFilter('')
    setCurrentPage(1)
  }

  const handleNew = () => {
    router.push('/matriz/nuevo')
  }

  const handleOpenImport = () => {
    setImportOpen(true)
  }

  const handleDeleteMatrix = (id: string) => {
    setDeleteTarget(id)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/api/riesgos/${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar')
      }
      setConfirmOpen(false)
      setDeleteTarget(null)
      summariesCacheRef.current = {}
      await loadSummaries(currentPage)
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`)
    }
  }

  async function handleDownloadMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'No se pudo obtener la matriz')
      }
      const matrizData = await res.json()
      await exportMatrizToExcel(matrizData)
    } catch (error) {
      console.error('Error downloading matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al descargar la matriz: ${errorMsg}`)
    }
  }

  async function handleDuplicateMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('No se pudo obtener la matriz')
      const matrizData = await res.json()

      const duplicateData = {
        area: `${matrizData.area} (Copia)`,
        responsable: matrizData.responsable,
        fecha_elaboracion: new Date().toISOString().split('T')[0],
        fecha_actualizacion: '',
        files: matrizData.files || [],
        procesos: matrizData.procesos || [],
      }

      const createRes = await apiFetch('/api/riesgos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      })

      if (!createRes.ok) throw new Error('No se pudo crear la copia')

      summariesCacheRef.current = {}
      await loadSummaries(currentPage)
      setDuplicateSuccessTitle(`${duplicateData.area}`)
      setDuplicateSuccess(true)
    } catch (error) {
      console.error('Error duplicating matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al duplicar la matriz: ${errorMsg}`)
    }
  }

  async function handleOpenVersions(matrizId: string, title: string) {
    setVersionsOpen(true)
    setVersionsMatrixId(matrizId)
    setVersionsMatrixTitle(title)
    setSelectedVersionId(null)
    setSelectedVersionDetail(null)

    const cached = versionsCacheRef.current[matrizId]
    if (cached) {
      setVersionEntries(cached.versions)
      setVersionsMatrixTitle(cached.title || title)
      setVersionsLoading(false)
      if (cached.versions[0]?.id) {
        void handleSelectVersion(matrizId, cached.versions[0].id)
      }
      return
    }

    setVersionsLoading(true)
    setVersionEntries([])

    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}/versions`)
      if (!res.ok) throw new Error('Could not load matrix versions')
      const body = await res.json()
      const nextTitle = body?.matriz?.title || title
      const nextVersions = Array.isArray(body?.versions) ? body.versions : []
      versionsCacheRef.current[matrizId] = { title: nextTitle, versions: nextVersions }
      setVersionsMatrixTitle(nextTitle)
      setVersionEntries(nextVersions)
      if (nextVersions[0]?.id) {
        void handleSelectVersion(matrizId, nextVersions[0].id)
      }
    } catch (error) {
      console.error('Error loading matrix versions:', error)
      alert('Could not load matrix versions.')
    } finally {
      setVersionsLoading(false)
    }
  }

  async function handleSelectVersion(matrizId: string, versionId: string) {
    setSelectedVersionId(versionId)

    const cached = versionDetailCacheRef.current[versionId]
    if (cached) {
      setSelectedVersionDetail(cached)
      setVersionDetailLoading(false)
      return
    }

    setVersionDetailLoading(true)
    setSelectedVersionDetail(null)

    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}/versions?versionId=${versionId}`)
      if (!res.ok) throw new Error('Could not load version detail')
      const body = await res.json()
      const detail = body?.version || null
      if (detail) {
        versionDetailCacheRef.current[versionId] = detail
      }
      setSelectedVersionDetail(detail)
    } catch (error) {
      console.error('Error loading version detail:', error)
      alert('Could not load version detail.')
    } finally {
      setVersionDetailLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-[#f8faf9] flex text-[#2c3630]">
      {/* 1. Collapsible Left Application Shell Sidebar */}
      <AppSidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Minimal Application Header */}
        <DashboardHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenInstructions={() => setInstructionsOpen(true)}
        />

        {/* 3. Dashboard Body */}
        <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Dashboard Page Header */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1F7D3E]">
              Bienvenido
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#163522]">
              Gestión de Matrices de Riesgos
            </h1>
            <p className="text-xs sm:text-sm text-[#5e6b62] max-w-2xl font-medium">
              Administra, consulta y mantén actualizadas las matrices de identificación de peligros y evaluación de riesgos de la Clínica Santa María S.A.S.
            </p>
          </div>

          {/* KPI Statistics & Segmented Risk Distribution */}
          <DashboardStats totals={totals} />

          {/* Matrix Filters */}
          <MatrixFilters
            search={search}
            setSearch={setSearch}
            dateDesde={dateDesde}
            setDateDesde={setDateDesde}
            dateHasta={dateHasta}
            setDateHasta={setDateHasta}
            tipoFilter={tipoFilter}
            setTipoFilter={setTipoFilter}
            tiposList={facetTipos}
            onResetFilters={handleResetFilters}
            onNewMatrix={handleNew}
            onOpenImport={handleOpenImport}
          />

          {/* Matrix List with Cards, Skeletons, and Pagination */}
          <MatrixList
            matrices={matrices}
            totalMatrices={totalMatrices}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            setPageSize={setPageSize}
            onPageChange={setCurrentPage}
            onResetFilters={handleResetFilters}
            onPreview={setPreviewMatrixId}
            onVersions={handleOpenVersions}
            onDownload={handleDownloadMatrix}
            onDuplicate={handleDuplicateMatrix}
            onDelete={handleDeleteMatrix}
          />
        </main>
      </div>

      {/* Existing Modals Preserved */}
      <ImportMatrizModal open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDeleteAction}
        title="Eliminar Matriz"
        message="¿Estás seguro de que deseas eliminar esta matriz? Esta acción no se puede deshacer y borrará todos los procesos, actividades y peligros asociados."
      />

      <ConfirmModal
        open={duplicateSuccess}
        onCancel={() => setDuplicateSuccess(false)}
        onConfirm={() => setDuplicateSuccess(false)}
        title="Matriz Duplicada"
        message={`La matriz "${duplicateSuccessTitle}" ha sido duplicada exitosamente.`}
        confirmLabel="Aceptar"
      />

      {previewMatrixId && (
        <MatrixPreview
          matrizId={previewMatrixId}
          onClose={() => setPreviewMatrixId(null)}
        />
      )}

      {/* Version History Modal */}
      <VersionHistoryModal
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        matrixTitle={versionsMatrixTitle}
        matrixId={versionsMatrixId}
        loading={versionsLoading}
        detailLoading={versionDetailLoading}
        versionEntries={versionEntries}
        selectedVersionId={selectedVersionId}
        selectedVersionDetail={selectedVersionDetail}
        onSelectVersion={handleSelectVersion}
        currentUser={user}
      />

      <InstructionsModal
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />
    </div>
  )
}
