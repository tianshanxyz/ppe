import json, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'src', 'data', 'ppe')
filepath = os.path.join(data_dir, 'regulations-fulltext.json')

with open(filepath, 'r') as f:
    existing = json.load(f)

print(f"Existing entries: {len(existing)}")

new_entries = [
    # === UK MARKET ===
    {
        "id": "uk-ppe-reg-2016-425-retained",
        "category_id": "respiratory-protection",
        "market_code": "UK",
        "title": "PPE Regulation 2016/425 (as retained in UK law) - UKCA Conformity Assessment",
        "title_zh": "PPE法规2016/425（英国保留立法版）- UKCA合规评定",
        "regulation_number": "PPE Regulation 2016/425 (UK retained)",
        "document_type": "regulation",
        "issuing_authority": "UK Government - OPSS (Office for Product Safety and Standards)",
        "effective_date": "2021-01-01",
        "status": "active",
        "summary": "UK retained version of EU 2016/425 post-Brexit, requiring UKCA marking for PPE placed on the GB market. CE marking accepted during transition until 30 June 2025.",
        "summary_zh": "英国脱欧后保留的EU 2016/425版本，要求投放GB市场的PPE产品加贴UKCA标志。过渡期内（至2025年6月30日）CE标志仍可接受。",
        "full_text": "## Key Differences from EU 2016/425\n\n### UKCA Marking\n- UK Conformity Assessed (UKCA) marking replaces CE for GB market\n- Transition period: CE marks accepted until 30 June 2025\n- Separate UK Approved Body system replaces EU Notified Bodies\n\n### Northern Ireland\n- UKNI marking required alongside CE for NI market\n- NI continues to follow EU regulations under the Northern Ireland Protocol\n\n### PPE Categories\n- Category I (Minimal risk): Self-declaration (Module A)\n- Category II (Intermediate risk): UK type examination (Module B) + Module C\n- Category III (Complex risk): UK type examination + Module C2/D\n\n### UK Approved Bodies\n- List maintained by OPSS (replaces NANDO)\n- UK-based Approved Bodies conduct conformity assessments\n\n### UK Declaration of Conformity\n- Replaces EU Declaration of Conformity\n- Must reference UK designated standards (same as EU harmonized standards initially)"
    },
    {
        "id": "uk-mhppmd-2019-medical-ppe",
        "category_id": "protective-clothing",
        "market_code": "UK",
        "title": "Medical Devices Regulations 2002/UK MDR 2019 (Medical PPE in Healthcare)",
        "title_zh": "英国医疗器械法规2002/MDR 2019（医疗环境PPE）",
        "regulation_number": "UK MDR 2019",
        "document_type": "regulation",
        "issuing_authority": "MHRA (Medicines and Healthcare products Regulatory Agency)",
        "effective_date": "2019-01-01",
        "status": "active",
        "summary": "UK regulations for medical devices including surgical masks, examination gloves, and protective apparel classified as medical devices. MHRA registration required.",
        "summary_zh": "英国医疗器械法规，涵盖外科口罩、检查手套和分类为医疗器械的防护服装。需MHRA注册。",
        "full_text": "## Classification\n\n- Class I (low risk): Examination gloves, surgical masks\n- Class IIa (medium risk): Surgical drapes, sterile gloves\n- Class IIb: Some specialized protective equipment\n- Class III: Highest risk devices\n\n## Registration\n- All medical devices must be registered with MHRA\n- UK Responsible Person required for non-UK manufacturers\n- Device registration on the MHRA Device Online Registration System (DORS)"
    },
    # === JAPAN MARKET ===
    {
        "id": "jp-industrial-safety-health-act-ppe",
        "category_id": "respiratory-protection",
        "market_code": "JP",
        "title": "Industrial Safety and Health Act (労働安全衛生法) - PPE Provisions",
        "title_zh": "日本劳动安全卫生法 - PPE相关规定",
        "regulation_number": "Act No. 57 of 1972 (amended)",
        "document_type": "regulation",
        "issuing_authority": "厚生労働省 (MHLW)",
        "effective_date": "1972-06-08",
        "status": "active",
        "summary": "Japan's primary occupational safety law requiring employers to provide appropriate PPE and employees to use it. Mandates government type-approval (型式検定) for certain high-risk PPE.",
        "summary_zh": "日本主要的职业安全法律，要求雇主提供适当的PPE并强制员工使用。高风险PPE须通过政府型式检定。",
        "full_text": "## Key Provisions\n\n### Article 42 (型式検定 - Type Approval)\n- Certain PPE must pass government type-approval testing\n- Products subject to approval: dust respirators, gas masks, air line respirators, SCBA, safety helmets, protective gloves, safety belts\n- Approval granted by MHLW after testing at authorized institutions\n\n### Article 45 (定期自主検査)\n- Employers must conduct periodic self-inspections of PPE\n- Inspection records must be kept for 3 years\n\n### Article 20-25 (事業者の責務)\n- Employers must provide appropriate PPE and ensure proper use\n- Risk assessment required prior to PPE selection\n- Training on correct PPE use mandatory"
    },
    {
        "id": "jp-pmd-act-medical-ppe",
        "category_id": "protective-clothing",
        "market_code": "JP",
        "title": "Act on Securing Quality, Efficacy and Safety of Pharmaceuticals and Medical Devices (PMD Act) - Medical PPE",
        "title_zh": "药品医疗器械法（药机法）- 医疗PPE相关规定",
        "regulation_number": "Act No. 145 of 1960 (PMD Act)",
        "document_type": "regulation",
        "issuing_authority": "厚生労働省 (MHLW) / PMDA",
        "effective_date": "2014-11-25",
        "status": "active",
        "summary": "Regulates PPE classified as medical devices including surgical masks, surgical gowns, and examination gloves. Requires manufacturing/marketing business license and product certification.",
        "summary_zh": "监管被分类为医疗器械的PPE产品，包括外科口罩、手术衣和检查手套。需要制造销售业许可和产品认证。",
        "full_text": "## Medical Device Classification\n\n- Class I (一般医療機器): Basic surgical masks, examination gloves\n- Class II (管理医療機器): Surgical N95 respirators, sterile gloves\n- Class III (高度管理医療機器): Certain implantable protective devices\n- Class IV (高度管理医療機器): Life-supporting devices\n\n## Market Access Requirements\n\n- 製造販売業許可 (Manufacturing/Marketing Business License)\n- 製造業登録 (Manufacturing Registration)\n- 認証/承認 (Certification or Approval by Registered Certification Body or PMDA)\n- QMS conformity assessment (MHLW Ordinance No. 169)\n- Japanese labeling mandatory\n- 外国製造業者登録 (Foreign Manufacturer Registration)"
    },
    {
        "id": "jp-jis-t-8151-respirators",
        "category_id": "respiratory-protection",
        "market_code": "JP",
        "title": "JIS T 8151:2023 - Particulate Respirators",
        "title_zh": "JIS T 8151:2023 - 防尘口罩（颗粒物呼吸器）",
        "regulation_number": "JIS T 8151:2023",
        "document_type": "standard",
        "issuing_authority": "JISC (Japanese Industrial Standards Committee)",
        "effective_date": "2023-01-01",
        "status": "active",
        "summary": "Japanese Industrial Standard specifying requirements and test methods for particulate respirators (dust masks) used in occupational settings.",
        "summary_zh": "日本工业标准，规定了职业环境中使用的颗粒物呼吸器（防尘口罩）的要求和测试方法。",
        "full_text": "## Classification\n\n- DS1: ≥ 80% filtration efficiency, low breathing resistance\n- DS2: ≥ 95% filtration efficiency, moderate use\n- DS3: ≥ 99.9% filtration efficiency, high-risk environments\n\n## Test Methods\n- NaCl particle penetration test (0.06-0.10 μm)\n- Breathing resistance: Inhalation <50 Pa, Exhalation <50 Pa\n- Total inward leakage test on human subjects\n- Facepiece fit testing\n\n## Marking Requirements\n- JIS mark + standard number\n- Manufacturer name\n- Model/type designation\n- Filter class (DS1/DS2/DS3)\n- National test certification number"
    },
    # === KOREA MARKET ===
    {
        "id": "kr-osh-act-ppe",
        "category_id": "respiratory-protection",
        "market_code": "KR",
        "title": "Occupational Safety and Health Act (산업안전보건법) - PPE Safety Certification",
        "title_zh": "韩国产业安全保健法 - PPE安全认证制度",
        "regulation_number": "Act No. 16272 (OSH Act)",
        "document_type": "regulation",
        "issuing_authority": "고용노동부 (MOEL) / KOSHA",
        "effective_date": "2020-01-16",
        "status": "active",
        "summary": "Korean law establishing mandatory safety certification (안전인증) and self-regulatory safety confirmation (자율안전확인) for PPE, administered by KOSHA.",
        "summary_zh": "韩国法律，建立了PPE的强制安全认证和自律安全确认制度，由KOSHA管理。",
        "full_text": "## Safety Certification System (안전인증)\n\n### Products Requiring Mandatory Certification\n- Respirators (dust, gas, air-line, SCBA)\n- Safety helmets (falling object protection)\n- Safety gloves (chemical resistant)\n- Safety belts (fall arrest)\n- Protective clothing (chemical protection)\n\n### Self-Regulatory Safety Confirmation (자율안전확인신고)\n- Safety shoes\n- Safety goggles/face shields\n- Welding protective equipment\n- Hearing protection\n\n## Certification Process\n1. Application to KOSHA or designated certification body\n2. Product testing at KOSHA laboratory\n3. Factory inspection (quality system audit)\n4. Issuance of safety certification (KCs mark)\n5. Annual follow-up inspections"
    },
    {
        "id": "kr-kc-mark-technical-standards",
        "category_id": "eye-face-protection",
        "market_code": "KR",
        "title": "KC Mark Technical Standards for PPE (안전인증기준) - Eye and Face Protection",
        "title_zh": "KC标志PPE技术标准 - 眼面部防护",
        "regulation_number": "고용노동부고시 (MOEL Notification) for PPE",
        "document_type": "standard",
        "issuing_authority": "고용노동부 (MOEL) / KOSHA",
        "effective_date": "2022-01-01",
        "status": "active",
        "summary": "Korean technical standards for KC-certified eye and face protection including safety glasses, goggles, face shields and welding helmets. Requires Korean labeling.",
        "summary_zh": "韩国KC认证眼面部防护的技术标准，涵盖安全眼镜、护目镜、面罩和焊接头盔。须有韩语标识。",
        "full_text": "## Performance Requirements\n\n### Safety Glasses (보안경)\n- Impact resistance: Steel ball test (22mm, 45g from 1.3m)\n- Optical quality: Spherical power ±0.12D, Astigmatism ±0.12D\n- UV protection: UV380nm cut-off\n- Anti-fog coating\n\n### Face Shields (안면보호구)\n- Impact resistance: Steel ball test (25mm from 1.3m)\n- Coverage area specification\n- Transparency: Light transmittance ≥ 89%\n\n### Welding Protection (용접용 보안면)\n- Shade number requirements (DIN 3-13 range)\n- Auto-darkening filter response time < 0.1ms\n\n## Marking\n- KC mark + 安全认证番号 (Safety Certification Number)\n- Manufacturer name (Korean required)\n- Model, production date"
    },
    # === BRAZIL MARKET ===
    {
        "id": "br-nr-6-ppe-regulation",
        "category_id": "head-protection",
        "market_code": "BR",
        "title": "NR-6 (Norma Regulamentadora No. 6) - Personal Protective Equipment",
        "title_zh": "NR-6（劳动规范第6号）- 个人防护装备",
        "regulation_number": "NR-6 / Portaria SIT No. 1.083/2021",
        "document_type": "regulation",
        "issuing_authority": "Ministério do Trabalho e Emprego (MTE)",
        "effective_date": "2021-12-01",
        "status": "active",
        "summary": "Brazilian regulatory standard establishing mandatory CA (Certificado de Aprovação) certification for all PPE sold in Brazil, with employer obligations for PPE provision and employee responsibilities.",
        "summary_zh": "巴西劳动规范标准，规定了在巴西销售的所有PPE必须获得CA证书（合格证书），并明确雇主提供PPE的义务和员工的职责。",
        "full_text": "## CA Certificate (Certificado de Aprovação)\n\n- All PPE sold in Brazil must have a valid CA certificate\n- CA number must be permanently marked on the product\n- CA validity: 5 years (renewal required)\n- Test reports must be from INMETRO-accredited laboratories\n\n### Employer Obligations (Responsabilidades do Empregador)\n- Provide PPE free of charge to employees\n- Select PPE appropriate to the risk identified\n- Provide training on correct use, storage and maintenance\n- Replace PPE immediately when damaged or expired\n- Maintain PPE issuance records\n\n### Employee Obligations\n- Use PPE only for its intended purpose\n- Be responsible for cleaning and maintenance\n- Report PPE damage or loss to employer\n- Participate in PPE training\n\n### CAEPI System\n- INMETRO certification for certain high-risk PPE\n- Includes manufacturing site auditing\n- Product conformity testing required"
    },
    # === INDIA MARKET ===
    {
        "id": "in-bis-ppe-qco-2020",
        "category_id": "protective-gloves",
        "market_code": "IN",
        "title": "PPE Quality Control Orders (QCO) 2020-2021 - Mandatory BIS ISI Certification",
        "title_zh": "印度PPE质量控制令(QCO) - 强制BIS ISI认证",
        "regulation_number": "QCO for PPE (multiple S.O.s 2020-2021)",
        "document_type": "regulation",
        "issuing_author": "Ministry of Commerce and Industry / DPIIT / BIS",
        "effective_date": "2021-01-01",
        "status": "active",
        "summary": "Mandatory BIS ISI certification orders for various PPE categories including safety shoes, protective gloves, eyewear protection and body protection. Products without ISI mark are prohibited from import and sale.",
        "summary_zh": "印度各类PPE产品的强制BIS ISI认证令，包括安全鞋、防护手套、眼护具和身体防护用品。没有ISI标志的产品禁止进口和销售。",
        "full_text": "## QCO Coverage\n\n### Industrial Safety Gloves (IS 6994-1, IS 4148)\n- Leather protective gloves\n- Rubber insulating gloves\n- Chemical protective gloves\n\n### Safety Footwear (IS 15298 Parts 1-4)\n- Leather safety boots and shoes\n- Polymeric safety footwear\n\n### Eye Protection (IS 5983)\n- Safety spectacles, goggles, face shields\n\n### Body Protection (IS 15741, IS 15809)\n- High visibility warning clothing\n- Chemical protective clothing\n\n## Certification Requirements\n- BIS ISI Mark certification mandatory\n- Foreign manufacturers must apply through BIS FMCS (Foreign Manufacturer Certification Scheme)\n- Indian Authorized Representative required for FMCS\n- Factory inspection by BIS officers\n- Market surveillance by BIS through random sampling"
    },
    # === AUSTRALIA MARKET ===
    {
        "id": "au-as-nzs-1716-respirators",
        "category_id": "respiratory-protection",
        "market_code": "AU",
        "title": "AS/NZS 1716:2012 - Respiratory Protective Devices",
        "title_zh": "AS/NZS 1716:2012 - 呼吸防护设备",
        "regulation_number": "AS/NZS 1716:2012",
        "document_type": "standard",
        "issuing_authority": "Standards Australia / Standards New Zealand",
        "effective_date": "2012-01-01",
        "status": "active",
        "summary": "Australian/New Zealand Standard specifying requirements for respiratory protective devices including classification, testing, marking and performance requirements.",
        "summary_zh": "澳大利亚/新西兰标准，规定了呼吸防护设备的要求，包括分类、测试、标识和性能要求。",
        "full_text": "## Classification\n\n- P1: ≥ 80% filtration against particulates (similar to FFP1)\n- P2: ≥ 94% filtration (similar to FFP2/N95)\n- P3: ≥ 99.95% filtration (similar to FFP3)\n\n## Performance Tests\n- Filter penetration: NaCl aerosol at 95 L/min\n- Breathing resistance: Inhalation <70 Pa (P1), <240 Pa (P3)\n- Total inward leakage: Human subject panel test\n- CO2 build-up in dead space\n\n## Marking\n- AS/NZS 1716 compliance label\n- Filter class (P1/P2/P3)\n- Manufacturer and model identification\n- Batch/lot number\n- Australian sponsor name and contact"
    },
    # === CANADA MARKET ===
    {
        "id": "ca-medical-device-reg-ppe",
        "category_id": "protective-clothing",
        "market_code": "CA",
        "title": "Medical Devices Regulations (SOR/98-282) - Medical PPE",
        "title_zh": "加拿大医疗器械法规(SOR/98-282) - 医疗PPE",
        "regulation_number": "SOR/98-282 (Medical Devices Regulations)",
        "document_type": "regulation",
        "issuing_authority": "Health Canada",
        "effective_date": "1998-07-01",
        "status": "active",
        "summary": "Canadian regulation covering PPE classified as medical devices (surgical masks, N95 respirators, surgical gowns, examination gloves). MDL (Medical Device Licence) required for Class II-IV.",
        "summary_zh": "加拿大法规，涵盖分类为医疗器械的PPE（外科口罩、N95呼吸器、手术衣、检查手套）。Class II-IV需MDL上市许可。",
        "full_text": "## Device Classification\n\n- Class I: Basic examination gloves, non-sterile gowns\n- Class II: Surgical masks, sterile gloves, surgical N95 respirators\n- Class III-IV: Higher risk devices\n\n## Market Access\n\n- Class I: Establishment Licence (MDEL) only\n- Class II-IV: Medical Device Licence (MDL) + Quality System Certificate (ISO 13485 under MDSAP)\n- Mandatory bilingual labeling (English/French)\n- MDL renewal: Annual licence review application\n\n## Post-market\n- Mandatory problem reporting (MDPR) in 10 days (death/serious) or 30 days\n- Recall classification: Type I, II, III\n- Health Canada recall database public"
    },
    # === EAEU MARKET ===
    {
        "id": "eaeu-tr-cu-019-2011-ppe",
        "category_id": "respiratory-protection",
        "market_code": "EAEU",
        "title": "TR CU 019/2011 - On Safety of Personal Protective Equipment",
        "title_zh": "TR CU 019/2011 - 个人防护装备安全技术法规",
        "regulation_number": "TR CU 019/2011",
        "document_type": "regulation",
        "issuing_authority": "Eurasian Economic Commission",
        "effective_date": "2012-06-01",
        "status": "active",
        "summary": "Technical regulation of the Customs Union (now EAEU) establishing mandatory safety requirements for PPE placed on the EAEU market (Russia, Belarus, Kazakhstan, Kyrgyzstan, Armenia).",
        "summary_zh": "海关联盟（现EAEU）技术法规，规定了投放EAEU市场（俄罗斯、白俄罗斯、哈萨克斯坦、吉尔吉斯斯坦、亚美尼亚）的PPE产品的强制安全要求。",
        "full_text": "## Scope\n\n- All PPE categories: respiratory, eye/face, head, hearing, hand, foot, fall protection, protective clothing\n- Classification: Class 1 (simple design, minimal risk), Class 2 (complex design, serious risk)\n\n## Certification Requirements\n\n### Class 1 PPE: Declaration of Conformity (EAC Declaration)\n- Manufacturer/importer self-declaration\n- Testing at accredited laboratory required\n- Registration in Unified Register of EAEU\n\n### Class 2 PPE: Certificate of Conformity (EAC Certificate)\n- Third-party certification by EAEU-accredited certification body\n- Product testing + production audit (for series production)\n- Certificate validity: 1-5 years\n- Annual inspection control\n\n## Marking\n- EAC mark mandatory\n- Product information in Russian\n- Certification body identification code\n- GOST standard reference"
    },
    # === GCC MARKET ===
    {
        "id": "gcc-gso-ppe-technical-regulation",
        "category_id": "safety-footwear",
        "market_code": "GCC",
        "title": "GSO Technical Regulation for Personal Protective Equipment - G-Mark Conformity",
        "title_zh": "GSO PPE技术法规 - G-Mark符合性认证",
        "regulation_number": "GSO TR for PPE",
        "document_type": "regulation",
        "issuing_authority": "GCC Standardization Organization (GSO)",
        "effective_date": "2018-01-01",
        "status": "active",
        "summary": "GCC-wide technical regulation requiring GCTS (GSO Conformity Tracking Symbol) marking for PPE products sold in GCC member states: Saudi Arabia, UAE, Kuwait, Qatar, Oman, Bahrain.",
        "summary_zh": "海湾合作委员会范围的技术法规，要求在GCC成员国销售的PPE产品必须加贴GCTS（海湾符合性追溯标志）。",
        "full_text": "## Scope\n\n### Affected Products\n- Respiratory protective devices (GSO standards aligned with EN)\n- Eye and face protection\n- Head protection (industrial safety helmets)\n- Safety footwear\n- Protective gloves\n- High-visibility clothing\n- Fall protection equipment\n\n## Certification Pathways\n\n### G-Mark (GSO Conformity Marking)\n- Mandatory for all PPE\n- Testing at GSO-recognized laboratories\n- Factory audit by GSO-notified certification body\n- Certificate validity: 1-3 years\n- Annual surveillance audits\n\n### GCTS (GSO Conformity Tracking Symbol)\n- Unique identifier including certification body code + certificate number\n- QR code or alphanumeric\n- Enables market traceability\n\n## Technical Requirements\n- Based primarily on ISO/EN standards adapted as GSO\n- Arabic labeling mandatory for safety information\n- Certificate holder must be registered in a GCC member state"
    },
    # === TURKEY ===
    {
        "id": "tr-ppe-regulation-2016-425-harmonized",
        "category_id": "head-protection",
        "market_code": "TR",
        "title": "PPE Regulation (2016/425/AT Uyumlu) - Turkish CE Marking",
        "title_zh": "土耳其PPE法规(与2016/425/AT协调) - 土耳其CE标志",
        "regulation_number": "Kişisel Koruyucu Donanım Yönetmeliği (2016/425 aligned)",
        "document_type": "regulation",
        "issuing_authority": "T.C. Sanayi ve Teknoloji Bakanlığı (Ministry of Industry and Technology)",
        "effective_date": "2018-04-21",
        "status": "active",
        "summary": "Turkish PPE regulation fully harmonized with EU 2016/425 through the EU-Turkey Customs Union. CE marking accepted with Turkish notified bodies.",
        "summary_zh": "土耳其PPE法规与EU 2016/425完全协调（基于EU-土耳其关税同盟）。接受CE标志认证，需使用土耳其认可的公告机构。",
        "full_text": "## Alignment\n- Full alignment with Regulation (EU) 2016/425\n- Turkish Notified Bodies (Onaylanmış Kuruluşlar) operate alongside EU NBs\n- CE marking recognized through Customs Union\n- Turkish-language user instructions mandatory\n\n## Turkish Specific Requirements\n- TSE (Turkish Standards Institution) accreditation strongly preferred\n- Turkish importer/distributor identification on labeling\n- Turkish Declaration of Conformity (Uygunluk Beyanı)\n- Market surveillance by T.C. Sanayi ve Teknoloji Bakanlığı"
    },
    # === SINGAPORE ===
    {
        "id": "sg-hsa-medical-device-ppe",
        "category_id": "protective-clothing",
        "market_code": "SG",
        "title": "Health Products (Medical Devices) Regulations 2010 - Medical PPE Registration",
        "title_zh": "新加坡健康产品（医疗器械）法规2010 - 医疗PPE注册",
        "regulation_number": "Health Products (Medical Devices) Regulations 2010",
        "document_type": "regulation",
        "issuing_authority": "Health Sciences Authority (HSA)",
        "effective_date": "2010-11-01",
        "status": "active",
        "summary": "Singapore regulations for medical devices including surgical masks, respirators, examination gloves and protective gowns classified as medical devices. HSA product registration required.",
        "summary_zh": "新加坡医疗器械法规，涵盖外科口罩、呼吸器、检查手套和分类为医疗器械的防护服。需HSA产品注册。",
        "full_text": "## Risk Classification\n- Class A (low risk): Non-sterile examination gloves, basic surgical masks\n- Class B (low-moderate): Surgical N95 respirators, sterile gloves\n- Class C (moderate-high): Some specialized PPE devices\n- Class D (high risk): Life-sustaining devices (rare for PPE)\n\n## Registration Routes\n- Class A: Exempt from product registration (listing via MEDICS)\n- Class B: Evaluation route via abridged/dossier assessment\n- Class C/D: Full evaluation route\n- Reference agencies: US FDA, EU NB, Health Canada, TGA, PMDA"
    },
    # === MEXICO ===
    {
        "id": "mx-nom-113-stps-ppe",
        "category_id": "safety-footwear",
        "market_code": "MX",
        "title": "NOM-113-STPS-2009 - Safety Footwear - Classification and Specifications",
        "title_zh": "NOM-113-STPS-2009 - 安全鞋 - 分类和规格要求",
        "regulation_number": "NOM-113-STPS-2009",
        "document_type": "standard",
        "issuing_authority": "STPS (Secretaría del Trabajo y Previsión Social)",
        "effective_date": "2010-07-01",
        "status": "active",
        "summary": "Mexican Official Standard for occupational safety footwear establishing classification, performance requirements, testing methods and mandatory certification through NOM-authorised bodies.",
        "summary_zh": "墨西哥官方标准（职业安全鞋），规定了分类、性能要求、测试方法及强制NOM认证要求。",
        "full_text": "## Classification\n\n### Type I: Leather Safety Footwear\n- Type I Class 20: Toe cap impact 200J, compression 15kN\n- Type I Class 30: Toe cap impact 200J, compression 15kN\n\n### Type II: Polymeric Safety Footwear\n- Similar to Type I classification\n\n## Performance Requirements\n- Toe cap impact: 200J (steel toe up to safety mark)\n- Compression resistance: 15kN\n- Sole resistance to oils and hydrocarbons\n- Slip resistance\n- Electrical hazard protection (EH rated)\n\n## Certification\n- Mandatory NOM certification through accredited certification bodies (OCs)\n- Product testing at approved laboratories\n- NOM mark + certification body key\n- Spanish-language labeling required"
    },
    # === SOUTH AFRICA ===
    {
        "id": "za-sans-safety-footwear-standard",
        "category_id": "safety-footwear",
        "market_code": "ZA",
        "title": "SANS 20345:2022 - Personal Protective Equipment - Safety Footwear (South African adoption of ISO 20345)",
        "title_zh": "SANS 20345:2022 - 个人防护装备-安全鞋（南非版本ISO 20345）",
        "regulation_number": "SANS 20345:2022",
        "document_type": "standard",
        "issuing_authority": "SABS (South African Bureau of Standards)",
        "effective_date": "2022-01-01",
        "status": "active",
        "summary": "South African national standard for safety footwear, aligned with ISO 20345, adopted as a compulsory specification (VC) by NRCS. NRCS Letter of Authority required for import.",
        "summary_zh": "南非国家安全鞋标准，与ISO 20345对齐,被NRCS采纳为强制规范。进口需NRCS批准书(LoA)。",
        "full_text": "## NRCS Compulsory Specification\n\n- VC 9002: Compulsory specification for safety footwear\n- Must obtain NRCS Letter of Authority (LoA) before import\n- LoA application: Submit samples + test reports to NRCS\n- Batch approval may be required per shipment\n\n## Classification\n\n- SB: Basic safety (toe cap 200J)\n- S1: SB + antistatic + energy absorption in seat region\n- S1P: S1 + penetration-resistant midsole\n- S2: S1 + water penetration & absorption resistance\n- S3: S2 + penetration-resistant midsole + cleated outsole\n\n## Testing\n- NRCS-recognized laboratories or SABS laboratories\n- Tests: Toe cap impact resistance, compression, penetration resistance, electrical resistance, slip resistance"
    },
    # === Additional key entries ===
    {
        "id": "vn-qcvn-standard-ppe",
        "category_id": "respiratory-protection",
        "market_code": "VN",
        "title": "QCVN 10:2016/BYT - National Technical Regulation for Medical Masks",
        "title_zh": "QCVN 10:2016/BYT - 医用口罩国家技术法规",
        "regulation_number": "QCVN 10:2016/BYT",
        "document_type": "standard",
        "issuing_authority": "Ministry of Health (Bộ Y Tế)",
        "effective_date": "2016-01-01",
        "status": "active",
        "summary": "Vietnam's national technical regulation for medical face masks establishing BFE, PFE, breathing resistance and microbial cleanliness requirements.",
        "summary_zh": "越南医用口罩国家技术法规，规定了BFE、PFE、呼吸阻力和微生物洁净度要求。",
        "full_text": "## Performance Requirements\n\n- Bacterial Filtration Efficiency (BFE): ≥ 95% (ASTM F2101)\n- Particulate Filtration Efficiency (PFE): ≥ 95% at 0.1μm\n- Differential Pressure (breathability): < 5.0 mm H2O/cm²\n- Microbial Cleanliness: ≤ 30 CFU/g\n\n## Regulation Conformity (CR) Mark\n- CR mark mandatory for domestically produced medical masks\n- Imported masks require quality inspection certificate\n- Vietnamese language labeling mandatory\n\n## Testing\n- Testing at MOH-designated laboratories\n- Certificate of Free Sale (CFS) for export"
    },
    {
        "id": "id-sni-ppe-regulation",
        "category_id": "protective-gloves",
        "market_code": "ID",
        "title": "SNI Mandatory Certification for PPE - Regulation of Minister of Industry",
        "title_zh": "印尼SNI强制PPE认证 - 工业部条例",
        "regulation_number": "Peraturan Menteri Perindustrian about SNI PPE",
        "document_type": "regulation",
        "issuing_authority": "BSN (Badan Standardisasi Nasional)",
        "effective_date": "2018-01-01",
        "status": "active",
        "summary": "Indonesia's mandatory SNI certification for various PPE categories including safety helmets, protective gloves, and safety footwear. SNI mark issued by LSPro certification bodies.",
        "summary_zh": "印尼强制SNI认证覆盖多类PPE产品，包括安全帽、防护手套和安全鞋。SNI标志由LSPro认证机构发放。",
        "full_text": "## Affected Products (SNI Wajib / Mandatory SNI)\n\n- Safety Helmets: SNI ISO 3873 (Industrial safety helmets)\n- Protective Gloves: SNI for rubber insulating gloves\n- Safety Footwear: SNI for safety shoes\n\n## LSPro Certification Bodies\n- BSN-accredited Product Certification Bodies (LSPro)\n- Must have SNI mark license from BSN\n- Testing at KAN-accredited laboratories\n\n## Market Access\n- SNI mark mandatory for affected products\n- Imported products must obtain SNI certification\n- Sample testing + factory audit required\n- Indonesian labeling (Bahasa Indonesia) mandatory\n- SNI certificate validity: 3-4 years with annual surveillance"
    }
]

existing.extend(new_entries)

with open(filepath, 'w') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_entries)} new entries")
print(f"Total entries now: {len(existing)}")

# Verify
with open(filepath, 'r') as f:
    verified = json.load(f)
print(f"Verification: {len(verified)} entries in file")

# Count markets
markets = set(e['market_code'] for e in verified)
cats = set(e['category_id'] for e in verified)
print(f"Markets: {sorted(markets)}")
print(f"Categories: {sorted(cats)}")