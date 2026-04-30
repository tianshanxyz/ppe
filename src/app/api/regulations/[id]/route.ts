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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Regulation ID is required' },
        { status: 400 }
      );
    }

    const regulation = REGULATIONS.find((reg) => reg.id === id);

    if (!regulation) {
      return NextResponse.json(
        { success: false, error: 'Regulation not found' },
        { status: 404 }
      );
    }

    // Also find related regulations from the same market (excluding the current one)
    const related = REGULATIONS.filter(
      (reg) => reg.market_code === regulation.market_code && reg.id !== regulation.id
    ).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: regulation,
      related,
    });
  } catch (error) {
    console.error('Regulation fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch regulation',
      },
      { status: 500 }
    );
  }
}
