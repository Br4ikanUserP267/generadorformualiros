"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
        return true
      }
    } catch (err) {
      console.error('Login error', err)
    }
    
    setIsLoading(false)
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

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
