-- Database schema for Riesgos application
-- PostgreSQL-compatible DDL

-- Drop existing tables (safe for development)
DROP TABLE IF EXISTS archivos CASCADE;
DROP TABLE IF EXISTS riesgos CASCADE;
DROP TABLE IF EXISTS clasificaciones CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Users (optional, for responsables / autenticación)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  cargo VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Areas / Procesos (optional lookup)
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clasificaciones (p. ej. Biológico, Químico...)
CREATE TABLE clasificaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Riesgos (main table)
CREATE TABLE riesgos (
  id SERIAL PRIMARY KEY,
  proceso VARCHAR(200) NOT NULL,
  zona VARCHAR(200) NOT NULL,
  actividad TEXT,
  tarea TEXT,
  cargo VARCHAR(150),
  rutinario BOOLEAN DEFAULT true,
  clasificacion_id INTEGER REFERENCES clasificaciones(id) ON DELETE SET NULL,
  clasificacion VARCHAR(100), -- denormalized name for convenience
  peligro_desc TEXT NOT NULL,
  efectos TEXT NOT NULL,
  deficiencia INTEGER DEFAULT 0,
  exposicion INTEGER DEFAULT 0,
  consecuencia INTEGER DEFAULT 0,
  controles TEXT,
  intervencion TEXT,
  fecha DATE,
  fecha_ejecucion DATE,
  seguimiento TEXT,
  fuente TEXT,
  medio TEXT,
  individuo VARCHAR(200),
  probabilidad INTEGER,
  interpretacion_probabilidad VARCHAR(60),
  nivel_riesgo INTEGER,
  interpretacion_nivel_riesgo VARCHAR(10),
  aceptabilidad VARCHAR(100),
  num_expuestos INTEGER,
  peor_consecuencia TEXT,
  requisito_legal VARCHAR(100),
  senalizacion VARCHAR(200),
  advertencia TEXT,
  control_eliminacion TEXT,
  control_sustitucion TEXT,
  control_ingenieria TEXT,
  control_admin TEXT,
  epp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_riesgos_proceso ON riesgos(proceso);
CREATE INDEX idx_riesgos_zona ON riesgos(zona);
CREATE INDEX idx_riesgos_clasificacion ON riesgos(clasificacion_id);

-- Archivos adjuntos relacionados a un riesgo
CREATE TABLE archivos (
  id VARCHAR(64) PRIMARY KEY,
  riesgo_id INTEGER REFERENCES riesgos(id) ON DELETE CASCADE,
  nombre VARCHAR(300) NOT NULL,
  tipo VARCHAR(120),
  tamano INTEGER,
  url TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_archivos_riesgo ON archivos(riesgo_id);

-- Example: seed some classifications
INSERT INTO clasificaciones (nombre) VALUES
('Biológico'),('Químico'),('Físico'),('Mecánico'),('Ergonómico'),('Eléctrico'),('Psicosocial'),('Locativo'),('Natural')
ON CONFLICT DO NOTHING;

-- Notes:
-- - This schema is PostgreSQL-oriented. For MySQL adjust TIMESTAMP and serial types.
-- - The application may denormalize `clasificacion` text for backwards compatibility with existing data.
-- - Consider adding a `usuarios` FK to `riesgos.individuo` if you manage users.
-- - Add constraints/triggers for updating `updated_at` timestamps in production.
