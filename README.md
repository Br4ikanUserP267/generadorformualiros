# Sistema de Matriz de Riesgos

## 1. Nombre y descripción general del sistema

### Nombre completo del sistema
Sistema de Matriz de Riesgos

### Propósito principal
La plataforma centraliza la gestión de matrices de riesgos para la organización. Su objetivo es permitir el registro, consulta, edición, evaluación, exportación y seguimiento de matrices de riesgo bajo una estructura jerárquica de procesos, zonas, actividades, peligros, controles, criterios e intervenciones.

El sistema está orientado a la operación documental y técnica de la matriz de riesgos institucional, con soporte para autenticación, persistencia en base de datos, adjuntos y exportación a Excel.

## 2. Módulos actuales del sistema

### Autenticación y acceso
El sistema cuenta con un módulo de acceso basado en sesión. La pantalla de entrada principal se encuentra en la ruta pública `/matriz-riesgos`. Desde allí el usuario puede iniciar sesión con credenciales y acceder al dashboard.

Funciones visibles:
- Formulario de inicio de sesión con correo y contraseña.
- Validación de credenciales contra la API del sistema.
- Redirección automática al dashboard después de iniciar sesión.
- Cierre de sesión desde la interfaz.

### Dashboard de matrices
El dashboard centraliza la consulta de matrices existentes y permite trabajar con ellas desde una vista resumen.

Funciones visibles:
- Listado de matrices registradas.
- Búsqueda por texto.
- Filtros por tipo y clasificación.
- Resumen de conteos por nivel de riesgo.
- Creación de una nueva matriz.
- Duplicación de una matriz existente.
- Eliminación lógica de matrices.
- Previsualización de una matriz.
- Descarga/exportación a Excel.

### Editor de matriz
Es el módulo operativo principal del sistema. Permite construir y mantener la matriz con una estructura jerárquica completa.

Estructura funcional:
- Matriz.
- Procesos.
- Zonas.
- Actividades.
- Peligros.

Capacidades del editor:
- Crear, editar y eliminar procesos.
- Crear, editar y eliminar zonas.
- Crear, editar y eliminar actividades.
- Registrar peligros por actividad.
- Diligenciar descripción, clasificación, efectos y controles existentes.
- Registrar criterios de evaluación y niveles de riesgo.
- Registrar intervenciones y responsables.
- Gestionar archivos adjuntos asociados a la matriz.
- Guardar, actualizar y exportar la matriz.

### Previsualización de matriz
El sistema incluye una vista de previsualización tabular para revisar la información antes de exportarla o validarla.

Funciones visibles:
- Visualización de la matriz en formato tabular.
- Columnas ampliadas para lectura de información técnica.
- Desplazamiento horizontal para matrices extensas.
- Representación visual de los niveles de riesgo.
- Vista útil para revisión y control de calidad.

### Exportación a Excel
La plataforma incorpora exportación estructurada a Excel con plantilla y formato institucional.

Funciones visibles:
- Exportación de matrices completas.
- Exportación con formato preservado.
- Mapeo de campos jerárquicos a columnas de hoja de cálculo.
- Colores asociados a la aceptabilidad del riesgo.
- Conservación de encabezados, anchos, celdas combinadas y estilos.
- Uso de plantilla institucional cuando está disponible en `public/templates/MATRIZ_IPVR_TEMPLATE.xlsx`.

### Adjuntos y carga de archivos
El sistema soporta la carga de archivos asociados a las matrices.

Funciones visibles:
- Subida de archivos desde la interfaz.
- Persistencia de archivos en disco.
- Asociación de adjuntos a la matriz correspondiente.
- Inclusión de archivos en el flujo de exportación.

### Integración de autocompletado con IA
Existe infraestructura backend para autocompletado con IA mediante un endpoint proxy.

Capacidades presentes:
- Recepción de prompts desde el frontend.
- Enrutamiento hacia un proveedor configurado por variables de entorno.
- Soporte para integración con Gemini u otros proveedores compatibles.

### Gestión de riesgos con persistencia relacional
El backend organiza la información de riesgos en una estructura relacional completa.

Capacidades visibles:
- Persistencia por matriz, proceso, zona, actividad y peligro.
- Relación de controles, evaluación, criterios e intervención por peligro.
- Soft delete en entidades principales.
- Consultas estructuradas para reconstruir el árbol de información en el frontend.

## 3. Tecnologías utilizadas

### Framework y lenguaje
- Next.js 16.1.6.
- React 19.2.4.
- TypeScript 5.7.3.

### Estilo e interfaz
- Tailwind CSS.
- PostCSS.
- Componentes UI basados en Radix UI.
- Lucide React para íconos.
- Sonner para notificaciones.
- next-themes para soporte visual temático.

### Persistencia y base de datos
- Prisma 5.22.0 como capa ORM.
- PostgreSQL como base de datos.
- Esquema relacional con entidades Usuario, Matriz, Proceso, Zona, Actividad, Peligro, Control, Evaluacion, Criterio, Intervencion y Archivo.

### Autenticación y sesiones
- Sesión basada en cookie HttpOnly llamada `auth_token`.
- Validación de sesión en middleware.
- Revalidación de sesión con endpoint `GET /api/auth/me`.
- Logout mediante endpoint `POST /api/auth/logout`.

### Exportación y documentos
- ExcelJS para exportación de hojas de cálculo.
- Sistema de plantilla Excel para conservar el formato institucional.

### Infraestructura y despliegue
- Docker.
- Docker Compose.
- Nginx como proxy inverso.
- Node.js 20 en contenedores de producción.

## 4. Arquitectura del proyecto

### Estructura general de carpetas
- `app/`: rutas de la interfaz principal construidas con App Router.
- `components/`: componentes visuales y funcionales reutilizables.
- `lib/`: utilidades compartidas, acceso a datos, autenticación y exportaciones.
- `pages/api/`: rutas backend tradicionales de Next.js para autenticación, riesgos, exportación, carga de archivos e IA.
- `prisma/`: esquema y migraciones de base de datos.
- `public/`: recursos estáticos y archivos subidos.
- `docs/`: documentación técnica adicional.

### Enrutamiento
El proyecto usa el sistema de rutas de Next.js.

Rutas relevantes identificadas:
- `/` redirige a `/matriz-riesgos`.
- `/matriz-riesgos` es la ruta pública de acceso y login.
- `/dashboard` es una vista protegida del dashboard.
- `/matriz/[id]` es el editor protegido de una matriz específica.
- `/matriz-riesgos/dashboard` y `/matriz-riesgos/matriz/[id]` son variantes protegidas equivalentes dentro de la misma base funcional.

### Autenticación y protección de rutas
La protección se implementa en varios niveles:

- El middleware bloquea rutas protegidas si no existe una sesión válida.
- La cookie `auth_token` se valida antes de permitir acceso a páginas y APIs protegidas.
- Los componentes protegidos usan un guard de interfaz para evitar que el contenido se renderice mientras se valida la sesión.
- El contexto de autenticación vuelve a verificar la sesión al cargar la página.
- Los requests que reciben `401 Unauthorized` se redirigen nuevamente a `/matriz-riesgos`.

Este enfoque evita que el dashboard o el editor se muestren siquiera de forma parcial cuando no hay sesión activa.

## 5. Instalación y configuración

### Requisitos previos
- Node.js 20 o superior.
- npm.
- Base de datos PostgreSQL.
- Opcional: Docker y Docker Compose para despliegue en contenedores.

### Instalación local
1. Instalar dependencias.

```bash
npm install
```

2. Configurar el archivo `.env.local` en la raíz del proyecto con al menos la conexión a base de datos.

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_base_datos"
```

3. Si se usará la integración de IA, agregar las variables correspondientes.

```env
GEMINI_KEY=tu_clave_gemini
# o bien
GEN_AI_KEY=tu_token
GEN_AI_ENDPOINT=https://tu-endpoint
```

4. Generar el cliente de Prisma.

```bash
npx prisma generate
```

5. Aplicar migraciones o sincronizar el esquema según el entorno de trabajo.

```bash
npx prisma migrate dev
```

6. Iniciar el entorno de desarrollo.

```bash
npm run dev
```

### Ejecución con Docker
El proyecto incluye configuración de contenedores para despliegue:
- `docker-compose.yaml`
- `Dockerfile`
- `Dockerfile.nginx`

El servicio principal expone la aplicación en el puerto `4597`.

```bash
docker-compose up -d --build
```

### Variables de entorno identificadas
- `DATABASE_URL`: conexión a PostgreSQL.
- `GEMINI_KEY`: clave para integración con proveedor Gemini.
- `GEN_AI_KEY`: token tipo bearer para proveedor generativo.
- `GEN_AI_ENDPOINT`: endpoint del proveedor generativo.
- `PORT`: puerto del contenedor en despliegue Docker.

## 6. Roles y permisos

El código no implementa un sistema formal de roles RBAC con permisos diferenciados. Lo que sí existe es un perfil funcional de autenticación basado en el campo `cargo` del usuario.

### Roles o perfiles observados
- `Director de Seguridad`: perfil principal que aparece en el flujo de autenticación de demostración.
- `Usuario`: valor de respaldo utilizado por el contexto cuando no se recibe un cargo explícito.

### Alcance de permisos actual
- El acceso al sistema se habilita únicamente con sesión válida.
- Una vez autenticado, el usuario puede consultar, editar, duplicar, exportar y eliminar matrices según la interfaz disponible.
- No se detectó una matriz separada de permisos por módulo en el código actual.

## 7. Módulos en desarrollo — Próximamente

### Matrices de Calidad
El siguiente paso funcional del sistema es el módulo de Matrices de Calidad. En el estado actual del repositorio no existe una implementación separada para este módulo, pero su incorporación forma parte natural de la evolución de la plataforma y estará disponible próximamente.

La intención de esta fase es ampliar el sistema desde la gestión de riesgos hacia una estructura complementaria para matrices de calidad, manteniendo el mismo enfoque institucional de:
- captura estructurada de información,
- trazabilidad documental,
- exportación a Excel,
- y control centralizado desde la misma plataforma.

## 8. Consideraciones de seguridad

### Protección de rutas
- Las rutas protegidas no se renderizan sin una sesión válida.
- El middleware valida la cookie de autenticación antes de permitir acceso a páginas o APIs protegidas.
- Los archivos estáticos y recursos públicos permanecen accesibles y no son bloqueados por la protección.

### Manejo de sesiones y tokens
- La sesión se almacena en una cookie HttpOnly llamada `auth_token`.
- El valor del token contiene datos de sesión serializados junto con expiración.
- La verificación se repite al cargar la aplicación y después de cada refresh.
- El cierre de sesión elimina la cookie y limpia el estado local.

### Protección de endpoints del backend
- Las rutas API protegidas devuelven `401 Unauthorized` cuando no existe una sesión válida.
- El frontend intercepta estas respuestas y redirige a `/matriz-riesgos`.
- Este comportamiento evita la visualización de dashboards vacíos o parcialmente cargados cuando la sesión está ausente o expirada.

## Estructura de alto nivel

```text
app/
components/
lib/
pages/api/
prisma/
public/
docs/
```

## Nota final

Este repositorio concentra una solución funcional de gestión de matriz de riesgos, con autenticación, persistencia relacional, interfaz de edición jerárquica y exportación institucional a Excel. La base técnica ya está preparada para ampliar el sistema con nuevos módulos sin alterar el flujo actual.
