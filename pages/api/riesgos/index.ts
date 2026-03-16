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
  if (req.method === 'GET') {
    const data = await readData()
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const body = req.body
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' })
    const data = await readData()
    const maxId = data.reduce((m: number, r: any) => Math.max(m, Number(r.id || 0)), 0)
    const newItem = { ...body, id: maxId + 1 }
    data.push(newItem)
    await writeData(data)
    return res.status(201).json(newItem)
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}
