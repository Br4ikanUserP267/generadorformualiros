"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "clasificaciones"

const DEFAULT_CLASIFICACIONES = [
  "Biológico",
  "Químico",
  "Físico",
  "Mecánico",
  "Ergonómico",
  "Eléctrico",
  "Psicosocial",
  "Locativo",
  "Natural",
]

export function useClasificaciones() {
  const [clasificaciones, setClasificaciones] = useState<string[]>(() => {
    try {
      if (typeof window === "undefined") return DEFAULT_CLASIFICACIONES
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) as string[] : DEFAULT_CLASIFICACIONES
    } catch {
      return DEFAULT_CLASIFICACIONES
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clasificaciones))
    } catch {
      // ignore
    }
  }, [clasificaciones])

  const addClasificacion = (value: string) => {
    setClasificaciones(prev => {
      if (prev.includes(value)) return prev
      return [...prev, value]
    })
  }

  const setAllClasificaciones = (values: string[]) => setClasificaciones(values)

  return { clasificaciones, addClasificacion, setAllClasificaciones }
}
