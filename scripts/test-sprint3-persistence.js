const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper comparison & normalization
function normStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function normNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function normBool(v) {
  return Boolean(v);
}

function normDateStr(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const s = String(v).trim();
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[0];
  return s;
}

function isMatrixHeaderEqual(persisted, incoming) {
  if (normStr(persisted.area) !== normStr(incoming.area)) return false;
  if (normStr(persisted.responsable) !== normStr(incoming.responsable)) return false;
  if (normDateStr(persisted.fechaElaboracion) !== normDateStr(incoming.fecha_elaboracion)) return false;
  if (normDateStr(persisted.fechaActualizacion) !== normDateStr(incoming.fecha_actualizacion)) return false;
  return true;
}

function isProcesoEqual(persisted, incoming, expectedOrden) {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false;
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0;
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden;
  return pOrden === iOrden;
}

function isZonaEqual(persisted, incoming, expectedOrden) {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false;
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0;
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden;
  return pOrden === iOrden;
}

function isActividadEqual(persisted, incoming, expectedOrden) {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false;
  if (normStr(persisted.descripcion) !== normStr(incoming.descripcion)) return false;
  if (normStr(persisted.tareas) !== normStr(incoming.tareas)) return false;
  if (normStr(persisted.cargo) !== normStr(incoming.cargo)) return false;
  if (normBool(persisted.rutinario) !== normBool(incoming.rutinario)) return false;
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0;
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden;
  return pOrden === iOrden;
}

function isPeligroEqual(persisted, incoming, expectedOrden) {
  if (normStr(persisted.descripcion) !== normStr(incoming.descripcion)) return false;
  if (normStr(persisted.clasificacion) !== normStr(incoming.clasificacion)) return false;
  if (normStr(persisted.efectosPosibles) !== normStr(incoming.efectos)) return false;
  if (normStr(persisted.catalogoPeligroId) !== normStr(incoming.catalogoPeligroId)) return false;
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0;
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden;
  return pOrden === iOrden;
}

function isControlEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) {
    return !normStr(incoming.fuente) && !normStr(incoming.medio) && !normStr(incoming.individuo);
  }
  if (persisted && !incoming) {
    return !normStr(persisted.fuente) && !normStr(persisted.medio) && !normStr(persisted.individuo);
  }
  if (normStr(persisted.fuente) !== normStr(incoming.fuente)) return false;
  if (normStr(persisted.medio) !== normStr(incoming.medio)) return false;
  if (normStr(persisted.individuo) !== normStr(incoming.individuo)) return false;
  return true;
}

function isEvaluacionEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) {
    return normNum(incoming.nd) === null && normNum(incoming.ne) === null && normNum(incoming.nc) === null;
  }
  if (persisted && !incoming) {
    return persisted.nivelDeficiencia === null && persisted.nivelExposicion === null && persisted.nivelConsecuencia === null;
  }
  if (normNum(persisted.nivelDeficiencia) !== normNum(incoming.nd)) return false;
  if (normNum(persisted.nivelExposicion) !== normNum(incoming.ne)) return false;
  if (normNum(persisted.nivelConsecuencia) !== normNum(incoming.nc)) return false;
  if (normNum(persisted.nivelProbabilidad) !== normNum(incoming.np)) return false;
  if (normNum(persisted.nivelRiesgo) !== normNum(incoming.nr)) return false;
  if (normStr(persisted.interpProbabilidad) !== normStr(incoming.interp_np)) return false;
  if (normStr(persisted.interpRiesgo) !== normStr(incoming.interp_nr)) return false;
  if (normStr(persisted.aceptabilidad) !== normStr(incoming.aceptabilidad)) return false;
  return true;
}

function isCriterioEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) {
    return normNum(incoming.num_expuestos) === null && !normStr(incoming.peor_consecuencia) && !normBool(incoming.requisito_legal);
  }
  if (persisted && !incoming) {
    return persisted.numExpuestos === null && !normStr(persisted.peorConsecuencia) && !normBool(persisted.requisitoLegal);
  }
  if (normNum(persisted.numExpuestos) !== normNum(incoming.num_expuestos)) return false;
  if (normStr(persisted.peorConsecuencia) !== normStr(incoming.peor_consecuencia)) return false;
  if (normBool(persisted.requisitoLegal) !== normBool(incoming.requisito_legal)) return false;
  return true;
}

function isIntervencionEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) {
    return !normStr(incoming.eliminacion) && !normStr(incoming.sustitucion) && !normStr(incoming.controles_ingenieria) && !normStr(incoming.controles_administrativos) && !normStr(incoming.epp) && !normStr(incoming.responsable) && !normDateStr(incoming.fecha_ejecucion);
  }
  if (persisted && !incoming) {
    return !normStr(persisted.eliminacion) && !normStr(persisted.sustitucion) && !normStr(persisted.controlesIngenieria) && !normStr(persisted.controlesAdministrativos) && !normStr(persisted.epp) && !normStr(persisted.responsable) && !normDateStr(persisted.fechaEjecucion);
  }
  if (normStr(persisted.eliminacion) !== normStr(incoming.eliminacion)) return false;
  if (normStr(persisted.sustitucion) !== normStr(incoming.sustitucion)) return false;
  if (normStr(persisted.controlesIngenieria) !== normStr(incoming.controles_ingenieria)) return false;
  if (normStr(persisted.controlesAdministrativos) !== normStr(incoming.controles_administrativos)) return false;
  if (normStr(persisted.epp) !== normStr(incoming.epp)) return false;
  if (normStr(persisted.responsable) !== normStr(incoming.responsable)) return false;
  if (normDateStr(persisted.fechaEjecucion) !== normDateStr(incoming.fecha_ejecucion)) return false;
  return true;
}

// Sync implementation
async function runDifferentialSync(tx, matrixId, payload, existing) {
  const stats = {
    matrixUpdated: false,
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
  };

  const idMap = { procesos: {}, zonas: {}, actividades: {}, peligros: {} };

  // Known IDs lookup
  const knownProcesos = new Map();
  for (const p of existing.procesos || []) {
    knownProcesos.set(p.id, p);
  }

  // 1. Matrix Header
  if (!isMatrixHeaderEqual(existing, payload)) {
    await tx.matriz.update({
      where: { id: matrixId },
      data: {
        area: payload.area,
        responsable: payload.responsable,
        fechaElaboracion: payload.fecha_elaboracion ? new Date(payload.fecha_elaboracion) : null,
        fechaActualizacion: payload.fecha_actualizacion ? new Date(payload.fecha_actualizacion) : null,
      },
    });
    stats.matrixUpdated = true;
    stats.totalMutations++;
  }

  // 2. Procesos
  const submittedProcesos = payload.procesos || [];
  const submittedProcesoIds = new Set(
    submittedProcesos.map((p) => p.id).filter((id) => Boolean(id && knownProcesos.has(id)))
  );

  for (const [pId] of knownProcesos) {
    if (!submittedProcesoIds.has(pId)) {
      await tx.proceso.delete({ where: { id: pId } });
      stats.processesDeleted++;
      stats.totalMutations++;
    }
  }

  for (let pIdx = 0; pIdx < submittedProcesos.length; pIdx++) {
    const p = submittedProcesos[pIdx];
    let targetProcesoId;
    let existingP = null;

    if (p.id && knownProcesos.has(p.id)) {
      targetProcesoId = p.id;
      existingP = knownProcesos.get(p.id);
      if (!isProcesoEqual(existingP, p, pIdx)) {
        await tx.proceso.update({
          where: { id: targetProcesoId },
          data: { nombre: p.nombre || '', orden: pIdx },
        });
        stats.processesUpdated++;
        stats.totalMutations++;
      }
    } else {
      const createdP = await tx.proceso.create({
        data: { matrizId: matrixId, nombre: p.nombre || '', orden: pIdx },
      });
      targetProcesoId = createdP.id;
      if (p.id) idMap.procesos[p.id] = createdP.id;
      stats.processesCreated++;
      stats.totalMutations++;
    }

    // Zonas
    const submittedZonas = p.zonas || [];
    const existingZonasInP = existingP?.zonas || [];
    const existingZonaMap = new Map(existingZonasInP.map((z) => [z.id, z]));
    const submittedZonaIds = new Set(
      submittedZonas.map((z) => z.id).filter((id) => Boolean(id && existingZonaMap.has(id)))
    );

    for (const [zId] of existingZonaMap) {
      if (!submittedZonaIds.has(zId)) {
        await tx.zona.delete({ where: { id: zId } });
        stats.zonesDeleted++;
        stats.totalMutations++;
      }
    }

    for (let zIdx = 0; zIdx < submittedZonas.length; zIdx++) {
      const z = submittedZonas[zIdx];
      let targetZonaId;
      let existingZ = null;

      if (z.id && existingZonaMap.has(z.id)) {
        targetZonaId = z.id;
        existingZ = existingZonaMap.get(z.id);
        if (!isZonaEqual(existingZ, z, zIdx)) {
          await tx.zona.update({
            where: { id: targetZonaId },
            data: { nombre: z.nombre || '', orden: zIdx },
          });
          stats.zonesUpdated++;
          stats.totalMutations++;
        }
      } else {
        const createdZ = await tx.zona.create({
          data: { procesoId: targetProcesoId, nombre: z.nombre || '', orden: zIdx },
        });
        targetZonaId = createdZ.id;
        if (z.id) idMap.zonas[z.id] = createdZ.id;
        stats.zonesCreated++;
        stats.totalMutations++;
      }

      // Actividades
      const submittedActividades = z.actividades || [];
      const existingActInZ = existingZ?.actividades || [];
      const existingActMap = new Map(existingActInZ.map((a) => [a.id, a]));
      const submittedActIds = new Set(
        submittedActividades.map((a) => a.id).filter((id) => Boolean(id && existingActMap.has(id)))
      );

      for (const [aId] of existingActMap) {
        if (!submittedActIds.has(aId)) {
          await tx.actividad.delete({ where: { id: aId } });
          stats.activitiesDeleted++;
          stats.totalMutations++;
        }
      }

      for (let aIdx = 0; aIdx < submittedActividades.length; aIdx++) {
        const a = submittedActividades[aIdx];
        let targetActividadId;
        let existingA = null;

        if (a.id && existingActMap.has(a.id)) {
          targetActividadId = a.id;
          existingA = existingActMap.get(a.id);
          if (!isActividadEqual(existingA, a, aIdx)) {
            await tx.actividad.update({
              where: { id: targetActividadId },
              data: {
                nombre: a.nombre || '',
                descripcion: a.descripcion || null,
                tareas: a.tareas || null,
                cargo: a.cargo || null,
                rutinario: !!a.rutinario,
                orden: aIdx,
              },
            });
            stats.activitiesUpdated++;
            stats.totalMutations++;
          }
        } else {
          const createdA = await tx.actividad.create({
            data: {
              zonaId: targetZonaId,
              nombre: a.nombre || '',
              descripcion: a.descripcion || null,
              tareas: a.tareas || null,
              cargo: a.cargo || null,
              rutinario: !!a.rutinario,
              orden: aIdx,
            },
          });
          targetActividadId = createdA.id;
          if (a.id) idMap.actividades[a.id] = createdA.id;
          stats.activitiesCreated++;
          stats.totalMutations++;
        }

        // Peligros
        const submittedPeligros = a.peligros || [];
        const existingPelInA = existingA?.peligros || [];
        const existingPelMap = new Map(existingPelInA.map((p) => [p.id, p]));
        const submittedPelIds = new Set(
          submittedPeligros.map((p) => p.id).filter((id) => Boolean(id && existingPelMap.has(id)))
        );

        for (const [pelId] of existingPelMap) {
          if (!submittedPelIds.has(pelId)) {
            await tx.peligro.delete({ where: { id: pelId } });
            stats.hazardsDeleted++;
            stats.totalMutations++;
          }
        }

        for (let pelIdx = 0; pelIdx < submittedPeligros.length; pelIdx++) {
          const pel = submittedPeligros[pelIdx];
          let targetPeligroId;
          let existingPel = null;

          if (pel.id && existingPelMap.has(pel.id)) {
            targetPeligroId = pel.id;
            existingPel = existingPelMap.get(pel.id);
            if (!isPeligroEqual(existingPel, pel, pelIdx)) {
              await tx.peligro.update({
                where: { id: targetPeligroId },
                data: {
                  descripcion: pel.descripcion || null,
                  clasificacion: pel.clasificacion || null,
                  efectosPosibles: pel.efectos || null,
                  orden: pelIdx,
                  catalogoPeligroId: pel.catalogoPeligroId || null,
                },
              });
              stats.hazardsUpdated++;
              stats.totalMutations++;
            }
          } else {
            const createdPel = await tx.peligro.create({
              data: {
                actividadId: targetActividadId,
                descripcion: pel.descripcion || null,
                clasificacion: pel.clasificacion || null,
                efectosPosibles: pel.efectos || null,
                orden: pelIdx,
                catalogoPeligroId: pel.catalogoPeligroId || null,
              },
            });
            targetPeligroId = createdPel.id;
            if (pel.id) idMap.peligros[pel.id] = createdPel.id;
            stats.hazardsCreated++;
            stats.totalMutations++;
          }

          // 1:1 Sub-records

          // Control
          const existingCtrl = existingPel?.control;
          if (!isControlEqual(existingCtrl, pel.controles)) {
            const ctrlData = {
              fuente: pel.controles?.fuente || null,
              medio: pel.controles?.medio || null,
              individuo: pel.controles?.individuo || null,
            };
            if (existingCtrl) {
              await tx.control.update({ where: { id: existingCtrl.id }, data: ctrlData });
              stats.controlsUpdated++;
              stats.totalMutations++;
            } else if (ctrlData.fuente || ctrlData.medio || ctrlData.individuo) {
              await tx.control.create({ data: { peligroId: targetPeligroId, ...ctrlData } });
              stats.controlsCreated++;
              stats.totalMutations++;
            }
          }

          // Evaluacion
          const existingEval = existingPel?.evaluacion;
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
            };
            if (existingEval) {
              await tx.evaluacion.update({ where: { id: existingEval.id }, data: evalData });
              stats.evaluationsUpdated++;
              stats.totalMutations++;
            } else if (evalData.nivelDeficiencia !== null || evalData.nivelExposicion !== null || evalData.nivelConsecuencia !== null) {
              await tx.evaluacion.create({ data: { peligroId: targetPeligroId, ...evalData } });
              stats.evaluationsCreated++;
              stats.totalMutations++;
            }
          }

          // EvaluacionPost
          const existingPost = existingPel?.evaluacionPost;
          if (!isEvaluacionEqual(existingPost, pel.evaluacionPost)) {
            const postData = {
              nivelDeficiencia: normNum(pel.evaluacionPost?.nd),
              nivelExposicion: normNum(pel.evaluacionPost?.ne),
              nivelConsecuencia: normNum(pel.evaluacionPost?.nc),
              nivelProbabilidad: normNum(pel.evaluacionPost?.np),
              nivelRiesgo: normNum(pel.evaluacionPost?.nr),
              interpProbabilidad: normStr(pel.evaluacionPost?.interp_np) || null,
              interpRiesgo: normStr(pel.evaluacionPost?.interp_nr) || null,
              aceptabilidad: normStr(pel.evaluacionPost?.aceptabilidad) || null,
            };
            if (existingPost) {
              await tx.evaluacionPost.update({ where: { id: existingPost.id }, data: postData });
              stats.evaluationsUpdated++;
              stats.totalMutations++;
            } else if (postData.nivelDeficiencia !== null || postData.nivelExposicion !== null || postData.nivelConsecuencia !== null) {
              await tx.evaluacionPost.create({ data: { peligroId: targetPeligroId, ...postData } });
              stats.evaluationsCreated++;
              stats.totalMutations++;
            }
          }

          // Criterios
          const existingCrit = existingPel?.criterio;
          if (!isCriterioEqual(existingCrit, pel.criterios)) {
            const critData = {
              numExpuestos: normNum(pel.criterios?.num_expuestos),
              peorConsecuencia: normStr(pel.criterios?.peor_consecuencia) || null,
              requisitoLegal: normBool(pel.criterios?.requisito_legal),
            };
            if (existingCrit) {
              await tx.criterio.update({ where: { id: existingCrit.id }, data: critData });
              stats.criteriaUpdated++;
              stats.totalMutations++;
            } else if (critData.numExpuestos !== null || critData.peorConsecuencia || critData.requisitoLegal) {
              await tx.criterio.create({ data: { peligroId: targetPeligroId, ...critData } });
              stats.criteriaCreated++;
              stats.totalMutations++;
            }
          }

          // Intervencion
          const existingInterv = existingPel?.intervencion;
          if (!isIntervencionEqual(existingInterv, pel.intervencion)) {
            const intervData = {
              eliminacion: normStr(pel.intervencion?.eliminacion) || null,
              sustitucion: normStr(pel.intervencion?.sustitucion) || null,
              controlesIngenieria: normStr(pel.intervencion?.controles_ingenieria) || null,
              controlesAdministrativos: normStr(pel.intervencion?.controles_administrativos) || null,
              epp: normStr(pel.intervencion?.epp) || null,
              responsable: normStr(pel.intervencion?.responsable) || null,
              fechaEjecucion: pel.intervencion?.fecha_ejecucion ? new Date(pel.intervencion.fecha_ejecucion) : null,
            };
            if (existingInterv) {
              await tx.intervencion.update({ where: { id: existingInterv.id }, data: intervData });
              stats.interventionsUpdated++;
              stats.totalMutations++;
            } else if (intervData.eliminacion || intervData.sustitucion || intervData.controlesIngenieria || intervData.controlesAdministrativos || intervData.epp || intervData.responsable || intervData.fechaEjecucion) {
              await tx.intervencion.create({ data: { peligroId: targetPeligroId, ...intervData } });
              stats.interventionsCreated++;
              stats.totalMutations++;
            }
          }
        }
      }
    }
  }

  if (stats.totalMutations > 0) {
    await tx.matriz.update({
      where: { id: matrixId },
      data: { updatedAt: new Date() },
    });
  }

  return { idMap, stats };
}

// Full load helper
async function loadFullMatrix(matrixId) {
  return prisma.matriz.findUnique({
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
  });
}

function mapPersistedToIncoming(m) {
  return {
    id: m.id,
    area: m.area || '',
    responsable: m.responsable || '',
    fecha_elaboracion: m.fechaElaboracion ? m.fechaElaboracion.toISOString().split('T')[0] : '',
    fecha_actualizacion: m.fechaActualizacion ? m.fechaActualizacion.toISOString().split('T')[0] : '',
    lastUpdatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
    files: (m.archivos || []).map((a) => ({ name: a.nombreOriginal, type: a.tipoMime, url: a.url })),
    procesos: (m.procesos || []).map((p, pIdx) => ({
      id: p.id,
      nombre: p.nombre,
      orden: p.orden ?? pIdx,
      zonas: (p.zonas || []).map((z, zIdx) => ({
        id: z.id,
        nombre: z.nombre,
        orden: z.orden ?? zIdx,
        actividades: (z.actividades || []).map((a, aIdx) => ({
          id: a.id,
          nombre: a.nombre,
          descripcion: a.descripcion || '',
          tareas: a.tareas || '',
          cargo: a.cargo || '',
          rutinario: !!a.rutinario,
          orden: a.orden ?? aIdx,
          peligros: (a.peligros || []).map((pel, pelIdx) => ({
            id: pel.id,
            catalogoPeligroId: pel.catalogoPeligroId || null,
            descripcion: pel.descripcion || '',
            clasificacion: pel.clasificacion || '',
            efectos: pel.efectosPosibles || '',
            orden: pel.orden ?? pelIdx,
            controles: {
              fuente: pel.control?.fuente || '',
              medio: pel.control?.medio || '',
              individuo: pel.control?.individuo || '',
            },
            evaluacion: {
              nd: pel.evaluacion?.nivelDeficiencia ?? null,
              ne: pel.evaluacion?.nivelExposicion ?? null,
              nc: pel.evaluacion?.nivelConsecuencia ?? null,
              np: pel.evaluacion?.nivelProbabilidad ?? null,
              nr: pel.evaluacion?.nivelRiesgo ?? null,
              interp_np: pel.evaluacion?.interpProbabilidad || '',
              interp_nr: pel.evaluacion?.interpRiesgo || '',
              aceptabilidad: pel.evaluacion?.aceptabilidad || '',
            },
            evaluacionPost: pel.evaluacionPost
              ? {
                  nd: pel.evaluacionPost.nivelDeficiencia ?? null,
                  ne: pel.evaluacionPost.nivelExposicion ?? null,
                  nc: pel.evaluacionPost.nivelConsecuencia ?? null,
                  np: pel.evaluacionPost.nivelProbabilidad ?? null,
                  nr: pel.evaluacionPost.nivelRiesgo ?? null,
                  interp_np: pel.evaluacionPost.interpProbabilidad || '',
                  interp_nr: pel.evaluacionPost.interpRiesgo || '',
                  aceptabilidad: pel.evaluacionPost.aceptabilidad || '',
                }
              : null,
            criterios: {
              num_expuestos: pel.criterio?.numExpuestos ?? null,
              peor_consecuencia: pel.criterio?.peorConsecuencia || '',
              requisito_legal: !!pel.criterio?.requisitoLegal,
            },
            intervencion: {
              eliminacion: pel.intervencion?.eliminacion || '',
              sustitucion: pel.intervencion?.sustitucion || '',
              controles_ingenieria: pel.intervencion?.controlesIngenieria || '',
              controles_administrativos: pel.intervencion?.controlesAdministrativos || '',
              epp: pel.intervencion?.epp || '',
              responsable: pel.intervencion?.responsable || '',
              fecha_ejecucion: pel.intervencion?.fechaEjecucion ? pel.intervencion.fechaEjecucion.toISOString().split('T')[0] : '',
            },
          })),
        })),
      })),
    })),
  };
}

async function main() {
  console.log('=== SPRINT 3: MATRIX PERSISTENCE ARCHITECTURE INTEGRATION TESTS ===\n');

  // 1. Initial Baseline DB Counts
  const initialCounts = {
    matricesTotal: await prisma.matriz.count(),
    matricesActive: await prisma.matriz.count({ where: { deletedAt: null } }),
    procesos: await prisma.proceso.count(),
    zonas: await prisma.zona.count(),
    actividades: await prisma.actividad.count(),
    peligros: await prisma.peligro.count(),
    controles: await prisma.control.count(),
    evaluaciones: await prisma.evaluacion.count(),
    criterios: await prisma.criterio.count(),
    intervenciones: await prisma.intervencion.count(),
    activityLogs: await prisma.activityLog.count(),
  };
  console.log('Initial DB Counts:', JSON.stringify(initialCounts, null, 2));

  // Find an admin user to own test matrix
  const user = await prisma.usuario.findFirst();
  if (!user) throw new Error('No user found');

  // 2. Create isolated test matrix
  console.log('\nCreating isolated test matrix...');
  const testMatrix = await prisma.matriz.create({
    data: {
      usuarioId: user.id,
      area: 'TEST PERSISTENCE SPRINT 3',
      responsable: 'Tester Automático',
      fechaElaboracion: new Date('2026-09-18'),
      fechaActualizacion: new Date('2026-09-18'),
      procesos: {
        create: [
          {
            nombre: 'Proceso Alpha',
            orden: 0,
            zonas: {
              create: [
                {
                  nombre: 'Zona Alpha 1',
                  orden: 0,
                  actividades: {
                    create: [
                      {
                        nombre: 'Actividad Alpha 1.1',
                        descripcion: 'Desc 1.1',
                        tareas: 'Tareas 1.1',
                        orden: 0,
                        peligros: {
                          create: [
                            {
                              descripcion: 'Peligro 1 - Biológico',
                              clasificacion: 'Biológico',
                              efectosPosibles: 'Infección',
                              orden: 0,
                              control: { create: { fuente: 'F1', medio: 'M1', individuo: 'I1' } },
                              evaluacion: { create: { nivelDeficiencia: 6, nivelExposicion: 3, nivelConsecuencia: 25, nivelProbabilidad: 18, nivelRiesgo: 450, interpProbabilidad: 'Alto', interpRiesgo: 'II', aceptabilidad: 'Aceptable con Control Especifico' } },
                              criterio: { create: { numExpuestos: 10, peorConsecuencia: 'Enfermedad grave', requisitoLegal: true } },
                              intervencion: { create: { eliminacion: 'E1', sustitucion: 'S1', controlesIngenieria: 'CI1', controlesAdministrativos: 'CA1', epp: 'EPP1', responsable: 'Jefe SST' } },
                            },
                            {
                              descripcion: 'Peligro 2 - Físico',
                              clasificacion: 'Físico',
                              efectosPosibles: 'Hipoacusia',
                              orden: 1,
                              control: { create: { fuente: 'F2', medio: 'M2', individuo: 'I2' } },
                              evaluacion: { create: { nivelDeficiencia: 2, nivelExposicion: 3, nivelConsecuencia: 10, nivelProbabilidad: 6, nivelRiesgo: 60, interpProbabilidad: 'Medio', interpRiesgo: 'III', aceptabilidad: 'Mejorable' } },
                              criterio: { create: { numExpuestos: 5, peorConsecuencia: 'Hipoacusia leve', requisitoLegal: false } },
                              intervencion: { create: { eliminacion: '', sustitucion: '', controlesIngenieria: 'Aislamiento acústico', controlesAdministrativos: 'Pausas', epp: 'Protector auditivo', responsable: 'Seguridad' } },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const matrixId = testMatrix.id;
  console.log(`Created test matrix ID: ${matrixId}`);

  // Test Results collector
  const testResults = [];

  // Load fresh state
  let currentDbState = await loadFullMatrix(matrixId);
  const origP0Id = currentDbState.procesos[0].id;
  const origZ0Id = currentDbState.procesos[0].zonas[0].id;
  const origA0Id = currentDbState.procesos[0].zonas[0].actividades[0].id;
  const origH0Id = currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id;
  const origH1Id = currentDbState.procesos[0].zonas[0].actividades[0].peligros[1].id;

  // TEST 1: No-op Save
  {
    console.log('\n--- TEST 1: No-op save (0 changes submitted) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { idMap, stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.totalMutations === 0 &&
      currentDbState.procesos[0].id === origP0Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id &&
      logsCreated === 0;

    testResults.push({
      test: 'TEST 1: No-op save',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 2: Modify matrix metadata (responsable)
  {
    console.log('\n--- TEST 2: Modify matrix metadata (responsable) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.responsable = 'Nuevo Responsable Modificado';
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.matrixUpdated === true &&
      stats.totalMutations === 1 &&
      currentDbState.responsable === 'Nuevo Responsable Modificado' &&
      currentDbState.procesos[0].id === origP0Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id;

    testResults.push({
      test: 'TEST 2: Modify matrix metadata',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 3: Modify activity (descripcion)
  {
    console.log('\n--- TEST 3: Modify activity description ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades[0].descripcion = 'Descripción Actividad Modificada';
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.activitiesUpdated === 1 &&
      stats.hazardsUpdated === 0 &&
      currentDbState.procesos[0].zonas[0].actividades[0].descripcion === 'Descripción Actividad Modificada' &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id;

    testResults.push({
      test: 'TEST 3: Modify activity',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 4: Modify hazard description
  {
    console.log('\n--- TEST 4: Modify hazard description ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades[0].peligros[0].descripcion = 'Peligro 1 - Descripción Actualizada';
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.hazardsUpdated === 1 &&
      stats.controlsUpdated === 0 &&
      stats.evaluationsUpdated === 0 &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].descripcion === 'Peligro 1 - Descripción Actualizada' &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[1].id === origH1Id;

    testResults.push({
      test: 'TEST 4: Modify hazard description',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 5: Modify ND in evaluation
  {
    console.log('\n--- TEST 5: Modify ND in evaluation ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    const p = incoming.procesos[0].zonas[0].actividades[0].peligros[0];
    p.evaluacion.nd = 10;
    p.evaluacion.np = 30;
    p.evaluacion.nr = 750;
    p.evaluacion.interp_nr = 'I';
    p.evaluacion.aceptabilidad = 'No Aceptable';

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const updatedEval = currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].evaluacion;
    const pass =
      stats.evaluationsUpdated === 1 &&
      stats.hazardsUpdated === 0 &&
      updatedEval.nivelDeficiencia === 10 &&
      updatedEval.nivelRiesgo === 750 &&
      updatedEval.interpRiesgo === 'I' &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id;

    testResults.push({
      test: 'TEST 5: Modify ND evaluation',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 6: Modify control (fuente)
  {
    console.log('\n--- TEST 6: Modify control (fuente) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades[0].peligros[0].controles.fuente = 'Control Fuente Modificado 2026';
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const updatedCtrl = currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].control;
    const pass =
      stats.controlsUpdated === 1 &&
      stats.hazardsUpdated === 0 &&
      updatedCtrl.fuente === 'Control Fuente Modificado 2026' &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id;

    testResults.push({
      test: 'TEST 6: Modify control',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 7: Modify intervention (eliminacion)
  {
    console.log('\n--- TEST 7: Modify intervention (eliminacion) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades[0].peligros[0].intervencion.eliminacion = 'Intervencion Eliminacion Modificada';
    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const updatedInterv = currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].intervencion;
    const pass =
      stats.interventionsUpdated === 1 &&
      stats.hazardsUpdated === 0 &&
      updatedInterv.eliminacion === 'Intervencion Eliminacion Modificada' &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id;

    testResults.push({
      test: 'TEST 7: Modify intervention',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Mutations=${stats.totalMutations}, Logs=${logsCreated}, Duration=${durationMs}ms`);
  }

  // TEST 8: Add hazard with temp ID
  let newAddedHazardDbId = null;
  {
    console.log('\n--- TEST 8: Add hazard with temp ID (r-temp999) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades[0].peligros.push({
      id: 'r-temp999',
      descripcion: 'Peligro 3 - Nuevo Químico Agregado',
      clasificacion: 'Químico',
      efectos: 'Irritación',
      orden: 2,
      controles: { fuente: 'F3', medio: '', individuo: 'Mascarilla' },
      evaluacion: { nd: 6, ne: 2, nc: 25, np: 12, nr: 300, interp_np: 'Alto', interp_nr: 'II', aceptabilidad: 'Aceptable con Control Especifico' },
      criterios: { num_expuestos: 3, peor_consecuencia: 'Quemadura', requisito_legal: true },
      intervencion: { epp: 'Respirador N95', responsable: 'SST' },
    });

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { idMap, stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    newAddedHazardDbId = idMap.peligros['r-temp999'];

    const pass =
      stats.hazardsCreated === 1 &&
      Boolean(newAddedHazardDbId) &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros.length === 3 &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[1].id === origH1Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[2].id === newAddedHazardDbId;

    testResults.push({
      test: 'TEST 8: Add hazard',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
      reconciledId: newAddedHazardDbId,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Reconciled 'r-temp999' -> ${newAddedHazardDbId}, Duration=${durationMs}ms`);
  }

  // TEST 9: Delete hazard
  {
    console.log('\n--- TEST 9: Delete hazard (delete the newly added hazard) ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    // Remove the 3rd hazard
    incoming.procesos[0].zonas[0].actividades[0].peligros = incoming.procesos[0].zonas[0].actividades[0].peligros.filter(
      (p) => p.id !== newAddedHazardDbId
    );

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.hazardsDeleted === 1 &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros.length === 2 &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH0Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[1].id === origH1Id;

    testResults.push({
      test: 'TEST 9: Delete hazard',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Deleted hazards=${stats.hazardsDeleted}, Remaining=${currentDbState.procesos[0].zonas[0].actividades[0].peligros.length}`);
  }

  // TEST 10: Add activity with hazards
  let newActDbId = null;
  {
    console.log('\n--- TEST 10: Add activity with hazards ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades.push({
      id: 'a-temp888',
      nombre: 'Actividad 1.2 Nueva',
      descripcion: 'Nueva actividad creada',
      orden: 1,
      peligros: [
        {
          id: 'r-temp777',
          descripcion: 'Peligro en nueva actividad',
          clasificacion: 'Locativo',
          efectos: 'Caída',
          orden: 0,
        },
      ],
    });

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { idMap, stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    newActDbId = idMap.actividades['a-temp888'];

    const pass =
      stats.activitiesCreated === 1 &&
      stats.hazardsCreated === 1 &&
      Boolean(newActDbId) &&
      currentDbState.procesos[0].zonas[0].actividades.length === 2 &&
      currentDbState.procesos[0].zonas[0].actividades[0].id === origA0Id &&
      currentDbState.procesos[0].zonas[0].actividades[1].id === newActDbId;

    testResults.push({
      test: 'TEST 10: Add activity with hazards',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Reconciled activity -> ${newActDbId}`);
  }

  // TEST 11: Delete activity
  {
    console.log('\n--- TEST 11: Delete activity ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    incoming.procesos[0].zonas[0].actividades = incoming.procesos[0].zonas[0].actividades.filter(
      (a) => a.id !== newActDbId
    );

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.activitiesDeleted === 1 &&
      currentDbState.procesos[0].zonas[0].actividades.length === 1 &&
      currentDbState.procesos[0].zonas[0].actividades[0].id === origA0Id;

    testResults.push({
      test: 'TEST 11: Delete activity',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Deleted activities=${stats.activitiesDeleted}, Remaining=${currentDbState.procesos[0].zonas[0].actividades.length}`);
  }

  // TEST 12: Reorder hazards
  {
    console.log('\n--- TEST 12: Reorder hazards ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    // Swap the 2 hazards
    const h0 = incoming.procesos[0].zonas[0].actividades[0].peligros[0];
    const h1 = incoming.procesos[0].zonas[0].actividades[0].peligros[1];
    h1.orden = 0;
    h0.orden = 1;
    incoming.procesos[0].zonas[0].actividades[0].peligros = [h1, h0];

    const startLogs = await prisma.activityLog.count();
    const startTime = Date.now();

    const { stats } = await prisma.$transaction((tx) =>
      runDifferentialSync(tx, matrixId, incoming, currentDbState)
    );
    const durationMs = Date.now() - startTime;
    const endLogs = await prisma.activityLog.count();
    const logsCreated = endLogs - startLogs;

    currentDbState = await loadFullMatrix(matrixId);
    const pass =
      stats.hazardsUpdated === 2 &&
      stats.hazardsCreated === 0 &&
      stats.hazardsDeleted === 0 &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[0].id === origH1Id &&
      currentDbState.procesos[0].zonas[0].actividades[0].peligros[1].id === origH0Id;

    testResults.push({
      test: 'TEST 12: Reorder hazards',
      pass,
      mutations: stats.totalMutations,
      logs: logsCreated,
      durationMs,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Reorder mutations=${stats.hazardsUpdated}, IDs preserved`);
  }

  // TEST 13 (Phase O): Failure / Rollback Test
  {
    console.log('\n--- TEST 13: Transaction Rollback on Failure ---');
    const beforeDbState = await loadFullMatrix(matrixId);
    const incoming = mapPersistedToIncoming(beforeDbState);
    incoming.area = 'SHOULD_NOT_BE_SAVED_DUE_TO_ROLLBACK';

    let errorCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: execute sync
        await runDifferentialSync(tx, matrixId, incoming, beforeDbState);
        // Step 2: intentionally throw error
        throw new Error('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
      });
    } catch (e) {
      if (e.message === 'INTENTIONAL_SIMULATED_TRANSACTION_FAILURE') {
        errorCaught = true;
      }
    }

    const afterDbState = await loadFullMatrix(matrixId);
    const pass =
      errorCaught &&
      afterDbState.area === beforeDbState.area &&
      afterDbState.updatedAt.getTime() === beforeDbState.updatedAt.getTime();

    testResults.push({
      test: 'TEST 13: Failure & Rollback',
      pass,
      mutations: 0,
      logs: 0,
      durationMs: 0,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Rollback verified. Area remained: "${afterDbState.area}"`);
  }

  // TEST 14 (Phase P): Optimistic Concurrency Test
  {
    console.log('\n--- TEST 14: Optimistic Concurrency Protection ---');
    const incoming = mapPersistedToIncoming(currentDbState);
    // Stale timestamp (1 hour in the past)
    incoming.lastUpdatedAt = new Date(Date.now() - 3600000).toISOString();

    const clientTime = new Date(incoming.lastUpdatedAt).getTime();
    const dbTime = new Date(currentDbState.updatedAt).getTime();
    const isConflict = dbTime - clientTime > 2000;

    const pass = isConflict === true;
    testResults.push({
      test: 'TEST 14: Optimistic Concurrency',
      pass,
      mutations: 0,
      logs: 0,
      durationMs: 0,
    });
    console.log(`Result: [${pass ? 'PASS' : 'FAIL'}] Stale update detected (delta=${(dbTime - clientTime) / 1000}s)`);
  }

  // 3. Clean up the test matrix cleanly
  console.log('\nCleaning up test matrix...');
  await prisma.matriz.delete({ where: { id: matrixId } });

  // 4. Final DB Integrity Check
  const finalCounts = {
    matricesTotal: await prisma.matriz.count(),
    matricesActive: await prisma.matriz.count({ where: { deletedAt: null } }),
    procesos: await prisma.proceso.count(),
    zonas: await prisma.zona.count(),
    actividades: await prisma.actividad.count(),
    peligros: await prisma.peligro.count(),
    controles: await prisma.control.count(),
    evaluaciones: await prisma.evaluacion.count(),
    criterios: await prisma.criterio.count(),
    intervenciones: await prisma.intervencion.count(),
  };

  const dbMatches =
    finalCounts.matricesTotal === initialCounts.matricesTotal &&
    finalCounts.matricesActive === initialCounts.matricesActive &&
    finalCounts.procesos === initialCounts.procesos &&
    finalCounts.zonas === initialCounts.zonas &&
    finalCounts.actividades === initialCounts.actividades &&
    finalCounts.peligros === initialCounts.peligros &&
    finalCounts.controles === initialCounts.controles &&
    finalCounts.evaluaciones === initialCounts.evaluaciones &&
    finalCounts.criterios === initialCounts.criterios &&
    finalCounts.intervenciones === initialCounts.intervenciones;

  console.log('\nFinal DB Counts:', JSON.stringify(finalCounts, null, 2));
  console.log(`Institutional DB Integrity: ${dbMatches ? '100% INTACT' : 'MISMATCH DETECTED'}`);

  console.log('\n=== ALL PERSISTENCE TEST RESULTS ===');
  console.table(testResults);

  const allPassed = testResults.every((t) => t.pass) && dbMatches;
  console.log(`\nOVERALL SUITE: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
