'use client'

import { Construction } from 'lucide-react'

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Construction className="w-16 h-16 text-[#339999] mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">功能开发中</h1>
        <p className="text-lg text-gray-600 mb-8">知识库功能正在开发中，敬请期待</p>
        <a href="/ppe/products" className="text-[#339999] hover:underline">返回产品列表</a>
      </div>
    </div>
  )
}
