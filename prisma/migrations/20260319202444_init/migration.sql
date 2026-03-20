-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrices" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "area" TEXT,
    "responsable" TEXT,
    "fecha_elaboracion" TIMESTAMP(3),
    "fecha_actualizacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procesos" (
    "id" TEXT NOT NULL,
    "matriz_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tareas" TEXT,
    "cargo" TEXT,
    "rutinario" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peligros" (
    "id" TEXT NOT NULL,
    "actividad_id" TEXT NOT NULL,
    "descripcion" TEXT,
    "clasificacion" TEXT,
    "efectos_posibles" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "peligros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles" (
    "id" TEXT NOT NULL,
    "peligro_id" TEXT NOT NULL,
    "fuente" TEXT,
    "medio" TEXT,
    "individuo" TEXT,

    CONSTRAINT "controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "peligro_id" TEXT NOT NULL,
    "nivel_deficiencia" INTEGER,
    "nivel_exposicion" INTEGER,
    "nivel_probabilidad" INTEGER,
    "interp_probabilidad" TEXT,
    "nivel_consecuencia" INTEGER,
    "nivel_riesgo" INTEGER,
    "interp_riesgo" TEXT,
    "aceptabilidad" TEXT,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios" (
    "id" TEXT NOT NULL,
    "peligro_id" TEXT NOT NULL,
    "num_expuestos" INTEGER,
    "peor_consecuencia" TEXT,
    "requisito_legal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "criterios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervenciones" (
    "id" TEXT NOT NULL,
    "peligro_id" TEXT NOT NULL,
    "eliminacion" TEXT,
    "sustitucion" TEXT,
    "controles_ingenieria" TEXT,
    "controles_administrativos" TEXT,
    "epp" TEXT,
    "responsable" TEXT,
    "fecha_ejecucion" TIMESTAMP(3),

    CONSTRAINT "intervenciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" TEXT NOT NULL,
    "matriz_id" TEXT NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre_almacenado" TEXT NOT NULL,
    "tipo_mime" TEXT,
    "tamanio_bytes" INTEGER,
    "url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "controles_peligro_id_key" ON "controles"("peligro_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_peligro_id_key" ON "evaluaciones"("peligro_id");

-- CreateIndex
CREATE UNIQUE INDEX "criterios_peligro_id_key" ON "criterios"("peligro_id");

-- CreateIndex
CREATE UNIQUE INDEX "intervenciones_peligro_id_key" ON "intervenciones"("peligro_id");

-- AddForeignKey
ALTER TABLE "matrices" ADD CONSTRAINT "matrices_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_matriz_id_fkey" FOREIGN KEY ("matriz_id") REFERENCES "matrices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peligros" ADD CONSTRAINT "peligros_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterios" ADD CONSTRAINT "criterios_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenciones" ADD CONSTRAINT "intervenciones_peligro_id_fkey" FOREIGN KEY ("peligro_id") REFERENCES "peligros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_matriz_id_fkey" FOREIGN KEY ("matriz_id") REFERENCES "matrices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
