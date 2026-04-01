"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Dashboard } from "@/components/dashboard"

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <Dashboard />
}

export default function MatrizRiesgosPage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
