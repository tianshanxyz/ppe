// Medplum 数据映射实现

import { Device, Organization } from '@medplum/fhirtypes'
import { DeviceMapper, OrganizationMapper, RegulatoryAuthorizationMapper } from './syncStrategy';

// 现有 MDLooker 数据结构接口
interface MDLookerProduct {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  market_status: string;
  approval_date: string;
  expiration_date: string;
  jurisdictions: string[];
  regulatory_status: string;
  links: {
    fda?: string;
    ce?: string;
    pmda?: string;
  };
  created_at: string;
  updated_at: string;
  _medplum_extensions?: unknown;
}

interface MDLookerCompany {
  id: string;
  name: string;
  headquarters: string;
  founded: string;
  employees: number;
  revenue: string;
  industry: string;
  website: string;
  description: string;
  products: number;
  created_at: string;
  updated_at: string;
  _medplum_extensions?: unknown;
}

interface MDLookerRegulation {
  id: string;
  title: string;
  jurisdiction: string;
  category: string;
  effective_date: string;
  expiration_date: string;
  description: string;
  requirements: string[];
  penalties: string[];
  links: string[];
  created_at: string;
  updated_at: string;
  _medplum_extensions?: unknown;
}

// 数据映射服务类
export class DataMappingService {
  private deviceMapper: DeviceMapper;
  private organizationMapper: OrganizationMapper;
  private regulatoryMapper: RegulatoryAuthorizationMapper;

  constructor() {
    this.deviceMapper = new DeviceMapper();
    this.organizationMapper = new OrganizationMapper();
    this.regulatoryMapper = new RegulatoryAuthorizationMapper();
  }

  // 映射 Medplum Device 到 MDLooker Product
  mapDeviceToProduct(device: Device): MDLookerProduct {
    return this.deviceMapper.map(device) as MDLookerProduct;
  }

  // 映射 MDLooker Product 到 Medplum Device
  mapProductToDevice(product: MDLookerProduct): Device {
    return this.deviceMapper.reverseMap(product);
  }

  // 映射 Medplum Organization 到 MDLooker Company
  mapOrganizationToCompany(organization: Organization): MDLookerCompany {
    return this.organizationMapper.map(organization) as MDLookerCompany;
  }

  // 映射 MDLooker Company 到 Medplum Organization
  mapCompanyToOrganization(company: MDLookerCompany): Organization {
    return this.organizationMapper.reverseMapCompany(company);
  }

  // 映射 Medplum RegulatoryAuthorization 到 MDLooker Regulation
  mapRegulatoryToRegulation(regulatory: unknown): MDLookerRegulation {
    return this.regulatoryMapper.map(regulatory) as MDLookerRegulation;
  }

  // 映射 MDLooker Regulation 到 Medplum RegulatoryAuthorization
  mapRegulationToRegulatory(regulation: MDLookerRegulation): unknown {
    return this.regulatoryMapper.reverseMap(regulation);
  }

  // 批量映射设备数据
  batchMapDevices(devices: Device[]): MDLookerProduct[] {
    return devices.map(device => this.mapDeviceToProduct(device));
  }

  // 批量映射组织数据
  batchMapOrganizations(organizations: Organization[]): MDLookerCompany[] {
    return organizations.map(organization => this.mapOrganizationToCompany(organization));
  }

  // 批量映射法规数据
  batchMapRegulatory(regulatoryItems: unknown[]): MDLookerRegulation[] {
    return regulatoryItems.map(regulatory => this.mapRegulatoryToRegulation(regulatory));
  }

  // 处理数据冲突
  resolveConflict<T>(existingData: T, newData: T, source: 'medplum' | 'local'): T {
    // 时间戳优先策略
    const existingUpdatedAt = (existingData as any).updated_at;
    const newUpdatedAt = (newData as any).updated_at;

    if (existingUpdatedAt && newUpdatedAt) {
      const existingDate = new Date(existingUpdatedAt);
      const newDate = new Date(newUpdatedAt);

      if (newDate > existingDate) {
        return newData;
      } else if (newDate < existingDate) {
        return existingData;
      }
    }

    // 来源优先级策略
    if (source === 'medplum') {
      return newData;
    }

    return existingData;
  }

  // 验证数据一致性
  validateDataConsistency<T>(data: T, type: 'product' | 'company' | 'regulation'): boolean {
    switch (type) {
      case 'product':
        const product = data as MDLookerProduct;
        return !!(product.id && product.name && product.manufacturer && product.model);
      case 'company':
        const company = data as MDLookerCompany;
        return !!(company.id && company.name);
      case 'regulation':
        const regulation = data as MDLookerRegulation;
        return !!(regulation.id && regulation.title && regulation.jurisdiction);
      default:
        return false;
    }
  }

  // 规范化数据格式
  normalizeData<T>(data: T, type: 'product' | 'company' | 'regulation'): T {
    switch (type) {
      case 'product':
        const product = data as MDLookerProduct;
        return {
          ...product,
          name: product.name.trim(),
          manufacturer: product.manufacturer.trim(),
          model: product.model.trim(),
          category: product.category || 'Other',
          market_status: product.market_status || 'Unknown',
          created_at: product.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as T;
      case 'company':
        const company = data as MDLookerCompany;
        return {
          ...company,
          name: company.name.trim(),
          industry: company.industry || 'Other',
          created_at: company.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as T;
      case 'regulation':
        const regulation = data as MDLookerRegulation;
        return {
          ...regulation,
          title: regulation.title.trim(),
          jurisdiction: regulation.jurisdiction || 'Unknown',
          category: regulation.category || 'Medical Device',
          created_at: regulation.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as T;
      default:
        return data;
    }
  }

  // 生成数据来源标注
  generateSourceAnnotation(source: 'medplum' | 'local', sourceId: string): unknown {
    return {
      source,
      source_id: sourceId,
      imported_at: new Date().toISOString(),
      version: '1.0',
    };
  }

  // 合并数据
  mergeData<T>(existingData: T, newData: T): T {
    return {
      ...existingData,
      ...newData,
      updated_at: new Date().toISOString(),
    };
  }
}

// 数据映射工具函数
export function createDataMappingService(): DataMappingService {
  return new DataMappingService();
}

// 导出映射器实例
export const dataMappingService = createDataMappingService();

// 测试映射功能
export function testMapping() {
  console.log('Testing data mapping...');
  
  // 测试设备映射
  const testDevice: Device = {
    resourceType: 'Device',
    id: 'device-1',
    deviceName: [{ name: 'Test Device', type: 'model-name' }],
    manufacturer: 'Test Manufacturer',
    modelNumber: 'TD-1000',
    type: {
      coding: [{ system: 'http://snomed.info/sct', code: '441624002', display: 'Medical Device' }]
    },
    status: 'active',
    expirationDate: '2026-12-31',
    version: [{ value: '1.0' }],
    serialNumber: 'SN-001',
  };

  const mappedProduct = dataMappingService.mapDeviceToProduct(testDevice);
  console.log('Mapped Device to Product:', mappedProduct);

  // 测试组织映射
  const testOrganization: Organization = {
    resourceType: 'Organization',
    id: 'org-1',
    name: 'Test Organization',
    active: true,
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '286406003', display: 'Healthcare Provider' }] }],
    contact: [{
      telecom: [{ system: 'url', value: 'https://test.org' }]
    }],
  };

  const mappedCompany = dataMappingService.mapOrganizationToCompany(testOrganization);
  console.log('Mapped Organization to Company:', mappedCompany);

  // 测试法规映射
  const testRegulatory: unknown = {
    resourceType: 'Device',
    id: 'reg-1',
    type: {
      coding: [{ system: 'http://snomed.info/sct', code: '441624002', display: 'Medical Device Regulation' }]
    },
    status: 'active',
    description: 'A test regulation',
    validityPeriod: {
      start: '2024-01-01',
      end: '2026-12-31'
    },
    regulator: { reference: 'Organization/org-1' },
  };

  const mappedRegulation = dataMappingService.mapRegulatoryToRegulation(testRegulatory);
  console.log('Mapped Regulatory to Regulation:', mappedRegulation);

  console.log('Mapping test completed!');
}