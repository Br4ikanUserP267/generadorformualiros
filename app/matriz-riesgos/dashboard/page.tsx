"use client"

import { AuthProvider } from "@/lib/auth-context"
import { Dashboard } from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
