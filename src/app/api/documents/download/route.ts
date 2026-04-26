import { NextRequest, NextResponse } from 'next/server'

const DOCUMENT_TEMPLATES: Record<string, { filename: string; contentType: string; content: string }> = {
  'ce-technical-file': {
    filename: 'CE_Technical_File_Template.md',
    contentType: 'text/markdown',
    content: `# CE Technical File Template\n\n## 1. Product Description\n- Product name: [Enter product name]\n- Model/type: [Enter model]\n- Intended use: [Describe intended use]\n- Classification: Category II/III per EU 2016/425\n\n## 2. Risk Assessment\n- Hazard identification per EN ISO 12100\n- Risk estimation and evaluation\n- Risk control measures\n- Residual risk assessment\n\n## 3. Applicable Standards\n- [List applicable EN standards]\n\n## 4. Test Reports\n- [Attach test reports from accredited labs]\n\n## 5. Manufacturing Process\n- Production flow chart\n- Quality control points\n- Material specifications\n\n## 6. Quality Control\n- Incoming inspection\n- In-process inspection\n- Final inspection\n\n## 7. Labeling & Instructions\n- CE marking requirements\n- User instructions per Annex II\n- Multi-language requirements\n`
  },
  'ce-doc': {
    filename: 'EU_Declaration_of_Conformity_Template.md',
    contentType: 'text/markdown',
    content: `# EU Declaration of Conformity\n\n## Manufacturer\n- Company name: [Enter company name]\n- Address: [Enter address]\n\n## Product\n- Product name: [Enter product name]\n- Model/type: [Enter model]\n- Serial/batch number: [Enter number]\n\n## Conformity Assessment\n- The product is in conformity with EU Regulation 2016/425\n- Conformity assessment procedure: [Module B + D/C2/F2]\n- Notified Body: [Enter NB name and number]\n\n## Applicable Standards\n- [List applicable EN standards]\n\n## Declaration\nI declare that the above product is in conformity with the applicable EU legislation.\n\nSignature: _______________\nName: [Enter name]\nTitle: [Enter title]\nDate: [Enter date]\n`
  },
  'fda-510k-cover': {
    filename: 'FDA_510k_Cover_Letter_Template.md',
    contentType: 'text/markdown',
    content: `# 510(k) Cover Letter Template\n\n## Submitter Information\n- Company name: [Enter company name]\n- Address: [Enter address]\n- Contact person: [Enter name]\n- Phone: [Enter phone]\n- Email: [Enter email]\n\n## Device Information\n- Trade name: [Enter device name]\n- Classification name: [Enter classification]\n- Product code: [Enter product code]\n- Review panel: [Enter panel]\n\n## Predicate Device\n- Predicate device name: [Enter predicate name]\n- 510(k) number: [Enter K number]\n- Manufacturer: [Enter manufacturer]\n\n## Statement\nI certify that the information provided is true and accurate.\n\nSignature: _______________\nDate: [Enter date]\n`
  },
  'risk-assessment': {
    filename: 'Risk_Assessment_Template.md',
    contentType: 'text/markdown',
    content: `# Risk Assessment Report Template\n\n## 1. Scope\n- Product: [Enter product name]\n- Assessment date: [Enter date]\n- Assessor: [Enter name]\n\n## 2. Hazard Identification\n| Hazard ID | Hazard Description | Affected Users | Phase |\n|-----------|-------------------|----------------|-------|\n| H-001 | [Describe hazard] | [Users] | [Phase] |\n\n## 3. Risk Estimation\n| Hazard ID | Severity | Probability | Risk Level |\n|-----------|----------|-------------|------------|\n| H-001 | [1-4] | [1-4] | [Low/Medium/High] |\n\n## 4. Risk Control Measures\n| Hazard ID | Control Measure | Residual Risk |\n|-----------|----------------|---------------|\n| H-001 | [Describe measure] | [Level] |\n\n## 5. Overall Risk Assessment\n- Conclusion: [Acceptable/Not acceptable]\n- Date: [Enter date]\n- Signature: _______________\n`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const template = DOCUMENT_TEMPLATES[docId]
    
    if (!template) {
      return NextResponse.json(
        { error: 'Document template not found' },
        { status: 404 }
      )
    }

    return new NextResponse(template.content, {
      status: 200,
      headers: {
        'Content-Type': template.contentType,
        'Content-Disposition': `attachment; filename="${template.filename}"`,
      },
    })

  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
