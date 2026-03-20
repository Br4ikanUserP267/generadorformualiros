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
  const [clasificaciones, setClasificaciones] = useState<string[]>(DEFAULT_CLASIFICACIONES)

  const addClasificacion = (value: string) => {
    setClasificaciones(prev => {
      if (prev.includes(value)) return prev
      return [...prev, value]
    })
  }

  const setAllClasificaciones = (values: string[]) => setClasificaciones(values)

  return { clasificaciones, addClasificacion, setAllClasificaciones }
}
