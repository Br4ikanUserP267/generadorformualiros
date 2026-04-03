# Sistema de Matriz de Riesgos

## Descripción general

El Sistema de Matriz de Riesgos es una plataforma para la gestión institucional de riesgos operativos, asistenciales y administrativos. Permite centralizar la identificación de peligros, la valoración de riesgos, la definición de controles y el seguimiento documental en un solo entorno de trabajo.

Su diseño prioriza la trazabilidad, la consistencia de la información y la generación de reportes en formatos de uso organizacional.

## Propósito del proyecto y organización objetivo

Este proyecto fue desarrollado para apoyar la operación de la Clínica Santa María S.A.S. en la administración de matrices de riesgos, facilitando procesos de control interno, gestión documental y apoyo a auditorías.

El propósito principal es estandarizar la forma en que se registran y actualizan los riesgos de la organización, reduciendo la dispersión de información y fortaleciendo la toma de decisiones basada en evidencia.

## Módulos funcionales disponibles

### 1. Acceso a la plataforma

Permite el ingreso de usuarios autorizados al entorno de trabajo institucional.

Capacidades generales:

- Inicio de acceso al sistema.
- Cierre de sesión desde la interfaz.

### 2. Dashboard de matrices

Consolida la información general y el estado de las matrices creadas.

Capacidades generales:

- Visualizar matrices registradas.
- Buscar y filtrar información.
- Consultar indicadores resumidos.
- Crear nuevas matrices.
- Duplicar y eliminar registros de trabajo.

### 3. Editor de matriz

Es el módulo operativo central para la construcción y mantenimiento de cada matriz.

Capacidades generales:

- Crear y actualizar la estructura de trabajo por procesos, zonas y actividades.
- Registrar peligros, efectos y controles.
- Documentar criterios de evaluación e intervenciones.
- Gestionar el contenido técnico de cada matriz de forma continua.

### 4. Previsualización

Brinda una vista de revisión antes de la salida documental final.

Capacidades generales:

- Revisar la matriz en formato tabular.
- Validar consistencia y completitud de la información.

### 5. Exportación de información

Permite generar documentos en formato de hoja de cálculo para circulación institucional.

Capacidades generales:

- Exportar matrices completas.
- Conservar estructura y formato de presentación.

### 6. Gestión de adjuntos

Permite asociar evidencia documental a los registros de trabajo.

Capacidades generales:

- Cargar archivos de soporte.
- Vincular adjuntos a la matriz correspondiente.

## Tecnologías y stack general

El sistema está construido con un stack web moderno orientado a productividad, mantenibilidad y escalabilidad.

- Framework principal: Next.js.
- Lenguaje: TypeScript.
- Biblioteca de interfaz: React.
- Base de datos: PostgreSQL.
- Capa de acceso a datos: Prisma.
- Estilos de interfaz: Tailwind CSS.
- Despliegue y contenedorización: Docker y Docker Compose.

## Estructura general del proyecto

La solución se organiza por dominios funcionales para facilitar su evolución.

- app: vistas y composición de páginas de la aplicación.
- components: componentes reutilizables de interfaz y módulos visuales.
- lib: utilidades y servicios compartidos.
- pages: endpoints de backend de la aplicación.
- prisma: modelo y migraciones de base de datos.
- public: recursos estáticos y archivos públicos.
- docs: documentación complementaria del proyecto.

## Instalación y configuración básica

### Requisitos previos

- Node.js 20 o superior.
- npm.
- Instancia de PostgreSQL disponible.

### Pasos de instalación local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno del proyecto en un archivo local de entorno, de acuerdo con el estándar interno del equipo.

3. Preparar la base de datos y generar artefactos de acceso a datos:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

### Ejecución en contenedores

También es posible iniciar el proyecto mediante contenedores:

```bash
docker-compose up -d --build
```

## Roles de usuario y capacidades generales

El sistema contempla perfiles de uso con enfoque operativo y de supervisión. A nivel general, las capacidades funcionales incluyen:

- Consultar matrices e indicadores.
- Crear y actualizar contenido técnico.
- Revisar información consolidada.
- Exportar reportes para gestión institucional.

La asignación específica de responsabilidades se define según la política organizacional y los lineamientos internos de operación.

## Próximamente: Matrices de Calidad

El módulo de Matrices de Calidad se encuentra previsto como siguiente etapa funcional del sistema y estará disponible próximamente.

Su incorporación ampliará el alcance de la plataforma, complementando la gestión de riesgos con un enfoque integrado de calidad, continuidad y mejora institucional.
