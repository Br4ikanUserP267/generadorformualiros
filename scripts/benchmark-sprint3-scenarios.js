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
function normBool(v) { return Boolean(v); }
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
  if (!persisted && incoming) return !normStr(incoming.fuente) && !normStr(incoming.medio) && !normStr(incoming.individuo);
  if (persisted && !incoming) return !normStr(persisted.fuente) && !normStr(persisted.medio) && !normStr(persisted.individuo);
  if (normStr(persisted.fuente) !== normStr(incoming.fuente)) return false;
  if (normStr(persisted.medio) !== normStr(incoming.medio)) return false;
  if (normStr(persisted.individuo) !== normStr(incoming.individuo)) return false;
  return true;
}
function isEvaluacionEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) return normNum(incoming.nd) === null && normNum(incoming.ne) === null && normNum(incoming.nc) === null;
  if (persisted && !incoming) return persisted.nivelDeficiencia === null && persisted.nivelExposicion === null && persisted.nivelConsecuencia === null;
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
  if (!persisted && incoming) return normNum(incoming.num_expuestos) === null && !normStr(incoming.peor_consecuencia) && !normBool(incoming.requisito_legal);
  if (persisted && !incoming) return persisted.numExpuestos === null && !normStr(persisted.peorConsecuencia) && !normBool(persisted.requisitoLegal);
  if (normNum(persisted.numExpuestos) !== normNum(incoming.num_expuestos)) return false;
  if (normStr(persisted.peorConsecuencia) !== normStr(incoming.peor_consecuencia)) return false;
  if (normBool(persisted.requisitoLegal) !== normBool(incoming.requisito_legal)) return false;
  return true;
}
function isIntervencionEqual(persisted, incoming) {
  if (!persisted && !incoming) return true;
  if (!persisted && incoming) return !normStr(incoming.eliminacion) && !normStr(incoming.sustitucion) && !normStr(incoming.controles_ingenieria) && !normStr(incoming.controles_administrativos) && !normStr(incoming.epp) && !normStr(incoming.responsable) && !normDateStr(incoming.fecha_ejecucion);
  if (persisted && !incoming) return !normStr(persisted.eliminacion) && !normStr(persisted.sustitucion) && !normStr(persisted.controlesIngenieria) && !normStr(persisted.controlesAdministrativos) && !normStr(persisted.epp) && !normStr(persisted.responsable) && !normDateStr(persisted.fechaEjecucion);
  if (normStr(persisted.eliminacion) !== normStr(incoming.eliminacion)) return false;
  if (normStr(persisted.sustitucion) !== normStr(incoming.sustitucion)) return false;
  if (normStr(persisted.controlesIngenieria) !== normStr(incoming.controles_ingenieria)) return false;
  if (normStr(persisted.controlesAdministrativos) !== normStr(incoming.controles_administrativos)) return false;
  if (normStr(persisted.epp) !== normStr(incoming.epp)) return false;
  if (normStr(persisted.responsable) !== normStr(incoming.responsable)) return false;
  if (normDateStr(persisted.fechaEjecucion) !== normDateStr(incoming.fecha_ejecucion)) return false;
  return true;
}

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

async function runDifferentialSyncWithStats(tx, matrixId, payload, existing) {
  let selectCount = 1; // initial load
  let insertCount = 0;
  let updateCount = 0;
  let deleteCount = 0;

  const knownProcesos = new Map();
  for (const p of existing.procesos || []) {
    knownProcesos.set(p.id, p);
  }

  // Header
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
    updateCount++;
  }

  // Procesos
  const submittedProcesos = payload.procesos || [];
  const submittedProcesoIds = new Set(
    submittedProcesos.map((p) => p.id).filter((id) => Boolean(id && knownProcesos.has(id)))
  );

  for (const [pId] of knownProcesos) {
    if (!submittedProcesoIds.has(pId)) {
      await tx.proceso.delete({ where: { id: pId } });
      deleteCount++;
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
        updateCount++;
      }
    } else {
      const createdP = await tx.proceso.create({
        data: { matrizId: matrixId, nombre: p.nombre || '', orden: pIdx },
      });
      targetProcesoId = createdP.id;
      insertCount++;
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
        deleteCount++;
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
          updateCount++;
        }
      } else {
        const createdZ = await tx.zona.create({
          data: { procesoId: targetProcesoId, nombre: z.nombre || '', orden: zIdx },
        });
        targetZonaId = createdZ.id;
        insertCount++;
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
          deleteCount++;
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
            updateCount++;
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
          insertCount++;
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
            deleteCount++;
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
              updateCount++;
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
            insertCount++;
          }

          // 1:1 records
          const existingCtrl = existingPel?.control;
          if (!isControlEqual(existingCtrl, pel.controles)) {
            const ctrlData = {
              fuente: pel.controles?.fuente || null,
              medio: pel.controles?.medio || null,
              individuo: pel.controles?.individuo || null,
            };
            if (existingCtrl) {
              await tx.control.update({ where: { id: existingCtrl.id }, data: ctrlData });
              updateCount++;
            } else if (ctrlData.fuente || ctrlData.medio || ctrlData.individuo) {
              await tx.control.create({ data: { peligroId: targetPeligroId, ...ctrlData } });
              insertCount++;
            }
          }

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
              updateCount++;
            } else if (evalData.nivelDeficiencia !== null || evalData.nivelExposicion !== null || evalData.nivelConsecuencia !== null) {
              await tx.evaluacion.create({ data: { peligroId: targetPeligroId, ...evalData } });
              insertCount++;
            }
          }

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
              updateCount++;
            } else if (postData.nivelDeficiencia !== null || postData.nivelExposicion !== null || postData.nivelConsecuencia !== null) {
              await tx.evaluacionPost.create({ data: { peligroId: targetPeligroId, ...postData } });
              insertCount++;
            }
          }

          const existingCrit = existingPel?.criterio;
          if (!isCriterioEqual(existingCrit, pel.criterios)) {
            const critData = {
              numExpuestos: normNum(pel.criterios?.num_expuestos),
              peorConsecuencia: normStr(pel.criterios?.peor_consecuencia) || null,
              requisitoLegal: normBool(pel.criterios?.requisito_legal),
            };
            if (existingCrit) {
              await tx.criterio.update({ where: { id: existingCrit.id }, data: critData });
              updateCount++;
            } else if (critData.numExpuestos !== null || critData.peorConsecuencia || critData.requisitoLegal) {
              await tx.criterio.create({ data: { peligroId: targetPeligroId, ...critData } });
              insertCount++;
            }
          }

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
              updateCount++;
            } else if (intervData.eliminacion || intervData.sustitucion || intervData.controlesIngenieria || intervData.controlesAdministrativos || intervData.epp || intervData.responsable || intervData.fechaEjecucion) {
              await tx.intervencion.create({ data: { peligroId: targetPeligroId, ...intervData } });
              insertCount++;
            }
          }
        }
      }
    }
  }

  const totalMutations = insertCount + updateCount + deleteCount;
  if (totalMutations > 0) {
    await tx.matriz.update({
      where: { id: matrixId },
      data: { updatedAt: new Date() },
    });
    updateCount++;
  }

  return { selectCount, insertCount, updateCount, deleteCount, total: selectCount + insertCount + updateCount + deleteCount };
}

async function benchmark() {
  console.log('=== SPRINT 3 SCENARIOS BENCHMARK ON LARGEST MATRIX ===\n');

  // Find largest matrix
  const allMatrices = await prisma.matriz.findMany({
    where: { deletedAt: null },
    select: { id: true, area: true },
  });

  let largestMatrix = null;
  let maxHazards = -1;

  for (const m of allMatrices) {
    const full = await loadFullMatrix(m.id);
    let hCount = 0;
    for (const p of full.procesos) {
      for (const z of p.zonas) {
        for (const a of z.actividades) {
          hCount += a.peligros.length;
        }
      }
    }
    if (hCount > maxHazards) {
      maxHazards = hCount;
      largestMatrix = full;
    }
  }

  console.log(`Largest Matrix: "${largestMatrix.area}" (ID: ${largestMatrix.id})`);
  console.log(`Hazards: ${maxHazards}, Processes: ${largestMatrix.procesos.length}`);

  const scenarios = [
    {
      name: 'Scenario A: No-op save',
      modify: (incoming) => {}, // no change
    },
    {
      name: 'Scenario B: One text field (hazard description)',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].descripcion += ' (BENCHMARK_EDIT)';
      },
    },
    {
      name: 'Scenario C: One evaluation (ND change)',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].evaluacion.nd = 10;
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].evaluacion.nr = 1000;
      },
    },
    {
      name: 'Scenario D: One control field (fuente)',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].controles.fuente += ' (NUEVO_CONTROL)';
      },
    },
    {
      name: 'Scenario E: One intervention field (eliminacion)',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].intervencion.eliminacion = 'Barrera de contención física';
      },
    },
    {
      name: 'Scenario F: Add one hazard',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros.push({
          id: 'r-bench123',
          descripcion: 'Peligro temporal benchmark',
          clasificacion: 'Físico',
          efectos: 'Fatiga auditiva',
          orden: 99,
          controles: { fuente: 'Aislamiento' },
        });
      },
    },
    {
      name: 'Scenario G: Delete one hazard',
      modify: (incoming) => {
        incoming.procesos[0].zonas[0].actividades[0].peligros.pop();
      },
    },
    {
      name: 'Scenario H: Multi-edit (metadata + activity + hazard + control)',
      modify: (incoming) => {
        incoming.responsable = 'Responsable SST Modificado';
        incoming.procesos[0].zonas[0].actividades[0].descripcion = 'Nueva desc actividad';
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].descripcion += ' (EDIT_MULTI)';
        incoming.procesos[0].zonas[0].actividades[0].peligros[0].controles.fuente = 'Control multi-edit';
      },
    },
  ];

  const reportTable = [];

  for (const sc of scenarios) {
    const incoming = mapPersistedToIncoming(largestMatrix);
    sc.modify(incoming);

    const startLogs = await prisma.activityLog.count();
    const t0 = process.hrtime.bigint();

    // Execute within transaction and ROLLBACK at end to safely measure without modifying institutional data!
    let opsStats = null;
    try {
      await prisma.$transaction(async (tx) => {
        opsStats = await runDifferentialSyncWithStats(tx, largestMatrix.id, incoming, largestMatrix);
        // Force rollback
        throw new Error('ROLLBACK_BENCHMARK');
      });
    } catch (e) {
      if (e.message !== 'ROLLBACK_BENCHMARK') throw e;
    }

    const t1 = process.hrtime.bigint();
    const durationMs = Number(t1 - t0) / 1e6;
    const endLogs = await prisma.activityLog.count();

    reportTable.push({
      Scenario: sc.name,
      SELECT: opsStats.selectCount,
      INSERT: opsStats.insertCount,
      UPDATE: opsStats.updateCount,
      DELETE: opsStats.deleteCount,
      'Activity Logs': opsStats.insertCount + opsStats.updateCount + opsStats.deleteCount, // would-be logs in commit
      Total_Queries: opsStats.total,
      'Duration (ms)': `${durationMs.toFixed(2)} ms`,
    });
  }

  console.table(reportTable);
  console.log('\nJSON output for report:');
  console.log(JSON.stringify(reportTable, null, 2));
}

benchmark()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
