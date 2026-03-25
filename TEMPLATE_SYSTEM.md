# Excel Template System Documentation

## Overview

The system now supports automatic cloning of Excel templates. Instead of building Excel files from scratch, it:

1. **Loads your template** from the public folder
2. **Preserves all formatting, structure, and merged cells** exactly as they appear
3. **Replaces only the data rows** with new risk information
4. **Maintains institutional formatting** (headers, info bars, colors, borders)

## Template Requirements

Your template Excel file should have:

### Structure (Starting Row 1)
- **Rows 1-5**: Header block (institution name, document title, code/version/date, spacing)
- **Rows 6-7**: Info bar (labels in row 6, values in row 7)
  - Area/Proceso, Responsable, Fecha Elaboración, Fecha Actualización
- **Row 8**: Column headers (table header)
- **Row 9+**: Data rows (these will be cleared and filled with new data)

### Columns (A-AE)
The template can have any columns, but the export logic maps data to these columns in order:

| Col | Name | Field |
|-----|------|-------|
| A | Proceso | proceso |
| B | Zona | zona |
| C | Actividades | actividad |
| D | Tareas | tarea |
| E | Cargo | cargo |
| F | Rutinario | rutinario (Sí/No) |
| G | Peligros | peligro_desc |
| H | Clasificación | clasificacion |
| I | Efectos | efectos |
| J | Controles Fuente | controles[fuente] |
| K | Controles Medio | controles[medio] |
| L | Controles Individuo | controles[individuo] |
| M | Nivel de Deficiencia | deficiencia |
| N | Nivel de Exposición | exposicion |
| O | Nivel de Probabilidad | nd × ne |
| P | Nivel de Consecuencia | consecuencia |
| Q | Nivel de Riesgo | np × nc |
| R | Interpretación del Riesgo | interpretacion_nivel_riesgo |
| S | Aceptabilidad del Riesgo | aceptabilidad (with color coding) |
| T-Z | Intervention & Follow-up columns | intervencion, eliminacion, sustitucion, etc. |
| AA-AE | Additional columns | seguimiento, fecha_seguimiento, observaciones, estado |

### Formatting Preserved
✅ Column widths  
✅ Merged cells (header & info rows)  
✅ Font styles (bold, size, color)  
✅ Alignment (left, center, right)  
✅ Fill colors  
✅ Borders  
✅ Frozen panes  
✅ Autofilter  

## How to Install Your Template

### Step 1: Create/Prepare Your Template
Ensure your template has:
- Proper header structure
- Correct column order (A-AE)
- All desired formatting and styling
- Any merged cells you want preserved
- Data rows starting at row 9

### Step 2: Store in Public Folder

**Option A: Default Template (Recommended)**
```
Place file at: public/templates/MATRIZ_IPVR_TEMPLATE.xlsx
```

**Option B: Area-Specific Template**
```
Place file at: public/templates/{AREA_NAME}.xlsx
Example: public/templates/HOSPITALIZACION.xlsx
```

Create the `templates` folder if it doesn't exist:
```bash
mkdir -p public/templates
```

### Step 3: Restart the Application
The template loader caches templates on first load, so restart your dev server or clear cache.

## Usage in Code

### Auto-Detection (Recommended)
```typescript
// The system automatically loads the template
await exportRisksToExcel(
  riesgos,
  'Hospitalización Sagrada Familia',
  'Dr. Juan Pérez',
  '2024-03-15',
  '2024-03-24',
  'MATRIZ_IPVR_HOSPITALIZACION.xlsx'
)
```

The template loader will:
1. Try `public/templates/HOSPITALIZACION.xlsx` (area-specific)
2. Try `public/templates/MATRIZ_IPVR_TEMPLATE.xlsx` (default)
3. Fall back to generating from scratch if not found

### Manual Template Passing
```typescript
import { loadTemplate } from '@/lib/template-loader'

const template = await loadTemplate('Hospitalización')
await exportRisksToExcel(
  riesgos,
  'Hospitalización Sagrada Familia',
  'Dr. Juan Pérez',
  fechaElaboracion,
  fechaActualizacion,
  filename,
  template
)
```

## Data Merging Rules

### Automatic Row Merging
When the same Actividad has multiple Peligros:
- ✅ **Columns A-F** merge vertically (Proceso, Zona, Actividades, Tareas, Cargo, Rutinario)
- ❌ **Columns G-AE** do NOT merge (each hazard gets its own row)

### Color Coding
Column S (Aceptabilidad del Riesgo) is automatically colored based on value:
- 🔴 "No Aceptable" → Red (#FFFFC7CE)
- 🟡 "Mejorable" → Yellow (#FFFFE699)
- 🟠 "Aceptable con Control Especifico" → Orange (#FFFFCC99)
- 🟢 "Aceptable" → Green (#FFC6EFCE)

## Examples

### Example 1: Load, modify, and export
```typescript
// Dashboard download button
async function handleDownloadMatrix(matrizId: string) {
  const res = await fetch(`/api/riesgos/${matrizId}`)
  const matriz = await res.json()
  
  const riesgos = flattenMatrixToRiesgos(matriz)
  
  await exportRisksToExcel(
    riesgos,
    matriz.area,
    matriz.responsable,
    matriz.fecha_elaboracion,
    matriz.fecha_actualizacion,
    `MATRIZ_IPVR_${matriz.area}.xlsx`
    // Template auto-loads from public/templates/
  )
}
```

### Example 2: Custom template override
```typescript
import { loadTemplate } from '@/lib/template-loader'

async function exportWithCustomTemplate() {
  const customTemplate = await loadTemplate('Urgencias')
  
  await exportRisksToExcel(
    riesgos,
    'Urgencias Hospital',
    'Responsable',
    date1,
    date2,
    'URGENCIAS.xlsx',
    customTemplate  // Force this template
  )
}
```

## Troubleshooting

### Template Not Loading
- Check file path: `public/templates/MATRIZ_IPVR_TEMPLATE.xlsx`
- Ensure file is valid Excel format (.xlsx)
- Check browser console for errors
- Try restarting dev server

### Data Not Appearing
- Verify data starts at row 9 in your template
- Check column count matches expected (A-AE)
- Ensure `riesgos` array has valid data

### Formatting Lost
- Template rows 1-8 are protected from modification
- Only data rows (9+) are replaced
- Styles in template header are preserved

### Colors Not Applied
- Auto-coloring only applies to column S (Aceptabilidad)
- Ensure aceptabilidad values match exactly:
  - "Aceptable"
  - "Mejorable"
  - "Aceptable con Control Especifico"
  - "No Aceptable"

## Technical Details

### Template Loader Caching
Templates are cached in memory after first load
- Improves performance for repeated exports
- Clear cache if template changes: `clearTemplateCache()`

### Graceful Fallback
If template fails to load:
1. System logs warning to console
2. Generates Excel from structured template (default format)
3. Export completes successfully

### Export Pipeline
```
Template File (public/templates/)
    ↓ (load via fetch)
ArrayBuffer
    ↓ (parse via ExcelJS)
Workbook
    ↓ (copy structure)
New Workbook (with preserved formatting)
    ↓ (fill data rows 9+)
Data-filled Workbook
    ↓ (apply grouping merges)
Final Workbook
    ↓ (generate buffer)
.xlsx file
    ↓ (download)
Browser Download
```

## Support

If templates don't load or formatting is lost:
1. Verify template file location: `public/templates/`
2. Check browser Network tab for 404 errors
3. Clear cache: `clearTemplateCache()`
4. Check console for error messages
5. Ensure Excel file is valid (try opening in Excel first)
