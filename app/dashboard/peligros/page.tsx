"use client"

import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { PeligrosDashboard } from '@/components/peligros/peligros-dashboard'

export default function PeligrosPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <PeligrosDashboard />
      </AuthGuard>
    </AuthProvider>
  )
}
