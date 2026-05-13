"use client"

import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { PriorizacionRiesgos } from '@/components/priorizacion-riesgos'

export default function PriorizacionPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <PriorizacionRiesgos />
      </AuthGuard>
    </AuthProvider>
  )
}
