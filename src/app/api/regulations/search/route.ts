import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers';
import { escapeIlikeSearch } from '@/lib/security/sanitize';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const market = searchParams.get('market') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    
      const supabase = await createClient();

    // 构建查询条件 - 简化版本
    let queryBuilder = supabase
      .from('regulations')
      .select('*', { count: 'exact' });

    // 只添加基本的搜索条件
    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${escapeIlikeSearch(query)}%`);
    }

    // 分页
    queryBuilder = queryBuilder.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Regulation search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
