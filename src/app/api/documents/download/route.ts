import { NextRequest, NextResponse } from 'next/server'

/**
 * 文档下载 API
 * 根据文档ID返回对应的文档文件
 */
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

    // 文档文件映射表
    const documentFiles: Record<string, { filename: string; contentType: string }> = {
      'ce-technical-file': { filename: 'CE_Technical_File_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'ce-risk-assessment': { filename: 'Risk_Assessment_Template.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      'ce-doc': { filename: 'EU_Declaration_of_Conformity_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'ce-test-report': { filename: 'Test_Report_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'fda-510k-cover': { filename: 'FDA_510k_Cover_Letter_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'fda-substantial-equiv': { filename: 'Substantial_Equivalence_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'fda-device-desc': { filename: 'Device_Description_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'fda-labeling': { filename: 'FDA_Labeling_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'nmpa-registration': { filename: 'NMPA_Registration_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'nmpa-technical': { filename: 'NMPA_Technical_Requirements_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'nmpa-clinical': { filename: 'Clinical_Evaluation_Report_Template.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'ce-checklist': { filename: 'CE_Marking_Checklist.pdf', contentType: 'application/pdf' },
      'fda-510k-checklist': { filename: 'FDA_510k_Checklist.pdf', contentType: 'application/pdf' },
      'iso-13485-checklist': { filename: 'ISO_13485_Audit_Checklist.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      'ce-guide-pdf': { filename: 'CE_Marking_Guide.pdf', contentType: 'application/pdf' },
      'fda-guide-pdf': { filename: 'FDA_510k_Guide.pdf', contentType: 'application/pdf' },
      'biocompatibility-guide': { filename: 'Biocompatibility_Testing_Guide.pdf', contentType: 'application/pdf' },
      'eu-2016-425': { filename: 'EU_Regulation_2016_425.pdf', contentType: 'application/pdf' },
      'fda-act': { filename: 'FD_C_Act.pdf', contentType: 'application/pdf' },
      'china-regulation': { filename: 'China_Medical_Device_Regulation.pdf', contentType: 'application/pdf' },
      'en-149': { filename: 'EN_149_2001_A1_2009.pdf', contentType: 'application/pdf' },
      'en-14683': { filename: 'EN_14683_2019_AC_2019.pdf', contentType: 'application/pdf' },
      'astm-f2100': { filename: 'ASTM_F2100.pdf', contentType: 'application/pdf' },
    }

    const docInfo = documentFiles[docId]
    
    if (!docInfo) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // 生成文档内容（在实际生产环境中，这里应该从存储服务获取真实文件）
    // 目前返回一个模拟的文档内容
    const mockContent = generateMockDocument(docId)
    
    // 创建响应
    const response = new NextResponse(mockContent.toString(), {
      status: 200,
      headers: {
        'Content-Type': docInfo.contentType,
        'Content-Disposition': `attachment; filename="${docInfo.filename}"`,
        'Content-Length': mockContent.length.toString(),
      },
    })

    return response

  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 生成模拟文档内容
 * 在实际生产环境中，应该从云存储获取真实文件
 */
function generateMockDocument(docId: string): Buffer {
  // 返回一个简单的文本内容作为模拟
  const content = `This is a template document for ${docId}.

In a production environment, this would be a real document file downloaded from cloud storage (AWS S3, Azure Blob, etc.).

Document contents would include:
- Professional templates
- Regulatory compliance guides
- Standard operating procedures
- Checklists and forms

For now, this is a placeholder to demonstrate the download functionality.`

  return Buffer.from(content, 'utf-8')
}
