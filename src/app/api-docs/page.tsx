import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { Card } from '@/components/ui';
import { Code, Key, Search, FileText, AlertCircle } from 'lucide-react';

const endpoints = [
  {
    method: 'GET',
    path: '/api/search',
    description: '搜索医疗器械注册信息',
    parameters: [
      { name: 'q', type: 'string', required: true, description: '搜索关键词' },
      { name: 'market', type: 'string', required: false, description: '市场筛选 (all/fda/nmpa/eudamed)' },
      { name: 'page', type: 'number', required: false, description: '页码，默认1' },
      { name: 'limit', type: 'number', required: false, description: '每页数量，默认20' },
    ],
    response: `{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`
  },
  {
    method: 'GET',
    path: '/api/companies/{id}',
    description: '获取企业详细信息',
    parameters: [
      { name: 'id', type: 'string', required: true, description: '企业ID' },
    ],
    response: `{
  "company": { ... },
  "products": [...],
  "fdaRegistrations": [...]
}`
  },
];

const codeExamples = [
  {
    language: 'cURL',
    code: `curl -X GET "https://mdlooker.vercel.app/api/search?q=medical&market=fda" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    language: 'JavaScript',
    code: `const response = await fetch(
  'https://mdlooker.vercel.app/api/search?q=medical&market=fda',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);
const data = await response.json();`
  },
  {
    language: 'Python',
    code: `import requests

response = requests.get(
    'https://mdlooker.vercel.app/api/search',
    params={'q': 'medical', 'market': 'fda'},
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()`
  },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">API 文档</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              使用MDLooker API将医疗器械合规数据集成到您的应用程序中
            </p>
          </div>

          {/* Quick Start */}
          <Card className="p-6 mb-8 bg-medical-50 border-medical-100">
            <div className="flex items-start gap-4">
              <Key className="w-8 h-8 text-medical flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-medical-800 mb-2">快速开始</h2>
                <p className="text-medical-700 mb-4">
                  1. 登录您的账户并前往用户中心的API密钥管理页面<br/>
                  2. 创建新的API密钥<br/>
                  3. 在请求头中添加 Authorization: Bearer YOUR_API_KEY
                </p>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400 text-sm">
                    Authorization: Bearer mk_live_xxxxxxxxxxxxxxxx
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Rate Limits */}
          <Card className="p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">速率限制</h2>
                <p className="text-gray-600">
                  免费用户：每分钟100次请求<br/>
                  付费用户：根据套餐享有更高额度
                </p>
              </div>
            </div>
          </Card>

          {/* Endpoints */}
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-800">API 端点</h2>
            
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                    endpoint.method === 'POST' ? 'bg-primary-100 text-primary-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-800">{endpoint.path}</code>
                </div>
                
                <p className="text-gray-600 mb-4">{endpoint.description}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">参数</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">参数名</th>
                        <th className="text-left py-2">类型</th>
                        <th className="text-left py-2">必需</th>
                        <th className="text-left py-2">描述</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.parameters.map((param, pIndex) => (
                        <tr key={pIndex} className="border-b">
                          <td className="py-2 font-mono">{param.name}</td>
                          <td className="py-2">{param.type}</td>
                          <td className="py-2">{param.required ? '是' : '否'}</td>
                          <td className="py-2 text-gray-600">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">响应示例</h3>
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-green-400 text-sm">{endpoint.response}</code>
                  </pre>
                </div>
              </Card>
            ))}
          </div>

          {/* Code Examples */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">代码示例</h2>
            
            <div className="space-y-6">
              {codeExamples.map((example, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{example.language}</h3>
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-green-400 text-sm">{example.code}</code>
                  </pre>
                </Card>
              ))}
            </div>
          </div>

          {/* Support */}
          <Card className="p-6 mt-8">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-medical" />
              <div>
                <h3 className="font-semibold text-gray-800">需要帮助？</h3>
                <p className="text-gray-600">
                  如有API使用问题，请联系 support@mdlooker.com
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
