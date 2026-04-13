"use client"

import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { ReportePeligros } from '@/components/reporte-peligros'

export default function ReportePeligrosPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <ReportePeligros />
      </AuthGuard>
    </AuthProvider>
  )
}
