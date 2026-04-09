"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/utils"

interface User {
  id: string
  email: string
  nombre: string
  cargo: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock admin user for demo
const MOCK_USERS = [
  { id: "1", email: "admin@clinicasantamaria.com", password: "admin123", nombre: "Dr. Carlos Mendoza", cargo: "Director de Seguridad" },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      console.log('[AUTH] checkSession starting')
      try {
        console.log('[AUTH] Calling apiFetch /api/auth/me')
        const startTime = Date.now()
        const res = await Promise.race([
          apiFetch('/api/auth/me', { redirectOn401: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout after 5s')), 5000))
        ])
        console.log('[AUTH] Got response after', Date.now() - startTime, 'ms, status:', res.status)
        if (!isMounted) return

        if (res.ok) {
          const data = await res.json()
          console.log('[AUTH] Session valid, user:', data.email)
          setUser({
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            cargo: data.cargo || 'Usuario',
          })
        } else {
          console.log('[AUTH] Response not OK, status:', res.status)
          setUser(null)
        }
      } catch (err) {
        console.error('[AUTH] Error in checkSession:', err)
        if (isMounted) setUser(null)
      } finally {
        console.log('[AUTH] Setting isLoading to false')
        if (isMounted) setIsLoading(false)
      }
    }

    checkSession()
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirectOn401: false,
      })

      if (res.ok) {
        const data = await res.json()
        setUser({
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          cargo: data.cargo || 'Usuario'
        })
        setIsLoading(false)
        router.push('/dashboard')
        return true
      }
    } catch (err) {
      console.error('Login error', err)
    }
    
    setIsLoading(false)
    return false
  }, [router])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch {
      // Ignore network errors and clear local state regardless
    }

    setUser(null)
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
