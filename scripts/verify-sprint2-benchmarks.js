const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import helpers logic
function interpProbabilidad(np) {
  if (!np) return { label: '—', color: '#9CA3AF' };
  if (np <= 4) return { label: 'Bajo', color: '#16a34a' };
  if (np <= 8) return { label: 'Medio', color: '#ca8a04' };
  if (np <= 20) return { label: 'Alto', color: '#ea580c' };
  return { label: 'Muy Alto', color: '#dc2626' };
}

function interpNivelRiesgo(nr) {
  if (!nr) return { label: '', color: '#9CA3AF' };
  if (nr <= 20) return { label: 'IV', color: '#16a34a' };
  if (nr <= 120) return { label: 'III', color: '#16a34a' };
  if (nr <= 500) return { label: 'II', color: '#ca8a04' };
  return { label: 'I', color: '#dc2626' };
}

function aceptabilidadFromNivel(label) {
  if (!label) return '';
  switch (label) {
    case 'IV':
      return 'Aceptable';
    case 'III':
      return 'Mejorable';
    case 'II':
      return 'Aceptable con Control Especifico';
    case 'I':
      return 'No Aceptable';
    default:
      return '';
  }
}

function applyHazardFieldUpdate(hazard, path, value) {
  const updated = { ...hazard };

  if (path.length === 1) {
    updated[path[0]] = value;
  } else if (path.length === 2) {
    updated[path[0]] = {
      ...(updated[path[0]] || {}),
      [path[1]]: value,
    };
  } else {
    let target = updated;
    for (let i = 0; i < path.length - 1; i++) {
      target[path[i]] = { ...(target[path[i]] || {}) };
      target = target[path[i]];
    }
    target[path[path.length - 1]] = value;
  }

  if (path[0] === 'evaluacion' && updated.evaluacion) {
    const nd = Number(updated.evaluacion.nd || 0);
    const ne = Number(updated.evaluacion.ne || 0);
    const nc = Number(updated.evaluacion.nc || 0);
    const np = !nd || !ne ? 0 : nd * ne;
    const nr = !np || !nc ? 0 : np * nc;
    const nivelLabel = interpNivelRiesgo(nr).label;

    updated.evaluacion = {
      ...updated.evaluacion,
      np,
      nr,
      interp_np: interpProbabilidad(np).label,
      interp_nr: nivelLabel,
      nivel_riesgo: nivelLabel,
      aceptabilidad: nivelLabel ? aceptabilidadFromNivel(nivelLabel) : '',
    };
  }

  if (path[0] === 'evaluacionPost' && updated.evaluacionPost) {
    const ep = updated.evaluacionPost || {};
    const ndP = Number(ep.nd || 0);
    const neP = Number(ep.ne || 0);
    const ncP = Number(ep.nc || 0);
    const npP = !ndP || !neP ? 0 : ndP * neP;
    const nrP = !npP || !ncP ? 0 : npP * ncP;
    const nivelLabelP = interpNivelRiesgo(nrP).label;

    updated.evaluacionPost = {
      ...ep,
      np: npP,
      nr: nrP,
      interp_np: interpProbabilidad(npP).label,
      interp_nr: nivelLabelP,
      nivel_riesgo: nivelLabelP,
      aceptabilidad: nivelLabelP ? aceptabilidadFromNivel(nivelLabelP) : '',
    };
  }

  return updated;
}

function updateHazardInMatrix(matrix, selected, peligroId, updater) {
  if (!matrix || !matrix.procesos) return matrix;

  let changed = false;
  const newProcesos = matrix.procesos.map((proc) => {
    if (selected.procesoId && proc.id !== selected.procesoId) return proc;

    let procChanged = false;
    const newZonas = (proc.zonas || []).map((zona) => {
      if (selected.zonaId && zona.id !== selected.zonaId) return zona;

      let zonaChanged = false;
      const newActividades = (zona.actividades || []).map((act) => {
        if (selected.actividadId && act.id !== selected.actividadId) return act;

        const peligros = act.peligros || [];
        const pIdx = peligros.findIndex((p) => p.id === peligroId);
        if (pIdx === -1) return act;

        const oldP = peligros[pIdx];
        const newP = updater(oldP);
        if (oldP === newP) return act;

        const newPeligros = [...peligros];
        newPeligros[pIdx] = newP;
        zonaChanged = true;
        return {
          ...act,
          peligros: newPeligros,
        };
      });

      if (!zonaChanged) return zona;
      procChanged = true;
      return {
        ...zona,
        actividades: newActividades,
      };
    });

    if (!procChanged) return proc;
    changed = true;
    return {
      ...proc,
      zonas: newZonas,
    };
  });

  if (!changed) return matrix;

  return {
    ...matrix,
    procesos: newProcesos,
  };
}

async function run() {
  console.log('=== SPRINT 2 PERFORMANCE & INTEGRITY BENCHMARKS ===\n');

  // 1. DB Integrity counts
  console.log('1. Fetching Database Counts...');
  const [
    matricesTotal,
    matricesActive,
    procesosCount,
    zonasCount,
    actividadesCount,
    peligrosCount,
    controlesCount,
    evaluacionesCount,
    criteriosCount,
    intervencionesCount,
    activityLogsCount,
  ] = await Promise.all([
    prisma.matriz.count(),
    prisma.matriz.count({ where: { deletedAt: null } }),
    prisma.proceso.count(),
    prisma.zona.count(),
    prisma.actividad.count(),
    prisma.peligro.count(),
    prisma.control.count(),
    prisma.evaluacion.count(),
    prisma.criterio.count(),
    prisma.intervencion.count(),
    prisma.activityLog.count(),
  ]);

  const dbCounts = {
    matricesTotal,
    matricesActive,
    procesos: procesosCount,
    zonas: zonasCount,
    actividades: actividadesCount,
    peligros: peligrosCount,
    controles: controlesCount,
    evaluaciones: evaluacionesCount,
    criterios: criteriosCount,
    intervenciones: intervencionesCount,
    activityLogs: activityLogsCount,
  };
  console.log('Database Counts:', JSON.stringify(dbCounts, null, 2));

  // 2. Fetch largest matrix
  console.log('\n2. Fetching Largest Matrix...');
  const matricesWithCounts = await prisma.matriz.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      area: true,
      _count: {
        select: {
          procesos: true,
        },
      },
    },
  });

  // Find the matrix with the most hazards by loading their processes
  let largestMatrix = null;
  let maxHazards = -1;

  for (const m of matricesWithCounts) {
    const full = await prisma.matriz.findUnique({
      where: { id: m.id },
      include: {
        procesos: {
          include: {
            zonas: {
              include: {
                actividades: {
                  include: {
                    peligros: {
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

  const matrixJson = JSON.stringify(largestMatrix);
  const matrixSizeKb = (Buffer.byteLength(matrixJson, 'utf8') / 1024).toFixed(2);
  console.log(`Largest Matrix: "${largestMatrix.nombre}" (ID: ${largestMatrix.id})`);
  console.log(`Processes: ${largestMatrix.procesos.length}, Total Hazards: ${maxHazards}, Payload Size: ${matrixSizeKb} KB`);

  // Target a specific hazard inside the matrix
  const proc = largestMatrix.procesos[0];
  const zona = proc.zonas[0];
  const act = zona.actividades[0];
  const targetHazard = act.peligros[0];
  const targetId = targetHazard.id;
  const selectedContext = { procesoId: proc.id, zonaId: zona.id, actividadId: act.id };

  console.log(`Targeting hazard: "${targetHazard.descripcion || targetHazard.id}" in activity "${act.nombre}" (${act.peligros.length} hazards in activity)`);

  // 3. Benchmarks comparison: Old (JSON clone) vs New (Targeted update)
  const iterations = 100;

  // Benchmark A: Plain Text Update
  console.log(`\n--- BENCHMARK A: Text input update (x${iterations}) ---`);
  // Old
  const startOldA = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const cloned = JSON.parse(JSON.stringify(largestMatrix));
    const p = cloned.procesos[0].zonas[0].actividades[0].peligros[0];
    p.descripcion = `Updated text ${i}`;
  }
  const endOldA = process.hrtime.bigint();
  const oldDurationA = Number(endOldA - startOldA) / 1e6 / iterations;

  // New
  let currentMatrix = largestMatrix;
  const startNewA = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    currentMatrix = updateHazardInMatrix(currentMatrix, selectedContext, targetId, (p) =>
      applyHazardFieldUpdate(p, ['descripcion'], `Updated text ${i}`)
    );
  }
  const endNewA = process.hrtime.bigint();
  const newDurationA = Number(endNewA - startNewA) / 1e6 / iterations;

  console.log(`Old JSON.parse/stringify clone: ${oldDurationA.toFixed(3)} ms per edit`);
  console.log(`New Targeted immutable update:  ${newDurationA.toFixed(3)} ms per edit`);
  console.log(`Speedup: ${(oldDurationA / newDurationA).toFixed(1)}x faster`);

  // Benchmark B: ND Change (Evaluation recalculation)
  console.log(`\n--- BENCHMARK B: ND change with GTC 45 recalculation (x${iterations}) ---`);
  const startOldB = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const cloned = JSON.parse(JSON.stringify(largestMatrix));
    const p = cloned.procesos[0].zonas[0].actividades[0].peligros[0];
    if (!p.evaluacion) p.evaluacion = {};
    p.evaluacion.nd = 6;
    const nd = 6, ne = Number(p.evaluacion.ne || 2), nc = Number(p.evaluacion.nc || 25);
    const np = nd * ne;
    const nr = np * nc;
    const lvl = interpNivelRiesgo(nr).label;
    p.evaluacion.np = np;
    p.evaluacion.nr = nr;
    p.evaluacion.interp_nr = lvl;
    p.evaluacion.nivel_riesgo = lvl;
    p.evaluacion.aceptabilidad = aceptabilidadFromNivel(lvl);
  }
  const endOldB = process.hrtime.bigint();
  const oldDurationB = Number(endOldB - startOldB) / 1e6 / iterations;

  const startNewB = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    currentMatrix = updateHazardInMatrix(currentMatrix, selectedContext, targetId, (p) =>
      applyHazardFieldUpdate(p, ['evaluacion', 'nd'], 6)
    );
  }
  const endNewB = process.hrtime.bigint();
  const newDurationB = Number(endNewB - startNewB) / 1e6 / iterations;

  console.log(`Old JSON.parse/stringify clone: ${oldDurationB.toFixed(3)} ms per edit`);
  console.log(`New Targeted immutable update:  ${newDurationB.toFixed(3)} ms per edit`);
  console.log(`Speedup: ${(oldDurationB / newDurationB).toFixed(1)}x faster`);

  // Benchmark C: Control edit
  console.log(`\n--- BENCHMARK C: Existing Control edit (x${iterations}) ---`);
  const startOldC = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const cloned = JSON.parse(JSON.stringify(largestMatrix));
    const p = cloned.procesos[0].zonas[0].actividades[0].peligros[0];
    if (!p.controles) p.controles = {};
    p.controles.fuente = `Control fuente ${i}`;
  }
  const endOldC = process.hrtime.bigint();
  const oldDurationC = Number(endOldC - startOldC) / 1e6 / iterations;

  const startNewC = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    currentMatrix = updateHazardInMatrix(currentMatrix, selectedContext, targetId, (p) =>
      applyHazardFieldUpdate(p, ['controles', 'fuente'], `Control fuente ${i}`)
    );
  }
  const endNewC = process.hrtime.bigint();
  const newDurationC = Number(endNewC - startNewC) / 1e6 / iterations;

  console.log(`Old JSON.parse/stringify clone: ${oldDurationC.toFixed(3)} ms per edit`);
  console.log(`New Targeted immutable update:  ${newDurationC.toFixed(3)} ms per edit`);
  console.log(`Speedup: ${(oldDurationC / newDurationC).toFixed(1)}x faster`);

  // Benchmark D: Intervention field edit
  console.log(`\n--- BENCHMARK D: Intervention field edit (x${iterations}) ---`);
  const startOldD = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const cloned = JSON.parse(JSON.stringify(largestMatrix));
    const p = cloned.procesos[0].zonas[0].actividades[0].peligros[0];
    if (!p.intervenciones) p.intervenciones = {};
    p.intervenciones.eliminacion = `Eliminacion ${i}`;
  }
  const endOldD = process.hrtime.bigint();
  const oldDurationD = Number(endOldD - startOldD) / 1e6 / iterations;

  const startNewD = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    currentMatrix = updateHazardInMatrix(currentMatrix, selectedContext, targetId, (p) =>
      applyHazardFieldUpdate(p, ['intervenciones', 'eliminacion'], `Eliminacion ${i}`)
    );
  }
  const endNewD = process.hrtime.bigint();
  const newDurationD = Number(endNewD - startNewD) / 1e6 / iterations;

  console.log(`Old JSON.parse/stringify clone: ${oldDurationD.toFixed(3)} ms per edit`);
  console.log(`New Targeted immutable update:  ${newDurationD.toFixed(3)} ms per edit`);
  console.log(`Speedup: ${(oldDurationD / newDurationD).toFixed(1)}x faster`);

  // 4. Reference Equality Checks (Object Identity Preservation)
  console.log('\n4. Checking Referential Stability (===) on Untouched Branches...');
  const baseMatrix = largestMatrix;
  const nextMatrix = updateHazardInMatrix(baseMatrix, selectedContext, targetId, (p) =>
    applyHazardFieldUpdate(p, ['descripcion'], 'New tested description')
  );

  const tests = [
    {
      name: 'Untouched Process 1 === Old Process 1',
      pass: baseMatrix.procesos.length > 1 ? baseMatrix.procesos[1] === nextMatrix.procesos[1] : true,
    },
    {
      name: 'Untouched Zone 1 in Process 0 === Old Zone 1',
      pass: proc.zonas.length > 1 ? proc.zonas[1] === nextMatrix.procesos[0].zonas[1] : true,
    },
    {
      name: 'Untouched Activity 1 in Zone 0 === Old Activity 1',
      pass: zona.actividades.length > 1 ? zona.actividades[1] === nextMatrix.procesos[0].zonas[0].actividades[1] : true,
    },
    {
      name: 'Untouched Hazard 1 in Activity 0 === Old Hazard 1',
      pass: act.peligros.length > 1 ? act.peligros[1] === nextMatrix.procesos[0].zonas[0].actividades[0].peligros[1] : true,
    },
    {
      name: 'Target Hazard !== Old Target Hazard (modified correctly)',
      pass: act.peligros[0] !== nextMatrix.procesos[0].zonas[0].actividades[0].peligros[0],
    },
    {
      name: 'Target Hazard description updated correctly',
      pass: nextMatrix.procesos[0].zonas[0].actividades[0].peligros[0].descripcion === 'New tested description',
    },
  ];

  tests.forEach((t) => {
    console.log(`  [${t.pass ? 'PASS' : 'FAIL'}] ${t.name}`);
  });

  // 5. GTC 45 Calculation Invariance
  console.log('\n5. Validating GTC 45 Risk Calculations Invariance...');
  const gtcTestCases = [
    { name: 'Level I (Muy Alto)', nd: 10, ne: 4, nc: 100, expNp: 40, expInterpNp: 'Muy Alto', expNr: 4000, expNivel: 'I', expAcept: 'No Aceptable' },
    { name: 'Level II (Alto)', nd: 6, ne: 3, nc: 25, expNp: 18, expInterpNp: 'Alto', expNr: 450, expNivel: 'II', expAcept: 'Aceptable con Control Especifico' },
    { name: 'Level III (Moderado)', nd: 2, ne: 3, nc: 10, expNp: 6, expInterpNp: 'Medio', expNr: 60, expNivel: 'III', expAcept: 'Mejorable' },
    { name: 'Level IV (Bajo)', nd: 2, ne: 1, nc: 10, expNp: 2, expInterpNp: 'Bajo', expNr: 20, expNivel: 'IV', expAcept: 'Aceptable' },
  ];

  let allGtcPass = true;
  for (const tc of gtcTestCases) {
    const dummyHazard = {
      id: 'test-h',
      evaluacion: { nd: tc.nd, ne: tc.ne, nc: tc.nc },
    };
    const res = applyHazardFieldUpdate(dummyHazard, ['evaluacion', 'nd'], tc.nd);
    const ev = res.evaluacion;

    const pass =
      ev.np === tc.expNp &&
      ev.interp_np === tc.expInterpNp &&
      ev.nr === tc.expNr &&
      ev.nivel_riesgo === tc.expNivel &&
      ev.aceptabilidad === tc.expAcept;

    if (!pass) allGtcPass = false;
    console.log(
      `  [${pass ? 'PASS' : 'FAIL'}] ${tc.name}: ND=${tc.nd}, NE=${tc.ne} -> NP=${ev.np} (${ev.interp_np}), NC=${tc.nc} -> NR=${ev.nr} (${ev.nivel_riesgo} / ${ev.aceptabilidad})`
    );
  }

  console.log(`\nOverall GTC 45 Invariance: ${allGtcPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('\n=== SUMMARY TABLE FOR REPORT ===');
  console.log(JSON.stringify({
    benchmarks: {
      textInput: { old: `${oldDurationA.toFixed(2)} ms`, new: `${newDurationA.toFixed(3)} ms`, speedup: `${(oldDurationA / newDurationA).toFixed(1)}x` },
      ndChange: { old: `${oldDurationB.toFixed(2)} ms`, new: `${newDurationB.toFixed(3)} ms`, speedup: `${(oldDurationB / newDurationB).toFixed(1)}x` },
      controlEdit: { old: `${oldDurationC.toFixed(2)} ms`, new: `${newDurationC.toFixed(3)} ms`, speedup: `${(oldDurationC / newDurationC).toFixed(1)}x` },
      interventionEdit: { old: `${oldDurationD.toFixed(2)} ms`, new: `${newDurationD.toFixed(3)} ms`, speedup: `${(oldDurationD / newDurationD).toFixed(1)}x` },
    },
    gtc45Validation: allGtcPass ? 'PASSED' : 'FAILED',
    dbCounts
  }, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
