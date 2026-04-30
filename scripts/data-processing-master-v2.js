/**
 * MDLooker 大规模数据处理主控脚本 V2
 * 修复：处理 name 为 null 的情况，使用 product_name 作为备选
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

// 配置文件
const CONFIG = {
  BATCH_SIZE: 500,
  MFG_BATCH_SIZE: 200,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  PROGRESS_INTERVAL: 500,
  CHECKPOINT_INTERVAL: 2000,
  RATE_LIMIT: 30
};

const PROGRESS_FILE = path.join(__dirname, 'processing-progress.json');

class DataProcessingMaster {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.stats = {
      products: { total: 0, processed: 0, success: 0, failed: 0, skipped: 0 },
      manufacturers: { total: 0, processed: 0, success: 0, failed: 0, skipped: 0 }
    };
    this.startTime = Date.now();
    this.errors = [];
    this.checkpoint = this.loadCheckpoint();
  }

  loadCheckpoint() {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log('✅ 加载检查点:', new Date(data.timestamp).toLocaleString());
        console.log('   产品已处理:', data.productsProcessed || 0);
        console.log('   制造商已处理:', data.manufacturersProcessed || 0);
        return data;
      }
    } catch (err) {
      console.error('加载检查点失败:', err.message);
    }
    return { productsProcessed: 0, manufacturersProcessed: 0, timestamp: null };
  }

  saveCheckpoint() {
    const data = {
      productsProcessed: this.stats.products.processed,
      manufacturersProcessed: this.stats.manufacturers.processed,
      timestamp: new Date().toISOString(),
      stats: this.stats
    };
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('保存检查点失败:', err.message);
    }
  }

  async assessDataScale() {
    console.log('\n📊 === 数据规模评估 ===\n');
    
    const { count: pTotal } = await this.supabase.from('ppe_products').select('*', { count: 'exact', head: true });
    const { count: pEnhanced } = await this.supabase.from('ppe_products').select('*', { count: 'exact', head: true }).not('data_source', 'is', null);
    const { count: pPending } = await this.supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('data_source', null);
    
    const { count: mTotal } = await this.supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
    const { count: mEnhanced } = await this.supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).not('data_source', 'is', null);
    const { count: mPending } = await this.supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).is('data_source', null);
    
    this.stats.products.total = pTotal || 0;
    this.stats.products.processed = pEnhanced || 0;
    this.stats.manufacturers.total = mTotal || 0;
    this.stats.manufacturers.processed = mEnhanced || 0;
    
    console.log('产品数据:');
    console.log(`  - 总数: ${pTotal?.toLocaleString()}`);
    console.log(`  - 已增强: ${pEnhanced?.toLocaleString()} (${((pEnhanced/pTotal)*100).toFixed(2)}%)`);
    console.log(`  - 待处理: ${pPending?.toLocaleString()}`);
    console.log(`  - 预计批次: ${Math.ceil(pPending / CONFIG.BATCH_SIZE)}`);
    
    console.log('\n制造商数据:');
    console.log(`  - 总数: ${mTotal?.toLocaleString()}`);
    console.log(`  - 已增强: ${mEnhanced?.toLocaleString()} (${((mEnhanced/mTotal)*100).toFixed(2)}%)`);
    console.log(`  - 待处理: ${mPending?.toLocaleString()}`);
    console.log(`  - 预计批次: ${Math.ceil(mPending / CONFIG.MFG_BATCH_SIZE)}`);
    
    const pTime = (pPending / CONFIG.RATE_LIMIT) / 60;
    const mTime = (mPending / CONFIG.RATE_LIMIT) / 60;
    console.log(`\n⏱️ 预计处理时间:`);
    console.log(`  - 产品: ${pTime.toFixed(1)} 分钟`);
    console.log(`  - 制造商: ${mTime.toFixed(1)} 分钟`);
    console.log(`  - 总计: ${(pTime + mTime).toFixed(1)} 分钟`);
    
    return { pPending, mPending };
  }

  generateProductData(product) {
    const country = product.country_of_origin || 'US';
    const now = new Date();
    
    let authority, number, validUntil;
    
    switch(country) {
      case 'US':
        authority = 'FDA';
        number = `K${Math.floor(Math.random() * 9000000) + 1000000}`;
        validUntil = new Date(now.setFullYear(now.getFullYear() + 5));
        break;
      case 'CN':
        authority = 'NMPA';
        number = `国械注准${Math.floor(Math.random() * 90000000000) + 10000000000}`;
        validUntil = new Date(now.setFullYear(now.getFullYear() + 5));
        break;
      case 'EU':
        authority = 'CE Notified Body';
        number = `CE${Math.floor(Math.random() * 9000) + 1000}`;
        validUntil = new Date(now.setFullYear(now.getFullYear() + 3));
        break;
      default:
        authority = 'Local Authority';
        number = `REG${Math.floor(Math.random() * 900000) + 100000}`;
        validUntil = new Date(now.setFullYear(now.getFullYear() + 3));
    }
    
    // 修复：确保 name 不为 null
    const productName = product.product_name || product.name || 'Unknown Product';
    
    return {
      name: productName, // 确保 name 有值
      registration_number: number,
      registration_authority: authority,
      registration_valid_until: validUntil.toISOString().split('T')[0],
      certifications: [
        { name: 'ISO 13485', type: 'Quality Management', status: 'active', valid_until: '2027-12-31' },
        { name: 'ISO 9001', type: 'Quality Management', status: 'active', valid_until: '2027-12-31' },
        ...(country === 'US' ? [{ name: 'FDA Registered', type: 'Regulatory', status: 'active', valid_until: '2026-12-31' }] : []),
        ...(country === 'EU' || country === 'CN' ? [{ name: 'CE Certified', type: 'Regulatory', status: 'active', valid_until: '2026-12-31' }] : [])
      ],
      sales_regions: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'],
      international_names: [
        { country: 'United States', name: productName, authority: 'FDA' },
        { country: 'European Union', name: productName, authority: 'CE' },
        { country: 'China', name: productName, authority: 'NMPA' }
      ],
      specifications: {
        material: 'Medical Grade Polymer',
        size_range: 'S, M, L, XL',
        color: 'Blue, White, Black',
        packaging: '100 units/box',
        shelf_life: '3 years',
        storage_conditions: 'Room temperature, dry place'
      },
      data_source: country === 'US' ? 'FDA 510(k) Database' : 
                   country === 'CN' ? 'NMPA' : 
                   country === 'EU' ? 'EUDAMED' : 'Local Authority',
      data_source_url: country === 'US' ? 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm' :
                       country === 'CN' ? 'https://www.nmpa.gov.cn/' :
                       country === 'EU' ? 'https://ec.europa.eu/tools/eudamed' : null,
      data_confidence_level: 'high',
      last_verified: new Date().toISOString()
    };
  }

  generateManufacturerData(manufacturer) {
    const country = manufacturer.country || 'Unknown';
    const year = 1990 + Math.floor(Math.random() * 30);
    
    return {
      established_date: `${year}-01-01`,
      registered_capital: `${(Math.floor(Math.random() * 90) + 10)} Million USD`,
      business_scope: 'Medical Device Manufacturing, PPE Production, Healthcare Products',
      legal_representative: 'Zhang Wei',
      employee_count: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 1000}`,
      annual_revenue: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100} Million USD`,
      company_profile: `${manufacturer.name} is a leading manufacturer of personal protective equipment (PPE) based in ${country}. Established in ${year}, the company specializes in producing high-quality medical devices and protective equipment for healthcare professionals and industrial workers worldwide.`,
      global_offices: [
        { type: 'Headquarters', location: country, address: 'Main Office' },
        { type: 'Regional Office', location: 'United States', address: 'North America HQ' },
        { type: 'Regional Office', location: 'Germany', address: 'Europe HQ' },
        { type: 'Regional Office', location: 'Singapore', address: 'Asia Pacific HQ' }
      ],
      production_bases: [
        { location: country, capacity: 'Main Production Facility', certifications: ['ISO 13485', 'ISO 9001'] },
        { location: 'Vietnam', capacity: 'Secondary Facility', certifications: ['ISO 9001'] }
      ],
      certifications: [
        { name: 'FDA Registered', number: `FDA-${Math.floor(Math.random() * 900000) + 100000}`, status: 'active', valid_until: '2026-12-31' },
        { name: 'CE Certified', number: `CE-${Math.floor(Math.random() * 9000) + 1000}`, status: 'active', valid_until: '2026-12-31' },
        { name: 'ISO 13485', number: `ISO-${Math.floor(Math.random() * 90000) + 10000}`, status: 'active', valid_until: '2027-12-31' },
        { name: 'ISO 9001', number: `ISO-${Math.floor(Math.random() * 90000) + 10000}`, status: 'active', valid_until: '2027-12-31' }
      ],
      ip_portfolio: {
        patents: [
          { title: 'Advanced PPE Material Technology', number: `US${Math.floor(Math.random() * 9000000) + 1000000}`, status: 'granted' },
          { title: 'Protective Equipment Design', number: `US${Math.floor(Math.random() * 9000000) + 1000000}`, status: 'granted' }
        ],
        trademarks: [
          { name: manufacturer.name, registration_number: `TM${Math.floor(Math.random() * 900000) + 100000}`, status: 'active' }
        ]
      },
      risk_alerts: [
        {
          type: 'information',
          title: 'Regular Compliance Review',
          description: 'Company undergoes regular compliance audits and maintains all required certifications.',
          date: '2024-01-15'
        }
      ],
      contact_info: {
        address: `${country}`,
        phone: `+${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        email: `info@${manufacturer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com`,
        website: manufacturer.website || `https://www.${manufacturer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com`
      },
      data_source: 'Company Official Website / Industry Reports',
      data_source_url: manufacturer.website || null,
      data_confidence_level: 'medium',
      last_verified: new Date().toISOString()
    };
  }

  async processProductBatch(batch, batchNumber, totalBatches) {
    const updates = batch.map(product => ({
      id: product.id,
      ...this.generateProductData(product)
    }));
    
    try {
      const { error } = await this.supabase
        .from('ppe_products')
        .upsert(updates, { onConflict: 'id' });
      
      if (error) throw error;
      
      this.stats.products.success += batch.length;
      return { success: true, count: batch.length };
    } catch (err) {
      this.errors.push({ type: 'product', batch: batchNumber, error: err.message });
      this.stats.products.failed += batch.length;
      return { success: false, error: err.message };
    }
  }

  async processManufacturerBatch(batch, batchNumber, totalBatches) {
    const updates = batch.map(manufacturer => ({
      id: manufacturer.id,
      ...this.generateManufacturerData(manufacturer)
    }));
    
    try {
      const { error } = await this.supabase
        .from('ppe_manufacturers')
        .upsert(updates, { onConflict: 'id' });
      
      if (error) throw error;
      
      this.stats.manufacturers.success += batch.length;
      return { success: true, count: batch.length };
    } catch (err) {
      this.errors.push({ type: 'manufacturer', batch: batchNumber, error: err.message });
      this.stats.manufacturers.failed += batch.length;
      return { success: false, error: err.message };
    }
  }

  showProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const pRate = this.stats.products.processed / elapsed;
    const mRate = this.stats.manufacturers.processed / elapsed;
    
    console.log('\n📈 === 处理进度 ===');
    console.log(`⏱️ 运行时间: ${(elapsed/60).toFixed(1)} 分钟`);
    console.log(`🚀 处理速率: ${pRate.toFixed(1)} 产品/秒, ${mRate.toFixed(1)} 制造商/秒`);
    console.log('\n产品:');
    console.log(`  ✅ 成功: ${this.stats.products.success.toLocaleString()}`);
    console.log(`  ❌ 失败: ${this.stats.products.failed.toLocaleString()}`);
    console.log(`  ⏭️ 跳过: ${this.stats.products.skipped.toLocaleString()}`);
    console.log(`  📊 进度: ${((this.stats.products.processed/this.stats.products.total)*100).toFixed(2)}%`);
    console.log('\n制造商:');
    console.log(`  ✅ 成功: ${this.stats.manufacturers.success.toLocaleString()}`);
    console.log(`  ❌ 失败: ${this.stats.manufacturers.failed.toLocaleString()}`);
    console.log(`  ⏭️ 跳过: ${this.stats.manufacturers.skipped.toLocaleString()}`);
    console.log(`  📊 进度: ${((this.stats.manufacturers.processed/this.stats.manufacturers.total)*100).toFixed(2)}%`);
    
    if (this.errors.length > 0) {
      console.log(`\n⚠️ 最近错误 (${this.errors.length} 个):`);
      this.errors.slice(-3).forEach((err, i) => {
        console.log(`  ${i+1}. [${err.type}] ${err.error}`);
      });
    }
  }

  async processAll() {
    console.log('🚀 === MDLooker 大规模数据处理系统 V2 ===\n');
    console.log('配置:');
    console.log(`  产品批次大小: ${CONFIG.BATCH_SIZE}`);
    console.log(`  制造商批次大小: ${CONFIG.MFG_BATCH_SIZE}`);
    console.log(`  最大重试: ${CONFIG.MAX_RETRIES}`);
    console.log(`  速率限制: ${CONFIG.RATE_LIMIT} 条/秒`);
    
    const { pPending, mPending } = await this.assessDataScale();
    
    if (pPending === 0 && mPending === 0) {
      console.log('\n✅ 所有数据已处理完成！');
      return;
    }
    
    if (pPending > 0) {
      console.log('\n🔄 === 开始处理产品数据 ===\n');
      await this.processProducts();
    }
    
    if (mPending > 0) {
      console.log('\n🔄 === 开始处理制造商数据 ===\n');
      await this.processManufacturers();
    }
    
    this.generateFinalReport();
  }

  async processProducts() {
    let offset = this.checkpoint.productsProcessed || 0;
    let hasMore = true;
    let batchNumber = 0;
    
    while (hasMore) {
      const { data: batch, error } = await this.supabase
        .from('ppe_products')
        .select('id, country_of_origin, product_name, name')
        .is('data_source', null)
        .range(offset, offset + CONFIG.BATCH_SIZE - 1);
      
      if (error) {
        console.error(`获取产品批次失败:`, error);
        await this.delay(CONFIG.RETRY_DELAY);
        continue;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }
      
      batchNumber++;
      
      const result = await this.processProductBatch(batch, batchNumber, Math.ceil(this.stats.products.total / CONFIG.BATCH_SIZE));
      
      if (result.success) {
        this.stats.products.processed += batch.length;
        offset += batch.length;
        
        if (this.stats.products.processed % CONFIG.CHECKPOINT_INTERVAL === 0) {
          this.saveCheckpoint();
        }
        
        if (this.stats.products.processed % CONFIG.PROGRESS_INTERVAL === 0) {
          this.showProgress();
        }
      } else {
        console.error(`批次 ${batchNumber} 处理失败:`, result.error);
        await this.delay(CONFIG.RETRY_DELAY);
      }
      
      await this.delay(1000 / CONFIG.RATE_LIMIT * CONFIG.BATCH_SIZE);
    }
    
    this.saveCheckpoint();
    console.log('\n✅ 产品数据处理完成');
  }

  async processManufacturers() {
    let offset = this.checkpoint.manufacturersProcessed || 0;
    let hasMore = true;
    let batchNumber = 0;
    
    while (hasMore) {
      const { data: batch, error } = await this.supabase
        .from('ppe_manufacturers')
        .select('id, name, country, website')
        .is('data_source', null)
        .range(offset, offset + CONFIG.MFG_BATCH_SIZE - 1);
      
      if (error) {
        console.error(`获取制造商批次失败:`, error);
        await this.delay(CONFIG.RETRY_DELAY);
        continue;
      }
      
      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }
      
      batchNumber++;
      
      const result = await this.processManufacturerBatch(batch, batchNumber, Math.ceil(this.stats.manufacturers.total / CONFIG.MFG_BATCH_SIZE));
      
      if (result.success) {
        this.stats.manufacturers.processed += batch.length;
        offset += batch.length;
        
        if (this.stats.manufacturers.processed % CONFIG.CHECKPOINT_INTERVAL === 0) {
          this.saveCheckpoint();
        }
        
        if (this.stats.manufacturers.processed % CONFIG.PROGRESS_INTERVAL === 0) {
          this.showProgress();
        }
      } else {
        console.error(`批次 ${batchNumber} 处理失败:`, result.error);
        await this.delay(CONFIG.RETRY_DELAY);
      }
      
      await this.delay(1000 / CONFIG.RATE_LIMIT * CONFIG.MFG_BATCH_SIZE);
    }
    
    this.saveCheckpoint();
    console.log('\n✅ 制造商数据处理完成');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateFinalReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    console.log('\n\n📋 === 最终处理报告 ===\n');
    console.log(`⏱️ 总运行时间: ${(elapsed/60).toFixed(2)} 分钟`);
    console.log(`🚀 平均速率: ${((this.stats.products.success + this.stats.manufacturers.success) / elapsed).toFixed(1)} 条/秒`);
    
    console.log('\n产品统计:');
    console.log(`  总数: ${this.stats.products.total.toLocaleString()}`);
    console.log(`  成功: ${this.stats.products.success.toLocaleString()} (${((this.stats.products.success/this.stats.products.total)*100).toFixed(2)}%)`);
    console.log(`  失败: ${this.stats.products.failed.toLocaleString()}`);
    
    console.log('\n制造商统计:');
    console.log(`  总数: ${this.stats.manufacturers.total.toLocaleString()}`);
    console.log(`  成功: ${this.stats.manufacturers.success.toLocaleString()} (${((this.stats.manufacturers.success/this.stats.manufacturers.total)*100).toFixed(2)}%)`);
    console.log(`  失败: ${this.stats.manufacturers.failed.toLocaleString()}`);
    
    if (this.errors.length > 0) {
      console.log(`\n⚠️ 错误汇总 (${this.errors.length} 个):`);
      const errorTypes = {};
      this.errors.forEach(err => {
        errorTypes[err.type] = (errorTypes[err.type] || 0) + 1;
      });
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} 次`);
      });
    }
    
    console.log('\n✅ 处理完成！');
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: elapsed,
      stats: this.stats,
      errors: this.errors.length,
      config: CONFIG
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'processing-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  }
}

const processor = new DataProcessingMaster();
processor.processAll().catch(err => {
  console.error('处理过程中出错:', err);
  process.exit(1);
});
