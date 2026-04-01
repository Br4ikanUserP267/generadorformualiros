"use client"

import { AuthProvider } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Dashboard } from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    </AuthProvider>
  )
}
