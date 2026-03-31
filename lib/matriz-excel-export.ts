"use client"

import ExcelJS from 'exceljs'

// ============================================================================
// Type Definitions for Nested Matrix Structure
// ============================================================================

interface Control {
  fuente?: string
  medio?: string
  individuo?: string
}

interface Evaluacion {
  nivel_deficiencia?: number
  nivel_exposicion?: number
  nivel_probabilidad?: number
  interp_probabilidad?: string
  nivel_consecuencia?: number
  nivel_riesgo?: number
  interp_riesgo?: string
  aceptabilidad?: string
  nd?: number
  ne?: number
  np?: number
  nc?: number
  nr?: number
  interp_np?: string
  interp_nr?: string
}

interface Criterio {
  num_expuestos?: number
  peor_consecuencia?: string
  requisito_legal?: string
  numExpuestos?: number
  peorConsecuencia?: string
  requisitoLegal?: boolean
}

interface Intervencion {
  eliminacion?: string
  sustitucion?: string
  controles_ingenieria?: string
  controles_administrativos?: string
  epp?: string
  responsable?: string
  fecha_ejecucion?: string
}

interface Peligro {
  id?: string
  descripcion?: string
  clasificacion?: string
  efectos_posibles?: string
  efectos?: string
  rutinario?: boolean
  control?: Control
  controles?: Control
  evaluacion?: Evaluacion
  criterio?: Criterio
  criterios?: Criterio
  intervencion?: Intervencion
}

interface Actividad {
  id?: string
  nombre?: string
  descripcion?: string
  tareas?: string
  cargo?: string
  rutinario?: boolean
  peligros?: Peligro[]
}

interface Zona {
  id?: string
  nombre?: string
  actividades?: Actividad[]
}

interface Proceso {
  id?: string
  nombre?: string
  zonas?: Zona[]
}

interface Archivo {
  id?: string
  nombre_original?: string
  nombreOriginal?: string
  name?: string
  tipo?: string
  tipoMime?: string
  type?: string
  tamano?: number
  url?: string
  data?: string
  fechaSubida?: string
}

interface MatrizData {
  id?: string
  area?: string
  responsable?: string
  fecha_elaboracion?: string
  fecha_actualizacion?: string
  procesos?: Proceso[]
  archivos?: Archivo[]
  files?: Archivo[]
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRiskColorFill(nr: number): { type: 'pattern'; pattern: 'solid'; fgColor: { argb: string } } {
  if (nr >= 4000) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfce8e8' } } // Muy alto
  if (nr >= 501) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfdecea' } } // Alto
  if (nr >= 121) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfff3e0' } } // Medio
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFe8f5e9' } } // Bajo
}

function getRiskColorFont(nr: number): { color: { argb: string } } {
  if (nr >= 4000) return { color: { argb: 'FFa50000' } } // Muy alto
  if (nr >= 501) return { color: { argb: 'FFdc3545' } } // Alto
  if (nr >= 121) return { color: { argb: 'FFfd7e14' } } // Medio
  return { color: { argb: 'FF198754' } } // Bajo
}

function colNumberToLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}


// ============================================================================
// Main Export Function
// ============================================================================

export async function exportMatrizToExcel(matrizData: MatrizData): Promise<void> {
  try {
    const response = await fetch('/api/export/matriz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matrizData),
    });

    if (!response.ok) {
      throw new Error(`Error en la exportación: ${response.statusText}`);
    }

    // Process the blob download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Default filename fallback
    let filename = 'Matriz_Riesgos.xlsx';
    
    // Attempt to parse filename from Content-Disposition header
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    } else {
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const sanitizedArea = (matrizData.area || 'Matriz')
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '')
      filename = `Matriz_${sanitizedArea}_${dateStr}.xlsx`
    }

    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}
