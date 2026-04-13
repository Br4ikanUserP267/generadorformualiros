import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { parseImportWorkbook } from '@/lib/riesgos-import'
import { saveImport } from '@/lib/riesgos-import-store'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
    allowEmptyFiles: false,
  })

  return new Promise<{ files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { files } = await parseForm(req)
    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file

    if (!uploaded) {
      return res.status(400).json({ error: 'No se envio ningun archivo' })
    }

    if (uploaded.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'El archivo supera el limite de 5 MB' })
    }

    const originalName = (uploaded.originalFilename || '').toLowerCase()
    if (!originalName.endsWith('.xlsx') && !originalName.endsWith('.xls')) {
      return res.status(400).json({ error: 'Formato invalido. Solo se permiten .xlsx y .xls' })
    }

    const buffer = await fs.readFile(uploaded.filepath)

    const parsed = await parseImportWorkbook(buffer)
    const saved = saveImport(parsed)

    return res.status(200).json({
      importId: saved.id,
      totalRows: saved.totalRows,
      validRows: saved.validRows,
      errors: saved.errors,
      preview: saved.preview,
    })
  } catch (error: any) {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el limite de 5 MB' })
    }

    if (error?.message === 'No se encontro la hoja "Matriz" en el archivo') {
      return res.status(400).json({ error: 'No se encontró la hoja "Matriz" en el archivo' })
    }

    if (error?.message === 'Columnas faltantes') {
      return res.status(400).json({ error: 'Columnas faltantes', missing: error.missing || [] })
    }

    console.error('Import preview error:', error)
    return res.status(500).json({ error: 'Error procesando el archivo de importacion' })
  }
}
