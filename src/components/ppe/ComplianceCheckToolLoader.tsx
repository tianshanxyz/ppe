'use client'

import { Suspense, lazy } from 'react'

const ComplianceCheckTool = lazy(() => 
  import('@/components/ppe/ComplianceCheckTool').then(mod => ({ default: mod.ComplianceCheckTool }))
)

function LoadingFallback() {
  return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-pulse text-[#339999]">Loading compliance tool...</div>
    </div>
  )
}

export function ComplianceCheckToolLoader() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ComplianceCheckTool />
    </Suspense>
  )
}
