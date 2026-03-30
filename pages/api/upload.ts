import { NextApiRequest, NextApiResponse } from 'next'
import { persistFilesToDisk } from '@/lib/server-upload'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { files } = req.body

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid payload: files array is required' })
    }

    const persistedFiles = await persistFilesToDisk(files)

    // Return the files with their physical disk URLs
    return res.status(200).json(persistedFiles.map(f => ({
      name: f.name,
      type: f.type,
      url: f.url
    })))
  } catch (error) {
    console.error('File upload error:', error)
    return res.status(500).json({ error: 'Error uploading files' })
  }
}