import React from 'react'
import MatrixEditor from '@/components/matrix-editor'

export default async function MatrizPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params

  return (
    <div>
      <MatrixEditor id={id} />
    </div>
  )
}
