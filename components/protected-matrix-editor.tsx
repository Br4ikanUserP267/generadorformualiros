"use client"

import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import MatrixEditor from '@/components/matrix-editor'

export default function ProtectedMatrixEditor({ id }: { id: string }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <MatrixEditor id={id} />
      </AuthGuard>
    </AuthProvider>
  )
}
