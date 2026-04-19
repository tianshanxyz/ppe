import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 数据源注册表
export const dataSources: Record<string, {
  name: string
  baseUrl: string
  icon: string
  color: string
  description: string
}> = {
  FDA: {
    name: 'FDA Official Database',
    baseUrl: 'https://www.accessdata.fda.gov',
    icon: 'us-flag',
    color: 'blue',
    description: '美国食品药品监督管理局官方数据库',
  },
  EUDAMED: {
    name: 'EUDAMED Official Portal',
    baseUrl: 'https://ec.europa.eu/tools/eudamed-web',
    icon: 'eu-flag',
    color: 'blue',
    description: '欧盟医疗器械数据库官方门户',
  },
  NMPA: {
    name: 'NMPA Official Database',
    baseUrl: 'https://www.nmpa.gov.cn',
    icon: 'cn-flag',
    color: 'red',
    description: '中国国家药品监督管理局官方数据库',
  },
  PMDA: {
    name: 'PMDA Official Database',
    baseUrl: 'https://www.pmda.go.jp',
    icon: 'jp-flag',
    color: 'red',
    description: '日本药品医疗器械管理局官方数据库',
  },
  MHRA: {
    name: 'MHRA Official Database',
    baseUrl: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
    icon: 'uk-flag',
    color: 'blue',
    description: '英国药品和健康产品监管局官方数据库',
  },
  TGA: {
    name: 'TGA Official Database',
    baseUrl: 'https://www.tga.gov.au',
    icon: 'au-flag',
    color: 'green',
    description: '澳大利亚治疗商品管理局官方数据库',
  },
}

// GET /api/data-sources - 获取所有数据源
export async function GET() {
  try {
    const sources = Object.entries(dataSources).map(([key, value]) => ({
      id: key,
      ...value,
    }))

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/data-sources/:entityType/:entityId - 获取实体的数据源链接
export async function GET_DATA_SOURCES_LINKS(
  request: Request,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required parameters: entityType and entityId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: links, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('source_name', { ascending: true })

    if (error) {
      console.error('Error fetching data source links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch data source links' },
        { status: 500 }
      )
    }

    return NextResponse.json({ links })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/data-sources - 添加数据源链接
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entityType, entityId, sourceName, sourceUrl, label } = body

    if (!entityType || !entityId || !sourceName || !sourceUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: link, error } = await supabase
      .from('data_sources')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        source_name: sourceName,
        source_url: sourceUrl,
        label,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating data source link:', error)
      return NextResponse.json(
        { error: 'Failed to create data source link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/data-sources/:id - 删除数据源链接
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting data source link:', error)
      return NextResponse.json(
        { error: 'Failed to delete data source link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface EntityData {
  name?: string
  company_name?: string
  k_number?: string
  cpc?: string
  product_code?: string
  registration_number?: string
  register_num?: string
  [key: string]: string | number | boolean | null | undefined
}

// 生成 FDA 数据源链接
export function generateFDALink(entityType: string, entityData: EntityData): string | null {
  if (entityType === 'company') {
    const companyName = encodeURIComponent(entityData.name || entityData.company_name || '')
    return `${dataSources.FDA.baseUrl}/search/?query=${companyName}&openfda.device_class=2`
  }
  if (entityType === 'product') {
    const kNumber = entityData.k_number || entityData.k_number
    if (kNumber) {
      return `${dataSources.FDA.baseUrl}/device/510k/?search=k_number:${kNumber}`
    }
  }
  return null
}

// 生成 EUDAMED 数据源链接
export function generateEUDAMEDLink(entityType: string, entityData: EntityData): string | null {
  if (entityType === 'company') {
    const companyName = encodeURIComponent(entityData.name || entityData.company_name || '')
    return `${dataSources.EUDAMED.baseUrl}/#/search?searchTerm=${companyName}&searchType=actor`
  }
  if (entityType === 'product') {
    const cpc = entityData.cpc || entityData.product_code
    if (cpc) {
      return `${dataSources.EUDAMED.baseUrl}/#/search?searchTerm=${cpc}&searchType=product`
    }
  }
  return null
}

// 生成 NMPA 数据源链接
export function generateNMPALink(entityType: string, entityData: EntityData): string | null {
  if (entityType === 'company') {
    const companyName = encodeURIComponent(entityData.name || entityData.company_name || '')
    return `https://www.nmpa.gov.cn/xxgk/ggtg/ylqxgg/index.html?keyword=${companyName}`
  }
  if (entityType === 'product') {
    const registrationNumber = entityData.registration_number || entityData.register_num
    if (registrationNumber) {
      return `https://www.nmpa.gov.cn/xxgk/ggtg/ylqxgg/index.html?keyword=${registrationNumber}`
    }
  }
  return null
}
