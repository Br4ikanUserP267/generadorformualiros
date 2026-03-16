import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'riesgos.json')

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

async function writeData(data: any) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const rid = Number(id)
  if (Number.isNaN(rid)) return res.status(400).json({ error: 'Invalid id' })

  const data = await readData()
  const idx = data.findIndex((r: any) => Number(r.id) === rid)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  if (req.method === 'GET') {
    return res.status(200).json(data[idx])
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = req.body
    data[idx] = { ...data[idx], ...body }
    await writeData(data)
    return res.status(200).json(data[idx])
  }

  if (req.method === 'DELETE') {
    const removed = data.splice(idx, 1)[0]
    await writeData(data)
    return res.status(200).json({ deleted: removed.id })
  }

  res.setHeader('Allow', 'GET,PUT,PATCH,DELETE')
  res.status(405).end('Method Not Allowed')
}
