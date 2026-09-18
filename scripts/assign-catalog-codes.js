const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PREFIX_MAP = {
  'BIOLÓGICO': 'BIO',
  'BIOMECÁNICO': 'BMC',
  'FÍSICO': 'FIS',
  'QUÍMICO': 'QUI',
  'PSICOSOCIAL': 'PSI',
  'CONDICIONES DE SEGURIDAD': 'SEG',
  'LOCATIVO': 'LOC',
  'MECÁNICO': 'MEC',
  'ELÉCTRICO': 'ELE',
  'TECNOLÓGICO': 'TEC',
  'ACCIDENTES DE TRÁNSITO': 'TRA',
  'PÚBLICO': 'PUB',
  'TRABAJO EN ALTURAS': 'ALT',
  'ESPACIOS CONFINADOS': 'ESP',
  'FENÓMENOS NATURALES': 'NAT',
};

async function main() {
  console.log('=== Assigning Sequential Codes to Existing peligros_catalogo Records ===');

  const items = await prisma.peligroCatalogo.findMany({
    where: { deletedAt: null },
    orderBy: [{ clasificacion: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
  });

  console.log(`Found ${items.length} active catalog items.`);

  const counters = {};
  let updatedCount = 0;

  for (const item of items) {
    const clasif = item.clasificacion || 'BIOLÓGICO';
    const prefix = PREFIX_MAP[clasif] || 'PEL';

    if (!counters[prefix]) counters[prefix] = 0;
    counters[prefix]++;

    const code = `${prefix}-${String(counters[prefix]).padStart(2, '0')}`;

    await prisma.peligroCatalogo.update({
      where: { id: item.id },
      data: { codigo: code }
    });

    updatedCount++;
    console.log(`  [${item.clasificacion}] -> ${code}: ${item.descripcion.slice(0, 40)}...`);
  }

  console.log(`\nSuccessfully updated ${updatedCount} items with sequential reference codes.`);
}

main()
  .catch((err) => {
    console.error('Error assigning codes:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
