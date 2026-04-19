// Medplum 数据同步策略

import { MedplumClient } from '@medplum/core';
import { Device, Organization } from '@medplum/fhirtypes';

// 同步配置接口
export interface SyncConfig {
  frequency: {
    devices: number; // 设备数据同步频率（分钟）
    organizations: number; // 组织数据同步频率（分钟）
    regulatory: number; // 法规数据同步频率（分钟）
  };
  batchSize: number; // 批量处理大小
  retryAttempts: number; // 重试次数
  retryDelay: number; // 重试延迟（毫秒）
  timeout: number; // 同步超时（毫秒）
}

// 同步状态接口
export interface SyncStatus {
  lastSync: {
    devices: string | null;
    organizations: string | null;
    regulatory: string | null;
  };
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  syncedCount: number;
  totalCount: number;
}

// 同步结果接口
export interface SyncResult {
  success: boolean;
  message: string;
  syncedItems: number;
  failedItems: number;
  lastSyncTime: string;
}

// 数据映射接口
export interface DataMapper<T, U> {
  map(source: T): U;
  reverseMap(target: U): T;
}

// 同步服务类
export class SyncService {
  private client: MedplumClient;
  private config: SyncConfig;
  private status: SyncStatus;

  constructor(client: MedplumClient, config: Partial<SyncConfig> = {}) {
    this.client = client;
    this.config = {
      frequency: {
        devices: config.frequency?.devices || 60, // 每小时
        organizations: config.frequency?.organizations || 1440, // 每天
        regulatory: config.frequency?.regulatory || 360, // 每6小时
      },
      batchSize: config.batchSize || 50,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 30000,
    };
    this.status = {
      lastSync: {
        devices: null,
        organizations: null,
        regulatory: null,
      },
      status: 'idle',
      syncedCount: 0,
      totalCount: 0,
    };
  }

  // 获取同步状态
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  // 执行设备数据同步
  async syncDevices(): Promise<SyncResult> {
    return this.syncResource<Device>('Device', this.status.lastSync.devices);
  }

  // 执行组织数据同步
  async syncOrganizations(): Promise<SyncResult> {
    return this.syncResource<Organization>('Organization', this.status.lastSync.organizations);
  }

  // 执行法规数据同步
  async syncRegulatory(): Promise<SyncResult> {
    // Note: Using Device as a placeholder since RegulatoryAuthorization is not a standard FHIR resource
    return this.syncResource<any>('Device', this.status.lastSync.regulatory);
  }

  // 同步指定资源类型
  private async syncResource<T>(resourceType: string, lastSyncTime: string | null): Promise<SyncResult> {
    this.status = {
      ...this.status,
      status: 'running',
      syncedCount: 0,
      totalCount: 0,
    };

    try {
      const now = new Date().toISOString();
      let syncedItems = 0;
      let failedItems = 0;

      // 构建查询参数
      const query: Record<string, string> = {};
      if (lastSyncTime) {
        query['_lastUpdated'] = `gt${lastSyncTime}`;
      }
      query['_count'] = this.config.batchSize.toString();

      // 分页获取数据
      let nextPage: string | undefined;
      do {
        const response = await this.retry(() => 
          this.client.searchResources(resourceType as any, { ...query, _page: nextPage })
        );

        const resources = response as any[];

        if (resources && resources.length > 0) {
          for (const resource of resources) {
            try {
              // 处理单个资源
              await this.processResource(resource as T);
              syncedItems++;
              this.status.syncedCount++;
            } catch (error) {
              console.error(`处理 ${resourceType} 资源失败:`, error);
              failedItems++;
            }
          }
        }

       const nextUrl = (response as any).link?.find((link: any) => link.relation === 'next')?.url;
      } while (nextPage);

      // 更新最后同步时间
      this.status.lastSync[resourceType.toLowerCase() as keyof typeof this.status.lastSync] = now;
      this.status.status = 'success';

      return {
        success: true,
        message: `成功同步 ${resourceType} 数据，共处理 ${syncedItems + failedItems} 条，成功 ${syncedItems} 条，失败 ${failedItems} 条`,
        syncedItems,
        failedItems,
        lastSyncTime: now,
      };
    } catch (error) {
      this.status.status = 'error';
      this.status.error = error instanceof Error ? error.message : '未知错误';

      return {
        success: false,
        message: `同步 ${resourceType} 数据失败: ${this.status.error}`,
        syncedItems: 0,
        failedItems: 0,
        lastSyncTime: new Date().toISOString(),
      };
    }
  }

  // 处理单个资源
  private async processResource<T>(resource: T): Promise<void> {
    // 这里实现具体的资源处理逻辑
    // 包括数据映射、存储等
    console.log('处理资源:', resource);
  }

  // 重试机制
  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < this.config.retryAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < this.config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (i + 1)));
        }
      }
    }
    throw lastError!;
  }

  // 启动定时同步
  startScheduledSync(): void {
    // 设备数据同步
    setInterval(() => this.syncDevices(), this.config.frequency.devices * 60 * 1000);
    
    // 组织数据同步
    setInterval(() => this.syncOrganizations(), this.config.frequency.organizations * 60 * 1000);
    
    // 法规数据同步
    setInterval(() => this.syncRegulatory(), this.config.frequency.regulatory * 60 * 1000);
  }

  // 手动触发全量同步
  async syncAll(): Promise<{ devices: SyncResult; organizations: SyncResult; regulatory: SyncResult }> {
    return {
      devices: await this.syncDevices(),
      organizations: await this.syncOrganizations(),
      regulatory: await this.syncRegulatory(),
    };
  }
}

// 数据映射器
export class DeviceMapper implements DataMapper<Device, any> {
  map(device: Device): unknown {
    return {
      id: device.id,
      name: device.deviceName?.[0]?.name || '',
      manufacturer: device.manufacturer || '',
      model: device.modelNumber || '',
      category: device.type?.coding?.[0]?.display || 'Other',
      description: '',
      market_status: this.mapStatus(device.status),
      approval_date: device.expirationDate ? new Date(device.expirationDate).toISOString() : '',
      expiration_date: device.expirationDate ? new Date(device.expirationDate).toISOString() : '',
      jurisdictions: [],
      regulatory_status: 'Unknown',
      links: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _medplum_extensions: {
        version: device.version,
        serialNumber: device.serialNumber,
        lotNumber: device.lotNumber,
        manufacturer: device.manufacturer,
        resourceType: device.resourceType
      }
    };
  }

  reverseMap(product: any): Device {
    return {
      resourceType: 'Device',
      id: product.id,
      deviceName: [{ name: product.name, type: 'model-name' }],
      manufacturer: product.manufacturer,
      modelNumber: product.model,
      type: {
        coding: [{ system: '', code: '', display: product.category }]
      },
      status: this.reverseMapStatus(product.market_status),
      expirationDate: product.expiration_date,
      ...(product._medplum_extensions && {
        version: product._medplum_extensions.version,
        serialNumber: product._medplum_extensions.serialNumber,
        lotNumber: product._medplum_extensions.lotNumber,
        organization: product._medplum_extensions.organization ? { reference: product._medplum_extensions.organization } : undefined
      })
    };
  }

  private mapStatus(status?: string): string {
    const statusMap: Record<string, string> = {
      'active': 'Active',
      'inactive': 'Inactive',
      'entered-in-error': 'Error',
      'unknown': 'Unknown'
    };
    return statusMap[status || 'unknown'] || 'Unknown';
  }

  private reverseMapStatus(marketStatus?: string): string {
    const statusMap: Record<string, string> = {
      'Active': 'active',
      'Inactive': 'inactive',
      'Error': 'entered-in-error',
      'Unknown': 'unknown'
    };
    return statusMap[marketStatus || 'Unknown'] || 'unknown';
  }
}

// 组织映射器
export class OrganizationMapper implements DataMapper<Organization, any> {
  map(organization: Organization): unknown {
    return {
      id: organization.id,
      name: organization.name || '',
      headquarters: '',
      founded: '',
      employees: 0,
      revenue: '',
      industry: (organization.type as any)?.[0]?.coding?.[0]?.display || 'Other',
      website: this.extractWebsite(organization.contact),
      description: '',
      products: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _medplum_extensions: {
        alias: organization.alias,
        active: organization.active,
        resourceType: organization.resourceType
      }
    };
  }

  reverseMap(item: any): Organization {
    return this.reverseMapCompany(item);
  }

  reverseMapCompany(company: any): Organization {
    return {
      resourceType: 'Organization',
      id: company.id,
      name: company.name,
      description: company.description,
      type: {
        coding: [{ system: '', code: '', display: company.industry }]
      },
      ...(company._medplum_extensions && {
        alias: company._medplum_extensions.alias,
        active: company._medplum_extensions.active
      })
    };
  }

  private extractWebsite(contact?: Array<any>): string {
    if (!contact || contact.length === 0) return '';
    
    for (const contactPoint of contact) {
      if (contactPoint.telecom) {
        for (const telecom of contactPoint.telecom) {
          if (telecom.system === 'url') {
            return telecom.value || '';
          }
        }
      }
    }
    return '';
  }
}

// 法规授权映射器
export class RegulatoryAuthorizationMapper implements DataMapper<any, any> {
  map(regulatory: any): unknown {
    return {
      id: regulatory.id || regulatory.identifier?.[0]?.value || '',
      title: regulatory.type?.coding?.[0]?.display || '',
      jurisdiction: this.extractJurisdiction(regulatory.regulator),
      category: 'Medical Device',
      effective_date: regulatory.validityPeriod?.start || '',
      expiration_date: regulatory.validityPeriod?.end || '',
      description: regulatory.description || '',
      requirements: [],
      penalties: [],
      links: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _medplum_extensions: {
        status: regulatory.status,
        holder: regulatory.holder?.reference,
        regulator: regulatory.regulator?.reference,
        resourceType: regulatory.resourceType
      }
    };
  }

  reverseMap(regulation: any): unknown {
    return {
      resourceType: 'Device',
      id: regulation.id,
      type: {
        coding: [{ system: '', code: '', display: regulation.title }]
      },
      description: regulation.description,
      validityPeriod: {
        start: regulation.effective_date,
        end: regulation.expiration_date
      },
      ...(regulation._medplum_extensions && {
        status: regulation._medplum_extensions.status,
        holder: regulation._medplum_extensions.holder ? { reference: regulation._medplum_extensions.holder } : undefined,
        regulator: regulation._medplum_extensions.regulator ? { reference: regulation._medplum_extensions.regulator } : undefined
      })
    };
  }

  private extractJurisdiction(regulator?: any): string {
    if (!regulator || !regulator.reference) return '';
    // 从监管机构参考中提取司法管辖区
    const reference = regulator.reference;
    // 这里可以根据实际情况实现更复杂的逻辑
    return reference.split('/')[1] || '';
  }
}