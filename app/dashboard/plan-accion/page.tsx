"use client"

import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { PlanAccionDashboard } from '@/components/plan-accion'

export default function PlanAccionPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <PlanAccionDashboard />
      </AuthGuard>
    </AuthProvider>
  )
}
