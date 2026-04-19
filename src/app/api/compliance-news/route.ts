import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ComplianceNewsItem {
  id: string
  title: string
  summary?: string
  content?: string
  source?: string
  regulatory_body?: string
  publish_date?: string
  created_at?: string
  category?: string
  region?: string
  is_hot?: boolean
  views?: number
  external_url?: string
  [key: string]: string | number | boolean | null | undefined
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || '';
    const region = searchParams.get('region') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // 构建查询条件
    let query = supabase
      .from('compliance_news')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // 筛选条件
    if (category) {
      query = query.eq('category', category);
    }

    if (region) {
      query = query.eq('region', region);
    }

    // 分页和排序
    query = query
      .range(offset, offset + limit - 1)
      .order('publish_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // 格式化返回数据
    const formattedData = (data || []).map((item: ComplianceNewsItem) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.content?.substring(0, 200) + '...' || '',
      source: item.source || item.regulatory_body || 'Official',
      publishDate: item.publish_date || item.created_at,
      category: item.category || 'regulation',
      region: item.region || 'Global',
      isHot: item.is_hot || (item.views || 0) > 1000,
      isNew: isNewItem(item.publish_date || item.created_at),
      externalUrl: item.external_url,
      views: item.views || 0,
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Compliance news error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch compliance news',
      },
      { status: 500 }
    );
  }
}

// 辅助函数：判断是否为最新内容（7天内）
function isNewItem(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const itemDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - itemDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}
