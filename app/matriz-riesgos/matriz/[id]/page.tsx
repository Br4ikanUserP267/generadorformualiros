import React from 'react'
import ProtectedMatrixEditor from '@/components/protected-matrix-editor'

export default async function MatrizPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params

  return (
    <div>
      <ProtectedMatrixEditor id={id} />
    </div>
  )
}
