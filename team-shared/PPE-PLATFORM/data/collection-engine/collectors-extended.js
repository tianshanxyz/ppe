#!/usr/bin/env node

/**
 * 扩展数据源采集器
 * 包含：韩国MFDS、巴西ANVISA、俄罗斯Roszdravnadzor、英国MHRA、瑞士Swissmedic等
 */

const fs = require('fs');
const path = require('path');

// 日志记录
const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, error ? error.message || error : ''),
};

/**
 * 韩国MFDS (Ministry of Food and Drug Safety) 数据模拟
 */
class MFDSCollector {
  constructor() {
    this.name = 'MFDS';
    this.country = 'South Korea';
    this.baseUrl = 'https://www.mfds.go.kr';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集韩国MFDS数据...`);
    
    // 模拟韩国PPE注册数据
    const mockData = {
      products: [
        {
          productName: 'KF94 Respirator',
          productNameEn: 'KF94 Respirator',
          productCode: 'KF94-001',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'Korean Filter 94 respirator for particle filtration',
          manufacturerName: 'LG Household & Health Care',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-KF94-001',
        },
        {
          productName: 'KF-AD Anti-Droplet Mask',
          productNameEn: 'KF-AD Anti-Droplet Mask',
          productCode: 'KFAD-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Anti-droplet mask for daily protection',
          manufacturerName: 'Kolon Industries',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-KFAD-002',
        },
        {
          productName: 'KF80 Dust Mask',
          productNameEn: 'KF80 Dust Mask',
          productCode: 'KF80-003',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'KF80 certified dust protection mask',
          manufacturerName: 'Yuhan Corporation',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-KF80-003',
        },
        {
          productName: 'Medical Surgical Mask Type II',
          productNameEn: 'Medical Surgical Mask Type II',
          productCode: 'MSM-004',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Type II surgical mask for medical use',
          manufacturerName: 'Mediheal',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-MSM-004',
        },
        {
          productName: 'Nitrile Medical Gloves',
          productNameEn: 'Nitrile Medical Gloves',
          productCode: 'NMG-005',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Sempermed',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-NMG-005',
        },
        {
          productName: 'Protective Face Shield KF-PS',
          productNameEn: 'Protective Face Shield KF-PS',
          productCode: 'KFPS-006',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Face shield with anti-fog coating',
          manufacturerName: 'Hanil Medical',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-KFPS-006',
        },
        {
          productName: 'Disposable Protective Coverall',
          productNameEn: 'Disposable Protective Coverall',
          productCode: 'DPC-007',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 protective coverall',
          manufacturerName: 'DuPont Korea',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-DPC-007',
        },
        {
          productName: 'Chemical Resistant Gloves',
          productNameEn: 'Chemical Resistant Gloves',
          productCode: 'CRG-008',
          category: '手部防护',
          ppeCategory: 'III',
          description: 'Chemical resistant nitrile gloves',
          manufacturerName: 'Kossan Rubber',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-CRG-008',
        },
        {
          productName: 'Safety Goggles KF-SG',
          productNameEn: 'Safety Goggles KF-SG',
          productCode: 'KFSG-009',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Impact resistant safety goggles',
          manufacturerName: '3M Korea',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-KFSG-009',
        },
        {
          productName: 'Hearing Protection Earmuffs',
          productNameEn: 'Hearing Protection Earmuffs',
          productCode: 'HPE-010',
          category: '听力防护',
          ppeCategory: 'II',
          description: 'SNR 30dB hearing protection',
          manufacturerName: 'Sordin Korea',
          manufacturerCountry: 'South Korea',
          dataSource: 'MFDS',
          sourceId: 'MFDS-HPE-010',
        },
      ],
      manufacturers: [
        { companyName: 'LG Household & Health Care', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-001' },
        { companyName: 'Kolon Industries', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-002' },
        { companyName: 'Yuhan Corporation', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-003' },
        { companyName: 'Mediheal', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-004' },
        { companyName: 'Sempermed', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-005' },
        { companyName: 'Hanil Medical', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-006' },
        { companyName: 'DuPont Korea', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-007' },
        { companyName: 'Kossan Rubber', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-008' },
        { companyName: '3M Korea', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-009' },
        { companyName: 'Sordin Korea', country: 'South Korea', dataSource: 'MFDS', sourceId: 'MFDS-MFG-010' },
      ],
      certifications: [
        { certificationType: 'KF Certification', certificationNumber: 'KF94-2024-001', standardCode: 'KF94', certBodyName: 'MFDS', status: 'active', issueDate: '2024-01-15', expiryDate: '2029-01-14', dataSource: 'MFDS', sourceId: 'MFDS-CERT-001' },
        { certificationType: 'KF Certification', certificationNumber: 'KFAD-2024-002', standardCode: 'KF-AD', certBodyName: 'MFDS', status: 'active', issueDate: '2024-02-20', expiryDate: '2029-02-19', dataSource: 'MFDS', sourceId: 'MFDS-CERT-002' },
        { certificationType: 'Medical Device', certificationNumber: 'MD-2024-003', standardCode: 'KFDA', certBodyName: 'MFDS', status: 'active', issueDate: '2024-03-10', expiryDate: '2029-03-09', dataSource: 'MFDS', sourceId: 'MFDS-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 巴西ANVISA (Agência Nacional de Vigilância Sanitária) 数据模拟
 */
class ANVISACollector {
  constructor() {
    this.name = 'ANVISA';
    this.country = 'Brazil';
    this.baseUrl = 'https://www.gov.br/anvisa';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集巴西ANVISA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Máscara PFF2 N95',
          productNameEn: 'PFF2 N95 Respirator',
          productCode: 'PFF2-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Brazilian PFF2 respirator equivalent to N95',
          manufacturerName: '3M do Brasil',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-PFF2-001',
        },
        {
          productName: 'Máscara Cirúrgica Tripla',
          productNameEn: 'Triple Layer Surgical Mask',
          productCode: 'MCT-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Triple layer surgical mask with bacterial filtration',
          manufacturerName: 'Indústria Nacional de Produtos Médicos',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-MCT-002',
        },
        {
          productName: 'Luvas de Látex para Procedimento',
          productNameEn: 'Latex Procedure Gloves',
          productCode: 'LLP-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powdered latex examination gloves',
          manufacturerName: 'Supermax Brasil',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-LLP-003',
        },
        {
          productName: 'Protetor Facial Transparente',
          productNameEn: 'Transparent Face Shield',
          productCode: 'PFT-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Reusable face shield with anti-fog treatment',
          manufacturerName: 'Plastcor Indústria',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-PFT-004',
        },
        {
          productName: 'Avental Impermeável Descartável',
          productNameEn: 'Disposable Waterproof Apron',
          productCode: 'AID-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable waterproof protective apron',
          manufacturerName: 'Descarpack',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-AID-005',
        },
        {
          productName: 'Respirador com Válvula PFF3',
          productNameEn: 'PFF3 Valved Respirator',
          productCode: 'PFF3-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'PFF3 respirator with exhalation valve',
          manufacturerName: 'Libus do Brasil',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-PFF3-006',
        },
        {
          productName: 'Luvas de Nitrilo Azul',
          productNameEn: 'Blue Nitrile Gloves',
          productCode: 'LNA-007',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Blue nitrile examination gloves powder-free',
          manufacturerName: 'Kolplast',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-LNA-007',
        },
        {
          productName: 'Óculos de Segurança Incolor',
          productNameEn: 'Clear Safety Glasses',
          productCode: 'OSI-008',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Impact resistant clear safety glasses',
          manufacturerName: ' Carbografite',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-OSI-008',
        },
        {
          productName: 'Macacão de Proteção Química',
          productNameEn: 'Chemical Protection Coverall',
          productCode: 'MPQ-009',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 3 chemical protection coverall',
          manufacturerName: 'DuPont Brasil',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-MPQ-009',
        },
        {
          productName: 'Máscara de Proteção Respiratória',
          productNameEn: 'Respiratory Protection Mask',
          productCode: 'MPR-010',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'Half-face respirator with P2 filter',
          manufacturerName: 'MSA do Brasil',
          manufacturerCountry: 'Brazil',
          dataSource: 'ANVISA',
          sourceId: 'ANVISA-MPR-010',
        },
      ],
      manufacturers: [
        { companyName: '3M do Brasil', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-001' },
        { companyName: 'Indústria Nacional de Produtos Médicos', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-002' },
        { companyName: 'Supermax Brasil', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-003' },
        { companyName: 'Plastcor Indústria', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-004' },
        { companyName: 'Descarpack', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-005' },
        { companyName: 'Libus do Brasil', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-006' },
        { companyName: 'Kolplast', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-007' },
        { companyName: 'Carbografite', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-008' },
        { companyName: 'DuPont Brasil', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-009' },
        { companyName: 'MSA do Brasil', country: 'Brazil', dataSource: 'ANVISA', sourceId: 'ANVISA-MFG-010' },
      ],
      certifications: [
        { certificationType: 'Registro ANVISA', certificationNumber: '80450990001', standardCode: 'RDC 546/2021', certBodyName: 'ANVISA', status: 'active', issueDate: '2024-01-10', expiryDate: '2029-01-09', dataSource: 'ANVISA', sourceId: 'ANVISA-CERT-001' },
        { certificationType: 'Registro ANVISA', certificationNumber: '80460980002', standardCode: 'RDC 546/2021', certBodyName: 'ANVISA', status: 'active', issueDate: '2024-02-15', expiryDate: '2029-02-14', dataSource: 'ANVISA', sourceId: 'ANVISA-CERT-002' },
        { certificationType: 'Certificado de Boas Práticas', certificationNumber: 'CBP-2024-003', standardCode: 'RDC 301/2019', certBodyName: 'ANVISA', status: 'active', issueDate: '2024-03-01', expiryDate: '2027-02-28', dataSource: 'ANVISA', sourceId: 'ANVISA-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 俄罗斯Roszdravnadzor数据模拟
 */
class RoszdravnadzorCollector {
  constructor() {
    this.name = 'Roszdravnadzor';
    this.country = 'Russia';
    this.baseUrl = 'https://roszdravnadzor.gov.ru';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集俄罗斯Roszdravnadzor数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Респиратор FFP3',
          productNameEn: 'FFP3 Respirator',
          productCode: 'FFP3-RU-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Russian FFP3 respirator with GOST certification',
          manufacturerName: 'АО "Спецмедзащита"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-FFP3-001',
        },
        {
          productName: 'Медицинская маска трехслойная',
          productNameEn: 'Three-layer Medical Mask',
          productCode: 'MM3-RU-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Disposable three-layer medical mask',
          manufacturerName: 'ООО "Медтекстиль"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-MM3-002',
        },
        {
          productName: 'Перчатки нитриловые медицинские',
          productNameEn: 'Nitrile Medical Gloves',
          productCode: 'PNM-RU-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile medical gloves',
          manufacturerName: 'АО "Ростех"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-PNM-003',
        },
        {
          productName: 'Защитный щиток для лица',
          productNameEn: 'Face Protection Shield',
          productCode: 'ZSL-RU-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Reusable face shield with adjustable headband',
          manufacturerName: 'ООО "Техноавиа"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-ZSL-004',
        },
        {
          productName: 'Комбинезон защитный одноразовый',
          productNameEn: 'Disposable Protective Coverall',
          productCode: 'KZO-RU-005',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 disposable protective coverall',
          manufacturerName: 'АО "Защитные технологии"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-KZO-005',
        },
        {
          productName: 'Респиратор с клапаном выдоха',
          productNameEn: 'Respirator with Exhalation Valve',
          productCode: 'RSK-RU-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'FFP2 respirator with exhalation valve',
          manufacturerName: 'ООО "Респиратор"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-RSK-006',
        },
        {
          productName: 'Очки защитные закрытые',
          productNameEn: 'Closed Safety Goggles',
          productCode: 'OZZ-RU-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Indirect vented safety goggles',
          manufacturerName: 'ООО "Спецодежда"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-OZZ-007',
        },
        {
          productName: 'Бахилы медицинские одноразовые',
          productNameEn: 'Disposable Medical Shoe Covers',
          productCode: 'BMO-RU-008',
          category: '足部防护',
          ppeCategory: 'I',
          description: 'Waterproof disposable shoe covers',
          manufacturerName: 'АО "Медпласт"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-BMO-008',
        },
        {
          productName: 'Шапочка медицинская одноразовая',
          productNameEn: 'Disposable Medical Cap',
          productCode: 'SMO-RU-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Non-woven disposable surgical cap',
          manufacturerName: 'ООО "Медтекстиль"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-SMO-009',
        },
        {
          productName: 'Респиратор противогазовый',
          productNameEn: 'Gas Mask Respirator',
          productCode: 'RPG-RU-010',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Full face gas mask with A2B2E2K2 filter',
          manufacturerName: 'АО "Спецмедзащита"',
          manufacturerCountry: 'Russia',
          dataSource: 'Roszdravnadzor',
          sourceId: 'RZN-RPG-010',
        },
      ],
      manufacturers: [
        { companyName: 'АО "Спецмедзащита"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-001' },
        { companyName: 'ООО "Медтекстиль"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-002' },
        { companyName: 'АО "Ростех"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-003' },
        { companyName: 'ООО "Техноавиа"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-004' },
        { companyName: 'АО "Защитные технологии"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-005' },
        { companyName: 'ООО "Респиратор"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-006' },
        { companyName: 'ООО "Спецодежда"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-007' },
        { companyName: 'АО "Медпласт"', country: 'Russia', dataSource: 'Roszdravnadzor', sourceId: 'RZN-MFG-008' },
      ],
      certifications: [
        { certificationType: 'Регистрационное удостоверение', certificationNumber: 'РЗН 2024/12345', standardCode: 'ГОСТ Р 12.4.294-2015', certBodyName: 'Roszdravnadzor', status: 'active', issueDate: '2024-01-20', expiryDate: '2029-01-19', dataSource: 'Roszdravnadzor', sourceId: 'RZN-CERT-001' },
        { certificationType: 'Сертификат соответствия', certificationNumber: 'RU C-RU.АБ12.В.12345', standardCode: 'ТР ТС 019/2011', certBodyName: 'Roszdravnadzor', status: 'active', issueDate: '2024-02-25', expiryDate: '2029-02-24', dataSource: 'Roszdravnadzor', sourceId: 'RZN-CERT-002' },
        { certificationType: 'Декларация о соответствии', certificationNumber: 'ЕАЭС N RU Д-RU.АБ12.В.67890', standardCode: 'ТР ТС 017/2011', certBodyName: 'Roszdravnadzor', status: 'active', issueDate: '2024-03-15', expiryDate: '2029-03-14', dataSource: 'Roszdravnadzor', sourceId: 'RZN-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 英国MHRA (Medicines and Healthcare products Regulatory Agency) 数据模拟
 */
class MHRACollector {
  constructor() {
    this.name = 'MHRA';
    this.country = 'United Kingdom';
    this.baseUrl = 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集英国MHRA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'FFP3 NR D Respirator',
          productNameEn: 'FFP3 NR D Respirator',
          productCode: 'FFP3-UK-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'UKCA marked FFP3 respirator with Dolomite dust test',
          manufacturerName: '3M United Kingdom PLC',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-FFP3-001',
        },
        {
          productName: 'Type IIR Surgical Face Mask',
          productNameEn: 'Type IIR Surgical Face Mask',
          productCode: 'T2R-UK-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'EN 14683 Type IIR surgical mask with splash resistance',
          manufacturerName: 'Smith & Nephew',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-T2R-002',
        },
        {
          productName: 'Nitrile Examination Gloves Blue',
          productNameEn: 'Nitrile Examination Gloves Blue',
          productCode: 'NEG-UK-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves AQL 1.5',
          manufacturerName: 'Ansell Healthcare Europe',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-NEG-003',
        },
        {
          productName: 'Face Shield Medical Grade',
          productNameEn: 'Face Shield Medical Grade',
          productCode: 'FSM-UK-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical grade face shield with anti-fog coating',
          manufacturerName: 'Vernacare',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-FSM-004',
        },
        {
          productName: 'Disposable Coverall Cat III Type 5/6',
          productNameEn: 'Disposable Coverall Cat III Type 5/6',
          productCode: 'DC3-UK-005',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Category III Type 5/6 disposable chemical coverall',
          manufacturerName: 'DuPont Safety & Construction',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-DC3-005',
        },
        {
          productName: 'Half Mask Respirator A2P3',
          productNameEn: 'Half Mask Respirator A2P3',
          productCode: 'HMR-UK-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Reusable half mask with A2P3 filters',
          manufacturerName: 'Scott Safety',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-HMR-006',
        },
        {
          productName: 'Safety Goggles Indirect Vent',
          productNameEn: 'Safety Goggles Indirect Vent',
          productCode: 'SGI-UK-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'EN 166 indirect vented safety goggles',
          manufacturerName: 'Bollé Safety',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-SGI-007',
        },
        {
          productName: 'Latex Surgical Gloves Sterile',
          productNameEn: 'Latex Surgical Gloves Sterile',
          productCode: 'LSG-UK-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile powder-free latex surgical gloves',
          manufacturerName: 'Mölnlycke Health Care',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-LSG-008',
        },
        {
          productName: 'Powered Air Purifying Respirator',
          productNameEn: 'Powered Air Purifying Respirator',
          productCode: 'PAPR-UK-009',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'TH3 PAPR with hood and battery pack',
          manufacturerName: '3M United Kingdom PLC',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-PAPR-009',
        },
        {
          productName: 'Chemical Resistant Boots',
          productNameEn: 'Chemical Resistant Boots',
          productCode: 'CRB-UK-010',
          category: '足部防护',
          ppeCategory: 'III',
          description: 'EN 13832 chemical resistant safety boots',
          manufacturerName: 'Honeywell Safety Products',
          manufacturerCountry: 'United Kingdom',
          dataSource: 'MHRA',
          sourceId: 'MHRA-CRB-010',
        },
      ],
      manufacturers: [
        { companyName: '3M United Kingdom PLC', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-001' },
        { companyName: 'Smith & Nephew', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-002' },
        { companyName: 'Ansell Healthcare Europe', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-003' },
        { companyName: 'Vernacare', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-004' },
        { companyName: 'DuPont Safety & Construction', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-005' },
        { companyName: 'Scott Safety', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-006' },
        { companyName: 'Bollé Safety', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-007' },
        { companyName: 'Mölnlycke Health Care', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-008' },
        { companyName: 'Honeywell Safety Products', country: 'United Kingdom', dataSource: 'MHRA', sourceId: 'MHRA-MFG-009' },
      ],
      certifications: [
        { certificationType: 'UKCA Marking', certificationNumber: 'UKCA-2024-001', standardCode: 'EN 149:2001+A1:2009', certBodyName: 'BSI', status: 'active', issueDate: '2024-01-05', expiryDate: '2029-01-04', dataSource: 'MHRA', sourceId: 'MHRA-CERT-001' },
        { certificationType: 'CE Type Examination', certificationNumber: 'CE-0120', standardCode: 'EN 14683:2019+AC:2019', certBodyName: 'BSI', status: 'active', issueDate: '2024-02-10', expiryDate: '2029-02-09', dataSource: 'MHRA', sourceId: 'MHRA-CERT-002' },
        { certificationType: 'Module D Certificate', certificationNumber: 'CE-0086', standardCode: 'EN 374-1:2016', certBodyName: 'SGS', status: 'active', issueDate: '2024-03-20', expiryDate: '2029-03-19', dataSource: 'MHRA', sourceId: 'MHRA-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 瑞士Swissmedic数据模拟
 */
class SwissmedicCollector {
  constructor() {
    this.name = 'Swissmedic';
    this.country = 'Switzerland';
    this.baseUrl = 'https://www.swissmedic.ch';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集瑞士Swissmedic数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'FFP2 Atemschutzmaske',
          productNameEn: 'FFP2 Respiratory Mask',
          productCode: 'FFP2-CH-001',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'Swiss authorized FFP2 respirator',
          manufacturerName: '3M Schweiz GmbH',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-FFP2-001',
        },
        {
          productName: 'Medizinische Maske Typ IIR',
          productNameEn: 'Medical Mask Type IIR',
          productCode: 'MMT-CH-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Type IIR surgical mask Swiss made',
          manufacturerName: 'Halyard Health Switzerland',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-MMT-002',
        },
        {
          productName: 'Nitril Untersuchungshandschuhe',
          productNameEn: 'Nitrile Examination Gloves',
          productCode: 'NUH-CH-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Semperit AG',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-NUH-003',
        },
        {
          productName: 'Gesichtsschutz Visier',
          productNameEn: 'Face Protection Visor',
          productCode: 'GSV-CH-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog',
          manufacturerName: 'Medela AG',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-GSV-004',
        },
        {
          productName: 'Schutzanzug Einweg Typ 5/6',
          productNameEn: 'Disposable Protective Suit Type 5/6',
          productCode: 'SAT-CH-005',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 protective coverall',
          manufacturerName: 'Otto Bock Schweiz',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-SAT-005',
        },
        {
          productName: 'Halbmaske mit Filter A2P3',
          productNameEn: 'Half Mask with A2P3 Filter',
          productCode: 'HMF-CH-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Reusable half mask respirator',
          manufacturerName: 'MSA Schweiz',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-HMF-006',
        },
        {
          productName: 'Schutzbrille Indirekt Belüftet',
          productNameEn: 'Safety Goggles Indirect Vented',
          productCode: 'SBI-CH-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Indirect vented safety goggles',
          manufacturerName: 'UVEX Safety Schweiz',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-SBI-007',
        },
        {
          productName: 'Latex Operationshandschuhe Steril',
          productNameEn: 'Latex Surgical Gloves Sterile',
          productCode: 'LOS-CH-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile powder-free latex surgical gloves',
          manufacturerName: 'B. Braun Medical AG',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-LOS-008',
        },
        {
          productName: 'Gebläse Atemschutzsystem TH3',
          productNameEn: 'Powered Air Respiratory System TH3',
          productCode: 'GAT-CH-009',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'TH3 powered air purifying respirator',
          manufacturerName: '3M Schweiz GmbH',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-GAT-009',
        },
        {
          productName: 'Gehörschutz Kapsel',
          productNameEn: 'Hearing Protection Earmuffs',
          productCode: 'GHK-CH-010',
          category: '听力防护',
          ppeCategory: 'II',
          description: 'SNR 32dB hearing protection',
          manufacturerName: 'Suva',
          manufacturerCountry: 'Switzerland',
          dataSource: 'Swissmedic',
          sourceId: 'SM-GHK-010',
        },
      ],
      manufacturers: [
        { companyName: '3M Schweiz GmbH', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-001' },
        { companyName: 'Halyard Health Switzerland', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-002' },
        { companyName: 'Semperit AG', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-003' },
        { companyName: 'Medela AG', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-004' },
        { companyName: 'Otto Bock Schweiz', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-005' },
        { companyName: 'MSA Schweiz', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-006' },
        { companyName: 'UVEX Safety Schweiz', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-007' },
        { companyName: 'B. Braun Medical AG', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-008' },
        { companyName: 'Suva', country: 'Switzerland', dataSource: 'Swissmedic', sourceId: 'SM-MFG-009' },
      ],
      certifications: [
        { certificationType: 'CH-Authorisation', certificationNumber: 'CH-2024-0001', standardCode: 'SN 16683', certBodyName: 'Swissmedic', status: 'active', issueDate: '2024-01-08', expiryDate: '2029-01-07', dataSource: 'Swissmedic', sourceId: 'SM-CERT-001' },
        { certificationType: 'Swiss Authorised Representative', certificationNumber: 'CH-AR-2024-002', standardCode: 'MedDO', certBodyName: 'Swissmedic', status: 'active', issueDate: '2024-02-12', expiryDate: '2029-02-11', dataSource: 'Swissmedic', sourceId: 'SM-CERT-002' },
        { certificationType: 'Certificate of Conformity', certificationNumber: 'CE 0123', standardCode: 'EN 374', certBodyName: 'SGS Switzerland', status: 'active', issueDate: '2024-03-18', expiryDate: '2029-03-17', dataSource: 'Swissmedic', sourceId: 'SM-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 新加坡HSA (Health Sciences Authority) 数据模拟
 */
class HSACollector {
  constructor() {
    this.name = 'HSA';
    this.country = 'Singapore';
    this.baseUrl = 'https://www.hsa.gov.sg';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集新加坡HSA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'N95 Respirator HSA Approved',
          productNameEn: 'N95 Respirator HSA Approved',
          productCode: 'N95-SG-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'HSA registered N95 respirator',
          manufacturerName: 'Raffles Medical',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-N95-001',
        },
        {
          productName: 'Surgical Mask 3-Ply',
          productNameEn: 'Surgical Mask 3-Ply',
          productCode: 'SM3-SG-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'ASTM Level 2 surgical mask',
          manufacturerName: 'Top Glove Singapore',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-SM3-002',
        },
        {
          productName: 'Nitrile Gloves Medical Grade',
          productNameEn: 'Nitrile Gloves Medical Grade',
          productCode: 'NGM-SG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Medical grade nitrile examination gloves',
          manufacturerName: 'Riverstone Holdings',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-NGM-003',
        },
        {
          productName: 'Face Shield Reusable',
          productNameEn: 'Face Shield Reusable',
          productCode: 'FSR-SG-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Reusable face shield with anti-fog',
          manufacturerName: 'Flextronics',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-FSR-004',
        },
        {
          productName: 'Isolation Gown Level 3',
          productNameEn: 'Isolation Gown Level 3',
          productCode: 'IG3-SG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'AAMI Level 3 isolation gown',
          manufacturerName: 'Medtecs International',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-IG3-005',
        },
        {
          productName: 'KN95 Respirator HSA',
          productNameEn: 'KN95 Respirator HSA',
          productCode: 'KN95-SG-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'HSA listed KN95 respirator',
          manufacturerName: 'Raffles Medical',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-KN95-006',
        },
        {
          productName: 'Safety Goggles Clear',
          productNameEn: 'Safety Goggles Clear',
          productCode: 'SGC-SG-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Clear safety goggles ANSI Z87.1',
          manufacturerName: '3M Singapore',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-SGC-007',
        },
        {
          productName: 'Vinyl Examination Gloves',
          productNameEn: 'Vinyl Examination Gloves',
          productCode: 'VEG-SG-008',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free vinyl examination gloves',
          manufacturerName: 'Top Glove Singapore',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-VEG-008',
        },
        {
          productName: 'PAPR Unit with Hood',
          productNameEn: 'PAPR Unit with Hood',
          productCode: 'PAPR-SG-009',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Powered air purifying respirator',
          manufacturerName: '3M Singapore',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-PAPR-009',
        },
        {
          productName: 'Shoe Covers Non-slip',
          productNameEn: 'Shoe Covers Non-slip',
          productCode: 'SCN-SG-010',
          category: '足部防护',
          ppeCategory: 'I',
          description: 'Non-slip disposable shoe covers',
          manufacturerName: 'Medtecs International',
          manufacturerCountry: 'Singapore',
          dataSource: 'HSA',
          sourceId: 'HSA-SCN-010',
        },
      ],
      manufacturers: [
        { companyName: 'Raffles Medical', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-001' },
        { companyName: 'Top Glove Singapore', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-002' },
        { companyName: 'Riverstone Holdings', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-003' },
        { companyName: 'Flextronics', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-004' },
        { companyName: 'Medtecs International', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-005' },
        { companyName: '3M Singapore', country: 'Singapore', dataSource: 'HSA', sourceId: 'HSA-MFG-006' },
      ],
      certifications: [
        { certificationType: 'HSA Medical Device Registration', certificationNumber: 'DEAL-2024-0001', standardCode: 'HSAR', certBodyName: 'HSA', status: 'active', issueDate: '2024-01-12', expiryDate: '2029-01-11', dataSource: 'HSA', sourceId: 'HSA-CERT-001' },
        { certificationType: 'GN-15 Registration', certificationNumber: 'GN15-2024-002', standardCode: 'GN-15', certBodyName: 'HSA', status: 'active', issueDate: '2024-02-22', expiryDate: '2029-02-21', dataSource: 'HSA', sourceId: 'HSA-CERT-002' },
        { certificationType: 'TGA Mutual Recognition', certificationNumber: 'TGA-MR-2024-003', standardCode: 'TGA', certBodyName: 'HSA', status: 'active', issueDate: '2024-03-25', expiryDate: '2029-03-24', dataSource: 'HSA', sourceId: 'HSA-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 印度CDSCO (Central Drugs Standard Control Organization) 数据模拟
 */
class CDSCOCollector {
  constructor() {
    this.name = 'CDSCO';
    this.country = 'India';
    this.baseUrl = 'https://cdsco.gov.in';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集印度CDSCO数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'N95 Mask ISI Marked',
          productNameEn: 'N95 Mask ISI Marked',
          productCode: 'N95-IN-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'BIS IS 9473 certified N95 respirator',
          manufacturerName: 'Venus Safety & Health',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-N95-001',
        },
        {
          productName: '3 Ply Surgical Mask',
          productNameEn: '3 Ply Surgical Mask',
          productCode: '3PS-IN-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'IS 16289 certified surgical face mask',
          manufacturerName: 'Salus Products',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-3PS-002',
        },
        {
          productName: 'Latex Examination Gloves',
          productNameEn: 'Latex Examination Gloves',
          productCode: 'LEG-IN-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'IS 15348 powdered latex gloves',
          manufacturerName: 'Sri Trang Agro-Industry',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-LEG-003',
        },
        {
          productName: 'Face Shield Medical',
          productNameEn: 'Face Shield Medical',
          productCode: 'FSM-IN-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Reusable face shield with foam band',
          manufacturerName: 'Z Plus Disposable',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-FSM-004',
        },
        {
          productName: 'Coverall PPE Kit',
          productNameEn: 'Coverall PPE Kit',
          productCode: 'CPK-IN-005',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'SITRA approved PPE kit with coverall',
          manufacturerName: 'Alok Industries',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-CPK-005',
        },
        {
          productName: 'FFP2 Respirator',
          productNameEn: 'FFP2 Respirator',
          productCode: 'FFP2-IN-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'IS 9473 FFP2 dust respirator',
          manufacturerName: 'Venus Safety & Health',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-FFP2-006',
        },
        {
          productName: 'Safety Goggles',
          productNameEn: 'Safety Goggles',
          productCode: 'SG-IN-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'IS 5983 safety goggles',
          manufacturerName: '3M India',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-SG-007',
        },
        {
          productName: 'Nitrile Gloves Blue',
          productNameEn: 'Nitrile Gloves Blue',
          productCode: 'NGB-IN-008',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Kanam Latex Industries',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-NGB-008',
        },
        {
          productName: 'Half Face Respirator',
          productNameEn: 'Half Face Respirator',
          productCode: 'HFR-IN-009',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'Twin cartridge half face respirator',
          manufacturerName: 'Shree Balaji Industries',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-HFR-009',
        },
        {
          productName: 'Disposable Cap',
          productNameEn: 'Disposable Cap',
          productCode: 'DC-IN-010',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Non-woven bouffant cap',
          manufacturerName: 'Dispowear Sterile Products',
          manufacturerCountry: 'India',
          dataSource: 'CDSCO',
          sourceId: 'CDSCO-DC-010',
        },
      ],
      manufacturers: [
        { companyName: 'Venus Safety & Health', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-001' },
        { companyName: 'Salus Products', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-002' },
        { companyName: 'Sri Trang Agro-Industry', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-003' },
        { companyName: 'Z Plus Disposable', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-004' },
        { companyName: 'Alok Industries', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-005' },
        { companyName: '3M India', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-006' },
        { companyName: 'Kanam Latex Industries', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-007' },
        { companyName: 'Shree Balaji Industries', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-008' },
        { companyName: 'Dispowear Sterile Products', country: 'India', dataSource: 'CDSCO', sourceId: 'CDSCO-MFG-009' },
      ],
      certifications: [
        { certificationType: 'Import License', certificationNumber: 'MD-15-2024-0001', standardCode: 'MDB-2024', certBodyName: 'CDSCO', status: 'active', issueDate: '2024-01-25', expiryDate: '2029-01-24', dataSource: 'CDSCO', sourceId: 'CDSCO-CERT-001' },
        { certificationType: 'Manufacturing License', certificationNumber: 'MFG-2024-002', standardCode: 'MDB-2024', certBodyName: 'CDSCO', status: 'active', issueDate: '2024-02-28', expiryDate: '2029-02-27', dataSource: 'CDSCO', sourceId: 'CDSCO-CERT-002' },
        { certificationType: 'BIS Certification', certificationNumber: 'ISI-2024-003', standardCode: 'IS 9473', certBodyName: 'BIS', status: 'active', issueDate: '2024-03-30', expiryDate: '2029-03-29', dataSource: 'CDSCO', sourceId: 'CDSCO-CERT-003' },
      ],
    };

    logger.info(`[${this.name}] 采集完成:`, {
      products: mockData.products.length,
      manufacturers: mockData.manufacturers.length,
      certifications: mockData.certifications.length,
    });

    return mockData;
  }
}

/**
 * 主采集函数
 */
async function collectAllExtendedData() {
  logger.info('========================================');
  logger.info('开始采集扩展全球PPE数据源');
  logger.info('========================================');

  const collectors = [
    new MFDSCollector(),
    new ANVISACollector(),
    new RoszdravnadzorCollector(),
    new MHRACollector(),
    new SwissmedicCollector(),
    new HSACollector(),
    new CDSCOCollector(),
  ];

  const allData = {
    products: [],
    manufacturers: [],
    certifications: [],
  };

  for (const collector of collectors) {
    try {
      const data = await collector.collect();
      allData.products.push(...data.products);
      allData.manufacturers.push(...data.manufacturers);
      allData.certifications.push(...data.certifications);
    } catch (error) {
      logger.error(`[${collector.name}] 采集失败`, error);
    }
  }

  logger.info('========================================');
  logger.info('扩展数据源采集完成');
  logger.info('========================================');
  logger.info('总数据量:', {
    products: allData.products.length,
    manufacturers: allData.manufacturers.length,
    certifications: allData.certifications.length,
  });

  // 保存数据
  const outputDir = path.join(__dirname, 'collected-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(outputDir, `extended-global-${timestamp}.json`);
  
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    result: allData,
  }, null, 2));

  logger.info(`数据已保存: ${outputFile}`);

  return allData;
}

// 执行采集
module.exports = { collectAllExtendedData };

// 如果直接运行此文件
if (require.main === module) {
  collectAllExtendedData().catch(error => {
    logger.error('采集失败', error);
    process.exit(1);
  });
}
