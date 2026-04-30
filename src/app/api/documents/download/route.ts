import { NextRequest, NextResponse } from 'next/server'

const DOCUMENT_TEMPLATES: Record<string, { filename: string; contentType: string; content: string }> = {
  'ce-technical-file': {
    filename: 'CE_Technical_File_Template.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: `CE Technical File Template

1. Product Description
- Product name: [Enter product name]
- Model/type: [Enter model]
- Intended use: [Describe intended use]
- Classification: Category II/III per EU 2016/425

2. Risk Assessment
- Hazard identification per EN ISO 12100
- Risk estimation and evaluation
- Risk control measures
- Residual risk assessment

3. Applicable Standards
- [List applicable EN standards]

4. Test Reports
- [Attach test reports from accredited labs]

5. Manufacturing Process
- Production flow chart
- Quality control points
- Material specifications

6. Quality Control
- Incoming inspection
- In-process inspection
- Final inspection

7. Labeling & Instructions
- CE marking requirements
- User instructions per Annex II
- Multi-language requirements

Note: This is a text representation. In production, this will be a proper Word document (.docx) format as required by EU notified bodies and market surveillance authorities.
`
  },
  'ce-doc': {
    filename: 'EU_Declaration_of_Conformity.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: `EU Declaration of Conformity

Manufacturer
- Company name: [Enter company name]
- Address: [Enter address]

Product
- Product name: [Enter product name]
- Model/type: [Enter model]
- Serial/batch number: [Enter number]

Conformity Assessment
- The product is in conformity with EU Regulation 2016/425
- Conformity assessment procedure: [Module B + D/C2/F2]
- Notified Body: [Enter NB name and number]

Applicable Standards
- [List applicable EN standards]

Declaration
I declare that the above product is in conformity with the applicable EU legislation.

Signature: _______________
Name: [Enter name]
Title: [Enter title]
Date: [Enter date]

Note: The EU Declaration of Conformity must be provided as a Word document (.docx) or PDF as required by EU market surveillance authorities.
`
  },
  'fda-510k-cover': {
    filename: 'FDA_510k_Cover_Letter.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: `510(k) Cover Letter Template

Submitter Information
- Company name: [Enter company name]
- Address: [Enter address]
- Contact person: [Enter name]
- Phone: [Enter phone]
- Email: [Enter email]

Device Information
- Trade name: [Enter device name]
- Classification name: [Enter classification]
- Product code: [Enter product code]
- Review panel: [Enter panel]

Predicate Device
- Predicate device name: [Enter predicate name]
- 510(k) number: [Enter K number]
- Manufacturer: [Enter manufacturer]

Statement
I certify that the information provided is true and accurate.

Signature: _______________
Date: [Enter date]

Note: FDA accepts submissions in Word (.docx) and PDF formats through the eSubmitter system.
`
  },
  'risk-assessment': {
    filename: 'Risk_Assessment_Template.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: `Risk Assessment Report Template

1. Scope
- Product: [Enter product name]
- Assessment date: [Enter date]
- Assessor: [Enter name]

2. Hazard Identification
| Hazard ID | Hazard Description | Affected Users | Phase |
|-----------|-------------------|----------------|-------|
| H-001 | [Describe hazard] | [Users] | [Phase] |

3. Risk Estimation
| Hazard ID | Severity | Probability | Risk Level |
|-----------|----------|-------------|------------|
| H-001 | [1-4] | [1-4] | [Low/Medium/High] |

4. Risk Control Measures
| Hazard ID | Control Measure | Residual Risk |
|-----------|----------------|---------------|
| H-001 | [Describe measure] | [Level] |

5. Overall Risk Assessment
- Conclusion: [Acceptable/Not acceptable]
- Date: [Enter date]
- Signature: _______________

Note: Risk assessment matrices are typically provided as Excel (.xlsx) files for calculation and tracking purposes.
`
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
