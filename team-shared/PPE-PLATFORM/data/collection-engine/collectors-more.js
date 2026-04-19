#!/usr/bin/env node

/**
 * MDLooker PPE 数据采集器 - 更多全球数据源
 * 包含：马来西亚MDA、南非SAHPRA、泰国FDA、墨西哥COFEPRIS、
 *       印尼BPOM、越南DAV、菲律宾FDA、阿根廷ANMAT、土耳其TITCK
 */

const fs = require('fs');
const path = require('path');

// 日志记录
const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, error ? error.message || error : ''),
};

/**
 * 马来西亚MDA (Medical Device Authority) 数据模拟
 */
class MDACollector {
  constructor() {
    this.name = 'MDA';
    this.country = 'Malaysia';
    this.baseUrl = 'https://www.mda.gov.my';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集马来西亚MDA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'N95 Particulate Respirator',
          productNameEn: 'N95 Particulate Respirator',
          productCode: 'MDA-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with NIOSH certification for Malaysia market',
          manufacturerName: 'Top Glove Malaysia',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-N95-001',
        },
        {
          productName: 'Surgical Face Mask 3-Ply',
          productNameEn: 'Surgical Face Mask 3-Ply',
          productCode: 'MDA-SFM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with bacterial filtration efficiency >98%',
          manufacturerName: 'Hartalega Holdings',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-SFM-002',
        },
        {
          productName: 'Nitrile Examination Gloves Powder-Free',
          productNameEn: 'Nitrile Examination Gloves Powder-Free',
          productCode: 'MDA-NEG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves, medical grade',
          manufacturerName: 'Supermax Corporation',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-NEG-003',
        },
        {
          productName: 'Latex Surgical Gloves',
          productNameEn: 'Latex Surgical Gloves',
          productCode: 'MDA-LSG-004',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves with textured surface',
          manufacturerName: 'Kossan Rubber Industries',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-LSG-004',
        },
        {
          productName: 'Medical Face Shield',
          productNameEn: 'Medical Face Shield',
          productCode: 'MDA-MFS-005',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Anti-fog medical face shield with adjustable headband',
          manufacturerName: 'Careplus Group',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-MFS-005',
        },
        {
          productName: 'Disposable Isolation Gown',
          productNameEn: 'Disposable Isolation Gown',
          productCode: 'MDA-DIG-006',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'AAMI Level 2 disposable isolation gown',
          manufacturerName: 'Comfort Gloves Berhad',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-DIG-006',
        },
        {
          productName: 'KN95 Protective Mask',
          productNameEn: 'KN95 Protective Mask',
          productCode: 'MDA-KN95-007',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 folding protective mask with 5-layer filtration',
          manufacturerName: 'Rubberex Corporation',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-KN95-007',
        },
        {
          productName: 'Safety Goggles Medical Grade',
          productNameEn: 'Safety Goggles Medical Grade',
          productCode: 'MDA-SGM-008',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical grade safety goggles with anti-fog coating',
          manufacturerName: 'Adventa Berhad',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-SGM-008',
        },
        {
          productName: 'Disposable Bouffant Cap',
          productNameEn: 'Disposable Bouffant Cap',
          productCode: 'MDA-DBC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Non-woven disposable bouffant cap for cleanroom',
          manufacturerName: 'Uchi Technologies',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-DBC-009',
        },
        {
          productName: 'Protective Coverall Type 5/6',
          productNameEn: 'Protective Coverall Type 5/6',
          productCode: 'MDA-PC56-010',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 protective coverall with hood and elastic cuffs',
          manufacturerName: 'Mycron Steel Berhad',
          manufacturerCountry: 'Malaysia',
          dataSource: 'MDA',
          sourceId: 'MDA-PC56-010',
        },
      ],
      manufacturers: [
        { companyName: 'Top Glove Malaysia', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-001' },
        { companyName: 'Hartalega Holdings', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-002' },
        { companyName: 'Supermax Corporation', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-003' },
        { companyName: 'Kossan Rubber Industries', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-004' },
        { companyName: 'Careplus Group', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-005' },
        { companyName: 'Comfort Gloves Berhad', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-006' },
        { companyName: 'Rubberex Corporation', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-007' },
        { companyName: 'Adventa Berhad', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-008' },
        { companyName: 'Uchi Technologies', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-009' },
        { companyName: 'Mycron Steel Berhad', country: 'Malaysia', dataSource: 'MDA', sourceId: 'MDA-MFG-010' },
      ],
      certifications: [
        { certificationType: 'MDA Registration', certificationNumber: 'MDA-REG-2024-001', standardCode: 'MS ISO 13485', certBodyName: 'MDA Malaysia', status: 'active', issueDate: '2024-01-15', expiryDate: '2027-01-14', dataSource: 'MDA', sourceId: 'MDA-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-MDA-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'SGS Malaysia', status: 'active', issueDate: '2024-02-01', expiryDate: '2027-01-31', dataSource: 'MDA', sourceId: 'MDA-CERT-002' },
        { certificationType: 'CE Marking', certificationNumber: 'CE-MDA-2024-003', standardCode: 'EN 149:2001', certBodyName: 'TÜV SÜD', status: 'active', issueDate: '2024-03-01', expiryDate: '2029-02-28', dataSource: 'MDA', sourceId: 'MDA-CERT-003' },
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
 * 南非SAHPRA (South African Health Products Regulatory Authority) 数据模拟
 */
class SAHPRACollector {
  constructor() {
    this.name = 'SAHPRA';
    this.country = 'South Africa';
    this.baseUrl = 'https://www.sahpra.org.za';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集南非SAHPRA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'FFP2 NR Respirator',
          productNameEn: 'FFP2 NR Respirator',
          productCode: 'SAHPRA-FFP2-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'FFP2 NR disposable respirator for South African market',
          manufacturerName: 'AfriPPE Manufacturing',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-FFP2-001',
        },
        {
          productName: 'Surgical Mask Type IIR',
          productNameEn: 'Surgical Mask Type IIR',
          productCode: 'SAHPRA-SM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: 'Type IIR surgical mask with fluid resistance',
          manufacturerName: 'Medhold Medical',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-SM-002',
        },
        {
          productName: 'Nitrile Examination Gloves Blue',
          productNameEn: 'Nitrile Examination Gloves Blue',
          productCode: 'SAHPRA-NEG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Blue nitrile examination gloves, powder-free',
          manufacturerName: 'Latex Surgical Products',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-NEG-003',
        },
        {
          productName: 'Protective Face Shield Reusable',
          productNameEn: 'Protective Face Shield Reusable',
          productCode: 'SAHPRA-PFS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Reusable face shield with replaceable visor',
          manufacturerName: 'SSEM Mthembu Medical',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-PFS-004',
        },
        {
          productName: 'Disposable Coverall White',
          productNameEn: 'Disposable Coverall White',
          productCode: 'SAHPRA-DC-005',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'White disposable coverall with elastic hood',
          manufacturerName: 'B Braun South Africa',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-DC-005',
        },
        {
          productName: 'Safety Goggles Anti-Fog',
          productNameEn: 'Safety Goggles Anti-Fog',
          productCode: 'SAHPRA-SGAF-006',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Anti-fog safety goggles with indirect ventilation',
          manufacturerName: '3M South Africa',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-SGAF-006',
        },
        {
          productName: 'Latex Surgical Gloves Sterile',
          productNameEn: 'Latex Surgical Gloves Sterile',
          productCode: 'SAHPRA-LSGS-007',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves, powdered',
          manufacturerName: 'Medi-Clinic SA',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-LSGS-007',
        },
        {
          productName: 'KN95 Folding Mask',
          productNameEn: 'KN95 Folding Mask',
          productCode: 'SAHPRA-KN95-008',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 folding protective mask with valve option',
          manufacturerName: 'Netcare Hospital Group',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-KN95-008',
        },
        {
          productName: 'Medical Bouffant Cap Blue',
          productNameEn: 'Medical Bouffant Cap Blue',
          productCode: 'SAHPRA-MBC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Blue bouffant cap for medical environments',
          manufacturerName: 'Life Healthcare',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-MBC-009',
        },
        {
          productName: 'Chemical Resistant Boots',
          productNameEn: 'Chemical Resistant Boots',
          productCode: 'SAHPRA-CRB-010',
          category: '足部防护',
          ppeCategory: 'III',
          description: 'Chemical resistant safety boots with steel toe',
          manufacturerName: 'Barloworld Medical',
          manufacturerCountry: 'South Africa',
          dataSource: 'SAHPRA',
          sourceId: 'SAHPRA-CRB-010',
        },
      ],
      manufacturers: [
        { companyName: 'AfriPPE Manufacturing', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-001' },
        { companyName: 'Medhold Medical', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-002' },
        { companyName: 'Latex Surgical Products', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-003' },
        { companyName: 'SSEM Mthembu Medical', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-004' },
        { companyName: 'B Braun South Africa', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-005' },
        { companyName: '3M South Africa', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-006' },
        { companyName: 'Medi-Clinic SA', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-007' },
        { companyName: 'Netcare Hospital Group', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-008' },
        { companyName: 'Life Healthcare', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-009' },
        { companyName: 'Barloworld Medical', country: 'South Africa', dataSource: 'SAHPRA', sourceId: 'SAHPRA-MFG-010' },
      ],
      certifications: [
        { certificationType: 'SAHPRA License', certificationNumber: 'SAHPRA-LIC-2024-001', standardCode: 'SANS 13485', certBodyName: 'SAHPRA', status: 'active', issueDate: '2024-01-20', expiryDate: '2027-01-19', dataSource: 'SAHPRA', sourceId: 'SAHPRA-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-SAHPRA-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'Bureau Veritas SA', status: 'active', issueDate: '2024-02-15', expiryDate: '2027-02-14', dataSource: 'SAHPRA', sourceId: 'SAHPRA-CERT-002' },
        { certificationType: 'SABS Certification', certificationNumber: 'SABS-2024-003', standardCode: 'SANS 50149', certBodyName: 'SABS', status: 'active', issueDate: '2024-03-10', expiryDate: '2029-03-09', dataSource: 'SAHPRA', sourceId: 'SAHPRA-CERT-003' },
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
 * 泰国FDA (Thailand Food and Drug Administration) 数据模拟
 */
class ThailandFDACollector {
  constructor() {
    this.name = 'Thailand FDA';
    this.country = 'Thailand';
    this.baseUrl = 'https://www.fda.moph.go.th';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集泰国FDA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'หน้ากากอนามัย N95',
          productNameEn: 'N95 Health Mask',
          productCode: 'THFDA-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator approved by Thailand FDA',
          manufacturerName: 'Thai Medica',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-N95-001',
        },
        {
          productName: 'หน้ากากผ่าตัด 3 ชั้น',
          productNameEn: '3-Ply Surgical Mask',
          productCode: 'THFDA-SM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with Thai FDA registration',
          manufacturerName: 'Sri Trang Gloves Thailand',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-SM-002',
        },
        {
          productName: 'ถุงมือไนไตรล์ ไม่มีแป้ง',
          productNameEn: 'Powder-Free Nitrile Gloves',
          productCode: 'THFDA-NG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Thai Rubber Latex Corporation',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-NG-003',
        },
        {
          productName: 'โล่ป้องกันใบหน้า',
          productNameEn: 'Face Shield',
          productCode: 'THFDA-FS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog coating',
          manufacturerName: 'Bangkok Medical Equipment',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-FS-004',
        },
        {
          productName: 'ชุดกาวน์ป้องกัน',
          productNameEn: 'Protective Gown',
          productCode: 'THFDA-PG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable protective gown AAMI Level 2',
          manufacturerName: 'Thai Hospital Products',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-PG-005',
        },
        {
          productName: 'หน้ากาก KN95',
          productNameEn: 'KN95 Mask',
          productCode: 'THFDA-KN95-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 protective mask with 5-layer filter',
          manufacturerName: 'Med-Con Thailand',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-KN95-006',
        },
        {
          productName: 'แว่นตานิรภัย',
          productNameEn: 'Safety Goggles',
          productCode: 'THFDA-SG-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical safety goggles with ventilation',
          manufacturerName: 'Thai Optical Group',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-SG-007',
        },
        {
          productName: 'ถุงมือผ่าตัด',
          productNameEn: 'Surgical Gloves',
          productCode: 'THFDA-SGL-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves',
          manufacturerName: 'Thai Glove Industry',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-SGL-008',
        },
        {
          productName: 'หมวกตัวหนอน',
          productNameEn: 'Bouffant Cap',
          productCode: 'THFDA-BC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Disposable bouffant cap for medical use',
          manufacturerName: 'Thai Medcare Products',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-BC-009',
        },
        {
          productName: 'รองเท้าบูทกันเคมี',
          productNameEn: 'Chemical Resistant Boots',
          productCode: 'THFDA-CRB-010',
          category: '足部防护',
          ppeCategory: 'III',
          description: 'Chemical resistant safety boots',
          manufacturerName: 'Thai Safety Equipment',
          manufacturerCountry: 'Thailand',
          dataSource: 'Thailand FDA',
          sourceId: 'THFDA-CRB-010',
        },
      ],
      manufacturers: [
        { companyName: 'Thai Medica', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-001' },
        { companyName: 'Sri Trang Gloves Thailand', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-002' },
        { companyName: 'Thai Rubber Latex Corporation', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-003' },
        { companyName: 'Bangkok Medical Equipment', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-004' },
        { companyName: 'Thai Hospital Products', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-005' },
        { companyName: 'Med-Con Thailand', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-006' },
        { companyName: 'Thai Optical Group', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-007' },
        { companyName: 'Thai Glove Industry', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-008' },
        { companyName: 'Thai Medcare Products', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-009' },
        { companyName: 'Thai Safety Equipment', country: 'Thailand', dataSource: 'Thailand FDA', sourceId: 'THFDA-MFG-010' },
      ],
      certifications: [
        { certificationType: 'Thai FDA Registration', certificationNumber: 'THFDA-REG-2024-001', standardCode: 'TIS 2424', certBodyName: 'Thai FDA', status: 'active', issueDate: '2024-01-10', expiryDate: '2027-01-09', dataSource: 'Thailand FDA', sourceId: 'THFDA-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-TH-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'TUV Thailand', status: 'active', issueDate: '2024-02-20', expiryDate: '2027-02-19', dataSource: 'Thailand FDA', sourceId: 'THFDA-CERT-002' },
        { certificationType: 'GMP Certificate', certificationNumber: 'GMP-TH-2024-003', standardCode: 'ASEAN GMP', certBodyName: 'Thai FDA', status: 'active', issueDate: '2024-03-15', expiryDate: '2027-03-14', dataSource: 'Thailand FDA', sourceId: 'THFDA-CERT-003' },
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
 * 墨西哥COFEPRIS (Federal Commission for Protection against Sanitary Risk) 数据模拟
 */
class COFEPRISCollector {
  constructor() {
    this.name = 'COFEPRIS';
    this.country = 'Mexico';
    this.baseUrl = 'https://www.gob.mx/cofepris';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集墨西哥COFEPRIS数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Respirador N95',
          productNameEn: 'N95 Respirator',
          productCode: 'COFEPRIS-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with COFEPRIS registration for Mexico',
          manufacturerName: '3M Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-N95-001',
        },
        {
          productName: 'Cubrebocas Quirúrgico 3 Capas',
          productNameEn: '3-Ply Surgical Mask',
          productCode: 'COFEPRIS-SM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with bacterial filtration',
          manufacturerName: 'Medline Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-SM-002',
        },
        {
          productName: 'Guantes de Nitrilo sin Polvo',
          productNameEn: 'Powder-Free Nitrile Gloves',
          productCode: 'COFEPRIS-NG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Kimberly-Clark Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-NG-003',
        },
        {
          productName: 'Careta Protectora Facial',
          productNameEn: 'Face Shield',
          productCode: 'COFEPRIS-FS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog treatment',
          manufacturerName: 'Cardinal Health Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-FS-004',
        },
        {
          productName: 'Bata de Aislamiento Desechable',
          productNameEn: 'Disposable Isolation Gown',
          productCode: 'COFEPRIS-DIG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable isolation gown AAMI Level 2',
          manufacturerName: 'Hartmann Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-DIG-005',
        },
        {
          productName: 'Respirador N95 con Válvula',
          productNameEn: 'N95 Respirator with Valve',
          productCode: 'COFEPRIS-N95V-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with exhalation valve',
          manufacturerName: 'Ansell Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-N95V-006',
        },
        {
          productName: 'Gafas de Seguridad Médica',
          productNameEn: 'Medical Safety Glasses',
          productCode: 'COFEPRIS-SG-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical safety goggles with anti-fog coating',
          manufacturerName: 'Becton Dickinson Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-SG-007',
        },
        {
          productName: 'Guantes Quirúrgicos de Látex',
          productNameEn: 'Latex Surgical Gloves',
          productCode: 'COFEPRIS-LSG-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves, powdered',
          manufacturerName: 'Terumo Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-LSG-008',
        },
        {
          productName: 'Gorro Quirúrgico Desechable',
          productNameEn: 'Disposable Surgical Cap',
          productCode: 'COFEPRIS-DSC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Disposable surgical bouffant cap',
          manufacturerName: 'Fresenius Medical Care Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-DSC-009',
        },
        {
          productName: 'Overol de Protección Tipo 5/6',
          productNameEn: 'Protective Coverall Type 5/6',
          productCode: 'COFEPRIS-PC-010',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 protective coverall with hood',
          manufacturerName: 'Medtronic Mexico',
          manufacturerCountry: 'Mexico',
          dataSource: 'COFEPRIS',
          sourceId: 'COFEPRIS-PC-010',
        },
      ],
      manufacturers: [
        { companyName: '3M Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-001' },
        { companyName: 'Medline Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-002' },
        { companyName: 'Kimberly-Clark Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-003' },
        { companyName: 'Cardinal Health Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-004' },
        { companyName: 'Hartmann Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-005' },
        { companyName: 'Ansell Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-006' },
        { companyName: 'Becton Dickinson Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-007' },
        { companyName: 'Terumo Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-008' },
        { companyName: 'Fresenius Medical Care Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-009' },
        { companyName: 'Medtronic Mexico', country: 'Mexico', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-MFG-010' },
      ],
      certifications: [
        { certificationType: 'COFEPRIS Registration', certificationNumber: 'COFEPRIS-REG-2024-001', standardCode: 'NOM-116', certBodyName: 'COFEPRIS', status: 'active', issueDate: '2024-01-05', expiryDate: '2027-01-04', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-MX-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'SGS Mexico', status: 'active', issueDate: '2024-02-10', expiryDate: '2027-02-09', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-CERT-002' },
        { certificationType: 'NOM Certification', certificationNumber: 'NOM-2024-003', standardCode: 'NOM-241', certBodyName: 'ANCE', status: 'active', issueDate: '2024-03-01', expiryDate: '2029-02-28', dataSource: 'COFEPRIS', sourceId: 'COFEPRIS-CERT-003' },
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
 * 印尼BPOM (Badan Pengawas Obat dan Makanan) 数据模拟
 */
class BPOMCollector {
  constructor() {
    this.name = 'BPOM';
    this.country = 'Indonesia';
    this.baseUrl = 'https://www.bpom.go.id';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集印尼BPOM数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Masker N95',
          productNameEn: 'N95 Mask',
          productCode: 'BPOM-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with BPOM registration for Indonesia',
          manufacturerName: 'PT Kimia Farma',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-N95-001',
        },
        {
          productName: 'Masker Bedah 3 Lapis',
          productNameEn: '3-Ply Surgical Mask',
          productCode: 'BPOM-SM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with BPOM approval',
          manufacturerName: 'PT Indofarma',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-SM-002',
        },
        {
          productName: 'Sarung Tangan Nitril',
          productNameEn: 'Nitrile Gloves',
          productCode: 'BPOM-NG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'PT Kalbe Farma',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-NG-003',
        },
        {
          productName: 'Pelindung Wajah Medis',
          productNameEn: 'Medical Face Shield',
          productCode: 'BPOM-MFS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog coating',
          manufacturerName: 'PT Tempo Scan Pacific',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-MFS-004',
        },
        {
          productName: 'Baju APD Sekali Pakai',
          productNameEn: 'Disposable PPE Gown',
          productCode: 'BPOM-APG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable protective gown for healthcare workers',
          manufacturerName: 'PT Bio Farma',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-APG-005',
        },
        {
          productName: 'Masker KN95',
          productNameEn: 'KN95 Mask',
          productCode: 'BPOM-KN95-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 protective mask with 5-layer filtration',
          manufacturerName: 'PT Darya-Varia Laboratoria',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-KN95-006',
        },
        {
          productName: 'Kacamata Pelindung',
          productNameEn: 'Protective Goggles',
          productCode: 'BPOM-PG-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical safety goggles with ventilation',
          manufacturerName: 'PT Phapros',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-PG-007',
        },
        {
          productName: 'Sarung Tangan Bedah',
          productNameEn: 'Surgical Gloves',
          productCode: 'BPOM-SGL-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves',
          manufacturerName: 'PT Sido Muncul',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-SGL-008',
        },
        {
          productName: 'Topi Bedah Sekali Pakai',
          productNameEn: 'Disposable Surgical Cap',
          productCode: 'BPOM-DSC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Disposable bouffant cap for medical use',
          manufacturerName: 'PT Hexpharm Jaya Laboratories',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-DSC-009',
        },
        {
          productName: 'Sepatu Boots Medis',
          productNameEn: 'Medical Boots',
          productCode: 'BPOM-MB-010',
          category: '足部防护',
          ppeCategory: 'III',
          description: 'Medical protective boots with anti-slip sole',
          manufacturerName: 'PT Medion Farma Jaya',
          manufacturerCountry: 'Indonesia',
          dataSource: 'BPOM',
          sourceId: 'BPOM-MB-010',
        },
      ],
      manufacturers: [
        { companyName: 'PT Kimia Farma', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-001' },
        { companyName: 'PT Indofarma', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-002' },
        { companyName: 'PT Kalbe Farma', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-003' },
        { companyName: 'PT Tempo Scan Pacific', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-004' },
        { companyName: 'PT Bio Farma', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-005' },
        { companyName: 'PT Darya-Varia Laboratoria', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-006' },
        { companyName: 'PT Phapros', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-007' },
        { companyName: 'PT Sido Muncul', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-008' },
        { companyName: 'PT Hexpharm Jaya Laboratories', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-009' },
        { companyName: 'PT Medion Farma Jaya', country: 'Indonesia', dataSource: 'BPOM', sourceId: 'BPOM-MFG-010' },
      ],
      certifications: [
        { certificationType: 'BPOM Registration', certificationNumber: 'BPOM-REG-2024-001', standardCode: 'SNI 8550', certBodyName: 'BPOM Indonesia', status: 'active', issueDate: '2024-01-08', expiryDate: '2027-01-07', dataSource: 'BPOM', sourceId: 'BPOM-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-ID-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'BSI Indonesia', status: 'active', issueDate: '2024-02-18', expiryDate: '2027-02-17', dataSource: 'BPOM', sourceId: 'BPOM-CERT-002' },
        { certificationType: 'SNI Certification', certificationNumber: 'SNI-2024-003', standardCode: 'SNI 1914', certBodyName: 'LSPro', status: 'active', issueDate: '2024-03-12', expiryDate: '2029-03-11', dataSource: 'BPOM', sourceId: 'BPOM-CERT-003' },
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
 * 越南DAV (Drug Administration of Vietnam) 数据模拟
 */
class DAVCollector {
  constructor() {
    this.name = 'DAV';
    this.country = 'Vietnam';
    this.baseUrl = 'https://dav.gov.vn';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集越南DAV数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Khẩu Trang N95',
          productNameEn: 'N95 Mask',
          productCode: 'DAV-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with DAV registration for Vietnam',
          manufacturerName: 'Vietnam Medical Equipment',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-N95-001',
        },
        {
          productName: 'Khẩu Trang Y Tế 3 Lớp',
          productNameEn: '3-Ply Medical Mask',
          productCode: 'DAV-MM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply medical mask with DAV approval',
          manufacturerName: 'Vingroup Medical',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-MM-002',
        },
        {
          productName: 'Găng Tay Nitrile',
          productNameEn: 'Nitrile Gloves',
          productCode: 'DAV-NG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'VRG Khai Hoan',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-NG-003',
        },
        {
          productName: 'Kính Chắn Giọt Bắn',
          productNameEn: 'Face Shield',
          productCode: 'DAV-FS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog coating',
          manufacturerName: 'An Phat Holdings',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-FS-004',
        },
        {
          productName: 'Áo Choàng Bảo Hộ',
          productNameEn: 'Protective Gown',
          productCode: 'DAV-PG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable protective gown for healthcare',
          manufacturerName: 'Nam Thai Son Export',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-PG-005',
        },
        {
          productName: 'Khẩu Trang KN95',
          productNameEn: 'KN95 Mask',
          productCode: 'DAV-KN95-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 protective mask with 5-layer filter',
          manufacturerName: 'Traphaco',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-KN95-006',
        },
        {
          productName: 'Kính Bảo Hộ Y Tế',
          productNameEn: 'Medical Safety Glasses',
          productCode: 'DAV-MSG-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical safety goggles with ventilation',
          manufacturerName: 'Domesco Medical',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-MSG-007',
        },
        {
          productName: 'Găng Tay Phẫu Thuật',
          productNameEn: 'Surgical Gloves',
          productCode: 'DAV-SGL-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves',
          manufacturerName: 'Imexpharm',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-SGL-008',
        },
        {
          productName: 'Mũ Y Tế Dùng Một Lần',
          productNameEn: 'Disposable Medical Cap',
          productCode: 'DAV-DMC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Disposable bouffant cap for medical use',
          manufacturerName: 'DHG Pharmaceutical',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-DMC-009',
        },
        {
          productName: 'Ủng Bảo Hộ Chống Hóa Chất',
          productNameEn: 'Chemical Resistant Boots',
          productCode: 'DAV-CRB-010',
          category: '足部防护',
          ppeCategory: 'III',
          description: 'Chemical resistant safety boots',
          manufacturerName: 'Pymepharco',
          manufacturerCountry: 'Vietnam',
          dataSource: 'DAV',
          sourceId: 'DAV-CRB-010',
        },
      ],
      manufacturers: [
        { companyName: 'Vietnam Medical Equipment', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-001' },
        { companyName: 'Vingroup Medical', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-002' },
        { companyName: 'VRG Khai Hoan', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-003' },
        { companyName: 'An Phat Holdings', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-004' },
        { companyName: 'Nam Thai Son Export', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-005' },
        { companyName: 'Traphaco', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-006' },
        { companyName: 'Domesco Medical', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-007' },
        { companyName: 'Imexpharm', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-008' },
        { companyName: 'DHG Pharmaceutical', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-009' },
        { companyName: 'Pymepharco', country: 'Vietnam', dataSource: 'DAV', sourceId: 'DAV-MFG-010' },
      ],
      certifications: [
        { certificationType: 'DAV Registration', certificationNumber: 'DAV-REG-2024-001', standardCode: 'TCVN 8389', certBodyName: 'DAV Vietnam', status: 'active', issueDate: '2024-01-12', expiryDate: '2027-01-11', dataSource: 'DAV', sourceId: 'DAV-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-VN-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'TUV Vietnam', status: 'active', issueDate: '2024-02-22', expiryDate: '2027-02-21', dataSource: 'DAV', sourceId: 'DAV-CERT-002' },
        { certificationType: 'TCVN Certification', certificationNumber: 'TCVN-2024-003', standardCode: 'TCVN 7438', certBodyName: 'QUACERT', status: 'active', issueDate: '2024-03-18', expiryDate: '2029-03-17', dataSource: 'DAV', sourceId: 'DAV-CERT-003' },
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
 * 菲律宾FDA (Food and Drug Administration Philippines) 数据模拟
 */
class PhilippinesFDACollector {
  constructor() {
    this.name = 'Philippines FDA';
    this.country = 'Philippines';
    this.baseUrl = 'https://www.fda.gov.ph';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集菲律宾FDA数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'N95 Respirator Mask',
          productNameEn: 'N95 Respirator Mask',
          productCode: 'PHFDA-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with Philippines FDA registration',
          manufacturerName: 'United Laboratories Inc',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-N95-001',
        },
        {
          productName: 'Surgical Face Mask 3-Ply',
          productNameEn: 'Surgical Face Mask 3-Ply',
          productCode: 'PHFDA-SFM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with FDA Philippines approval',
          manufacturerName: 'Pfizer Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-SFM-002',
        },
        {
          productName: 'Nitrile Examination Gloves',
          productNameEn: 'Nitrile Examination Gloves',
          productCode: 'PHFDA-NEG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Merck Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-NEG-003',
        },
        {
          productName: 'Medical Face Shield',
          productNameEn: 'Medical Face Shield',
          productCode: 'PHFDA-MFS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog coating',
          manufacturerName: 'GlaxoSmithKline Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-MFS-004',
        },
        {
          productName: 'Isolation Gown Disposable',
          productNameEn: 'Isolation Gown Disposable',
          productCode: 'PHFDA-IGD-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable isolation gown AAMI Level 2',
          manufacturerName: 'Sanofi Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-IGD-005',
        },
        {
          productName: 'KN95 Protective Mask',
          productNameEn: 'KN95 Protective Mask',
          productCode: 'PHFDA-KN95-006',
          category: '呼吸防护',
          ppeCategory: 'II',
          description: 'KN95 protective mask with 5-layer filtration',
          manufacturerName: 'AstraZeneca Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-KN95-006',
        },
        {
          productName: 'Safety Goggles Medical',
          productNameEn: 'Safety Goggles Medical',
          productCode: 'PHFDA-SGM-007',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical safety goggles with ventilation',
          manufacturerName: 'Novartis Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-SGM-007',
        },
        {
          productName: 'Latex Surgical Gloves',
          productNameEn: 'Latex Surgical Gloves',
          productCode: 'PHFDA-LSG-008',
          category: '手部防护',
          ppeCategory: 'II',
          description: 'Sterile latex surgical gloves',
          manufacturerName: 'Bayer Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-LSG-008',
        },
        {
          productName: 'Disposable Bouffant Cap',
          productNameEn: 'Disposable Bouffant Cap',
          productCode: 'PHFDA-DBC-009',
          category: '头部防护',
          ppeCategory: 'I',
          description: 'Disposable bouffant cap for medical use',
          manufacturerName: 'Roche Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-DBC-009',
        },
        {
          productName: 'Protective Coverall Type 5/6',
          productNameEn: 'Protective Coverall Type 5/6',
          productCode: 'PHFDA-PC-010',
          category: '身体防护',
          ppeCategory: 'III',
          description: 'Type 5/6 protective coverall with hood',
          manufacturerName: 'Johnson & Johnson Philippines',
          manufacturerCountry: 'Philippines',
          dataSource: 'Philippines FDA',
          sourceId: 'PHFDA-PC-010',
        },
      ],
      manufacturers: [
        { companyName: 'United Laboratories Inc', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-001' },
        { companyName: 'Pfizer Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-002' },
        { companyName: 'Merck Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-003' },
        { companyName: 'GlaxoSmithKline Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-004' },
        { companyName: 'Sanofi Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-005' },
        { companyName: 'AstraZeneca Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-006' },
        { companyName: 'Novartis Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-007' },
        { companyName: 'Bayer Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-008' },
        { companyName: 'Roche Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-009' },
        { companyName: 'Johnson & Johnson Philippines', country: 'Philippines', dataSource: 'Philippines FDA', sourceId: 'PHFDA-MFG-010' },
      ],
      certifications: [
        { certificationType: 'Philippines FDA LTO', certificationNumber: 'PHFDA-LTO-2024-001', standardCode: 'AO 2020-0017', certBodyName: 'Philippines FDA', status: 'active', issueDate: '2024-01-14', expiryDate: '2027-01-13', dataSource: 'Philippines FDA', sourceId: 'PHFDA-CERT-001' },
        { certificationType: 'ISO 13485', certificationNumber: 'ISO-PH-2024-002', standardCode: 'ISO 13485:2016', certBodyName: 'TUV Philippines', status: 'active', issueDate: '2024-02-24', expiryDate: '2027-02-23', dataSource: 'Philippines FDA', sourceId: 'PHFDA-CERT-002' },
        { certificationType: 'CDRHR Registration', certificationNumber: 'CDRHR-2024-003', standardCode: 'PNS 2030', certBodyName: 'DTI-BPS', status: 'active', issueDate: '2024-03-20', expiryDate: '2029-03-19', dataSource: 'Philippines FDA', sourceId: 'PHFDA-CERT-003' },
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
 * 阿根廷ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica) 数据模拟
 */
class ANMATCollector {
  constructor() {
    this.name = 'ANMAT';
    this.country = 'Argentina';
    this.baseUrl = 'https://www.anmat.gov.ar';
  }

  async collect() {
    logger.info(`[${this.name}] 开始采集阿根廷ANMAT数据...`);
    
    const mockData = {
      products: [
        {
          productName: 'Respirador N95',
          productNameEn: 'N95 Respirator',
          productCode: 'ANMAT-N95-001',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with ANMAT registration for Argentina',
          manufacturerName: 'Laboratorio Elea Phoenix',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-N95-001',
        },
        {
          productName: 'Barbijo Quirúrgico 3 Capas',
          productNameEn: '3-Ply Surgical Mask',
          productCode: 'ANMAT-SM-002',
          category: '呼吸防护',
          ppeCategory: 'I',
          description: '3-ply surgical mask with ANMAT approval',
          manufacturerName: 'Bago Laboratorios',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-SM-002',
        },
        {
          productName: 'Guantes de Nitrilo sin Polvo',
          productNameEn: 'Powder-Free Nitrile Gloves',
          productCode: 'ANMAT-NG-003',
          category: '手部防护',
          ppeCategory: 'I',
          description: 'Powder-free nitrile examination gloves',
          manufacturerName: 'Gador SA',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-NG-003',
        },
        {
          productName: 'Protector Facial Médico',
          productNameEn: 'Medical Face Shield',
          productCode: 'ANMAT-MFS-004',
          category: '眼面防护',
          ppeCategory: 'II',
          description: 'Medical face shield with anti-fog coating',
          manufacturerName: 'Roemmers SA',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-MFS-004',
        },
        {
          productName: 'Bata de Aislamiento Desechable',
          productNameEn: 'Disposable Isolation Gown',
          productCode: 'ANMAT-DIG-005',
          category: '身体防护',
          ppeCategory: 'II',
          description: 'Disposable isolation gown for healthcare',
          manufacturerName: 'Bayer Argentina',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-DIG-005',
        },
        {
          productName: 'Barbijo N95 con Válvula',
          productNameEn: 'N95 Mask with Valve',
          productCode: 'ANMAT-N95V-006',
          category: '呼吸防护',
          ppeCategory: 'III',
          description: 'N95 respirator with exhalation valve',
          manufacturerName: 'Pfizer Argentina',
          manufacturerCountry: 'Argentina',
          dataSource: 'ANMAT',
          sourceId: 'ANMAT-N95V-006',
        },
