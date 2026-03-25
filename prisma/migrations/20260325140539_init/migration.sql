-- DropForeignKey
ALTER TABLE "actividades" DROP CONSTRAINT "actividades_zona_id_fkey";

-- DropForeignKey
ALTER TABLE "controles" DROP CONSTRAINT "controles_peligro_id_fkey";

-- DropForeignKey
ALTER TABLE "criterios" DROP CONSTRAINT "criterios_peligro_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluaciones" DROP CONSTRAINT "evaluaciones_peligro_id_fkey";

-- DropForeignKey
ALTER TABLE "intervenciones" DROP CONSTRAINT "intervenciones_peligro_id_fkey";

-- DropForeignKey
ALTER TABLE "peligros" DROP CONSTRAINT "peligros_actividad_id_fkey";

-- DropForeignKey
ALTER TABLE "procesos" DROP CONSTRAINT "procesos_matriz_id_fkey";

-- DropForeignKey
ALTER TABLE "zonas" DROP CONSTRAINT "zonas_proceso_id_fkey";

-- CreateTable
CREATE TABLE "riesgos" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riesgos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_matriz_id_fkey" FOREIGN KEY ("matriz_id") REFERENCES "matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peligros" ADD CONSTRAINT "peligros_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterios" ADD CONSTRAINT "criterios_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
