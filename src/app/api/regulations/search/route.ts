import { NextRequest, NextResponse } from 'next/server';
import regulationsData from '@/data/ppe/regulations-fulltext.json';

export interface RegulationFulltext {
  id: string;
  category_id: string;
  market_code: string;
  title: string;
  title_zh?: string;
  regulation_number: string;
  document_type: string;
  issuing_authority: string;
  effective_date: string;
  status: string;
  summary: string;
  summary_zh?: string;
  full_text: string;
}

const REGULATIONS = regulationsData as RegulationFulltext[];

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
    const searchInFulltext = searchParams.get('fulltext') === 'true';
    const offset = (page - 1) * limit;

    // Filter regulations
    let filtered = REGULATIONS.filter((reg) => {
      if (status && reg.status !== status) return false;
      if (market && reg.market_code !== market) return false;
      if (category && reg.category_id !== category) return false;
      if (type && reg.document_type !== type) return false;
      return true;
    });

    // Search in title, summary, and optionally full text
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((reg) => {
        const inTitle = (reg.title || '').toLowerCase().includes(lowerQuery) ||
          (reg.title_zh && reg.title_zh.toLowerCase().includes(lowerQuery));
        const inSummary = (reg.summary || '').toLowerCase().includes(lowerQuery) ||
          (reg.summary_zh && reg.summary_zh.toLowerCase().includes(lowerQuery));
        const inRegNumber = (reg.regulation_number || '').toLowerCase().includes(lowerQuery);
        const inAuthority = (reg.issuing_authority || '').toLowerCase().includes(lowerQuery);
        
        let inFulltext = false;
        if (searchInFulltext && reg.full_text) {
          inFulltext = reg.full_text.toLowerCase().includes(lowerQuery);
        }
        
        return inTitle || inSummary || inRegNumber || inAuthority || inFulltext;
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
