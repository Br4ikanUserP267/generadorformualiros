import React from 'react'
import MatrixEditor from '@/components/matrix-editor'

export default function MatrizPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <MatrixEditor id={params.id} />
    </div>
  )
}
