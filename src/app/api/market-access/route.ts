import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MarketAccessStep {
  id?: string
  market_id?: string
  device_type_id?: string
  phase?: string
  step_name?: string
  description?: string
  is_required?: boolean
  estimated_days?: number
  [key: string]: string | number | boolean | null | undefined
}

interface MarketAccessDocument {
  id?: string
  market_id?: string
  document_name?: string
  format?: string
  file_size?: string
  description?: string
  [key: string]: string | number | boolean | null | undefined
}

interface MarketAccessTip {
  id?: string
  market_id?: string
  content?: string
  [key: string]: string | number | boolean | null | undefined
}

interface GroupedStep {
  phase: string
  items: Array<{
    name: string
    required: boolean
    description: string
    estimatedDays?: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || '';
    const deviceType = searchParams.get('deviceType') || '';

    const supabase = await createClient();

    // 查询市场准入指南数据
    let query = supabase
      .from('market_access_guides')
      .select('*')
      .eq('market_code', market)
      .eq('status', 'active');

    const { data: guideData, error: guideError } = await query.single();

    if (guideError && guideError.code !== 'PGRST116') {
      throw guideError;
    }

    // 查询设备类型相关信息
    const { data: deviceData, error: deviceError } = await supabase
      .from('device_type_classifications')
      .select('*')
      .eq('device_type', deviceType)
      .eq('market_code', market)
      .single();

    if (deviceError && deviceError.code !== 'PGRST116') {
      throw deviceError;
    }

    // 查询注册步骤
    const { data: stepsData, error: stepsError } = await supabase
      .from('registration_steps')
      .select('*')
      .eq('market_code', market)
      .eq('device_type', deviceType)
      .order('step_order', { ascending: true });

    if (stepsError) {
      throw stepsError;
    }

    // 查询所需文档
    const { data: documentsData, error: documentsError } = await supabase
      .from('required_documents')
      .select('*')
      .eq('market_code', market)
      .eq('device_type', deviceType);

    if (documentsError) {
      throw documentsError;
    }

    // 查询专业建议
    const { data: tipsData, error: tipsError } = await supabase
      .from('market_access_tips')
      .select('*')
      .eq('market_code', market)
      .limit(5);

    if (tipsError) {
      throw tipsError;
    }

    // 组合返回数据
    const result = {
      market: guideData?.market_name || getMarketName(market),
      marketCode: market,
      regulator: guideData?.regulator || getRegulator(market),
      deviceType: deviceType,
      deviceClass: deviceData?.device_class || 'Class I',
      riskLevel: deviceData?.risk_level || 'low',
      timeline: deviceData?.estimated_timeline || '30-90 days',
      estimatedCost: deviceData?.estimated_cost || 'Contact for details',
      steps: stepsData && stepsData.length > 0 
        ? groupStepsByPhase(stepsData)
        : getDefaultSteps(market),
      documents: documentsData && documentsData.length > 0
        ? documentsData.map((doc: MarketAccessDocument) => ({
            name: doc.document_name,
            format: doc.format || 'PDF',
            size: doc.file_size || 'N/A',
            description: doc.description,
          }))
        : getDefaultDocuments(),
      tips: tipsData && tipsData.length > 0
        ? tipsData.map((tip: MarketAccessTip) => tip.content)
        : getDefaultTips(market),
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Market access guide error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market access guide'
      },
      { status: 500 }
    );
  }
}

// 辅助函数
function getMarketName(code: string): string {
  const markets: Record<string, string> = {
    'SG': 'Singapore',
    'US': 'United States',
    'EU': 'European Union',
    'CN': 'China',
    'JP': 'Japan',
    'AU': 'Australia',
    'CA': 'Canada',
    'UK': 'United Kingdom'
  };
  return markets[code] || code;
}

function getRegulator(code: string): string {
  const regulators: Record<string, string> = {
    'SG': 'HSA',
    'US': 'FDA',
    'EU': 'MDR/IVDR',
    'CN': 'NMPA',
    'JP': 'PMDA',
    'AU': 'TGA',
    'CA': 'Health Canada',
    'UK': 'MHRA'
  };
  return regulators[code] || code;
}

function groupStepsByPhase(steps: MarketAccessStep[]): GroupedStep[] {
  const phases: Record<string, Array<{ name: string; required: boolean; description: string; estimatedDays?: number }>> = {}
  
  steps.forEach((step) => {
    const phase = step.phase || 'General'
    if (!phases[phase]) {
      phases[phase] = []
    }
    phases[phase].push({
      name: step.step_name || 'Unknown Step',
      required: step.is_required || false,
      description: step.description || '',
      estimatedDays: step.estimated_days,
    })
  })

  return Object.entries(phases).map(([phase, items]) => ({
    phase,
    items,
  }))
}

function getDefaultSteps(market: string): GroupedStep[] {
  return [
    {
      phase: 'Preparation Phase',
      items: [
        { name: 'Determine Product Classification', required: true, description: 'Identify the correct risk class for your device' },
        { name: 'Appoint Local Authorized Representative', required: true, description: 'Non-local companies need a local representative' },
        { name: 'Prepare Technical Documentation', required: true, description: 'Include product description, manufacturing process, quality control' }
      ]
    },
    {
      phase: 'Application Phase',
      items: [
        { name: 'Submit Registration Application', required: true, description: 'Submit through the online system' },
        { name: 'Pay Application Fees', required: true, description: 'Pay according to device classification' },
        { name: 'Provide Declaration of Conformity', required: true, description: 'Declare compliance with relevant standards and regulations' }
      ]
    },
    {
      phase: 'Post-Market Surveillance',
      items: [
        { name: 'Establish Adverse Event Reporting System', required: true, description: 'Set up system to collect and report adverse events' },
        { name: 'Product Labeling Compliance', required: true, description: 'Ensure labeling meets regulatory requirements' },
        { name: 'Periodic Safety Update Reports', required: false, description: 'Submit safety updates as required' }
      ]
    }
  ];
}

function getDefaultDocuments(): Array<{ name: string; format: string; size: string }> {
  return [
    { name: 'Technical Documentation', format: 'PDF', size: '2-5 MB' },
    { name: 'Quality Management Certificate (ISO 13485)', format: 'PDF', size: '1-2 MB' },
    { name: 'Declaration of Conformity Template', format: 'DOCX', size: '50 KB' },
    { name: 'Registration Guidelines', format: 'PDF', size: '500 KB' },
  ]
}

function getDefaultTips(market: string): string[] {
  return [
    'Recommend pre-submission meetings with regulatory authorities',
    'Products approved in reference countries may receive expedited review',
    'Ensure product labeling includes complete information',
    'Maintain up-to-date technical documentation',
    'Consider engaging local regulatory consultants'
  ];
}
