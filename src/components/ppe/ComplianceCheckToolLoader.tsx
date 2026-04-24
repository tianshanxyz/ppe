'use client'

import dynamic from 'next/dynamic'

const ComplianceCheckTool = dynamic(
  () => import('@/components/ppe/ComplianceCheckTool').then(mod => mod.ComplianceCheckTool),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-[#339999]">Loading compliance tool...</div>
      </div>
    ),
  }
)

export function ComplianceCheckToolLoader() {
  return <ComplianceCheckTool />
}
