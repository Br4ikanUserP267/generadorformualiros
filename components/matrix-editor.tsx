"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import ConfirmModal from '@/components/confirm-modal'
import { apiFetch } from '@/lib/utils'
import { FolderTree, ShieldAlert, FileSpreadsheet } from 'lucide-react'

// Modular Matrix Editor Subcomponents
import { MatrixGeneralInfoHeader } from './matrix-editor/matrix-general-info-header'
import { MatrixInfoCard } from './matrix-editor/matrix-info-card'
import { OrganizationalSidebar } from './matrix-editor/organizational-sidebar'
import { ActivityHeader } from './matrix-editor/activity-header'
import { ActivityDetailPanel } from './matrix-editor/activity-detail-panel'
import { ActivityRiskSummary } from './matrix-editor/activity-risk-summary'
import { HazardSection } from './matrix-editor/hazard-section'

// Modals
import { EditProcesoModal } from './matrix-editor/modals/edit-proceso-modal'
import { EditZonaModal } from './matrix-editor/modals/edit-zona-modal'
import { EditActividadModal } from './matrix-editor/modals/edit-actividad-modal'
import { FilesModal } from './matrix-editor/modals/files-modal'
import { SelectPeligroCatalogModal } from './matrix-editor/modals/select-peligro-catalog-modal'

function makeId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9)
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function interpProbabilidad(np: number) {
  if (!np) return { label: '', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a' }
  if (np <= 8) return { label: 'Medio', color: '#ca8a04' }
  if (np <= 20) return { label: 'Alto', color: '#ea580c' }
  return { label: 'Muy Alto', color: '#dc2626' }
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV', color: '#16a34a' }
  if (nr <= 120) return { label: 'III', color: '#16a34a' }
  if (nr <= 500) return { label: 'II', color: '#ca8a04' }
  return { label: 'I', color: '#dc2626' }
}

function aceptabilidadFromNivel(label: string) {
  if (!label) return ''
  switch (label) {
    case 'IV':
      return 'Aceptable'
    case 'III':
      return 'Mejorable'
    case 'II':
      return 'Aceptable con Control Especifico'
    case 'I':
      return 'No Aceptable'
    default:
      return ''
  }
}

export default function MatrixEditor({ id }: { id?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const peligroIdParam = searchParams?.get('peligroId') || null

  // Matrix State
  const [matrix, setMatrix] = useState<any>(null)
  const [selected, setSelected] = useState<{
    procesoId?: string
    zonaId?: string
    actividadId?: string
  }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Search & Navigation State
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedZonaIds, setExpandedZonaIds] = useState<Record<string, boolean>>({})

  // Modals State
  const [showProcesoModal, setShowProcesoModal] = useState(false)
  const [editingProceso, setEditingProceso] = useState<any>(null)

  const [showZonaModal, setShowZonaModal] = useState(false)
  const [editingZona, setEditingZona] = useState<any>(null)
  const [zonaParentProcesoId, setZonaParentProcesoId] = useState<string | null>(null)

  const [showActividadModal, setShowActividadModal] = useState(false)
  const [editingActividad, setEditingActividad] = useState<any>(null)
  const [actividadTarget, setActividadTarget] = useState<{
    procesoId?: string
    zonaId?: string
  } | null>(null)

  const [showFilesModal, setShowFilesModal] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [editorView, setEditorView] = useState<'matriz' | 'plan_accion'>('matriz')

  // Confirmation Modal State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState('Confirmar eliminación')
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState(
    '¿Estás seguro? Esta acción no se puede deshacer.'
  )
  const [pendingDeleteAction, setPendingDeleteAction] = useState<null | (() => void)>(null)

  // Drag & Drop State
  const isDraggingRef = useRef(false)
  const actividadDragSourceRef = useRef<{
    procesoId: string
    zonaId: string
    actividadId: string
  } | null>(null)
  const [dragOverActividadId, setDragOverActividadId] = useState<string | null>(null)
  const [dragOverActividadEdge, setDragOverActividadEdge] = useState<'before' | 'after' | null>(null)

  const isDraggingPeligroRef = useRef(false)
  const peligroDragSourceRef = useRef<{
    procesoId: string
    zonaId: string
    actividadId: string
    peligroId: string
  } | null>(null)
  const [dragOverPeligroId, setDragOverPeligroId] = useState<string | null>(null)
  const [dragOverPeligroEdge, setDragOverPeligroEdge] = useState<'before' | 'after' | null>(null)

  const peligroRefMap = useRef<Record<string, HTMLDivElement | null>>({})
  const autoFocusPeligroKeyRef = useRef<string | null>(null)
  const [highlightedPeligroId, setHighlightedPeligroId] = useState<string | null>(peligroIdParam)

  // Initial Data Fetching
  useEffect(() => {
    if (id && id !== 'nuevo') {
      apiFetch(`/api/riesgos/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            toast({ title: 'Error', variant: 'destructive', description: data.error })
            router.push('/dashboard')
          } else {
            const withStableLabels = JSON.parse(JSON.stringify(data))
            ;(withStableLabels.procesos || []).forEach((p: any) => {
              ;(p.zonas || []).forEach((z: any) => {
                ;(z.actividades || []).forEach((a: any) => {
                  ;(a.peligros || []).forEach((pel: any, pelIdx: number) => {
                    const persistedNumero =
                      typeof pel.numero === 'number' && pel.numero > 0 ? pel.numero : null
                    const labelFromNumero = persistedNumero
                      ? `Peligro ${persistedNumero}`
                      : `Peligro ${pelIdx + 1}`
                    pel._ui = {
                      ...(pel._ui || {}),
                      stableLabel: pel._ui?.stableLabel || labelFromNumero,
                      numero: pel.numero,
                    }
                  })
                })
              })
            })
            setMatrix({
              ...withStableLabels,
              fecha_actualizacion: withStableLabels.fecha_actualizacion || getTodayDate(),
            })
            let targetP = withStableLabels.procesos?.[0]
            let targetZ = targetP?.zonas?.[0]
            let targetA = targetZ?.actividades?.[0]

            if (peligroIdParam) {
              for (const p of withStableLabels.procesos || []) {
                for (const z of p.zonas || []) {
                  for (const a of z.actividades || []) {
                    const pel = (a.peligros || []).find((x: any) => x.id === peligroIdParam)
                    if (pel) {
                      targetP = p
                      targetZ = z
                      targetA = a
                      pel._ui = { ...(pel._ui || {}), expanded: true }
                      break
                    }
                  }
                }
              }
            }

            setSelected({ procesoId: targetP?.id, zonaId: targetZ?.id, actividadId: targetA?.id })
            if (targetZ?.id) {
              setExpandedZonaIds((prev) => ({ ...prev, [targetZ.id]: true }))
            }
          }
        })
        .catch((e) => {
          toast({
            title: 'Error',
            variant: 'destructive',
            description: 'No se pudo cargar la matriz',
          })
          router.push('/dashboard')
        })
    } else {
      setMatrix({
        id: makeId('m-'),
        area: '',
        responsable: '',
        fecha_elaboracion: getTodayDate(),
        fecha_actualizacion: getTodayDate(),
        procesos: [],
      })
    }
  }, [id, router])

  // Deep Link: Auto-focus, uncollapse, and highlight peligro when accessed from URL query
  useEffect(() => {
    if (!matrix || !peligroIdParam) return

    const autofocusKey = `${id || 'nuevo'}:${peligroIdParam}`
    if (autoFocusPeligroKeyRef.current === autofocusKey) return

    let targetProcesoId: string | undefined = undefined
    let targetZonaId: string | undefined = undefined
    let targetActividadId: string | undefined = undefined
    let foundPeligro: any = null

    for (const proceso of matrix.procesos || []) {
      for (const zona of proceso.zonas || []) {
        for (const actividad of zona.actividades || []) {
          const peligro = (actividad.peligros || []).find((p: any) => p.id === peligroIdParam)
          if (peligro) {
            targetProcesoId = proceso.id
            targetZonaId = zona.id
            targetActividadId = actividad.id
            foundPeligro = peligro
            break
          }
        }
        if (foundPeligro) break
      }
      if (foundPeligro) break
    }

    if (!foundPeligro || !targetZonaId || !targetActividadId) return

    autoFocusPeligroKeyRef.current = autofocusKey

    setSelected({
      procesoId: targetProcesoId,
      zonaId: targetZonaId,
      actividadId: targetActividadId,
    })
    setExpandedZonaIds((s) => ({ ...s, [targetZonaId!]: true }))

    // Uncollapse specific peligro without setting dirty unsaved changes
    setMatrix((m: any) => {
      if (!m) return m
      const cloned = JSON.parse(JSON.stringify(m))
      for (const proceso of cloned.procesos || []) {
        for (const zona of proceso.zonas || []) {
          for (const actividad of zona.actividades || []) {
            for (const peligro of actividad.peligros || []) {
              if (peligro.id === peligroIdParam) {
                peligro._ui = { ...peligro._ui, expanded: true }
              }
            }
          }
        }
      }
      return cloned
    })

    // Set prominent highlight on the card
    setHighlightedPeligroId(peligroIdParam)
    const highlightTimer = window.setTimeout(() => {
      setHighlightedPeligroId(null)
    }, 4500)

    // Multi-stage progressive smooth scroll to center target hazard in view
    const scrollToTarget = () => {
      const element = document.querySelector(`[data-peligro-id="${peligroIdParam}"]`) as HTMLElement | null
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        })
      }
    }

    const t1 = window.setTimeout(scrollToTarget, 80)
    const t2 = window.setTimeout(scrollToTarget, 250)
    const t3 = window.setTimeout(scrollToTarget, 550)
    const t4 = window.setTimeout(scrollToTarget, 900)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
      window.clearTimeout(highlightTimer)
    }
  }, [matrix, peligroIdParam, id])

  // Helpers to mutate matrix immutably
  function updateMatrix(fn: (m: any) => any) {
    setMatrix((m: any) => {
      const next = fn(JSON.parse(JSON.stringify(m)))
      return next
    })
    setHasUnsavedChanges(true)
  }

  // General info update handler
  function handleUpdateGeneralInfo(data: {
    area: string
    responsable: string
    fecha_elaboracion: string
  }) {
    updateMatrix((m: any) => {
      m.area = data.area
      m.responsable = data.responsable
      m.fecha_elaboracion = data.fecha_elaboracion
      return m
    })
  }

  // Process Handlers
  function handleAddProceso() {
    setEditingProceso(null)
    setShowProcesoModal(true)
  }

  function handleSaveProceso(name: string) {
    if (!name) return setShowProcesoModal(false)
    if (editingProceso && editingProceso.id) {
      updateMatrix((m: any) => {
        m.procesos = m.procesos.map((p: any) =>
          p.id === editingProceso.id ? { ...p, nombre: name } : p
        )
        return m
      })
      setShowProcesoModal(false)
      return
    }

    const newProcesoId = makeId('p-')
    updateMatrix((m: any) => {
      m.procesos.push({ id: newProcesoId, nombre: name, zonas: [] })
      return m
    })
    setSelected({ procesoId: newProcesoId, zonaId: undefined, actividadId: undefined })
    setShowProcesoModal(false)
  }

  function handleEditProceso(p: any) {
    setEditingProceso(p)
    setShowProcesoModal(true)
  }

  function handleDeleteProceso(procesoId: string) {
    setConfirmDeleteTitle('Eliminar proceso')
    setConfirmDeleteMessage(
      '¿Estás seguro de que deseas eliminar este proceso? Se eliminarán también sus zonas, actividades y peligros asociados.'
    )
    setPendingDeleteAction(() => () => {
      updateMatrix((m: any) => {
        m.procesos = m.procesos.filter((p: any) => p.id !== procesoId)
        if (selected.procesoId === procesoId) {
          const np = m.procesos[0]
          const nz = np?.zonas?.[0]
          const na = nz?.actividades?.[0]
          setSelected({ procesoId: np?.id, zonaId: nz?.id, actividadId: na?.id })
        }
        return m
      })
    })
    setConfirmDeleteOpen(true)
  }

  // Zone Handlers
  function handleAddZona(procesoId: string) {
    setEditingZona(null)
    setZonaParentProcesoId(procesoId)
    setShowZonaModal(true)
  }

  function handleEditZona(procesoId: string, z: any) {
    setEditingZona(z)
    setZonaParentProcesoId(procesoId)
    setShowZonaModal(true)
  }

  function handleSaveZona(name: string) {
    if (!zonaParentProcesoId) {
      setShowZonaModal(false)
      return
    }

    if (editingZona) {
      updateMatrix((m: any) => {
        const p = m.procesos.find((x: any) => x.id === zonaParentProcesoId)
        const z = p?.zonas?.find((x: any) => x.id === editingZona.id)
        if (z) z.nombre = name
        return m
      })
      setShowZonaModal(false)
      setZonaParentProcesoId(null)
      setEditingZona(null)
      return
    }

    const newZonaId = makeId('z-')
    updateMatrix((m: any) => {
      const p = m.procesos.find((x: any) => x.id === zonaParentProcesoId)
      if (p) {
        p.zonas = p.zonas || []
        p.zonas.push({ id: newZonaId, nombre: name, actividades: [] })
      }
      return m
    })
    setExpandedZonaIds((prev) => ({ ...prev, [newZonaId]: true }))
    setShowZonaModal(false)
    setZonaParentProcesoId(null)
  }

  function handleDeleteZona(procesoId: string, zonaId: string) {
    setConfirmDeleteTitle('Eliminar zona')
    setConfirmDeleteMessage(
      '¿Estás seguro de que deseas eliminar esta zona / lugar? Se eliminarán también sus actividades y peligros asociados.'
    )
    setPendingDeleteAction(() => () => {
      updateMatrix((m: any) => {
        const p = m.procesos.find((x: any) => x.id === procesoId)
        if (p) {
          p.zonas = p.zonas.filter((z: any) => z.id !== zonaId)
        }
        if (selected.zonaId === zonaId) {
          setSelected({ procesoId, zonaId: p?.zonas?.[0]?.id })
        }
        return m
      })
    })
    setConfirmDeleteOpen(true)
  }

  // Activity Handlers
  function handleAddActividad(procesoId: string, zonaId: string) {
    const newId = makeId('a-')
    updateMatrix((m: any) => {
      const z = m.procesos
        .find((x: any) => x.id === procesoId)
        ?.zonas?.find((y: any) => y.id === zonaId)
      if (z) {
        z.actividades = z.actividades || []
        const nueva = {
          id: newId,
          nombre: `Actividad ${(z.actividades.length || 0) + 1}`,
          descripcion: '',
          tareas: '',
          cargo: '',
          rutinario: false,
          peligros: [],
        }
        z.actividades.push(nueva)
      }
      return m
    })
    setExpandedZonaIds((s) => ({ ...s, [zonaId]: true }))
    setSelected({ procesoId, zonaId, actividadId: newId })
  }

  function handleEditActividad(procesoId: string, zonaId: string, actividad: any) {
    setEditingActividad({ ...actividad, procesoId, zonaId })
    setActividadTarget({ procesoId, zonaId })
    setShowActividadModal(true)
  }

  function handleSaveEditedActividad(name: string) {
    if (!editingActividad) return setShowActividadModal(false)
    updateMatrix((m: any) => {
      const z = m.procesos
        .find((x: any) => x.id === editingActividad.procesoId)
        ?.zonas?.find((y: any) => y.id === editingActividad.zonaId)
      const a = z?.actividades?.find((aa: any) => aa.id === editingActividad.id)
      if (a) a.nombre = name
      return m
    })
    setShowActividadModal(false)
    setEditingActividad(null)
    setActividadTarget(null)
  }

  function handleDeleteActividad(procesoId: string, zonaId: string, actividadId: string) {
    setConfirmDeleteTitle('Eliminar actividad')
    setConfirmDeleteMessage(
      '¿Estás seguro de que deseas eliminar esta actividad? Se eliminarán también sus peligros asociados.'
    )
    setPendingDeleteAction(() => () => {
      updateMatrix((m: any) => {
        const z = m.procesos
          .find((x: any) => x.id === procesoId)
          ?.zonas?.find((y: any) => y.id === zonaId)
        if (z) {
          z.actividades = z.actividades.filter((a: any) => a.id !== actividadId)
        }
        if (selected.actividadId === actividadId) {
          setSelected({ procesoId, zonaId, actividadId: z?.actividades?.[0]?.id })
        }
        return m
      })
    })
    setConfirmDeleteOpen(true)
  }

  function handleUpdateActivityField(field: string, value: any) {
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((p: any) => p.id === selected.procesoId)
        ?.zonas?.find((z: any) => z.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      if (a) {
        a[field] = value
      }
      return m
    })
  }

  // Hazard Handlers
  function handleAddPeligro() {
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      if (a) {
        a.peligros = a.peligros || []
        const nextNumero =
          Math.max(0, ...(a.peligros || []).map((p: any) => Number(p.numero) || 0)) + 1
        const stableLabel = `Peligro ${nextNumero}`
        a.peligros.push({
          id: makeId('r-'),
          numero: nextNumero,
          descripcion: '',
          clasificacion: '',
          efectos: '',
          controles: { fuente: '', medio: '', individuo: '' },
          evaluacion: {
            nd: null,
            ne: null,
            nc: null,
            np: null,
            nr: null,
            interp_np: '',
            interp_nr: '',
            nivel_riesgo: '',
            aceptabilidad: '',
          },
          criterios: { num_expuestos: null, peor_consecuencia: '', requisito_legal: false },
          intervencion: {
            eliminacion: '',
            sustitucion: '',
            controles_ingenieria: '',
            controles_administrativos: '',
            epp: '',
            responsable: '',
            fecha_ejecucion: '',
          },
          _ui: { expanded: true, activeTab: 0, stableLabel },
        })
      }
      return m
    })
  }

  function handleSelectFromCatalog(selectedCatalogItems: any[]) {
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return
    if (!selectedCatalogItems || selectedCatalogItems.length === 0) return

    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      if (a) {
        a.peligros = a.peligros || []
        let baseNumero = Math.max(0, ...(a.peligros || []).map((p: any) => Number(p.numero) || 0))

        selectedCatalogItems.forEach((catItem) => {
          baseNumero += 1
          const stableLabel = `Peligro ${baseNumero}`
          const nd = catItem.nivelDeficiencia ?? null
          const ne = catItem.nivelExposicion ?? null
          const nc = catItem.nivelConsecuencia ?? null
          const np = catItem.nivelProbabilidad ?? (nd && ne ? nd * ne : null)
          const nr = catItem.nivelRiesgo ?? (np && nc ? np * nc : null)

          a.peligros.push({
            id: makeId('r-'),
            catalogoPeligroId: catItem.id,
            numero: baseNumero,
            codigo: catItem.codigo || '',
            descripcion: catItem.descripcion || '',
            clasificacion: catItem.clasificacion || '',
            efectos: catItem.efectosPosibles || '',
            controles: {
              fuente: catItem.controlFuente || '',
              medio: catItem.controlMedio || '',
              individuo: catItem.controlIndividuo || '',
            },
            evaluacion: {
              nd,
              ne,
              nc,
              np,
              nr,
              interp_np: catItem.interpProbabilidad || (np ? interpProbabilidad(np).label : ''),
              interp_nr: catItem.interpRiesgo || (nr ? interpNivelRiesgo(nr).label : ''),
              nivel_riesgo: catItem.interpRiesgo || (nr ? interpNivelRiesgo(nr).label : ''),
              aceptabilidad:
                catItem.aceptabilidad ||
                (nr ? aceptabilidadFromNivel(interpNivelRiesgo(nr).label) : ''),
            },
            criterios: {
              num_expuestos: catItem.numExpuestos ?? null,
              peor_consecuencia: catItem.peorConsecuencia || '',
              requisito_legal: Boolean(catItem.requisitoLegal),
            },
            intervencion: {
              eliminacion: catItem.eliminacion || '',
              sustitucion: catItem.sustitucion || '',
              controles_ingenieria: catItem.controlesIngenieria || '',
              controles_administrativos: catItem.controlesAdministrativos || '',
              epp: catItem.epp || '',
              responsable: '',
              fecha_ejecucion: '',
            },
            _ui: { expanded: true, activeTab: 0, stableLabel },
          })
        })
      }
      return m
    })

    toast({
      title: 'Peligros agregados',
      description: `Se ${selectedCatalogItems.length === 1 ? 'agregó 1 peligro' : `agregaron ${selectedCatalogItems.length} peligros`} desde el Catálogo Maestro.`,
    })
  }

  function handleDuplicatePeligro(peligroId: string) {
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      if (a) {
        const peligroToDuplicate = a.peligros.find((p: any) => p.id === peligroId)
        if (peligroToDuplicate) {
          const newPeligro = JSON.parse(JSON.stringify(peligroToDuplicate))
          newPeligro.id = makeId('r-')
          newPeligro.numero =
            Math.max(0, ...(a.peligros || []).map((p: any) => Number(p.numero) || 0)) + 1
          newPeligro._ui = {
            expanded: false,
            activeTab: 0,
            stableLabel: `Peligro ${newPeligro.numero}`,
          }
          a.peligros.push(newPeligro)
        }
      }
      return m
    })
    toast({ title: 'Éxito', description: 'Peligro duplicado correctamente.' })
  }

  function handleDeletePeligro(peligroId: string) {
    setConfirmDeleteTitle('Eliminar peligro')
    setConfirmDeleteMessage(
      '¿Estás seguro de que deseas eliminar este peligro? Esta acción no se puede deshacer.'
    )
    setPendingDeleteAction(() => () => {
      updateMatrix((m: any) => {
        const a = m.procesos
          .find((x: any) => x.id === selected.procesoId)
          ?.zonas?.find((y: any) => y.id === selected.zonaId)
          ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
        if (a) {
          a.peligros = a.peligros.filter((p: any) => p.id !== peligroId)
        }
        return m
      })
    })
    setConfirmDeleteOpen(true)
  }

  function handleToggleExpandPeligro(peligroId: string) {
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      const p = a?.peligros?.find((pel: any) => pel.id === peligroId)
      if (p) {
        p._ui = { ...p._ui, expanded: !p._ui?.expanded }
      }
      return m
    })
  }

  function handleChangeTabPeligro(peligroId: string, tabIndex: number) {
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      const p = a?.peligros?.find((pel: any) => pel.id === peligroId)
      if (p) {
        p._ui = { ...p._ui, activeTab: tabIndex }
      }
      return m
    })
  }

  function handleUpdatePeligroField(peligroId: string, path: string[], value: any) {
    updateMatrix((m: any) => {
      const a = m.procesos
        .find((x: any) => x.id === selected.procesoId)
        ?.zonas?.find((y: any) => y.id === selected.zonaId)
        ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      const r = a?.peligros?.find((p: any) => p.id === peligroId)
      if (!r) return m

      let cur: any = r
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]]
      }
      cur[path[path.length - 1]] = value

      // Initial evaluation recalculation (GTC 45)
      if (path[0] === 'evaluacion') {
        const nd = Number(r.evaluacion.nd || 0)
        const ne = Number(r.evaluacion.ne || 0)
        const nc = Number(r.evaluacion.nc || 0)
        const np = !nd || !ne ? 0 : nd * ne
        const nr = !np || !nc ? 0 : np * nc
        r.evaluacion.np = np
        r.evaluacion.nr = nr
        r.evaluacion.interp_np = interpProbabilidad(np).label
        r.evaluacion.interp_nr = interpNivelRiesgo(nr).label
        r.evaluacion.nivel_riesgo = interpNivelRiesgo(nr).label
        const nivelLabel = interpNivelRiesgo(nr).label
        r.evaluacion.aceptabilidad = nivelLabel ? aceptabilidadFromNivel(nivelLabel) : ''
      }

      // Residual evaluation recalculation (GTC 45 post-intervention)
      if (path[0] === 'evaluacionPost' || r.evaluacionPost) {
        if (!r.evaluacionPost) r.evaluacionPost = {}
        const ndP = Number(r.evaluacionPost.nd || 0)
        const neP = Number(r.evaluacionPost.ne || 0)
        const ncP = Number(r.evaluacionPost.nc || 0)
        const npP = !ndP || !neP ? 0 : ndP * neP
        const nrP = !npP || !ncP ? 0 : npP * ncP
        r.evaluacionPost.np = npP
        r.evaluacionPost.nr = nrP
        r.evaluacionPost.interp_np = interpProbabilidad(npP).label
        r.evaluacionPost.interp_nr = interpNivelRiesgo(nrP).label
        r.evaluacionPost.nivel_riesgo = interpNivelRiesgo(nrP).label
        const nivelLabelP = interpNivelRiesgo(nrP).label
        r.evaluacionPost.aceptabilidad = nivelLabelP ? aceptabilidadFromNivel(nivelLabelP) : ''
      }

      return m
    })
  }

  // Drag and drop handlers
  function onActividadDragStart(
    e: React.DragEvent,
    procesoId: string,
    zonaId: string,
    actividadId: string
  ) {
    isDraggingRef.current = true
    actividadDragSourceRef.current = { procesoId, zonaId, actividadId }
    e.stopPropagation()
    try {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'actividad', procesoId, zonaId, actividadId })
      )
    } catch (err) {}
    try {
      e.dataTransfer.setData('text/plain', actividadId)
    } catch (err) {}
    e.dataTransfer.effectAllowed = 'move'
  }

  function onActividadDragOver(e: React.DragEvent, targetActividadId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverActividadId(targetActividadId)
    if (!targetActividadId) {
      setDragOverActividadEdge(null)
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const edge: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      setDragOverActividadEdge(edge)
    }
    e.dataTransfer.dropEffect = 'move'
  }

  function onActividadDragLeave() {
    setDragOverActividadId(null)
    setDragOverActividadEdge(null)
  }

  function onActividadDrop(
    e: React.DragEvent,
    procesoId: string,
    zonaId: string,
    targetActividadId: string | null
  ) {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = false
    const dropEdge = dragOverActividadEdge
    setDragOverActividadId(null)
    setDragOverActividadEdge(null)

    let src: any = actividadDragSourceRef.current
    if (!src) {
      try {
        src = JSON.parse(e.dataTransfer.getData('application/json'))
      } catch (err) {}
    }
    if (!src || !src.actividadId) return
    if (
      src.procesoId === procesoId &&
      src.zonaId === zonaId &&
      targetActividadId === src.actividadId
    ) {
      actividadDragSourceRef.current = null
      return
    }

    updateMatrix((m: any) => {
      const srcP = m.procesos.find((p: any) => p.id === src.procesoId)
      const srcZ = srcP?.zonas?.find((z: any) => z.id === src.zonaId)
      if (!srcZ) return m
      const srcIdx = srcZ.actividades.findIndex((aa: any) => aa.id === src.actividadId)
      if (srcIdx === -1) return m
      const actividadObj = srcZ.actividades.splice(srcIdx, 1)[0]

      const dstP = m.procesos.find((p: any) => p.id === procesoId)
      const dstZ = dstP?.zonas?.find((z: any) => z.id === zonaId)
      if (!dstZ) return m
      const targetIdx = targetActividadId
        ? dstZ.actividades.findIndex((aa: any) => aa.id === targetActividadId)
        : -1
      if (targetIdx === -1) {
        dstZ.actividades.push(actividadObj)
      } else {
        const insertIdx = dropEdge === 'after' ? targetIdx + 1 : targetIdx
        dstZ.actividades.splice(insertIdx, 0, actividadObj)
      }
      return m
    })

    actividadDragSourceRef.current = null
  }

  function onPeligroDragStart(
    e: React.DragEvent,
    peligroId: string
  ) {
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return
    isDraggingPeligroRef.current = true
    const src = {
      procesoId: selected.procesoId,
      zonaId: selected.zonaId,
      actividadId: selected.actividadId,
      peligroId,
    }
    peligroDragSourceRef.current = src
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'peligro', ...src }))
    } catch (err) {}
    try {
      e.dataTransfer.setData('text/plain', peligroId)
    } catch (err) {}
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }

  function onPeligroDragOver(e: React.DragEvent, targetPeligroId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPeligroId(targetPeligroId)
    if (!targetPeligroId) {
      setDragOverPeligroEdge(null)
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const edge: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      setDragOverPeligroEdge(edge)
    }
    e.dataTransfer.dropEffect = 'move'
  }

  function onPeligroDragLeave() {
    setDragOverPeligroId(null)
    setDragOverPeligroEdge(null)
  }

  function onPeligroDrop(e: React.DragEvent, targetPeligroId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    const dropEdge = dragOverPeligroEdge
    setDragOverPeligroId(null)
    setDragOverPeligroEdge(null)

    let src: any = peligroDragSourceRef.current
    if (!src) {
      try {
        src = JSON.parse(e.dataTransfer.getData('application/json'))
      } catch (err) {}
    }
    if (!src || !src.peligroId) return
    if (!selected.procesoId || !selected.zonaId || !selected.actividadId) return

    updateMatrix((m: any) => {
      const srcP = m.procesos.find((p: any) => p.id === src.procesoId)
      const srcZ = srcP?.zonas?.find((z: any) => z.id === src.zonaId)
      const srcA = srcZ?.actividades?.find((aa: any) => aa.id === src.actividadId)
      if (!srcA) return m

      const srcIdx = srcA.peligros.findIndex((pp: any) => pp.id === src.peligroId)
      if (srcIdx === -1) return m

      const peligroObj = srcA.peligros.splice(srcIdx, 1)[0]

      const dstP = m.procesos.find((p: any) => p.id === selected.procesoId)
      const dstZ = dstP?.zonas?.find((z: any) => z.id === selected.zonaId)
      const dstA = dstZ?.actividades?.find((aa: any) => aa.id === selected.actividadId)
      if (!dstA) return m

      const targetIdx = targetPeligroId
        ? dstA.peligros.findIndex((pp: any) => pp.id === targetPeligroId)
        : -1
      if (targetIdx === -1) {
        dstA.peligros.push(peligroObj)
      } else {
        const insertIdx = dropEdge === 'after' ? targetIdx + 1 : targetIdx
        dstA.peligros.splice(insertIdx, 0, peligroObj)
      }

      return m
    })

    peligroDragSourceRef.current = null
  }

  // Files Handlers
  function handleSaveFilesToMatrix(
    newFiles: Array<{ name: string; type: string; size: number; data: string }>
  ) {
    updateMatrix((m: any) => {
      m.files = m.files || []
      m.files = m.files.concat(newFiles)
      return m
    })
  }

  function handleDeleteFile(index: number) {
    setConfirmDeleteTitle('Eliminar archivo adjunto')
    setConfirmDeleteMessage('¿Deseas eliminar este archivo adjunto de la matriz?')
    setPendingDeleteAction(() => () => {
      updateMatrix((m: any) => {
        m.files = m.files || []
        m.files.splice(index, 1)
        return m
      })
    })
    setConfirmDeleteOpen(true)
  }

  // Save Matrix Handler (with automatic update-date)
  async function saveMatrix() {
    try {
      setIsSaving(true)
      let currentMatrix = { ...matrix }
      
      // Automatic update date on real persisted save
      currentMatrix.fecha_actualizacion = getTodayDate()

      // Pre-upload base64 files
      if (currentMatrix.files && currentMatrix.files.length > 0) {
        const base64Files = currentMatrix.files.filter(
          (f: any) => f.data && f.data.startsWith('data:')
        )
        if (base64Files.length > 0) {
          const uploadRes = await apiFetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: base64Files }),
          })

          if (!uploadRes.ok) {
            const errBody = await uploadRes.json().catch(() => ({}))
            throw new Error(errBody.error || 'Error al subir los archivos')
          }

          const uploaded = await uploadRes.json()

          currentMatrix.files = currentMatrix.files.map((f: any) => {
            if (f.data && f.data.startsWith('data:')) {
              const updated = uploaded.find(
                (uf: any) => uf.originalName === f.name || uf.name === f.name
              )
              if (updated) {
                return { ...f, data: updated.url, name: updated.name }
              }
            }
            return f
          })
        }
      }

      const isNew = String(currentMatrix.id).startsWith('m-') || id === 'nuevo'
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/riesgos' : `/api/riesgos/${currentMatrix.id}`

      // Persist order indices
      if (currentMatrix.procesos && Array.isArray(currentMatrix.procesos)) {
        currentMatrix.procesos.forEach((p: any, pIdx: number) => {
          p.orden = pIdx
          if (p.zonas && Array.isArray(p.zonas)) {
            p.zonas.forEach((z: any, zIdx: number) => {
              z.orden = zIdx
              if (z.actividades && Array.isArray(z.actividades)) {
                z.actividades.forEach((a: any, aIdx: number) => {
                  a.orden = aIdx
                  if (a.peligros && Array.isArray(a.peligros)) {
                    a.peligros.forEach((pel: any, pelIdx: number) => {
                      pel.orden = pelIdx
                      if (!(typeof pel.numero === 'number' && pel.numero > 0)) {
                        const label = String(pel?._ui?.stableLabel || '')
                        const match = label.match(/\b(\d+)\b/)
                        if (match) pel.numero = Number(match[1])
                      }
                      if (!(typeof pel.numero === 'number' && pel.numero > 0)) {
                        pel.numero = pelIdx + 1
                      }
                      pel._ui = {
                        ...(pel._ui || {}),
                        stableLabel: `Peligro ${pel.numero}`,
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMatrix),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const details = [errBody?.error, errBody?.details].filter(Boolean).join(' - ')
        throw new Error(details || 'Error al guardar en el servidor')
      }

      const saved = await res.json().catch(() => ({}))
      setMatrix(currentMatrix)
      setHasUnsavedChanges(false)
      toast({
        title: 'Éxito',
        description: 'La matriz se ha guardado correctamente en la base de datos.',
      })
      if (isNew && saved.id) {
        router.push(`/matriz/${saved.id}`)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: err.message || 'No se pudo guardar la matriz',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Export to Excel Handler
  async function handleExportMatrix() {
    try {
      if (!matrix?.id || String(matrix.id).startsWith('m-')) {
        toast({
          title: 'Aviso',
          description: 'Por favor, guarda la matriz primero antes de exportar.',
        })
        return
      }
      const res = await apiFetch(`/api/riesgos/${matrix.id}`)
      if (!res.ok) throw new Error('No se pudo obtener los datos de la matriz')
      const matrizData = await res.json()
      await exportMatrizToExcel(matrizData)
      toast({
        title: 'Éxito',
        description: 'La matriz se ha exportado correctamente a Excel.',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: err.message || 'No se pudo exportar la matriz',
      })
    }
  }

  // Filtered Procesos based on search
  const filteredProcesos = useMemo(() => {
    if (!searchTerm.trim()) return matrix?.procesos || []
    const term = searchTerm.toLowerCase().trim()

    const mapped = (matrix?.procesos || [])
      .map((p: any) => {
        const pMatches = p.nombre?.toLowerCase().includes(term)

        const filteredZonas = (p.zonas || [])
          .map((z: any) => {
            const zMatches = z.nombre?.toLowerCase().includes(term)

            const filteredActividades = (z.actividades || []).filter((a: any) => {
              const aMatches =
                a.nombre?.toLowerCase().includes(term) ||
                (a.descripcion || '').toLowerCase().includes(term) ||
                (a.tareas || '').toLowerCase().includes(term) ||
                (a.cargo || '').toLowerCase().includes(term)

              const dangerMatches = (a.peligros || []).some(
                (pel: any) =>
                  (pel.descripcion || '').toLowerCase().includes(term) ||
                  (pel.clasificacion || '').toLowerCase().includes(term)
              )

              return aMatches || dangerMatches
            })

            if (zMatches || filteredActividades.length > 0) {
              return {
                ...z,
                actividades: zMatches ? z.actividades : filteredActividades,
                _searchMatch: true,
              }
            }
            return null
          })
          .filter(Boolean)

        if (pMatches || filteredZonas.length > 0) {
          return {
            ...p,
            zonas: pMatches ? p.zonas : filteredZonas,
            _searchMatch: true,
          }
        }
        return null
      })
      .filter(Boolean)

    return mapped
  }, [matrix?.procesos, searchTerm])

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase().trim()
    const results: Array<{ proceso: any; zona: any; actividad: any }> = []

    ;(matrix?.procesos || []).forEach((p: any) => {
      ;(p.zonas || []).forEach((z: any) => {
        ;(z.actividades || []).forEach((a: any) => {
          const aMatches =
            a.nombre?.toLowerCase().includes(term) ||
            (a.descripcion || '').toLowerCase().includes(term) ||
            (a.tareas || '').toLowerCase().includes(term) ||
            (a.cargo || '').toLowerCase().includes(term)

          const dangerMatches = (a.peligros || []).some(
            (pel: any) =>
              (pel.descripcion || '').toLowerCase().includes(term) ||
              (pel.clasificacion || '').toLowerCase().includes(term)
          )

          if (aMatches || dangerMatches) {
            results.push({ proceso: p, zona: z, actividad: a })
          }
        })
      })
    })
    return results
  }, [matrix?.procesos, searchTerm])

  // Current Selections
  const currentProceso = matrix?.procesos?.find((p: any) => p.id === selected.procesoId)
  const currentZona = currentProceso?.zonas?.find((z: any) => z.id === selected.zonaId)
  const currentActividad = currentZona?.actividades?.find(
    (a: any) => a.id === selected.actividadId
  )
  const currentActividadIndex = (currentZona?.actividades || []).findIndex(
    (a: any) => a.id === selected.actividadId
  )

  const tasksCount = useMemo(() => {
    if (!currentActividad?.tareas?.trim()) return 0
    return currentActividad.tareas
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean).length
  }, [currentActividad?.tareas])

  if (!matrix) {
    return (
      <div className="flex items-center justify-center p-12 text-[#5e6b62] h-screen w-full bg-[#f8faf9]">
        <div className="text-center space-y-3">
          <div className="size-10 rounded-2xl bg-[#eef7f0] animate-pulse mx-auto" />
          <div className="text-sm font-bold text-[#163522]">Cargando matriz de riesgos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#2c3630] flex flex-col">
      {/* 1. Global Header: Navigation & Branding */}
      <MatrixGeneralInfoHeader />

      {/* 2. Main Editor Body */}
      <div className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-6 lg:p-7 space-y-6">
        {/* Dedicated Matrix Information Card with Actions */}
        <MatrixInfoCard
          matrix={matrix}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onUpdateGeneralInfo={handleUpdateGeneralInfo}
          onExport={handleExportMatrix}
          onSave={saveMatrix}
        />

        {/* Layout: Organizational Sidebar + Activity View */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-6 lg:gap-7">
            {/* Left: Organizational Sidebar + Documents Panel */}
            <OrganizationalSidebar
              procesos={matrix.procesos || []}
              filteredProcesos={filteredProcesos}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              searchResults={searchResults}
              selected={selected}
              expandedZonaIds={expandedZonaIds}
              dragOverActividadId={dragOverActividadId}
              dragOverActividadEdge={dragOverActividadEdge}
              files={matrix.files || []}
              onSelectActividad={(pId, zId, aId) =>
                setSelected({ procesoId: pId, zonaId: zId, actividadId: aId })
              }
              onToggleExpandZona={(zId) =>
                setExpandedZonaIds((prev) => ({ ...prev, [zId]: !prev[zId] }))
              }
              onAddProceso={handleAddProceso}
              onEditProceso={handleEditProceso}
              onDeleteProceso={handleDeleteProceso}
              onAddZona={handleAddZona}
              onEditZona={handleEditZona}
              onDeleteZona={handleDeleteZona}
              onAddActividad={handleAddActividad}
              onEditActividad={handleEditActividad}
              onDeleteActividad={handleDeleteActividad}
              onActividadDragStart={onActividadDragStart}
              onActividadDragOver={onActividadDragOver}
              onActividadDragLeave={onActividadDragLeave}
              onActividadDrop={onActividadDrop}
              onOpenAddFiles={() => setShowFilesModal(true)}
              onDeleteFile={handleDeleteFile}
            />

            {/* Right: Selected Activity View */}
            <main className="flex-1 min-w-0 space-y-6">
              {!currentActividad ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-[#dfe9e2] rounded-3xl bg-white p-8 text-center space-y-3 shadow-2xs">
                  <div className="size-12 rounded-2xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center">
                    <FolderTree className="size-6" />
                  </div>
                  <div className="text-base font-bold text-[#163522]">
                    Selecciona una actividad para comenzar a editar
                  </div>
                  <p className="text-xs text-[#7a9182] max-w-sm">
                    Explora el árbol organizacional en el panel izquierdo y haz clic en cualquier actividad para gestionar sus tareas, descripción y evaluación de peligros.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 3. Activity Header */}
                  <ActivityHeader
                    activity={currentActividad}
                    activityIndex={currentActividadIndex >= 0 ? currentActividadIndex : 0}
                    matrixArea={matrix.area || 'Matriz'}
                    procesoNombre={currentProceso?.nombre || 'Proceso'}
                    zonaNombre={currentZona?.nombre || 'Zona'}
                    tasksCount={tasksCount}
                    onUpdateField={handleUpdateActivityField}
                    onDeleteActivity={() =>
                      handleDeleteActividad(
                        currentProceso.id,
                        currentZona.id,
                        currentActividad.id
                      )
                    }
                  />

                  {/* 4. Collapsible Activity Detail (Description + Tasks inline) */}
                  <ActivityDetailPanel
                    description={currentActividad.descripcion || ''}
                    tasksString={currentActividad.tareas || ''}
                    cargo={currentActividad.cargo || ''}
                    onUpdateDescription={(desc) => handleUpdateActivityField('descripcion', desc)}
                    onUpdateTasks={(tasks) => handleUpdateActivityField('tareas', tasks)}
                  />

                  {/* 5. Activity Risk Summary (3 animated cards: Inherent, Impact, Residual) */}
                  <ActivityRiskSummary peligros={currentActividad.peligros || []} />

                  {/* 6. Hazards Section */}
                  <HazardSection
                    peligros={currentActividad.peligros || []}
                    highlightPeligroId={highlightedPeligroId}
                    dragOverPeligroId={dragOverPeligroId}
                    dragOverPeligroEdge={dragOverPeligroEdge}
                    onAddPeligro={handleAddPeligro}
                    onOpenCatalog={() => setShowCatalogModal(true)}
                    onToggleExpand={handleToggleExpandPeligro}
                    onChangeTab={handleChangeTabPeligro}
                    onUpdateField={handleUpdatePeligroField}
                    onDuplicate={handleDuplicatePeligro}
                    onDelete={handleDeletePeligro}
                    onDragStart={onPeligroDragStart}
                    onDragEnd={() => {
                      setDragOverPeligroId(null)
                      setDragOverPeligroEdge(null)
                      peligroDragSourceRef.current = null
                      setTimeout(() => {
                        isDraggingPeligroRef.current = false
                      }, 0)
                    }}
                    onDragOver={onPeligroDragOver}
                    onDragLeave={onPeligroDragLeave}
                    onDrop={onPeligroDrop}
                  />
                </div>
              )}
            </main>
          </div>
      </div>

      {/* Auxiliary Modals */}
      <SelectPeligroCatalogModal
        open={showCatalogModal}
        onOpenChange={setShowCatalogModal}
        onSelectPeligros={handleSelectFromCatalog}
      />

      <EditProcesoModal
        open={showProcesoModal}
        onOpenChange={setShowProcesoModal}
        proceso={editingProceso}
        onSave={handleSaveProceso}
      />

      <EditZonaModal
        open={showZonaModal}
        onOpenChange={setShowZonaModal}
        zona={editingZona}
        onSave={handleSaveZona}
      />

      <EditActividadModal
        open={showActividadModal}
        onOpenChange={setShowActividadModal}
        actividad={editingActividad}
        onSave={handleSaveEditedActividad}
      />

      <FilesModal
        open={showFilesModal}
        onOpenChange={setShowFilesModal}
        onSaveFiles={handleSaveFilesToMatrix}
      />

      <ConfirmModal
        open={confirmDeleteOpen}
        title={confirmDeleteTitle}
        message={confirmDeleteMessage}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (pendingDeleteAction) pendingDeleteAction()
          setConfirmDeleteOpen(false)
          setPendingDeleteAction(null)
        }}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setPendingDeleteAction(null)
        }}
      />
    </div>
  )
}
