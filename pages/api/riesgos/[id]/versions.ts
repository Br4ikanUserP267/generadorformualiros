import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

function safeParseJson(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function unwrapCreateList(value: any): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray(value.create)) return value.create
  return []
}

function countStructure(procesos: any[] = []) {
  let procesosCount = 0
  let zonasCount = 0
  let actividadesCount = 0
  let peligrosCount = 0

  for (const proceso of unwrapCreateList(procesos)) {
    procesosCount += 1
    for (const zona of unwrapCreateList(proceso?.zonas)) {
      zonasCount += 1
      for (const actividad of unwrapCreateList(zona?.actividades)) {
        actividadesCount += 1
        peligrosCount += unwrapCreateList(actividad?.peligros).length
      }
    }
  }

  return { procesosCount, zonasCount, actividadesCount, peligrosCount }
}

function summarizeChanges(changes: any, action: string) {
  const data = changes?.data && typeof changes.data === 'object' ? changes.data : changes
  const lines: string[] = []

  if (!data || typeof data !== 'object') {
    return {
      title: action === 'CREATE' ? 'Matrix created' : action === 'UPDATE' ? 'Version saved' : 'Matrix changed',
      lines: ['No structured summary available.'],
    }
  }

  if (typeof data.area === 'string') lines.push(`Area: ${data.area || 'Empty'}`)
  if (typeof data.responsable === 'string') lines.push(`Responsible: ${data.responsable || 'Empty'}`)
  if (typeof data.fecha_elaboracion === 'string') lines.push(`Created date: ${data.fecha_elaboracion || 'Empty'}`)
  if (typeof data.fecha_actualizacion === 'string') lines.push(`Updated date: ${data.fecha_actualizacion || 'Empty'}`)

  const procesos = unwrapCreateList(data.procesos)
  if (procesos.length > 0) {
    const counts = countStructure(procesos)
    lines.push(`Structure: ${counts.procesosCount} processes, ${counts.zonasCount} zones, ${counts.actividadesCount} activities, ${counts.peligrosCount} hazards`)
  } else if (changes?.data?.procesos?.deleteMany || changes?.procesos?.deleteMany) {
    lines.push('Structure was regenerated from the current matrix state.')
  }

  if (lines.length === 0) {
    lines.push(action === 'DELETE' ? 'Matrix was deleted.' : 'Matrix data was saved.')
  }

  return {
    title: action === 'CREATE' ? 'Version created' : action === 'UPDATE' ? 'Version saved' : action === 'DELETE' ? 'Matrix deleted' : 'Matrix changed',
    lines,
  }
}

function resolveActor(log: { userName: string | null; userEmail: string | null }, currentUser: any) {
  const isUnknown =
    !log.userName ||
    log.userName === 'Desconocido' ||
    !log.userEmail ||
    log.userEmail === 'unknown@csm.net.co'

  if (!isUnknown) {
    return {
      userName: log.userName || '',
      userEmail: log.userEmail || '',
    }
  }

  return {
    userName: currentUser?.nombre || log.userName || '',
    userEmail: currentUser?.email || log.userEmail || '',
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { id, versionId } = req.query
    const matrizId = String(Array.isArray(id) ? id[0] : id || '')
    const requestedVersionId = String(Array.isArray(versionId) ? versionId[0] : versionId || '')
    if (!matrizId) return res.status(400).json({ error: 'Invalid id' })

    const matriz = await prisma.matriz.findUnique({
      where: { id: matrizId },
      select: { id: true, area: true, responsable: true, deletedAt: true }
    })

    if (!matriz || matriz.deletedAt) {
      return res.status(404).json({ error: 'Matrix not found' })
    }

    if (requestedVersionId) {
      const log = await prisma.activityLog.findFirst({
        where: {
          id: requestedVersionId,
          model: 'Matriz',
          recordId: matrizId,
        },
        select: {
          id: true,
          timestamp: true,
          userName: true,
          userEmail: true,
          action: true,
          changes: true,
          before: true,
        }
      })

      if (!log) {
        return res.status(404).json({ error: 'Version not found' })
      }

      const actor = resolveActor(log, user)

      return res.status(200).json({
        matriz: {
          id: matriz.id,
          title: matriz.area || matriz.responsable || 'Untitled matrix',
        },
        version: {
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          userName: actor.userName,
          userEmail: actor.userEmail,
          action: log.action,
          changes: log.changes || '',
          before: log.before || '',
        },
      })
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        model: 'Matriz',
        recordId: matrizId,
      },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        userName: true,
        userEmail: true,
        action: true,
        changes: true,
      }
    })

    return res.status(200).json({
      matriz: {
        id: matriz.id,
        title: matriz.area || matriz.responsable || 'Untitled matrix',
      },
      versions: logs.map((log) => {
        const actor = resolveActor(log, user)
        const parsedChanges = safeParseJson(log.changes || '')
        const summary = summarizeChanges(parsedChanges, log.action)

        return {
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          userName: actor.userName,
          userEmail: actor.userEmail,
          action: log.action,
          title: summary.title,
          lines: summary.lines,
        }
      }),
    })
  } catch (error: any) {
    console.error('API /api/riesgos/[id]/versions error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error?.message || 'Unknown error' })
  }
}
