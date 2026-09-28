/**
 * Synchronization Engine for Matrix Differential Persistence.
 * Translates an incoming matrix document into minimal, transactional database operations.
 */

import { PrismaClient } from '@prisma/client'
import {
  IncomingMatrixPayload,
  SyncMatrixResult,
  PersistenceOperationStats,
  IdReconciliationMap,
} from './types'
import {
  normStr,
  normNum,
  normBool,
  isMatrixHeaderEqual,
  isProcesoEqual,
  isZonaEqual,
  isActividadEqual,
  isPeligroEqual,
  isControlEqual,
  isEvaluacionEqual,
  isCriterioEqual,
  isIntervencionEqual,
} from './compare-fields'
import { persistFilesToDisk } from '@/lib/server-upload'

export class ConcurrencyError extends Error {
  code = 'CONCURRENT_MODIFICATION'
  constructor(message = 'La matriz ha sido modificada por otra sesión. Por favor recarga antes de guardar.') {
    super(message)
    this.name = 'ConcurrencyError'
  }
}

export async function syncMatrix(
  prisma: PrismaClient | any,
  matrixId: string,
  payload: IncomingMatrixPayload
): Promise<SyncMatrixResult> {
  const startTime = Date.now()

  // 1. Load full existing persisted matrix hierarchy
  const existing = await prisma.matriz.findUnique({
    where: { id: matrixId },
    include: {
      archivos: true,
      procesos: {
        orderBy: { orden: 'asc' },
        include: {
          zonas: {
            orderBy: { orden: 'asc' },
            include: {
              actividades: {
                orderBy: { orden: 'asc' },
                include: {
                  peligros: {
                    orderBy: { orden: 'asc' },
                    include: {
                      control: true,
                      evaluacion: true,
                      evaluacionPost: true,
                      criterio: true,
                      intervencion: true,
                      catalogoPeligro: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    throw new Error(`Matrix with id ${matrixId} not found`)
  }

  // 2. Concurrency Check (Optimistic Concurrency)
  if (payload.lastUpdatedAt && existing.updatedAt) {
    const clientTime = new Date(payload.lastUpdatedAt).getTime()
    const dbTime = new Date(existing.updatedAt).getTime()
    // 2-second tolerance for network transit / clock drift
    if (dbTime - clientTime > 2000) {
      throw new ConcurrencyError()
    }
  }

  // 3. Build identity lookup tables from database for security validation
  const knownProcesos = new Map<string, any>()
  const knownZonas = new Map<string, any>()
  const knownActividades = new Map<string, any>()
  const knownPeligros = new Map<string, any>()

  for (const proc of existing.procesos) {
    knownProcesos.set(proc.id, proc)
    for (const zona of proc.zonas) {
      knownZonas.set(zona.id, zona)
      for (const act of zona.actividades) {
        knownActividades.set(act.id, act)
        for (const pel of act.peligros) {
          knownPeligros.set(pel.id, pel)
        }
      }
    }
  }

  const idMap: IdReconciliationMap = {
    procesos: {},
    zonas: {},
    actividades: {},
    peligros: {},
  }

  const stats: PersistenceOperationStats = {
    matrixUpdated: false,
    filesCreated: 0,
    filesDeleted: 0,
    processesCreated: 0,
    processesUpdated: 0,
    processesDeleted: 0,
    zonesCreated: 0,
    zonesUpdated: 0,
    zonesDeleted: 0,
    activitiesCreated: 0,
    activitiesUpdated: 0,
    activitiesDeleted: 0,
    hazardsCreated: 0,
    hazardsUpdated: 0,
    hazardsDeleted: 0,
    controlsCreated: 0,
    controlsUpdated: 0,
    controlsDeleted: 0,
    evaluationsCreated: 0,
    evaluationsUpdated: 0,
    evaluationsDeleted: 0,
    criteriaCreated: 0,
    criteriaUpdated: 0,
    criteriaDeleted: 0,
    interventionsCreated: 0,
    interventionsUpdated: 0,
    interventionsDeleted: 0,
    totalMutations: 0,
  }

  // Handle files persistence outside transaction if files are supplied
  let persistedFiles: any[] = []
  if (payload.files && Array.isArray(payload.files)) {
    persistedFiles = await persistFilesToDisk(payload.files)
  }

  // 4. Run synchronization inside atomic database transaction
  let updatedMatrixRecord: any = null

  await prisma.$transaction(async (tx: any) => {
    // --- STEP A: Matrix Header ---
    if (!isMatrixHeaderEqual(existing, payload)) {
      updatedMatrixRecord = await tx.matriz.update({
        where: { id: matrixId },
        data: {
          area: payload.area,
          responsable: payload.responsable,
          fechaElaboracion: payload.fecha_elaboracion ? new Date(payload.fecha_elaboracion) : null,
          fechaActualizacion: payload.fecha_actualizacion ? new Date(payload.fecha_actualizacion) : null,
        },
      })
      stats.matrixUpdated = true
      stats.totalMutations++
    }

    // --- STEP B: Files (Archivos) ---
    if (payload.files && Array.isArray(payload.files)) {
      const existingFiles = existing.archivos || []
      const submittedUrls = new Set(persistedFiles.map((f) => f.url))
      const filesToDelete = existingFiles.filter((ef: any) => !submittedUrls.has(ef.url))

      if (filesToDelete.length > 0) {
        await tx.archivo.deleteMany({
          where: { id: { in: filesToDelete.map((f: any) => f.id) } },
        })
        stats.filesDeleted += filesToDelete.length
        stats.totalMutations += filesToDelete.length
      }

      const existingUrls = new Set(existingFiles.map((ef: any) => ef.url))
      const filesToCreate = persistedFiles.filter((pf) => !existingUrls.has(pf.url))

      for (const f of filesToCreate) {
        await tx.archivo.create({
          data: {
            matrizId: matrixId,
            nombreOriginal: f.name || 'file',
            nombreAlmacenado: f.name || 'file',
            tipoMime: f.type || '',
            url: f.url || '',
          },
        })
        stats.filesCreated++
        stats.totalMutations++
      }
    }

    // --- STEP C: Procesos ---
    const submittedProcesos = payload.procesos || []
    const submittedProcesoIds = new Set(
      submittedProcesos.map((p) => p.id).filter((id): id is string => Boolean(id && knownProcesos.has(id)))
    )

    // Delete removed processes
    for (const [pId] of knownProcesos) {
      if (!submittedProcesoIds.has(pId)) {
        await tx.proceso.delete({ where: { id: pId } })
        stats.processesDeleted++
        stats.totalMutations++
      }
    }

    // Sync processes
    for (let pIdx = 0; pIdx < submittedProcesos.length; pIdx++) {
      const p = submittedProcesos[pIdx]
      let targetProcesoId: string
      let existingP: any = null

      if (p.id && knownProcesos.has(p.id)) {
        targetProcesoId = p.id
        existingP = knownProcesos.get(p.id)
        if (!isProcesoEqual(existingP, p, pIdx)) {
          await tx.proceso.update({
            where: { id: targetProcesoId },
            data: {
              nombre: p.nombre || '',
              orden: typeof p.orden === 'number' ? p.orden : pIdx,
            },
          })
          stats.processesUpdated++
          stats.totalMutations++
        }
      } else {
        const createdP = await tx.proceso.create({
          data: {
            matrizId: matrixId,
            nombre: p.nombre || '',
            orden: typeof p.orden === 'number' ? p.orden : pIdx,
          },
        })
        targetProcesoId = createdP.id
        if (p.id) {
          idMap.procesos[p.id] = createdP.id
        }
        stats.processesCreated++
        stats.totalMutations++
      }

      // --- STEP D: Zonas in Proceso ---
      const submittedZonas = p.zonas || []
      const existingZonasInP = existingP?.zonas || []
      const existingZonaMap = new Map<string, any>(existingZonasInP.map((z: any) => [z.id, z]))
      const submittedZonaIds = new Set(
        submittedZonas.map((z) => z.id).filter((id): id is string => Boolean(id && existingZonaMap.has(id)))
      )

      // Delete removed zonas in this process
      for (const [zId] of existingZonaMap) {
        if (!submittedZonaIds.has(zId)) {
          await tx.zona.delete({ where: { id: zId } })
          stats.zonesDeleted++
          stats.totalMutations++
        }
      }

      // Sync zonas
      for (let zIdx = 0; zIdx < submittedZonas.length; zIdx++) {
        const z = submittedZonas[zIdx]
        let targetZonaId: string
        let existingZ: any = null

        if (z.id && existingZonaMap.has(z.id)) {
          targetZonaId = z.id
          existingZ = existingZonaMap.get(z.id)
          if (!isZonaEqual(existingZ, z, zIdx)) {
            await tx.zona.update({
              where: { id: targetZonaId },
              data: {
                nombre: z.nombre || '',
                orden: typeof z.orden === 'number' ? z.orden : zIdx,
              },
            })
            stats.zonesUpdated++
            stats.totalMutations++
          }
        } else {
          const createdZ = await tx.zona.create({
            data: {
              procesoId: targetProcesoId,
              nombre: z.nombre || '',
              orden: typeof z.orden === 'number' ? z.orden : zIdx,
            },
          })
          targetZonaId = createdZ.id
          if (z.id) {
            idMap.zonas[z.id] = createdZ.id
          }
          stats.zonesCreated++
          stats.totalMutations++
        }

        // --- STEP E: Actividades in Zona ---
        const submittedActividades = z.actividades || []
        const existingActividadesInZ = existingZ?.actividades || []
        const existingActMap = new Map<string, any>(existingActividadesInZ.map((a: any) => [a.id, a]))
        const submittedActIds = new Set(
          submittedActividades.map((a) => a.id).filter((id): id is string => Boolean(id && existingActMap.has(id)))
        )

        // Delete removed activities
        for (const [aId] of existingActMap) {
          if (!submittedActIds.has(aId)) {
            await tx.actividad.delete({ where: { id: aId } })
            stats.activitiesDeleted++
            stats.totalMutations++
          }
        }

        // Sync actividades
        for (let aIdx = 0; aIdx < submittedActividades.length; aIdx++) {
          const a = submittedActividades[aIdx]
          let targetActividadId: string
          let existingA: any = null

          if (a.id && existingActMap.has(a.id)) {
            targetActividadId = a.id
            existingA = existingActMap.get(a.id)
            if (!isActividadEqual(existingA, a, aIdx)) {
              await tx.actividad.update({
                where: { id: targetActividadId },
                data: {
                  nombre: a.nombre || '',
                  descripcion: a.descripcion || null,
                  tareas: a.tareas || null,
                  cargo: a.cargo || z.cargo || null,
                  rutinario: a.rutinario || z.rutinario || false,
                  orden: typeof a.orden === 'number' ? a.orden : aIdx,
                },
              })
              stats.activitiesUpdated++
              stats.totalMutations++
            }
          } else {
            const createdA = await tx.actividad.create({
              data: {
                zonaId: targetZonaId,
                nombre: a.nombre || '',
                descripcion: a.descripcion || null,
                tareas: a.tareas || null,
                cargo: a.cargo || z.cargo || null,
                rutinario: a.rutinario || z.rutinario || false,
                orden: typeof a.orden === 'number' ? a.orden : aIdx,
              },
            })
            targetActividadId = createdA.id
            if (a.id) {
              idMap.actividades[a.id] = createdA.id
            }
            stats.activitiesCreated++
            stats.totalMutations++
          }

          // --- STEP F: Peligros in Actividad ---
          const submittedPeligros = a.peligros || []
          const existingPeligrosInA = existingA?.peligros || []
          const existingPelMap = new Map<string, any>(existingPeligrosInA.map((p: any) => [p.id, p]))
          const submittedPelIds = new Set(
            submittedPeligros.map((p) => p.id).filter((id): id is string => Boolean(id && existingPelMap.has(id)))
          )

          // Delete removed hazards
          for (const [pId] of existingPelMap) {
            if (!submittedPelIds.has(pId)) {
              await tx.peligro.delete({ where: { id: pId } })
              stats.hazardsDeleted++
              stats.totalMutations++
            }
          }

          // Sync peligros
          for (let pelIdx = 0; pelIdx < submittedPeligros.length; pelIdx++) {
            const pel = submittedPeligros[pelIdx]
            let targetPeligroId: string
            let existingPel: any = null

            if (pel.id && existingPelMap.has(pel.id)) {
              targetPeligroId = pel.id
              existingPel = existingPelMap.get(pel.id)
              if (!isPeligroEqual(existingPel, pel, pelIdx)) {
                await tx.peligro.update({
                  where: { id: targetPeligroId },
                  data: {
                    descripcion: pel.descripcion || null,
                    clasificacion: pel.clasificacion || null,
                    efectosPosibles: pel.efectos || null,
                    orden: typeof pel.orden === 'number' ? pel.orden : pelIdx,
                    catalogoPeligroId: pel.catalogoPeligroId || null,
                  },
                })
                stats.hazardsUpdated++
                stats.totalMutations++
              }
            } else {
              const createdPel = await tx.peligro.create({
                data: {
                  actividadId: targetActividadId,
                  descripcion: pel.descripcion || null,
                  clasificacion: pel.clasificacion || null,
                  efectosPosibles: pel.efectos || null,
                  orden: typeof pel.orden === 'number' ? pel.orden : pelIdx,
                  catalogoPeligroId: pel.catalogoPeligroId || null,
                },
              })
              targetPeligroId = createdPel.id
              if (pel.id) {
                idMap.peligros[pel.id] = createdPel.id
              }
              stats.hazardsCreated++
              stats.totalMutations++
            }

            // --- STEP G: 1:1 Sub-records for Peligro ---

            // G1: Control
            const existingCtrl = existingPel?.control
            if (!isControlEqual(existingCtrl, pel.controles)) {
              const ctrlData = {
                fuente: pel.controles?.fuente || null,
                medio: pel.controles?.medio || null,
                individuo: pel.controles?.individuo || null,
              }
              if (existingCtrl) {
                await tx.control.update({
                  where: { id: existingCtrl.id },
                  data: ctrlData,
                })
                stats.controlsUpdated++
                stats.totalMutations++
              } else if (ctrlData.fuente || ctrlData.medio || ctrlData.individuo) {
                await tx.control.create({
                  data: {
                    peligroId: targetPeligroId,
                    ...ctrlData,
                  },
                })
                stats.controlsCreated++
                stats.totalMutations++
              }
            }

            // G2: Evaluacion Inherent
            const existingEval = existingPel?.evaluacion
            if (!isEvaluacionEqual(existingEval, pel.evaluacion)) {
              const evalData = {
                nivelDeficiencia: normNum(pel.evaluacion?.nd),
                nivelExposicion: normNum(pel.evaluacion?.ne),
                nivelConsecuencia: normNum(pel.evaluacion?.nc),
                nivelProbabilidad: normNum(pel.evaluacion?.np),
                nivelRiesgo: normNum(pel.evaluacion?.nr),
                interpProbabilidad: normStr(pel.evaluacion?.interp_np) || null,
                interpRiesgo: normStr(pel.evaluacion?.interp_nr) || null,
                aceptabilidad: normStr(pel.evaluacion?.aceptabilidad) || null,
              }
              if (existingEval) {
                await tx.evaluacion.update({
                  where: { id: existingEval.id },
                  data: evalData,
                })
                stats.evaluationsUpdated++
                stats.totalMutations++
              } else if (evalData.nivelDeficiencia !== null || evalData.nivelExposicion !== null || evalData.nivelConsecuencia !== null) {
                await tx.evaluacion.create({
                  data: {
                    peligroId: targetPeligroId,
                    ...evalData,
                  },
                })
                stats.evaluationsCreated++
                stats.totalMutations++
              }
            }

            // G3: EvaluacionPost Residual
            const existingEvalPost = existingPel?.evaluacionPost
            if (!isEvaluacionEqual(existingEvalPost, pel.evaluacionPost)) {
              const postData = {
                nivelDeficiencia: normNum(pel.evaluacionPost?.nd),
                nivelExposicion: normNum(pel.evaluacionPost?.ne),
                nivelConsecuencia: normNum(pel.evaluacionPost?.nc),
                nivelProbabilidad: normNum(pel.evaluacionPost?.np),
                nivelRiesgo: normNum(pel.evaluacionPost?.nr),
                interpProbabilidad: normStr(pel.evaluacionPost?.interp_np) || null,
                interpRiesgo: normStr(pel.evaluacionPost?.interp_nr) || null,
                aceptabilidad: normStr(pel.evaluacionPost?.aceptabilidad) || null,
              }
              if (existingEvalPost) {
                await tx.evaluacionPost.update({
                  where: { id: existingEvalPost.id },
                  data: postData,
                })
                stats.evaluationsUpdated++
                stats.totalMutations++
              } else if (postData.nivelDeficiencia !== null || postData.nivelExposicion !== null || postData.nivelConsecuencia !== null) {
                await tx.evaluacionPost.create({
                  data: {
                    peligroId: targetPeligroId,
                    ...postData,
                  },
                })
                stats.evaluationsCreated++
                stats.totalMutations++
              }
            }

            // G4: Criterios
            const existingCrit = existingPel?.criterio
            if (!isCriterioEqual(existingCrit, pel.criterios)) {
              const critData = {
                numExpuestos: normNum(pel.criterios?.num_expuestos),
                peorConsecuencia: normStr(pel.criterios?.peor_consecuencia) || null,
                requisitoLegal: normBool(pel.criterios?.requisito_legal),
              }
              if (existingCrit) {
                await tx.criterio.update({
                  where: { id: existingCrit.id },
                  data: critData,
                })
                stats.criteriaUpdated++
                stats.totalMutations++
              } else if (critData.numExpuestos !== null || critData.peorConsecuencia || critData.requisitoLegal) {
                await tx.criterio.create({
                  data: {
                    peligroId: targetPeligroId,
                    ...critData,
                  },
                })
                stats.criteriaCreated++
                stats.totalMutations++
              }
            }

            // G5: Intervencion
            const existingInterv = existingPel?.intervencion
            if (!isIntervencionEqual(existingInterv, pel.intervencion)) {
              const intervData = {
                eliminacion: normStr(pel.intervencion?.eliminacion) || null,
                sustitucion: normStr(pel.intervencion?.sustitucion) || null,
                controlesIngenieria: normStr(pel.intervencion?.controles_ingenieria) || null,
                controlesAdministrativos: normStr(pel.intervencion?.controles_administrativos) || null,
                epp: normStr(pel.intervencion?.epp) || null,
                responsable: normStr(pel.intervencion?.responsable) || null,
                fechaEjecucion: pel.intervencion?.fecha_ejecucion
                  ? new Date(pel.intervencion.fecha_ejecucion)
                  : null,
              }
              if (existingInterv) {
                await tx.intervencion.update({
                  where: { id: existingInterv.id },
                  data: intervData,
                })
                stats.interventionsUpdated++
                stats.totalMutations++
              } else if (
                intervData.eliminacion ||
                intervData.sustitucion ||
                intervData.controlesIngenieria ||
                intervData.controlesAdministrativos ||
                intervData.epp ||
                intervData.responsable ||
                intervData.fechaEjecucion
              ) {
                await tx.intervencion.create({
                  data: {
                    peligroId: targetPeligroId,
                    ...intervData,
                  },
                })
                stats.interventionsCreated++
                stats.totalMutations++
              }
            }
          }
        }
      }
    }

    // --- STEP H: updatedAt Behavior ---
    if (stats.totalMutations > 0) {
      updatedMatrixRecord = await tx.matriz.update({
        where: { id: matrixId },
        data: { updatedAt: new Date() },
      })
    }
  })

  const durationMs = Date.now() - startTime

  return {
    id: matrixId,
    updatedAt: updatedMatrixRecord?.updatedAt || existing.updatedAt,
    idMap,
    stats,
    durationMs,
  }
}
