#!/usr/bin/env node
/**
 * T1.4: 中美欧法规标准数据补全
 *
 * 补全 ppe_regulations + ppe_standards
 *
 * US: ANSI/ISEA, ASTM, NIOSH, OSHA 全套标准
 * CN: GB 国标全套
 * EU: EN harmonized standards 全套
 */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ============================================================
// 美国 ANSI/ISEA 标准
// ============================================================
const ANSI_ISEA_STANDARDS = [
  { name: 'ANSI/ISEA Z87.1 - Occupational and Educational Personal Eye and Face Protection Devices', code: 'ANSI-Z87.1', region: 'US', desc: 'STANDARD | Eye/Face Protection\n\nStandard for eye and face protective devices including spectacles, goggles, face shields, and welding helmets. Covers impact resistance, optical quality, and coverage requirements.\n\nKeywords: ANSI, ISEA, Z87.1, eye protection, face protection, goggles, spectacles' },
  { name: 'ANSI/ISEA Z89.1 - Industrial Head Protection', code: 'ANSI-Z89.1', region: 'US', desc: 'STANDARD | Head Protection\n\nStandard for protective helmets for industrial workers. Defines Type I (top impact) and Type II (lateral impact) helmets with Class G/E/C electrical ratings.\n\nKeywords: ANSI, ISEA, Z89.1, hard hat, safety helmet, head protection' },
  { name: 'ANSI/ISEA 105 - Hand Protection Selection Criteria', code: 'ANSI-ISEA-105', region: 'US', desc: 'STANDARD | Hand Protection\n\nProvides performance classification for hand protection including cut, puncture, abrasion, and chemical permeation resistance ratings.\n\nKeywords: ANSI, ISEA, 105, hand protection, gloves, cut resistance' },
  { name: 'ANSI/ISEA 107 - High-Visibility Safety Apparel', code: 'ANSI-ISEA-107', region: 'US', desc: 'STANDARD | High-Visibility\n\nSpecifies requirements for high-visibility safety apparel including performance class 1, 2, and 3 garments.\n\nKeywords: ANSI, ISEA, 107, high-visibility, reflective, safety apparel' },
  { name: 'ANSI/ISEA 121 - Dropped Object Prevention Solutions', code: 'ANSI-ISEA-121', region: 'US', desc: 'STANDARD | Fall Protection\n\nStandard for dropped object prevention solutions including tool tethers, anchor attachments, and containers.\n\nKeywords: ANSI, ISEA, 121, dropped objects, fall protection, tool tethering' },
  { name: 'ANSI/ISEA Z358.1 - Emergency Eyewash and Shower Equipment', code: 'ANSI-Z358.1', region: 'US', desc: 'STANDARD | Emergency Equipment\n\nMinimum requirements for emergency eyewash and shower equipment for workplaces.\n\nKeywords: ANSI, ISEA, Z358.1, eyewash, emergency shower, decontamination' },
  { name: 'ANSI/ISEA Z308.1 - Minimum Requirements for Workplace First Aid Kits', code: 'ANSI-Z308.1', region: 'US', desc: 'STANDARD | First Aid\n\nMinimum requirements for workplace first aid kits and supplies in Class A and Class B.\n\nKeywords: ANSI, ISEA, Z308.1, first aid, workplace safety' },
  { name: 'ANSI/ISEA 138 - Performance and Classification for Impact Resistant Gloves', code: 'ANSI-ISEA-138', region: 'US', desc: 'STANDARD | Hand Protection\n\nStandard for impact resistant gloves used in industrial applications, with performance levels 1-3.\n\nKeywords: ANSI, ISEA, 138, impact gloves, hand protection' },
];

// ============================================================
// ASTM PPE 标准
// ============================================================
const ASTM_PPE_STANDARDS = [
  { name: 'ASTM F2413 - Standard Specification for Performance Requirements for Foot Protection', code: 'ASTM-F2413', region: 'US', desc: 'STANDARD | Foot Protection\n\nPerformance requirements for protective footwear including impact resistance, compression resistance, metatarsal protection, and electrical hazard protection.\n\nKeywords: ASTM, F2413, safety shoes, steel toe, protective footwear' },
  { name: 'ASTM D3578 - Standard Specification for Rubber Examination Gloves', code: 'ASTM-D3578', region: 'US', desc: 'STANDARD | Hand Protection\n\nSpecification for rubber examination gloves used in medical examinations and diagnostic procedures.\n\nKeywords: ASTM, D3578, examination gloves, rubber gloves, medical gloves' },
  { name: 'ASTM D6319 - Standard Specification for Nitrile Examination Gloves', code: 'ASTM-D6319', region: 'US', desc: 'STANDARD | Hand Protection\n\nSpecification for nitrile rubber examination gloves for medical purposes.\n\nKeywords: ASTM, D6319, nitrile gloves, examination gloves' },
  { name: 'ASTM D5250 - Standard Specification for Poly(vinyl chloride) Gloves', code: 'ASTM-D5250', region: 'US', desc: 'STANDARD | Hand Protection\n\nSpecification for polyvinyl chloride (PVC) examination gloves.\n\nKeywords: ASTM, D5250, PVC gloves, vinyl gloves' },
  { name: 'ASTM D6977 - Standard Specification for Polychloroprene Examination Gloves', code: 'ASTM-D6977', region: 'US', desc: 'STANDARD | Hand Protection\n\nSpecification for polychloroprene (neoprene) examination gloves.\n\nKeywords: ASTM, D6977, neoprene gloves, examination gloves' },
  { name: 'ASTM F2100 - Standard Specification for Performance of Materials in Medical Face Masks', code: 'ASTM-F2100', region: 'US', desc: 'STANDARD | Respiratory\n\nPerformance requirements for medical face mask materials including bacterial filtration efficiency, differential pressure, and fluid resistance.\n\nKeywords: ASTM, F2100, face masks, surgical mask, medical mask' },
  { name: 'ASTM F1862 - Resistance of Medical Face Masks to Penetration by Synthetic Blood', code: 'ASTM-F1862', region: 'US', desc: 'STANDARD | Respiratory\n\nTest method for resistance of medical face masks to penetration by synthetic blood under high velocity.\n\nKeywords: ASTM, F1862, blood penetration, surgical mask, fluid resistance' },
  { name: 'ASTM F1296 - Standard Guide for Evaluating Chemical Protective Clothing', code: 'ASTM-F1296', region: 'US', desc: 'STANDARD | Body Protection\n\nGuide for evaluating the chemical resistance of protective clothing materials.\n\nKeywords: ASTM, F1296, chemical protective, clothing, permeation' },
  { name: 'ASTM F1506 - Standard Performance Specification for Flame Resistant Textile Materials', code: 'ASTM-F1506', region: 'US', desc: 'STANDARD | Body Protection\n\nPerformance specification for flame resistant textile materials for wearing apparel.\n\nKeywords: ASTM, F1506, flame resistant, FR clothing, arc flash' },
  { name: 'ASTM F2178 - Test Method for Determining Arc Rating of Face Protective Products', code: 'ASTM-F2178', region: 'US', desc: 'STANDARD | Eye/Face\n\nTest method for determining the arc rating of face protective products for arc flash exposure.\n\nKeywords: ASTM, F2178, arc flash, face shield, arc rating' },
];

// ============================================================
// NIOSH 标准
// ============================================================
const NIOSH_STANDARDS = [
  { name: 'NIOSH 42 CFR Part 84 - Approval of Respiratory Protective Devices', code: 'NIOSH-42CFR84', region: 'US', desc: 'STANDARD | Respiratory\n\nThe key US regulation governing certification of respiratory protective devices including N95, N99, N100, R95, P95, P99, P100 filters and chemical cartridges.\n\nKeywords: NIOSH, 42 CFR 84, N95, respirator, certification' },
  { name: 'NIOSH Respirator Approval Program - Standard Application Procedures', code: 'NIOSH-STP', region: 'US', desc: 'STANDARD | Respiratory\n\nStandard testing procedures for NIOSH respirator approval including filtration efficiency, breathing resistance, and fit testing requirements.\n\nKeywords: NIOSH, respirator approval, testing procedures, certification' },
  { name: 'NIOSH CBRN Approval Program', code: 'NIOSH-CBRN', region: 'US', desc: 'STANDARD | Respiratory\n\nChemical, Biological, Radiological, and Nuclear (CBRN) respirator approval requirements for first responders.\n\nKeywords: NIOSH, CBRN, respirator, first responder, terrorism' },
];

// ============================================================
// OSHA 法规
// ============================================================
const OSHA_RULES = [
  { name: 'OSHA 29 CFR 1910.132 - General Requirements for PPE', code: 'OSHA-1910.132', region: 'US', desc: 'REGULATION | PPE General\n\nGeneral requirements for personal protective equipment including hazard assessment, equipment selection, and employee training. Employers must provide PPE at no cost to employees.\n\nKeywords: OSHA, 29 CFR 1910, PPE, general requirements, employer obligation' },
  { name: 'OSHA 29 CFR 1910.133 - Eye and Face Protection', code: 'OSHA-1910.133', region: 'US', desc: 'REGULATION | Eye/Face\n\nRequirements for eye and face protection against flying particles, molten metal, liquid chemicals, acids, caustic liquids, chemical gases, and light radiation.\n\nKeywords: OSHA, 29 CFR 1910.133, eye protection, face protection' },
  { name: 'OSHA 29 CFR 1910.134 - Respiratory Protection', code: 'OSHA-1910.134', region: 'US', desc: 'REGULATION | Respiratory\n\nComprehensive respiratory protection standard including medical evaluation, fit testing, respirator selection, and written program requirements.\n\nKeywords: OSHA, 29 CFR 1910.134, respiratory, respirator, fit test' },
  { name: 'OSHA 29 CFR 1910.135 - Head Protection', code: 'OSHA-1910.135', region: 'US', desc: 'REGULATION | Head Protection\n\nRequirements for protective helmets to protect against impact, falling objects, and electrical shock.\n\nKeywords: OSHA, 29 CFR 1910.135, head protection, hard hat, helmet' },
  { name: 'OSHA 29 CFR 1910.136 - Foot Protection', code: 'OSHA-1910.136', region: 'US', desc: 'REGULATION | Foot Protection\n\nRequirements for protective footwear when there is danger of foot injuries from falling or rolling objects, piercing objects, or electrical hazards.\n\nKeywords: OSHA, 29 CFR 1910.136, foot protection, safety shoes' },
  { name: 'OSHA 29 CFR 1910.137 - Electrical Protective Equipment', code: 'OSHA-1910.137', region: 'US', desc: 'REGULATION | Electrical\n\nRequirements for electrical protective equipment including insulating gloves, sleeves, blankets, and matting.\n\nKeywords: OSHA, 29 CFR 1910.137, electrical, insulating gloves, dielectric' },
  { name: 'OSHA 29 CFR 1910.138 - Hand Protection', code: 'OSHA-1910.138', region: 'US', desc: 'REGULATION | Hand Protection\n\nRequirements for hand protection against skin absorption of harmful substances, severe cuts, lacerations, abrasions, punctures, chemical and thermal burns, and harmful temperature extremes.\n\nKeywords: OSHA, 29 CFR 1910.138, hand protection, gloves' },
  { name: 'OSHA 29 CFR 1910.140 - Personal Fall Protection Systems', code: 'OSHA-1910.140', region: 'US', desc: 'REGULATION | Fall Protection\n\nRequirements for personal fall protection systems including harnesses, lanyards, lifelines, and anchorages.\n\nKeywords: OSHA, 29 CFR 1910.140, fall protection, harness, lanyard' },
  { name: 'OSHA 29 CFR 1910.95 - Occupational Noise Exposure', code: 'OSHA-1910.95', region: 'US', desc: 'REGULATION | Hearing\n\nRequirements for hearing protection in occupational settings where noise exposure exceeds permissible levels.\n\nKeywords: OSHA, 29 CFR 1910.95, noise, hearing protection, earplugs' },
];

// ============================================================
// 中国 GB 国标
// ============================================================
const CHINA_GB_STANDARDS = [
  { name: 'GB 2626-2019 - 呼吸防护 自吸过滤式防颗粒物呼吸器', code: 'GB-2626-2019', region: 'CN', desc: 'STANDARD | Respiratory\n\n中国自吸过滤式防颗粒物呼吸器国家标准。规定KN90/KN95/KN100和KP90/KP95/KP100等级别要求。\n\nKeywords: GB 2626, 呼吸防护, KN95, 颗粒物, 口罩' },
  { name: 'GB 19083-2010 - 医用防护口罩技术要求', code: 'GB-19083-2010', region: 'CN', desc: 'STANDARD | Respiratory\n\n医用防护口罩技术要求，包括过滤效率、气流阻力、合成血液穿透、表面抗湿性等指标。\n\nKeywords: GB 19083, 医用防护口罩, N95, 医疗器械' },
  { name: 'YY 0469-2011 - 医用外科口罩', code: 'YY-0469-2011', region: 'CN', desc: 'STANDARD | Respiratory\n\n医用外科口罩行业标准，包括细菌过滤效率、颗粒过滤效率、压力差和合成血液穿透等要求。\n\nKeywords: YY 0469, 医用外科口罩, 细菌过滤, 医疗器械' },
  { name: 'GB 8965.1-2020 - 防护服装 阻燃防护 第1部分：阻燃服', code: 'GB-8965.1-2020', region: 'CN', desc: 'STANDARD | Body Protection\n\n阻燃防护服国家标准，规定阻燃服的技术要求、试验方法和检验规则。\n\nKeywords: GB 8965, 阻燃服, 防护服装, 防火' },
  { name: 'GB 12014-2019 - 防护服装 防静电服', code: 'GB-12014-2019', region: 'CN', desc: 'STANDARD | Body Protection\n\n防静电工作服国家标准，适用于可能因静电引燃的场所。\n\nKeywords: GB 12014, 防静电服, 防护服装, 静电' },
  { name: 'GB/T 18664-2002 - 呼吸防护用品的选择、使用与维护', code: 'GB-T-18664-2002', region: 'CN', desc: 'STANDARD | Respiratory\n\n呼吸防护用品的选择、使用与维护推荐性标准，涵盖危害评估和防护用品选用。\n\nKeywords: GB/T 18664, 呼吸防护, APF, 选用' },
  { name: 'GB 2890-2009 - 呼吸防护 自吸过滤式防毒面具', code: 'GB-2890-2009', region: 'CN', desc: 'STANDARD | Respiratory\n\n自吸过滤式防毒面具国家标准，包括全面罩和半面罩的技术要求。\n\nKeywords: GB 2890, 防毒面具, 全面罩, 半面罩, 滤毒盒' },
  { name: 'GB 2811-2019 - 头部防护 安全帽', code: 'GB-2811-2019', region: 'CN', desc: 'STANDARD | Head Protection\n\n安全帽国家标准，规定工业环境下使用的安全帽技术要求。\n\nKeywords: GB 2811, 安全帽, 头部防护, 冲击吸收' },
  { name: 'GB 12624-2020 - 手部防护 机械危害防护手套', code: 'GB-12624-2020', region: 'CN', desc: 'STANDARD | Hand Protection\n\n机械危害防护手套国家标准，规定耐磨性、抗切割性、抗撕裂性和抗穿刺性等级。\n\nKeywords: GB 12624, 防护手套, 机械危害, 切割' },
  { name: 'GB/T 12624-2020 - 手部防护 防护手套的选择、使用和维护指南', code: 'GB-T-12624-2020', region: 'CN', desc: 'STANDARD | Hand Protection\n\n手部防护手套的选择、使用和维护推荐性标准指南。\n\nKeywords: GB/T 12624, 手套选择, 使用维护' },
  { name: 'GB/T 28895-2012 - 防护服装 抗油易去污防静电服', code: 'GB-T-28895-2012', region: 'CN', desc: 'STANDARD | Body Protection\n\n抗油易去污防静电防护服推荐性标准。\n\nKeywords: GB/T 28895, 抗油, 易去污, 防静电' },
  { name: 'GB 21148-2020 - 足部防护 安全鞋', code: 'GB-21148-2020', region: 'CN', desc: 'STANDARD | Foot Protection\n\n安全鞋国家标准，规定安全鞋的抗冲击性、耐压力性等防护性能要求。\n\nKeywords: GB 21148, 安全鞋, 足部防护, 钢包头' },
  { name: 'GB 20653-2020 - 防护服装 职业用高可视性警示服', code: 'GB-20653-2020', region: 'CN', desc: 'STANDARD | High-Visibility\n\n高可视性警示服国家标准，适用于需要提高视觉可见性的高风险职业。\n\nKeywords: GB 20653, 高可视性, 警示服, 反光' },
  { name: 'GB/T 23466-2009 - 护听器 选择指南', code: 'GB-T-23466-2009', region: 'CN', desc: 'STANDARD | Hearing\n\n护听器选择指南推荐性标准。\n\nKeywords: GB/T 23466, 护听器, 听力防护, 耳塞' },
  { name: 'GB 30865.1-2014 - 手部防护 防静电手套', code: 'GB-30865.1-2014', region: 'CN', desc: 'STANDARD | Hand Protection\n\n防静电手套国家标准。\n\nKeywords: GB 30865, 防静电手套, ESD' },
  { name: 'GB 39800.1-2020 - 个体防护装备配备规范 第1部分：总则', code: 'GB-39800.1-2020', region: 'CN', desc: 'STANDARD | PPE General\n\n个体防护装备配备规范总则，规定用人单位PPE配备的基本要求、配备流程和管理要求。\n\nKeywords: GB 39800, PPE配备, 总则, 用人单位' },
  { name: 'GB 39800.2-2020 - 个体防护装备配备规范 第2部分：石油化工', code: 'GB-39800.2-2020', region: 'CN', desc: 'STANDARD | PPE\n\n石油化工行业个体防护装备配备规范。\n\nKeywords: GB 39800, 石油化工, PPE配备' },
  { name: 'GB 39800.3-2020 - 个体防护装备配备规范 第3部分：冶金', code: 'GB-39800.3-2020', region: 'CN', desc: 'STANDARD | PPE\n\n冶金行业个体防护装备配备规范。\n\nKeywords: GB 39800, 冶金, PPE配备' },
  { name: 'GB 39800.4-2020 - 个体防护装备配备规范 第4部分：非煤矿山', code: 'GB-39800.4-2020', region: 'CN', desc: 'STANDARD | PPE\n\n非煤矿山行业个体防护装备配备规范。\n\nKeywords: GB 39800, 非煤矿山, PPE配备' },
];

// ============================================================
// 欧洲 EN 协调标准
// ============================================================
const EN_HARMONIZED_STANDARDS = [
  // Respiratory Protection
  { name: 'EN 149:2001+A1:2009 - Respiratory protective devices - Filtering half masks to protect against particles', code: 'EN-149-2009', region: 'EU', desc: 'STANDARD | Respiratory\n\nFiltering facepiece respirators (FFP1/FFP2/FFP3) for protection against particles. Testing includes filtration efficiency, breathing resistance, and total inward leakage.\n\nKeywords: EN 149, FFP2, FFP3, filtering facepiece, respirator, particle' },
  { name: 'EN 140:1998 - Respiratory protective devices - Half masks and quarter masks', code: 'EN-140-1998', region: 'EU', desc: 'STANDARD | Respiratory\n\nRequirements for reusable half masks and quarter masks used with filters.\n\nKeywords: EN 140, half mask, reusable respirator, filter connection' },
  { name: 'EN 136:1998 - Respiratory protective devices - Full face masks', code: 'EN-136-1998', region: 'EU', desc: 'STANDARD | Respiratory\n\nRequirements for full face masks for respiratory protection.\n\nKeywords: EN 136, full face mask, respirator, eye protection' },
  { name: 'EN 143:2021 - Respiratory protective devices - Particle filters', code: 'EN-143-2021', region: 'EU', desc: 'STANDARD | Respiratory\n\nRequirements and testing for particle filters (P1/P2/P3) used with respiratory protective devices.\n\nKeywords: EN 143, particle filter, P3, P2, respirator' },
  { name: 'EN 12941:1998 - Powered filtering devices with helmet/hood - PAPR Class TH', code: 'EN-12941-1998', region: 'EU', desc: 'STANDARD | Respiratory\n\nPowered air-purifying respirators incorporating a helmet or hood.\n\nKeywords: EN 12941, PAPR, powered respirator, helmet, hood' },
  { name: 'EN 12942:1998 - Powered filtering devices with full/half mask - PAPR Class TM', code: 'EN-12942-1998', region: 'EU', desc: 'STANDARD | Respiratory\n\nPowered air-purifying respirators incorporating full/half masks.\n\nKeywords: EN 12942, PAPR, powered respirator, TM class' },
  { name: 'EN 14683:2019+AC:2019 - Medical face masks - Requirements and test methods', code: 'EN-14683-2019', region: 'EU', desc: 'STANDARD | Respiratory/Medical\n\nMedical face masks Types I, II, and IIR with requirements for bacterial filtration efficiency and splash resistance.\n\nKeywords: EN 14683, medical mask, surgical mask, Type IIR, bacterial filtration' },
  // Eye/Face Protection
  { name: 'EN 166:2001 - Personal eye-protection - Specifications', code: 'EN-166-2001', region: 'EU', desc: 'STANDARD | Eye Protection\n\nGeneral specifications for eye protectors including optical quality, field of vision, impact resistance, and marking requirements.\n\nKeywords: EN 166, eye protection, safety glasses, goggles, face shield' },
  { name: 'EN 170:2002 - Personal eye protection - Ultraviolet filters', code: 'EN-170-2002', region: 'EU', desc: 'STANDARD | Eye Protection\n\nTransmittance requirements for UV filters used in eye protectors.\n\nKeywords: EN 170, UV filter, eye protection, ultraviolet' },
  { name: 'EN 175:1997 - Personal protection - Equipment for eye and face protection during welding', code: 'EN-175-1997', region: 'EU', desc: 'STANDARD | Welding\n\nSpecifications for welding eye and face protection equipment.\n\nKeywords: EN 175, welding, face shield, auto-darkening' },
  // Hand Protection
  { name: 'EN 388:2016+A1:2018 - Protective gloves against mechanical risks', code: 'EN-388-2016', region: 'EU', desc: 'STANDARD | Hand Protection\n\nProtective gloves against mechanical risks tested for abrasion, blade cut, tear, puncture, and impact protection.\n\nKeywords: EN 388, gloves, mechanical, cut resistance, abrasion, puncture' },
  { name: 'EN 374:2016 - Protective gloves against dangerous chemicals and micro-organisms', code: 'EN-374-2016', region: 'EU', desc: 'STANDARD | Hand Protection\n\nChemical protective gloves with permeation resistance testing against 18 challenge chemicals.\n\nKeywords: EN 374, chemical gloves, permeation, micro-organism, breakthrough' },
  { name: 'EN 420:2003+A1:2009 - Protective gloves - General requirements and test methods', code: 'EN-420-2009', region: 'EU', desc: 'STANDARD | Hand Protection\n\nGeneral requirements for protective gloves including innocuousness, dexterity, sizing, marking, and information supplied by manufacturer.\n\nKeywords: EN 420, gloves, general requirements, sizing, marking' },
  { name: 'EN 407:2020 - Protective gloves against thermal risks', code: 'EN-407-2020', region: 'EU', desc: 'STANDARD | Hand Protection\n\nThermal protective gloves against heat and/or fire with testing for flammability, contact heat, convective heat, radiant heat, and molten metal.\n\nKeywords: EN 407, thermal gloves, heat resistance, fire, molten metal' },
  { name: 'EN 511:2006 - Protective gloves against cold', code: 'EN-511-2006', region: 'EU', desc: 'STANDARD | Hand Protection\n\nGloves protecting against cold measured by convective cold and contact cold.\n\nKeywords: EN 511, cold gloves, winter, thermal protection' },
  { name: 'EN 421:2010 - Protective gloves against ionizing radiation and radioactive contamination', code: 'EN-421-2010', region: 'EU', desc: 'STANDARD | Hand Protection\n\nGloves protecting against radioactive contamination and ionizing radiation.\n\nKeywords: EN 421, radiation gloves, radioactive, nuclear' },
  // Head Protection
  { name: 'EN 397:2012+A1:2012 - Industrial safety helmets', code: 'EN-397-2012', region: 'EU', desc: 'STANDARD | Head Protection\n\nIndustrial safety helmets with requirements for shock absorption, penetration resistance, and optional electrical/chimney/name requirements.\n\nKeywords: EN 397, safety helmet, hard hat, industrial, impact' },
  { name: 'EN 14052:2012+A1:2012 - High performance industrial helmets', code: 'EN-14052-2012', region: 'EU', desc: 'STANDARD | Head Protection\n\nHigh performance industrial safety helmets exceeding EN 397 with lateral deformation and chin strap retention testing.\n\nKeywords: EN 14052, high performance helmet, lateral impact' },
  // Foot Protection
  { name: 'EN ISO 20345:2011 - Personal protective equipment - Safety footwear', code: 'EN-ISO-20345-2011', region: 'EU', desc: 'STANDARD | Foot Protection\n\nSafety footwear with 200-joule toe cap impact protection (SB/S1/S2/S3 etc).\n\nKeywords: EN ISO 20345, safety footwear, steel toe, S3, safety shoes' },
  { name: 'EN ISO 20346:2014 - Personal protective equipment - Protective footwear', code: 'EN-ISO-20346-2014', region: 'EU', desc: 'STANDARD | Foot Protection\n\nProtective footwear with 100-joule toe cap protection (PB/P1/P2/P3).\n\nKeywords: EN ISO 20346, protective footwear, toe protection' },
  { name: 'EN ISO 20347:2012 - Personal protective equipment - Occupational footwear', code: 'EN-ISO-20347-2012', region: 'EU', desc: 'STANDARD | Foot Protection\n\nOccupational footwear without toe protection (OB/O1/O2/O3).\n\nKeywords: EN ISO 20347, occupational footwear' },
  // Body Protection
  { name: 'EN ISO 13982-1:2004+A1:2010 - Protective clothing against solid particulates - Type 5', code: 'EN-ISO-13982-1', region: 'EU', desc: 'STANDARD | Body Protection\n\nChemical protective clothing against solid airborne particles (Type 5 suits).\n\nKeywords: EN ISO 13982, Type 5, particulate suit, coverall' },
  { name: 'EN ISO 20471:2013+A1:2016 - High visibility clothing', code: 'EN-ISO-20471-2013', region: 'EU', desc: 'STANDARD | High-Visibility\n\nHigh-visibility warning clothing for professional use with retro-reflective and fluorescent material.\n\nKeywords: EN ISO 20471, high-visibility, hi-vis, reflective, classes 1-3' },
  { name: 'EN ISO 11612:2015 - Protective clothing against heat and flame', code: 'EN-ISO-11612-2015', region: 'EU', desc: 'STANDARD | Body Protection\n\nProtective clothing made from flexible materials to protect against heat/flame.\n\nKeywords: EN ISO 11612, flame resistant, heat protection, FR clothing' },
  { name: 'EN 14605:2005+A1:2009 - Protective clothing against liquid chemicals - Type 3/4', code: 'EN-14605-2009', region: 'EU', desc: 'STANDARD | Body Protection\n\nChemical protective clothing with liquid-tight (Type 3) or spray-tight (Type 4) connections.\n\nKeywords: EN 14605, chemical suit, Type 3, Type 4, liquid tight' },
  { name: 'EN 943-1:2015+A1:2019 - Protective clothing against liquid and gaseous chemicals - Type 1 gas-tight', code: 'EN-943-1-2019', region: 'EU', desc: 'STANDARD | Body Protection\n\nGas-tight chemical protective suit (Type 1) for hazmat and chemical emergency response.\n\nKeywords: EN 943-1, gas-tight suit, hazmat, chemical emergency' },
  // Hearing Protection
  { name: 'EN 352-1:2020 - Hearing protectors - Ear-muffs', code: 'EN-352-1-2020', region: 'EU', desc: 'STANDARD | Hearing\n\nRequirements for ear-muff type hearing protectors.\n\nKeywords: EN 352-1, ear muff, hearing protection, noise reduction' },
  { name: 'EN 352-2:2020 - Hearing protectors - Ear-plugs', code: 'EN-352-2-2020', region: 'EU', desc: 'STANDARD | Hearing\n\nRequirements for ear-plug type hearing protectors.\n\nKeywords: EN 352-2, ear plug, hearing protection, disposable' },
  // Fall Protection
  { name: 'EN 361:2002 - Personal protective equipment against falls - Full body harnesses', code: 'EN-361-2002', region: 'EU', desc: 'STANDARD | Fall Protection\n\nRequirements for full body harnesses used in fall arrest systems.\n\nKeywords: EN 361, fall arrest, harness, full body, PPE' },
  { name: 'EN 354:2010 - Personal fall protection - Lanyards', code: 'EN-354-2010', region: 'EU', desc: 'STANDARD | Fall Protection\n\nRequirements for lanyards used in fall protection systems.\n\nKeywords: EN 354, lanyard, fall protection, connector' },
  { name: 'EN 360:2002 - Personal protective equipment against falls - Retractable type fall arresters', code: 'EN-360-2002', region: 'EU', desc: 'STANDARD | Fall Protection\n\nRetractable type fall arresters (SRL) requirements.\n\nKeywords: EN 360, SRL, retractable, fall arrest, self-retracting' },
  { name: 'EN 795:2012 - Personal fall protection - Anchor devices', code: 'EN-795-2012', region: 'EU', desc: 'STANDARD | Fall Protection\n\nRequirements for anchor devices for fall protection.\n\nKeywords: EN 795, anchor, fall protection, anchor point' },
];

async function insertRegulations(list) {
  let inserted = 0, skipped = 0;
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    for (const item of batch) {
      const { data: existing } = await supabase.from('ppe_regulations').select('id').eq('code', item.code).limit(1);
      if (existing && existing.length > 0) { skipped++; continue; }
      const record = { name: item.name, code: item.code, region: item.region, description: item.desc };
      const { error } = await supabase.from('ppe_regulations').insert(record);
      if (!error) inserted++;
    }
  }
  return { inserted, skipped };
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  T1.4: 中美欧法规标准数据补全');
  console.log('═══════════════════════════════════════');

  let totalInserted = 0, totalSkipped = 0;

  // US Standards
  console.log('\n[US] ANSI/ISEA 标准...');
  let r = await insertRegulations(ANSI_ISEA_STANDARDS);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  console.log('[US] ASTM PPE 标准...');
  r = await insertRegulations(ASTM_PPE_STANDARDS);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  console.log('[US] NIOSH 标准...');
  r = await insertRegulations(NIOSH_STANDARDS);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  console.log('[US] OSHA 法规...');
  r = await insertRegulations(OSHA_RULES);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  // CN Standards
  console.log('[CN] GB 国标...');
  r = await insertRegulations(CHINA_GB_STANDARDS);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  // EU Standards
  console.log('[EU] EN Harmonized Standards...');
  r = await insertRegulations(EN_HARMONIZED_STANDARDS);
  console.log(`  插入: ${r.inserted}, 已有: ${r.skipped}`);
  totalInserted += r.inserted; totalSkipped += r.skipped;

  // Verification
  const { count: regCount } = await supabase.from('ppe_regulations').select('*',{count:'exact',head:true});
  console.log(`\n  ppe_regulations 总数: ${regCount}`);
  console.log(`  本次新增: ${totalInserted}, 跳过(已有): ${totalSkipped}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  T1.4 完成');
  console.log('═══════════════════════════════════════');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}