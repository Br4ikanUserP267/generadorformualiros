const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeClasificacion(val) {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim().replace(/\s+/g, ' ')
  if (!trimmed || /^\d+$/.test(trimmed)) return null

  const clean = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  if (clean.includes('BIOMEC') || clean.includes('ERGONOM')) return 'BIOMECÁNICO'
  if (clean.startsWith('BIO')) return 'BIOLÓGICO'
  if (clean.includes('FISI') || clean.includes('FISIC')) return 'FÍSICO'
  if (clean.startsWith('QUIM')) return 'QUÍMICO'
  if (clean.startsWith('PSICO')) return 'PSICOSOCIAL'
  if (clean.includes('TRANSIT')) return 'ACCIDENTES DE TRÁNSITO'
  if (clean.includes('MECANIC')) return 'MECÁNICO'
  if (clean.includes('ELECTR')) return 'ELÉCTRICO'
  if (clean.includes('LOCATIV')) return 'LOCATIVO'
  if (clean.includes('TECNOLOG')) return 'TECNOLÓGICO'
  if (clean.includes('ALTURA')) return 'TRABAJO EN ALTURAS'
  if (clean.includes('CONFINAD')) return 'ESPACIOS CONFINADOS'
  if (clean.includes('PUBLIC')) return 'PÚBLICO'
  if (clean.startsWith('CONDICION') || clean.startsWith('SEGURIDAD')) return 'CONDICIONES DE SEGURIDAD'
  if (clean.includes('NATURAL') || clean.includes('FENOMEN')) return 'FENÓMENOS NATURALES'

  return trimmed.toUpperCase()
}

async function run() {
  console.log('🚀 Normalizando con updateMany en Peligro...');
  
  // Get all unique values currently in peligro
  const distinctPels = await prisma.peligro.groupBy({
    by: ['clasificacion'],
  });

  for (const d of distinctPels) {
    const rawVal = d.clasificacion;
    const target = normalizeClasificacion(rawVal);
    if (rawVal !== target) {
      console.log(`Updating "${rawVal}" -> "${target}"`);
      await prisma.peligro.updateMany({
        where: { clasificacion: rawVal },
        data: { clasificacion: target }
      });
    }
  }

  // Same for PeligroCatalogo
  const distinctCats = await prisma.peligroCatalogo.groupBy({
    by: ['clasificacion'],
  });

  for (const d of distinctCats) {
    const rawVal = d.clasificacion;
    const target = normalizeClasificacion(rawVal) || 'BIOLÓGICO';
    if (rawVal !== target) {
      console.log(`Updating Catalogo "${rawVal}" -> "${target}"`);
      await prisma.peligroCatalogo.updateMany({
        where: { clasificacion: rawVal },
        data: { clasificacion: target }
      });
    }
  }

  console.log('✅ Finalizado con éxito.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
