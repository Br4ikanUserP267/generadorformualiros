/**
 * Template Loader - Handles loading Excel templates from public folder
 * Supports template caching and fallback strategies
 */

let templateCache: Map<string, ArrayBuffer> = new Map()

/**
 * Load Excel template from public/templates/ folder
 * Filename format: MATRIZ_IPVR_TEMPLATE.xlsx or {area}-template.xlsx
 */
export async function loadTemplate(areaName?: string): Promise<ArrayBuffer | null> {
  try {
    // First check cache
    const cacheKey = areaName || 'default'
    if (templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey)!
    }

    // Try area-specific template first
    if (areaName) {
      const sanitized = areaName
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '')
      const paths = [
        `/templates/${sanitized}.xlsx`,
        `/templates/${sanitized}-template.xlsx`,
        `/templates/MATRIZ_IPVR_TEMPLATE.xlsx`,
      ]

      for (const path of paths) {
        try {
          const response = await fetch(path)
          if (response.ok) {
            const buffer = await response.arrayBuffer()
            templateCache.set(cacheKey, buffer)
            return buffer
          }
        } catch (e) {
          // Continue to next path
        }
      }
    }

    // Try default template
    const defaultPaths = [
      '/templates/MATRIZ_IPVR_TEMPLATE.xlsx',
      '/MATRIZ_IPVR_TEMPLATE.xlsx',
      '/templates/template.xlsx',
    ]

    for (const path of defaultPaths) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          templateCache.set('default', buffer)
          return buffer
        }
      } catch (e) {
        // Continue to next path
      }
    }

    return null
  } catch (error) {
    console.warn('Failed to load template:', error)
    return null
  }
}

/**
 * Clear template cache (useful if templates change)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
}

/**
 * Preload a specific template
 */
export async function preloadTemplate(areaName?: string): Promise<boolean> {
  try {
    const buffer = await loadTemplate(areaName)
    return buffer !== null
  } catch (error) {
    console.error('Failed to preload template:', error)
    return false
  }
}
