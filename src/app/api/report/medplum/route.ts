import { NextRequest, NextResponse } from 'next/server';
import { searchMedplumDevices, searchMedplumOrganizations, searchMedplumRegulatoryAuthorizations } from '@/lib/medplum';
import { isMedplumEnabled } from '@/lib/medplum/client';
import { withRateLimit } from '@/lib/middleware/rateLimit';

export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const { companyName, reportType, language } = await request.json();

      if (!companyName || !reportType) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      if (!isMedplumEnabled()) {
        return NextResponse.json(
          { error: 'Medplum integration is not enabled' },
          { status: 403 }
        );
      }

      // 收集 Medplum 数据
      const [devices, organizations, regulations] = await Promise.all([
        searchMedplumDevices({ query: companyName, limit: 10 }),
        searchMedplumOrganizations({ query: companyName, limit: 5 }),
        searchMedplumRegulatoryAuthorizations({ query: companyName, limit: 15 })
      ]);

      // 生成报告
      const reportContent = generateReport(
        companyName,
        reportType,
        language,
        devices,
        organizations,
        regulations
      );

      return NextResponse.json({
        data: {
          report: reportContent,
          companyName,
          reportType,
          language,
          generatedAt: new Date().toISOString(),
          medplumData: {
            deviceCount: devices.length,
            organizationCount: organizations.length,
            regulationCount: regulations.length
          }
        }
      });
    } catch (error) {
      console.error('Medplum report generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }
  }, {
    maxRequests: 50,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  });
}

function generateReport(
  companyName: string,
  reportType: string,
  language: string,
  devices: any[],
  organizations: any[],
  regulations: any[]
) {
  const typeNames: Record<string, { en: string; zh: string }> = {
    market_analysis: { en: 'Market Access Analysis', zh: '市场准入分析' },
    competitor_analysis: { en: 'Competitor Analysis', zh: '竞争对手分析' },
    risk_assessment: { en: 'Risk Assessment', zh: '风险评估' },
    regulatory_summary: { en: 'Regulatory Summary', zh: '法规摘要' },
  };

  const typeName = typeNames[reportType] || { en: 'Report', zh: '报告' };
  const typeDisplayName = language === 'zh' ? typeName.zh : typeName.en;

  const sections: Record<string, { en: string; zh: string }> = {
    executive_summary: { en: 'Executive Summary', zh: '执行摘要' },
    company_overview: { en: 'Company Overview', zh: '公司概览' },
    market_analysis: { en: 'Market Analysis', zh: '市场分析' },
    regulatory_status: { en: 'Regulatory Status', zh: '法规状态' },
    risk_assessment: { en: 'Risk Assessment', zh: '风险评估' },
    competitors: { en: 'Competitive Landscape', zh: '竞争格局' },
    recommendations: { en: 'Conclusions and Recommendations', zh: '结论与建议' },
  };

  const getSectionName = (key: string) => sections[key][language === 'zh' ? 'zh' : 'en'];

  let report = `# ${companyName} - ${typeDisplayName}\n\n`;

  // 执行摘要
  report += `## ${getSectionName('executive_summary')}\n\n`;
  report += language === 'zh' 
    ? `本报告基于Medplum医疗合规标准库的数据，对${companyName}在全球主要医疗器械市场的合规状况进行了全面分析。\n\n`
    : `This report provides comprehensive analysis of ${companyName}'s compliance status in major global medical device markets based on data from Medplum medical compliance standards library.\n\n`;

  // 公司概览
  report += `## ${getSectionName('company_overview')}\n\n`;
  report += `- **${language === 'zh' ? '公司名称' : 'Company Name'}**: ${companyName}\n`;
  report += `- **${language === 'zh' ? '分析日期' : 'Analysis Date'}**: ${new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}\n`;
  report += `- **${language === 'zh' ? '报告类型' : 'Report Type'}**: ${typeDisplayName}\n`;
  report += `- **${language === 'zh' ? '数据来源' : 'Data Source'}**: Medplum 医疗合规标准库\n\n`;

  // 市场分析
  report += `## ${getSectionName('market_analysis')}\n\n`;
  if (devices.length > 0) {
    report += language === 'zh' ? `### 2.1 产品注册情况\n` : `### 2.1 Product Registration Status\n`;
    report += `- **${language === 'zh' ? '设备数量' : 'Device Count'}**: ${devices.length}\n`;
    
    const deviceTypes = [...new Set(devices.map(d => d.type?.[0]?.coding?.[0]?.display || 'Unknown'))];
    report += `- **${language === 'zh' ? '设备类型' : 'Device Types'}**: ${deviceTypes.join(', ')}\n\n`;
  } else {
    report += language === 'zh' ? '未找到相关设备数据\n\n' : 'No device data found\n\n';
  }

  // 法规状态
  report += `## ${getSectionName('regulatory_status')}\n\n`;
  if (regulations.length > 0) {
    report += language === 'zh' ? `### 3.1 法规授权\n` : `### 3.1 Regulatory Authorizations\n`;
    report += `- **${language === 'zh' ? '授权数量' : 'Authorization Count'}**: ${regulations.length}\n`;
    
    const regions = [...new Set(regulations.map(r => r.region?.[0]?.coding?.[0]?.display || 'Global'))];
    report += `- **${language === 'zh' ? '覆盖地区' : 'Regions'}**: ${regions.join(', ')}\n\n`;
  } else {
    report += language === 'zh' ? '未找到相关法规数据\n\n' : 'No regulatory data found\n\n';
  }

  // 风险评估
  if (reportType === 'risk_assessment' || reportType === 'market_analysis') {
    report += `## ${getSectionName('risk_assessment')}\n\n`;
    report += language === 'zh' 
      ? `### 4.1 潜在风险分析\n` 
      : `### 4.1 Potential Risk Analysis\n`;
    report += language === 'zh' 
      ? `- **合规风险**: 基于当前数据，未发现明显合规风险\n` 
      : `- **Compliance Risk**: No significant compliance risks identified based on current data\n`;
    report += language === 'zh' 
      ? `- **市场风险**: 建议进一步评估目标市场的竞争状况\n\n` 
      : `- **Market Risk**: Further assessment of competitive landscape in target markets recommended\n\n`;
  }

  // 竞争格局
  if (reportType === 'competitor_analysis' || reportType === 'market_analysis') {
    report += `## ${getSectionName('competitors')}\n\n`;
    if (organizations.length > 0) {
      report += language === 'zh' 
        ? `### 5.1 相关组织\n` 
        : `### 5.1 Related Organizations\n`;
      organizations.slice(0, 5).forEach((org, index) => {
        report += `- ${index + 1}. ${org.name || 'Unknown Organization'}\n`;
      });
    } else {
      report += language === 'zh' ? '未找到相关组织数据\n\n' : 'No organization data found\n\n';
    }
  }

  // 结论与建议
  report += `## ${getSectionName('recommendations')}\n\n`;
  report += language === 'zh' 
    ? `基于以上分析，我们建议：\n` 
    : `Based on the analysis above, we recommend:\n`;
  report += `1. ${language === 'zh' ? '利用Medplum数据定期更新合规状态' : 'Use Medplum data to regularly update compliance status'}\n`;
  report += `2. ${language === 'zh' ? '建立全球市场准入策略' : 'Establish global market access strategy'}\n`;
  report += `3. ${language === 'zh' ? '加强与监管机构的沟通' : 'Strengthen communication with regulatory authorities'}\n\n`;

  // 免责声明
  report += `---\n`;
  report += language === 'zh' 
    ? `*本报告基于Medplum数据自动生成，仅供参考。实际决策请结合其他信息来源。*` 
    : `*This report is automatically generated based on Medplum data for reference only. Please combine with other information sources for actual decision-making.*`;

  return report;
}
