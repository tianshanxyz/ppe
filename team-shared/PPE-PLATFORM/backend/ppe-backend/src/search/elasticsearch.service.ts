import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const node = this.configService.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200');
    const auth = {
      username: this.configService.get<string>('ELASTICSEARCH_USERNAME', 'elastic'),
      password: this.configService.get<string>('ELASTICSEARCH_PASSWORD', 'changeme'),
    };

    this.client = new Client({
      node,
      auth,
    });

    // 测试连接
    try {
      const info = await this.client.info();
      console.log('Elasticsearch connected:', info.body.version);
    } catch (error) {
      console.error('Elasticsearch connection failed:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  getClient(): Client {
    return this.client;
  }

  /**
   * 检查索引是否存在
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      await this.client.indices.exists({ index });
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 创建索引
   */
  async createIndex(index: string, mapping: any): Promise<void> {
    const exists = await this.indexExists(index);
    
    if (!exists) {
      await this.client.indices.create({
        index,
        body: mapping,
      });
      console.log(`Index ${index} created`);
    }
  }

  /**
   * 删除索引
   */
  async deleteIndex(index: string): Promise<void> {
    const exists = await this.indexExists(index);
    
    if (exists) {
      await this.client.indices.delete({ index });
      console.log(`Index ${index} deleted`);
    }
  }

  /**
   * 刷新索引
   */
  async refreshIndex(index: string): Promise<void> {
    await this.client.indices.refresh({ index });
  }
}
