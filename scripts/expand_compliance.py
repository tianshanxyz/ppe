import json, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'src', 'data', 'ppe')
filepath = os.path.join(data_dir, 'compliance-data.json')

with open(filepath, 'r') as f:
    existing = json.load(f)

print(f"Existing entries: {len(existing)}")

new_entries = [
    # === HIGH-VISIBILITY for existing markets (missing category) ===
    {
        "category_id": "high-visibility",
        "market_code": "EU",
        "classification": "Category II",
        "standards": [
            {"name": "EN ISO 20471:2013", "title": "High visibility clothing - Test methods and requirements", "url": "https://www.iso.org/standard/42815.html"},
            {"name": "EN 1150:1999", "title": "Protective clothing - High visibility clothing for non-professional use", "url": ""}
        ],
        "certification_requirements": ["CE Marking under EU 2016/425", "EU Type Examination (Module B)", "Module C - Internal Production Control"],
        "estimated_cost": {"min": 8000, "max": 25000, "currency": "EUR"},
        "estimated_timeline": {"min": 4, "max": 8, "unit": "months"},
        "customs_documents": ["CE Certificate", "EU DoC", "Test Reports per EN ISO 20471", "Commercial Invoice"],
        "risk_warnings": ["Class 1/2/3 based on risk level of work environment", "Retroreflective material performance critical"]
    },
    {
        "category_id": "high-visibility",
        "market_code": "US",
        "classification": "ANSI Class 1/2/3 (Type O/R/P)",
        "standards": [
            {"name": "ANSI/ISEA 107-2020", "title": "High-Visibility Safety Apparel", "url": "https://safetyequipment.org/standard/ansiisea-107/"}
        ],
        "certification_requirements": ["Third-party certification to ANSI/ISEA 107", "Labeling with performance class", "Garment type designation"],
        "estimated_cost": {"min": 3000, "max": 15000, "currency": "USD"},
        "estimated_timeline": {"min": 1, "max": 3, "unit": "months"},
        "customs_documents": ["Test Reports to ANSI/ISEA 107", "Certificate of Compliance", "Commercial Invoice"],
        "risk_warnings": ["Specific requirement based on work zone type (Roadway vs Off-road)", "Flame resistance optional"]
    },
    {
        "category_id": "high-visibility",
        "market_code": "CN",
        "classification": "GB 20653 Class 1/2/3",
        "standards": [
            {"name": "GB 20653-2020", "title": "高可视性警示服 (High-visibility warning clothing)", "url": ""}
        ],
        "certification_requirements": ["LA Safety Mark (特种劳动防护用品安全标志)", "型式检验(Type Test)", "Manufacturing license inspection"],
        "estimated_cost": {"min": 8000, "max": 35000, "currency": "CNY"},
        "estimated_timeline": {"min": 3, "max": 6, "unit": "months"},
        "customs_documents": ["LA证书", "型式检验报告", "Product test report to GB 20653", "Commercial Invoice"],
        "risk_warnings": ["荧光材料和反光材料面积需满足Class等级要求", "洗涤次数后的性能保持"]
    },
    # === JAPAN MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "JP",
        "classification": "型式検定対象 (Type Approval Required)",
        "standards": [
            {"name": "JIS T 8151:2023", "title": "Particulate respirators", "url": "https://www.jisc.go.jp/"},
            {"name": "JIS T 8159:2020", "title": "Gas respirators", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["型式検定 (National Type Approval) from MHLW", "型式検定合格番号 mandatory on product", "Manufacturing and quality system registration", "Japanese labeling mandatory"],
        "estimated_cost": {"min": 500000, "max": 2000000, "currency": "JPY"},
        "estimated_timeline": {"min": 6, "max": 12, "unit": "months"},
        "customs_documents": ["型式検定合格証 (Type Approval Certificate)", "Test Reports from designated laboratory", "製造販売届 (Business notification)", "Commercial Invoice"],
        "risk_warnings": ["National Type Approval testing in Japan (or MHLW-recognized overseas lab)", "DS1/DS2/DS3 classification must match product", "Japanese language instructions only"]
    },
    {
        "category_id": "eye-face-protection",
        "market_code": "JP",
        "classification": "JIS Standard Conformity",
        "standards": [
            {"name": "JIS T 8147:2016", "title": "Eye protectors", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["JIS certification (voluntary but strongly recommended)", "型式検定 for high-risk applications", "Product testing at JIS-accredited labs", "Japanese marking"],
        "estimated_cost": {"min": 300000, "max": 1000000, "currency": "JPY"},
        "estimated_timeline": {"min": 3, "max": 6, "unit": "months"},
        "customs_documents": ["JIS Test Reports", "製造販売届", "Commercial Invoice"],
        "risk_warnings": ["JIS与海外标准的差异性需谨慎评估", "防雾性能在日本市场特别重要"]
    },
    {
        "category_id": "head-protection",
        "market_code": "JP",
        "classification": "型式検定対象",
        "standards": [
            {"name": "JIS T 8131:2016", "title": "Industrial safety helmets", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["型式検定 (飛来・落下物用保護帽)", "電気用保護帽 (electrical) separate approval", "衝撃吸収性能测试 mandatory", "年度检查记录制度"],
        "estimated_cost": {"min": 400000, "max": 1500000, "currency": "JPY"},
        "estimated_timeline": {"min": 4, "max": 8, "unit": "months"},
        "customs_documents": ["型式検定合格証", "Test Report to JIS T 8131", "Commercial Invoice"],
        "risk_warnings": ["飛来落下用（防冲击）、墜落時保護用（防坠落）、電気用（绝缘）三个子类独立认证"]
    },
    {
        "category_id": "hearing-protection",
        "market_code": "JP",
        "classification": "JIS Mark Voluntary",
        "standards": [
            {"name": "JIS T 8161:2020", "title": "Hearing protectors", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["JIS T 8161 conformity (voluntary)", "Noise reduction value (遮音値) labeling", "Japanese instructions required"],
        "estimated_cost": {"min": 200000, "max": 600000, "currency": "JPY"},
        "estimated_timeline": {"min": 2, "max": 4, "unit": "months"},
        "customs_documents": ["Test Report JIS T 8161", "遮音値 test data", "Commercial Invoice"]
    },
    {
        "category_id": "protective-gloves",
        "market_code": "JP",
        "classification": "型式検定 (chemical/electrical)",
        "standards": [
            {"name": "JIS T 8116:2020", "title": "Protective gloves for chemical hazards", "url": "https://www.jisc.go.jp/"},
            {"name": "JIS T 8112", "title": "Insulating rubber gloves", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["型式検定 for 絶縁用保護具 (electrical insulation gloves)", "型式検定 for chemical protective gloves", "Japanese labeling with 合格番号"],
        "estimated_cost": {"min": 400000, "max": 1500000, "currency": "JPY"},
        "estimated_timeline": {"min": 5, "max": 10, "unit": "months"},
        "customs_documents": ["型式検定合格証", "Lab test reports", "Commercial Invoice"],
        "risk_warnings": ["特別教育 (special education) for employers on glove selection"]
    },
    {
        "category_id": "safety-footwear",
        "market_code": "JP",
        "classification": "JIS T 8101 voluntary / 型式検定 for special types",
        "standards": [
            {"name": "JIS T 8101:2020", "title": "Safety footwear", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["JIS T 8101 voluntary certification", "JISマーク表示制度", "JSAA-type certification recommended", "Japanese labeling"],
        "estimated_cost": {"min": 300000, "max": 1000000, "currency": "JPY"},
        "estimated_timeline": {"min": 3, "max": 6, "unit": "months"},
        "customs_documents": ["JIS Test Certificate", "Commercial Invoice"]
    },
    {
        "category_id": "protective-clothing",
        "market_code": "JP",
        "classification": "Type Approval / JIS Voluntary",
        "standards": [
            {"name": "JIS T 8115:2015", "title": "Protective clothing for chemical hazards", "url": "https://www.jisc.go.jp/"},
            {"name": "JIS T 8122:2015", "title": "Protective clothing for biological hazards", "url": "https://www.jisc.go.jp/"}
        ],
        "certification_requirements": ["型式検定 for certain chemical suits", "JIS certification", "PMD Act registration if medical use", "Japanese documentation"],
        "estimated_cost": {"min": 500000, "max": 2000000, "currency": "JPY"},
        "estimated_timeline": {"min": 6, "max": 12, "unit": "months"},
        "customs_documents": ["型式検定合格証 or JIS certificate", "Test Reports", "PMDA notification (medical only)", "Commercial Invoice"]
    },
    # === KOREA MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "KR",
        "classification": "KCs Safety Certification (안전인증대상)",
        "standards": [
            {"name": "KOSHA Guide H-82-2020", "title": "Technical standard for dust respirators", "url": "https://www.kosha.or.kr/"},
            {"name": "KOSHA Guide H-83-2020", "title": "Technical standard for gas respirators", "url": "https://www.kosha.or.kr/"}
        ],
        "certification_requirements": ["KCs 안전인증 (Safety Certification) mandatory", "KOSHA laboratory testing", "Factory quality system audit", "Annual follow-up inspection", "Korean language labeling (KC logo)"],
        "estimated_cost": {"min": 5000000, "max": 20000000, "currency": "KRW"},
        "estimated_timeline": {"min": 4, "max": 8, "unit": "months"},
        "customs_documents": ["KCs Certification Certificate (안전인증서)", "KOSHA Test Report", "Factory Audit Report", "Commercial Invoice"],
        "risk_warnings": ["KCs证书有效期3年", "年度监督审计不可遗漏", "KC标志样式需严格遵循规格"]
    },
    {
        "category_id": "protective-clothing",
        "market_code": "KR",
        "classification": "KCs Safety / Self-Regulatory",
        "standards": [
            {"name": "KOSHA Guide H-91", "title": "Chemical protective clothing", "url": "https://www.kosha.or.kr/"}
        ],
        "certification_requirements": ["KCs for chemical protective suits (안전인증)", "자율안전확인신고 (Self-regulatory declaration) for general protective clothing", "KOSHA lab testing", "Korean labeling"],
        "estimated_cost": {"min": 5000000, "max": 25000000, "currency": "KRW"},
        "estimated_timeline": {"min": 5, "max": 10, "unit": "months"},
        "customs_documents": ["안전인증서 or 자율안전확인신고증명서", "Test Reports", "Commercial Invoice"]
    },
    # === BRAZIL MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "BR",
        "classification": "CA (Certificado de Aprovação) - Required",
        "standards": [
            {"name": "ABNT NBR 13698:2021", "title": "Respiratory protective devices - Filtering half masks", "url": "https://www.abnt.org.br/"},
            {"name": "ABNT NBR 13697:2021", "title": "Respiratory protective devices - Particulate filters", "url": "https://www.abnt.org.br/"}
        ],
        "certification_requirements": ["CA证书 (Certificado de Aprovação) mandatory - No CA = cannot sell in Brazil", "INMETRO-accredited lab testing in Brazil", "Product must remain identical to tested sample", "CA validity: 5 years", "Brazilian Portuguese labeling", "Importers must also hold CA for imported products"],
        "estimated_cost": {"min": 15000, "max": 60000, "currency": "BRL"},
        "estimated_timeline": {"min": 6, "max": 12, "unit": "months"},
        "customs_documents": ["CA Certificate (original)", "INMETRO/MTE lab reports", "Technical File (Portuguese)", "Invoice showing CA number", "Import Declaration (DI)"],
        "risk_warnings": ["CA证书必须在产品本体永久标注", "进口商须为每款产品单独申请CA", "任何原材料或工艺变更均须重新测试更新CA"]
    },
    {
        "category_id": "protective-clothing",
        "market_code": "BR",
        "classification": "CA Certificate - Mandatory",
        "standards": [
            {"name": "ABNT NBR ISO 16602", "title": "Chemical protective clothing", "url": "https://www.abnt.org.br/"}
        ],
        "certification_requirements": ["CA Certificate for all PPE", "INMETRO lab testing", "CA number markup on garment", "Portuguese labeling"],
        "estimated_cost": {"min": 12000, "max": 50000, "currency": "BRL"},
        "estimated_timeline": {"min": 6, "max": 12, "unit": "months"},
        "customs_documents": ["CA证书", "ABNT lab reports", "Commercial Invoice"],
        "risk_warnings": ["CA过期后产品不得销售", "特别严格的产品与送检样品一致要求"]
    },
    # === INDIA MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "IN",
        "classification": "BIS ISI Mark (QCO Mandatory)",
        "standards": [
            {"name": "IS 9473:2002", "title": "Respiratory protective devices - Particulate respirators", "url": "https://www.bis.gov.in/"},
            {"name": "IS 9623:2008", "title": "Half masks and full face masks", "url": "https://www.bis.gov.in/"}
        ],
        "certification_requirements": ["BIS ISI Mark mandatory under QCO", "BIS FMCS (Foreign Manufacturer Certification Scheme) for imports", "Indian Authorized Representative (AIR) required", "Factory audit by BIS officers", "BIS license validity: 1-2 years", "Indian language labeling"],
        "estimated_cost": {"min": 300000, "max": 1500000, "currency": "INR"},
        "estimated_timeline": {"min": 6, "max": 14, "unit": "months"},
        "customs_documents": ["BIS ISI License Certificate", "BIS Test Reports", "AIR Agreement documentation", "Commercial Invoice"],
        "risk_warnings": ["BIS许可证年度更新+审计", "使用未经BIS认证的PPE产品可导致进口禁令", "抽样检测不合格会立即暂停进口"]
    },
    {
        "category_id": "eye-face-protection",
        "market_code": "IN",
        "classification": "BIS ISI mark (QCO)",
        "standards": [
            {"name": "IS 5983:2000", "title": "Eye protectors - Specification", "url": "https://www.bis.gov.in/"}
        ],
        "certification_requirements": ["BIS ISI certification mandatory", "Tests at BIS-recognized labs", "AIR required for foreign manufacturers"],
        "estimated_cost": {"min": 200000, "max": 800000, "currency": "INR"},
        "estimated_timeline": {"min": 4, "max": 10, "unit": "months"},
        "customs_documents": ["BIS License", "IS 5983 test reports", "AIR agreement", "Commercial Invoice"]
    },
    # === AUSTRALIA MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "AU",
        "classification": "Mandatory standards + TGA (medical use)",
        "standards": [
            {"name": "AS/NZS 1716:2012", "title": "Respiratory protective devices", "url": "https://www.standards.org.au/"},
            {"name": "AS/NZS 1715:2009", "title": "Selection, use and maintenance of respiratory protective equipment", "url": "https://www.standards.org.au/"}
        ],
        "certification_requirements": ["AS/NZS 1716 conformity required", "TGA ARTG registration for medical respirators", "NATA-accredited lab testing", "Australian Sponsor required for TGA registration"],
        "estimated_cost": {"min": 15000, "max": 60000, "currency": "AUD"},
        "estimated_timeline": {"min": 5, "max": 10, "unit": "months"},
        "customs_documents": ["AS/NZS 1716 Test Reports", "ARTG Certificate (medical)", "Commercial Invoice"],
        "risk_warnings": ["P1/P2/P3 classification system", "TGA经常抽查检测（特别是进口防护产品）"]
    },
    {
        "category_id": "eye-face-protection",
        "market_code": "AU",
        "classification": "Compliance with AS/NZS 1337 series",
        "standards": [
            {"name": "AS/NZS 1337.1:2010", "title": "Eye and face protectors for occupational applications", "url": "https://www.standards.org.au/"}
        ],
        "certification_requirements": ["AS/NZS 1337.1 proof of conformity", "ARTG registration for medical-type eye protection", "NATA testing"],
        "estimated_cost": {"min": 5000, "max": 20000, "currency": "AUD"},
        "estimated_timeline": {"min": 3, "max": 6, "unit": "months"},
        "customs_documents": ["NATA test reports", "AS/NZS 1337.1 compliance statement", "ARTG (if medical)", "Commercial Invoice"]
    },
    # === CANADA MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "CA",
        "classification": "CSA certified + Health Canada MDL (medical)",
        "standards": [
            {"name": "CSA Z94.4-18", "title": "Selection, use, and care of respirators", "url": "https://www.csagroup.org/"},
            {"name": "CAN/CSA-Z94.4.1", "title": "Performance of filtering respirators", "url": "https://www.csagroup.org/"}
        ],
        "certification_requirements": ["CSA certification or equivalent third-party certification", "Health Canada MDL for medical respirators", "ISO 13485/MDSAP QMS for medical devices", "Bilingual labeling (English/French)"],
        "estimated_cost": {"min": 10000, "max": 60000, "currency": "CAD"},
        "estimated_timeline": {"min": 4, "max": 10, "unit": "months"},
        "customs_documents": ["CSA certificate", "Health Canada MDL (medical)", "MDSAP certificate", "Bilingual instruction manual", "Commercial Invoice"],
        "risk_warnings": ["双语标签(E/F)是法律要求不是建议", "CSA Z94.4.1中的NIOSH等效标准"]
    },
    {
        "category_id": "eye-face-protection",
        "market_code": "CA",
        "classification": "CSA Z94.3 certification",
        "standards": [
            {"name": "CSA Z94.3-20", "title": "Eye and face protectors", "url": "https://www.csagroup.org/"}
        ],
        "certification_requirements": ["CSA Z94.3 third-party certification", "Bilingual labeling", "Product testing in CSA-accredited lab"],
        "estimated_cost": {"min": 5000, "max": 20000, "currency": "CAD"},
        "estimated_timeline": {"min": 3, "max": 6, "unit": "months"},
        "customs_documents": ["CSA certification", "Test Reports", "Bilingual user manual", "Commercial Invoice"]
    },
    # === EAEU MARKET ===
    {
        "category_id": "respiratory-protection",
        "market_code": "EAEU",
        "classification": "EAC Class 2 (Certificate Required)",
        "standards": [
            {"name": "ГОСТ 12.4.294-2015 (EN 149:2001)", "title": "Filtering half masks (GOST equivalent)", "url": ""}
        ],
        "certification_requirements": ["EAC Certificate of Conformity (Class 2 PPE)", "Testing at EAEU-accredited laboratory", "Manufacturing audit for serial production", "EAEU Authorized Representative required", "Russian language labeling and instructions", "EAC marking on product"],
        "estimated_cost": {"min": 5000, "max": 25000, "currency": "USD"},
        "estimated_timeline": {"min": 4, "max": 10, "unit": "months"},
        "customs_documents": ["EAC Certificate of Conformity", "GOST Test Reports", "Authorized Representative agreement", "Russian language user manual", "Commercial Invoice"],
        "risk_warnings": ["EAC授权代表必须是EAEU境内的实体", "证书有效期1-5年需年度监督", "海关联盟成员国的法规要求统一但执行各异"]
    },
    # === TURKEY ===
    {
        "category_id": "respiratory-protection",
        "market_code": "TR",
        "classification": "CE Category II/III (EU aligned)",
        "standards": [
            {"name": "TS EN 149", "title": "Turkish adoption of EN 149", "url": "https://www.tse.org.tr/"}
        ],
        "certification_requirements": ["CE marking (aligned with EU)", "Turkish Notified Body assessment (Onaylanmış Kuruluş)", "Turkish language user instructions", "TSE certification preferred"],
        "estimated_cost": {"min": 12000, "max": 40000, "currency": "EUR"},
        "estimated_timeline": {"min": 5, "max": 10, "unit": "months"},
        "customs_documents": ["CE Certificate from Turkish NB", "Turkish DoC", "TSE Test Reports", "Commercial Invoice"]
    },
    # === SINGAPORE ===
    {
        "category_id": "respiratory-protection",
        "market_code": "SG",
        "classification": "General compliance + HSA Class B (medical)",
        "standards": [
            {"name": "SS 548:2020", "title": "Code of practice for selection, use and maintenance of respiratory protective devices", "url": "https://www.singaporestandardseshop.sg/"}
        ],
        "certification_requirements": ["HSA medical device registration (Class B)", "ISO 13485 QMS", "Singapore local agent/registrant", "English language instructions"],
        "estimated_cost": {"min": 8000, "max": 30000, "currency": "SGD"},
        "estimated_timeline": {"min": 3, "max": 8, "unit": "months"},
        "customs_documents": ["HSA Registration Certificate", "ISO 13485 certificate", "Test Reports", "Commercial Invoice"]
    },
    # === MEXICO ===
    {
        "category_id": "respiratory-protection",
        "market_code": "MX",
        "classification": "NOM mandatory + COFEPRIS (medical)",
        "standards": [
            {"name": "NOM-116-STPS-2009", "title": "Respiratory protective equipment", "url": "https://www.gob.mx/stps"}
        ],
        "certification_requirements": ["NOM certification for occupational respirators", "COFEPRIS registro sanitario for medical masks/respirators", "Testing at EMA-accredited Mexican labs", "Spanish-language labeling"],
        "estimated_cost": {"min": 6000, "max": 30000, "currency": "USD"},
        "estimated_timeline": {"min": 5, "max": 10, "unit": "months"},
        "customs_documents": ["NOM certificate", "COFEPRIS registration (medical)", "Mexican lab test reports", "Spanish manual", "Commercial Invoice"]
    },
    # === SOUTH AFRICA ===
    {
        "category_id": "respiratory-protection",
        "market_code": "ZA",
        "classification": "NRCS Letter of Authority",
        "standards": [
            {"name": "SANS 50149 (EN 149 adopted)", "title": "Respiratory protective devices - Filtering half masks", "url": "https://www.sabs.co.za/"}
        ],
        "certification_requirements": ["NRCS Letter of Authority for import", "SANS/SABS testing", "Batch approval recommended", "English/Afrikaans instructions"],
        "estimated_cost": {"min": 6000, "max": 25000, "currency": "USD"},
        "estimated_timeline": {"min": 3, "max": 8, "unit": "months"},
        "customs_documents": ["NRCS LoA", "SANS test reports", "SABS certificate (optional)", "Commercial Invoice"]
    }
]

existing.extend(new_entries)

with open(filepath, 'w') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_entries)} new entries")
print(f"Total entries now: {len(existing)}")

# Verify and analyze
markets = set(e['market_code'] for e in existing)
cats = set(e['category_id'] for e in existing)
pairs = set((e['category_id'], e['market_code']) for e in existing)
print(f"Markets: {sorted(markets)}")
print(f"Categories: {sorted(cats)}")
print(f"Total category-market pairs: {len(pairs)}")