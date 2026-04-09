import path from 'path'
import fs from 'fs/promises'

export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'matrices')

void fs.mkdir(UPLOADS_DIR, { recursive: true })

type IncomingFile = {
  name?: string
  type?: string
  data?: string
  url?: string
}

export type PersistedFile = {
  name: string
  originalName?: string
  type: string
  url: string
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned || 'archivo'
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/json': '.json'
  }
  return map[mime] || ''
}

function splitBaseNameAndExt(fileName: string): { base: string; ext: string } {
  const parsed = path.parse(fileName)
  return { base: parsed.name || 'archivo', ext: parsed.ext || '' }
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  const base64 = match[2]
  try {
    return { mime, buffer: Buffer.from(base64, 'base64') }
  } catch {
    return null
  }
}

export async function persistFilesToDisk(files: IncomingFile[] = []): Promise<PersistedFile[]> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })

  const persisted: PersistedFile[] = []

  for (const file of files) {
    const originalName = String(file?.name || 'archivo')
    const sanitizedName = sanitizeFileName(originalName)
    const type = String(file?.type || '')
    const rawData = String(file?.data || file?.url || '')

    if (!rawData) continue

    const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || '')
    const normBase = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '')

    // accept existing URLs with or without basePath
    if (rawData.startsWith(`${normBase}/uploads/matrices/`) || rawData.startsWith('/uploads/matrices/')) {
      // ensure returned url includes basePath
      const returned = rawData.startsWith('/uploads/matrices/') && normBase ? `${normBase}${rawData}` : rawData
      persisted.push({ name: sanitizedName, originalName, type, url: returned })
      continue
    }

    if (rawData.startsWith('http://') || rawData.startsWith('https://') || (rawData.startsWith('/') && !rawData.startsWith('/uploads/matrices/'))) {
      persisted.push({ name: sanitizedName, originalName, type, url: rawData })
      continue
    }

    const parsed = parseDataUrl(rawData)
    if (!parsed) continue

    const { base, ext } = splitBaseNameAndExt(sanitizedName)
    const finalExt = ext || extFromMime(type || parsed.mime)
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const fileName = `${base}_${uniqueSuffix}${finalExt}`

    const filePath = path.join(UPLOADS_DIR, fileName)
    await fs.writeFile(filePath, parsed.buffer)

    const urlPath = `/uploads/matrices/${fileName}`
    const url = normBase ? `${normBase}${urlPath}` : urlPath
    persisted.push({ name: sanitizedName, originalName, type: type || parsed.mime, url })
  }

  return persisted
}