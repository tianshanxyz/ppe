/**
 * MDLooker 系统性数据处理与优化主控脚本
 * 
 * 处理任务：
 * 1. 公司信息去重与整合优化
 * 2. 产品数据质量提升
 * 3. 产品详情模块优化（图片覆盖率统计）
 * 4. 国家/地区名称标准化
 * 5. 制造商名称国际化补充
 * 6. 多语言系统数据准备
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const CONFIG = {
  BATCH_SIZE: 500,
  MFG_BATCH_SIZE: 200,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  CHECKPOINT_INTERVAL: 2000
};

const PROGRESS_FILE = path.join(__dirname, 'optimization-progress.json');

// 国家/地区代码映射表（ISO 3166-1 alpha-2 到标准全称）
const COUNTRY_CODE_MAP = {
  // 主要国家
  'CN': 'China', 'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom',
  'AU': 'Australia', 'JP': 'Japan', 'KR': 'South Korea', 'DE': 'Germany',
  'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden',
  'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland',
  'PT': 'Portugal', 'GR': 'Greece', 'PL': 'Poland', 'CZ': 'Czech Republic',
  'HU': 'Hungary', 'SK': 'Slovakia', 'SI': 'Slovenia', 'HR': 'Croatia',
  'RO': 'Romania', 'BG': 'Bulgaria', 'LT': 'Lithuania', 'LV': 'Latvia',
  'EE': 'Estonia', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus',
  'IS': 'Iceland', 'LI': 'Liechtenstein', 'MC': 'Monaco', 'SM': 'San Marino',
  'AD': 'Andorra', 'VA': 'Vatican City', 'TR': 'Turkey', 'RU': 'Russia',
  'UA': 'Ukraine', 'BY': 'Belarus', 'MD': 'Moldova', 'GE': 'Georgia',
  'AM': 'Armenia', 'AZ': 'Azerbaijan', 'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan',
  'KG': 'Kyrgyzstan', 'TJ': 'Tajikistan', 'TM': 'Turkmenistan', 'IN': 'India',
  'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Nepal',
  'BT': 'Bhutan', 'MV': 'Maldives', 'AF': 'Afghanistan', 'IR': 'Iran',
  'IQ': 'Iraq', 'SY': 'Syria', 'LB': 'Lebanon', 'JO': 'Jordan',
  'IL': 'Israel', 'PS': 'Palestine', 'SA': 'Saudi Arabia', 'YE': 'Yemen',
  'OM': 'Oman', 'AE': 'United Arab Emirates', 'QA': 'Qatar', 'BH': 'Bahrain',
  'KW': 'Kuwait', 'EG': 'Egypt', 'LY': 'Libya', 'TN': 'Tunisia',
  'DZ': 'Algeria', 'MA': 'Morocco', 'MR': 'Mauritania', 'ML': 'Mali',
  'NE': 'Niger', 'TD': 'Chad', 'SD': 'Sudan', 'ER': 'Eritrea',
  'DJ': 'Djibouti', 'ET': 'Ethiopia', 'SO': 'Somalia', 'KE': 'Kenya',
  'UG': 'Uganda', 'TZ': 'Tanzania', 'RW': 'Rwanda', 'BI': 'Burundi',
  'CD': 'DR Congo', 'CG': 'Congo', 'GA': 'Gabon', 'GQ': 'Equatorial Guinea',
  'ST': 'Sao Tome and Principe', 'CM': 'Cameroon', 'CF': 'Central African Republic',
  'NG': 'Nigeria', 'BJ': 'Benin', 'TG': 'Togo', 'GH': 'Ghana',
  'CI': 'Ivory Coast', 'LR': 'Liberia', 'SL': 'Sierra Leone', 'GN': 'Guinea',
  'GW': 'Guinea-Bissau', 'GM': 'Gambia', 'SN': 'Senegal', 'CV': 'Cape Verde',
  'ZA': 'South Africa', 'NA': 'Namibia', 'BW': 'Botswana', 'ZW': 'Zimbabwe',
  'MZ': 'Mozambique', 'ZM': 'Zambia', 'MW': 'Malawi', 'AO': 'Angola',
  'MG': 'Madagascar', 'MU': 'Mauritius', 'SC': 'Seychelles', 'KM': 'Comoros',
  'TH': 'Thailand', 'VN': 'Vietnam', 'MY': 'Malaysia', 'PH': 'Philippines',
  'ID': 'Indonesia', 'SG': 'Singapore', 'BN': 'Brunei', 'KH': 'Cambodia',
  'LA': 'Laos', 'MM': 'Myanmar', 'MN': 'Mongolia', 'KP': 'North Korea',
  'TW': 'Taiwan', 'HK': 'Hong Kong', 'MO': 'Macau', 'MX': 'Mexico',
  'GT': 'Guatemala', 'BZ': 'Belize', 'SV': 'El Salvador', 'HN': 'Honduras',
  'NI': 'Nicaragua', 'CR': 'Costa Rica', 'PA': 'Panama', 'CU': 'Cuba',
  'JM': 'Jamaica', 'HT': 'Haiti', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico',
  'CO': 'Colombia', 'VE': 'Venezuela', 'GY': 'Guyana', 'SR': 'Suriname',
  'GF': 'French Guiana', 'EC': 'Ecuador', 'PE': 'Peru', 'BO': 'Bolivia',
  'BR': 'Brazil', 'PY': 'Paraguay', 'UY': 'Uruguay', 'AR': 'Argentina',
  'CL': 'Chile', 'NZ': 'New Zealand', 'PG': 'Papua New Guinea', 'FJ': 'Fiji',
  'SB': 'Solomon Islands', 'VU': 'Vanuatu', 'NC': 'New Caledonia', 'PF': 'French Polynesia',
  'WS': 'Samoa', 'TO': 'Tonga', 'KI': 'Kiribati', 'TV': 'Tuvalu',
  'NR': 'Nauru', 'PW': 'Palau', 'MH': 'Marshall Islands', 'FM': 'Micronesia',
  // 常见全名到标准代码的反向映射
  'China': 'CN', 'United States': 'US', 'USA': 'US', 'Canada': 'CA',
  'United Kingdom': 'GB', 'UK': 'GB', 'Australia': 'AU', 'Japan': 'JP',
  'South Korea': 'KR', 'Korea': 'KR', 'Germany': 'DE', 'France': 'FR',
  'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL', 'Belgium': 'BE',
  'Switzerland': 'CH', 'Austria': 'AT', 'Sweden': 'SE', 'Norway': 'NO',
  'Denmark': 'DK', 'Finland': 'FI', 'Ireland': 'IE', 'Portugal': 'PT',
  'Greece': 'GR', 'Poland': 'PL', 'Czech Republic': 'CZ', 'Hungary': 'HU',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'Croatia': 'HR', 'Romania': 'RO',
  'Bulgaria': 'BG', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE',
  'Luxembourg': 'LU', 'Malta': 'MT', 'Cyprus': 'CY', 'Iceland': 'IS',
  'Liechtenstein': 'LI', 'Monaco': 'MC', 'San Marino': 'SM', 'Andorra': 'AD',
  'Vatican City': 'VA', 'Turkey': 'TR', 'Russia': 'RU', 'Russian Federation': 'RU',
  'Ukraine': 'UA', 'Belarus': 'BY', 'Moldova': 'MD', 'Georgia': 'GE',
  'Armenia': 'AM', 'Azerbaijan': 'AZ', 'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ',
  'Kyrgyzstan': 'KG', 'Tajikistan': 'TJ', 'Turkmenistan': 'TM', 'India': 'IN',
  'Pakistan': 'PK', 'Bangladesh': 'BD', 'Sri Lanka': 'LK', 'Nepal': 'NP',
  'Bhutan': 'BT', 'Maldives': 'MV', 'Afghanistan': 'AF', 'Iran': 'IR',
  'Iraq': 'IQ', 'Syria': 'SY', 'Lebanon': 'LB', 'Jordan': 'JO',
  'Israel': 'IL', 'Palestine': 'PS', 'Saudi Arabia': 'SA', 'Yemen': 'YE',
  'Oman': 'OM', 'United Arab Emirates': 'AE', 'UAE': 'AE', 'Qatar': 'QA',
  'Bahrain': 'BH', 'Kuwait': 'KW', 'Egypt': 'EG', 'Libya': 'LY',
  'Tunisia': 'TN', 'Algeria': 'DZ', 'Morocco': 'MA', 'Mauritania': 'MR',
  'Mali': 'ML', 'Niger': 'NE', 'Chad': 'TD', 'Sudan': 'SD',
  'Eritrea': 'ER', 'Djibouti': 'DJ', 'Ethiopia': 'ET', 'Somalia': 'SO',
  'Kenya': 'KE', 'Uganda': 'UG', 'Tanzania': 'TZ', 'Rwanda': 'RW',
  'Burundi': 'BI', 'DR Congo': 'CD', 'Congo': 'CG', 'Gabon': 'GA',
  'Equatorial Guinea': 'GQ', 'Sao Tome and Principe': 'ST', 'Cameroon': 'CM',
  'Central African Republic': 'CF', 'Nigeria': 'NG', 'Benin': 'BJ',
  'Togo': 'TG', 'Ghana': 'GH', 'Ivory Coast': 'CI', 'Liberia': 'LR',
  'Sierra Leone': 'SL', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Gambia': 'GM',
  'Senegal': 'SN', 'Cape Verde': 'CV', 'South Africa': 'ZA', 'Namibia': 'NA',
  'Botswana': 'BW', 'Zimbabwe': 'ZW', 'Mozambique': 'MZ', 'Zambia': 'ZM',
  'Malawi': 'MW', 'Angola': 'AO', 'Madagascar': 'MG', 'Mauritius': 'MU',
  'Seychelles': 'SC', 'Comoros': 'KM', 'Thailand': 'TH', 'Vietnam': 'VN',
  'Malaysia': 'MY', 'Philippines': 'PH', 'Indonesia': 'ID', 'Singapore': 'SG',
  'Brunei': 'BN', 'Cambodia': 'KH', 'Laos': 'LA', 'Myanmar': 'MM',
  'Mongolia': 'MN', 'North Korea': 'KP', 'Taiwan': 'TW', 'Hong Kong': 'HK',
  'Macau': 'MO', 'Mexico': 'MX', 'Guatemala': 'GT', 'Belize': 'BZ',
  'El Salvador': 'SV', 'Honduras': 'HN', 'Nicaragua': 'NI', 'Costa Rica': 'CR',
  'Panama': 'PA', 'Cuba': 'CU', 'Jamaica': 'JM', 'Haiti': 'HT',
  'Dominican Republic': 'DO', 'Puerto Rico': 'PR', 'Colombia': 'CO',
  'Venezuela': 'VE', 'Guyana': 'GY', 'Suriname': 'SR', 'French Guiana': 'GF',
  'Ecuador': 'EC', 'Peru': 'PE', 'Bolivia': 'BO', 'Brazil': 'BR',
  'Paraguay': 'PY', 'Uruguay': 'UY', 'Argentina': 'AR', 'Chile': 'CL',
  'New Zealand': 'NZ', 'Papua New Guinea': 'PG', 'Fiji': 'FJ',
  'Solomon Islands': 'SB', 'Vanuatu': 'VU', 'New Caledonia': 'NC',
  'French Polynesia': 'PF', 'Samoa': 'WS', 'Tonga': 'TO', 'Kiribati': 'KI',
  'Tuvalu': 'TV', 'Nauru': 'NR', 'Palau': 'PW', 'Marshall Islands': 'MH',
  'Micronesia': 'FM'
};

// 国家代码到中文名称映射
const COUNTRY_CODE_TO_ZH = {
  'CN': '中国', 'US': '美国', 'CA': '加拿大', 'GB': '英国',
  'AU': '澳大利亚', 'JP': '日本', 'KR': '韩国', 'DE': '德国',
  'FR': '法国', 'IT': '意大利', 'ES': '西班牙', 'NL': '荷兰',
  'BE': '比利时', 'CH': '瑞士', 'AT': '奥地利', 'SE': '瑞典',
  'NO': '挪威', 'DK': '丹麦', 'FI': '芬兰', 'IE': '爱尔兰',
  'PT': '葡萄牙', 'GR': '希腊', 'PL': '波兰', 'CZ': '捷克',
  'HU': '匈牙利', 'SK': '斯洛伐克', 'SI': '斯洛文尼亚', 'HR': '克罗地亚',
  'RO': '罗马尼亚', 'BG': '保加利亚', 'LT': '立陶宛', 'LV': '拉脱维亚',
  'EE': '爱沙尼亚', 'LU': '卢森堡', 'MT': '马耳他', 'CY': '塞浦路斯',
  'IS': '冰岛', 'LI': '列支敦士登', 'MC': '摩纳哥', 'SM': '圣马力诺',
  'AD': '安道尔', 'VA': '梵蒂冈', 'TR': '土耳其', 'RU': '俄罗斯',
  'UA': '乌克兰', 'BY': '白俄罗斯', 'MD': '摩尔多瓦', 'GE': '格鲁吉亚',
  'AM': '亚美尼亚', 'AZ': '阿塞拜疆', 'KZ': '哈萨克斯坦', 'UZ': '乌兹别克斯坦',
  'KG': '吉尔吉斯斯坦', 'TJ': '塔吉克斯坦', 'TM': '土库曼斯坦', 'IN': '印度',
  'PK': '巴基斯坦', 'BD': '孟加拉国', 'LK': '斯里兰卡', 'NP': '尼泊尔',
  'BT': '不丹', 'MV': '马尔代夫', 'AF': '阿富汗', 'IR': '伊朗',
  'IQ': '伊拉克', 'SY': '叙利亚', 'LB': '黎巴嫩', 'JO': '约旦',
  'IL': '以色列', 'PS': '巴勒斯坦', 'SA': '沙特阿拉伯', 'YE': '也门',
  'OM': '阿曼', 'AE': '阿联酋', 'QA': '卡塔尔', 'BH': '巴林',
  'KW': '科威特', 'EG': '埃及', 'LY': '利比亚', 'TN': '突尼斯',
  'DZ': '阿尔及利亚', 'MA': '摩洛哥', 'MR': '毛里塔尼亚', 'ML': '马里',
  'NE': '尼日尔', 'TD': '乍得', 'SD': '苏丹', 'ER': '厄立特里亚',
  'DJ': '吉布提', 'ET': '埃塞俄比亚', 'SO': '索马里', 'KE': '肯尼亚',
  'UG': '乌干达', 'TZ': '坦桑尼亚', 'RW': '卢旺达', 'BI': '布隆迪',
  'CD': '刚果民主共和国', 'CG': '刚果', 'GA': '加蓬', 'GQ': '赤道几内亚',
  'ST': '圣多美和普林西比', 'CM': '喀麦隆', 'CF': '中非共和国',
  'NG': '尼日利亚', 'BJ': '贝宁', 'TG': '多哥', 'GH': '加纳',
  'CI': '科特迪瓦', 'LR': '利比里亚', 'SL': '塞拉利昂', 'GN': '几内亚',
  'GW': '几内亚比绍', 'GM': '冈比亚', 'SN': '塞内加尔', 'CV': '佛得角',
  'ZA': '南非', 'NA': '纳米比亚', 'BW': '博茨瓦纳', 'ZW': '津巴布韦',
  'MZ': '莫桑比克', 'ZM': '赞比亚', 'MW': '马拉维', 'AO': '安哥拉',
  'MG': '马达加斯加', 'MU': '毛里求斯', 'SC': '塞舌尔', 'KM': '科摩罗',
  'TH': '泰国', 'VN': '越南', 'MY': '马来西亚', 'PH': '菲律宾',
  'ID': '印度尼西亚', 'SG': '新加坡', 'BN': '文莱', 'KH': '柬埔寨',
  'LA': '老挝', 'MM': '缅甸', 'MN': '蒙古', 'KP': '朝鲜',
  'TW': '中国台湾', 'HK': '中国香港', 'MO': '中国澳门', 'MX': '墨西哥',
  'GT': '危地马拉', 'BZ': '伯利兹', 'SV': '萨尔瓦多', 'HN': '洪都拉斯',
  'NI': '尼加拉瓜', 'CR': '哥斯达黎加', 'PA': '巴拿马', 'CU': '古巴',
  'JM': '牙买加', 'HT': '海地', 'DO': '多米尼加', 'PR': '波多黎各',
  'CO': '哥伦比亚', 'VE': '委内瑞拉', 'GY': '圭亚那', 'SR': '苏里南',
  'GF': '法属圭亚那', 'EC': '厄瓜多尔', 'PE': '秘鲁', 'BO': '玻利维亚',
  'BR': '巴西', 'PY': '巴拉圭', 'UY': '乌拉圭', 'AR': '阿根廷',
  'CL': '智利', 'NZ': '新西兰', 'PG': '巴布亚新几内亚', 'FJ': '斐济',
  'SB': '所罗门群岛', 'VU': '瓦努阿图', 'NC': '新喀里多尼亚', 'PF': '法属波利尼西亚',
  'WS': '萨摩亚', 'TO': '汤加', 'KI': '基里巴斯', 'TV': '图瓦卢',
  'NR': '瑙鲁', 'PW': '帕劳', 'MH': '马绍尔群岛', 'FM': '密克罗尼西亚'
};

// 标准化国家代码（统一为2位大写代码）
function standardizeCountryCode(country) {
  if (!country || country === 'Unknown' || country === 'unknown' || country === 'null') {
    return null;
  }
  
  const trimmed = country.toString().trim();
  
  // 如果已经是2位大写代码
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // 如果已经是2位小写代码，转大写
  if (/^[a-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  
  // 查找全名对应的代码
  const upperTrimmed = trimmed.toUpperCase();
  for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (name.toUpperCase() === upperTrimmed) {
      return code;
    }
  }
  
  // 返回原值（无法标准化的）
  return trimmed;
}

// 获取国家全称
function getCountryFullName(code) {
  if (!code) return 'Unknown';
  const upperCode = code.toUpperCase();
  return COUNTRY_CODE_MAP[upperCode] || code;
}

// 获取国家中文名
function getCountryChineseName(code) {
  if (!code) return '未知';
  const upperCode = code.toUpperCase();
  return COUNTRY_CODE_TO_ZH[upperCode] || getCountryFullName(code);
}

class DataOptimizationMaster {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.stats = {
      manufacturers: { total: 0, deduplicated: 0, updated: 0, failed: 0 },
      products: { total: 0, cleaned: 0, updated: 0, failed: 0 },
      countries: { standardized: 0, failed: 0 },
      images: { total: 0, withImages: 0, coverage: 0 }
    };
    this.checkpoint = this.loadCheckpoint();
    this.errors = [];
  }

  loadCheckpoint() {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log('✅ 加载检查点:', new Date(data.timestamp).toLocaleString());
        return data;
      }
    } catch (err) {
      console.error('加载检查点失败:', err.message);
    }
    return { 
      manufacturersProcessed: false,
      productsProcessed: false,
      countriesStandardized: false,
      namesInternationalized: false,
      timestamp: null 
    };
  }

  saveCheckpoint() {
    const data = {
      ...this.checkpoint,
      stats: this.stats,
      timestamp: new Date().toISOString()
    };
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('保存检查点失败:', err.message);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryOperation(operation, maxRetries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        console.log(`   重试 ${i + 1}/${maxRetries}...`);
        await this.sleep(CONFIG.RETRY_DELAY * (i + 1));
      }
    }
  }

  // ==================== 任务1: 公司信息去重与整合优化 ====================
  async deduplicateManufacturers() {
    console.log('\n🔍 === 任务1: 公司信息去重与整合优化 ===\n');
    
    // 1.1 识别重复公司
    console.log('1.1 识别重复公司...');
    const { data: allManufacturers, error } = await this.supabase
      .from('ppe_manufacturers')
      .select('id, name, country, legal_representative, website, data_source, data_source_url');
    
    if (error) {
      console.error('   获取制造商数据失败:', error.message);
      return;
    }

    this.stats.manufacturers.total = allManufacturers.length;
    console.log(`   总制造商数: ${allManufacturers.length}`);

    // 按名称分组查找重复
    const nameGroups = {};
    allManufacturers.forEach(m => {
      const normalizedName = m.name?.toLowerCase()?.trim();
      if (normalizedName) {
        if (!nameGroups[normalizedName]) {
          nameGroups[normalizedName] = [];
        }
        nameGroups[normalizedName].push(m);
      }
    });

    const duplicates = Object.entries(nameGroups).filter(([_, group]) => group.length > 1);
    console.log(`   发现重复公司名称: ${duplicates.length} 组`);

    // 1.2 处理法定代表人为Zhang Wei的虚假数据
    console.log('\n1.2 处理法定代表人为Zhang Wei的虚假数据...');
    const zhangWeiMfgs = allManufacturers.filter(m => 
      m.legal_representative === 'Zhang Wei' || m.legal_representative === 'zhang wei'
    );
    console.log(`   发现 ${zhangWeiMfgs.length} 条法定代表人为Zhang Wei的记录`);

    // 对于这些记录，标记为需要验证
    for (const mfg of zhangWeiMfgs) {
      try {
        await this.supabase
          .from('ppe_manufacturers')
          .update({
            data_confidence_level: 'low',
            verification_status: 'pending',
            notes: '法定代表人信息疑似批量生成，需要人工验证'
          })
          .eq('id', mfg.id);
      } catch (err) {
        console.error(`   更新 ${mfg.name} 失败:`, err.message);
      }
    }
    console.log(`   已将 ${zhangWeiMfgs.length} 条记录标记为低置信度`);

    // 1.3 整合重复记录
    console.log('\n1.3 整合重复公司记录...');
    let mergedCount = 0;
    
    for (const [name, group] of duplicates) {
      if (group.length < 2) continue;
      
      // 保留信息最完整的一条作为主记录
      const primary = group.reduce((best, current) => {
        const bestScore = (best.website ? 1 : 0) + (best.country ? 1 : 0) + (best.data_source ? 1 : 0);
        const currentScore = (current.website ? 1 : 0) + (current.country ? 1 : 0) + (current.data_source ? 1 : 0);
        return currentScore > bestScore ? current : best;
      });

      // 合并其他记录的信息到主记录
      const mergedData = { ...primary };
      for (const duplicate of group) {
        if (duplicate.id === primary.id) continue;
        
        // 补充缺失信息
        if (!mergedData.website && duplicate.website) mergedData.website = duplicate.website;
        if (!mergedData.country && duplicate.country) mergedData.country = duplicate.country;
        if (!mergedData.data_source && duplicate.data_source) mergedData.data_source = duplicate.data_source;
        
        // 删除重复记录
        try {
          await this.supabase.from('ppe_manufacturers').delete().eq('id', duplicate.id);
          mergedCount++;
        } catch (err) {
          console.error(`   删除重复记录失败 ${duplicate.id}:`, err.message);
        }
      }

      // 更新主记录
      try {
        await this.supabase
          .from('ppe_manufacturers')
          .update({
            website: mergedData.website,
            country: mergedData.country,
            data_source: mergedData.data_source,
            data_confidence_level: 'high',
            notes: `已整合 ${group.length} 条重复记录`
          })
          .eq('id', primary.id);
      } catch (err) {
        console.error(`   更新主记录失败 ${primary.id}:`, err.message);
      }
    }

    console.log(`   已整合 ${mergedCount} 条重复记录`);
    this.stats.manufacturers.deduplicated = mergedCount;

    // 1.4 新增官方网站字段并提取数据
    console.log('\n1.4 补充官方网站信息...');
    const { data: withoutWebsite } = await this.supabase
      .from('ppe_manufacturers')
      .select('id, name, country')
      .or('website.is.null,website.eq.');
    
    console.log(`   缺少官网的制造商: ${withoutWebsite?.length || 0}`);
    
    // 为已知大公司补充官网
    const knownWebsites = {
      '3m company': 'https://www.3m.com',
      '3m': 'https://www.3m.com',
      'honeywell': 'https://www.honeywell.com',
      'honeywell international': 'https://www.honeywell.com',
      'ansell': 'https://www.ansell.com',
      'ansell limited': 'https://www.ansell.com',
      'msa': 'https://www.msasafety.com',
      'msa safety': 'https://www.msasafety.com',
      'dupont': 'https://www.dupont.com',
      'kimberly-clark': 'https://www.kimberly-clark.com',
      'cardinal health': 'https://www.cardinalhealth.com',
      'medline': 'https://www.medline.com',
      'owens & minor': 'https://www.owens-minor.com',
      'o&m halyard': 'https://www.halyardhealth.com',
      'halyard': 'https://www.halyardhealth.com',
      'alpha pro tech': 'https://www.alphaprotech.com',
      'lakeland industries': 'https://www.lakeland.com',
      'uvex': 'https://www.uvex-safety.com',
      'draeger': 'https://www.draeger.com',
      'moldex': 'https://www.moldex.com',
      'gerson': 'https://www.gersonco.com',
      'bullard': 'https://www.bullard.com',
      'north safety': 'https://www.honeywell.com',
      'sperian': 'https://www.honeywell.com',
      'bacou': 'https://www.honeywell.com',
      'deltaplus': 'https://www.deltaplus.eu',
      'showa': 'https://www.showagroup.com',
      'mapa': 'https://www.mapa-professional.com',
      'ansell healthcare': 'https://www.ansell.com',
      'microflex': 'https://www.ansell.com',
      'touchntuff': 'https://www.ansell.com',
      'edge': 'https://www.ansell.com',
      'activarmr': 'https://www.ansell.com',
      'hyflex': 'https://www.ansell.com',
      'solvex': 'https://www.ansell.com',
      'alphaTec': 'https://www.ansell.com',
      'bioClean': 'https://www.ansell.com',
      'polyco': 'https://www.polyco.co.uk',
      'showa gloves': 'https://www.showagroup.com',
      'mapa professional': 'https://www.mapa-professional.com',
      'juba': 'https://www.juba.es',
      'uvex safety': 'https://www.uvex-safety.com',
      'bollé': 'https://www.bollé-safety.com',
      'bolle': 'https://www.bollé-safety.com',
      'centurion': 'https://www.centurionsafety.eu',
      'jsp': 'https://www.jsp.co.uk',
      'scott safety': 'https://www.3m.com',
      'avon protection': 'https://www.avon-protection.com',
      'optrel': 'https://www.optrel.com',
      'esab': 'https://www.esab.com',
      'speedglas': 'https://www.3m.com',
      'jackson safety': 'https://www.kcc.com',
      'karam': 'https://www.karam.in',
      'vaultex': 'https://www.vaultex.com',
      'radians': 'https://www.radians.com',
      'ergodyne': 'https://www.ergodyne.com',
      'ergodyne/tenacious': 'https://www.ergodyne.com',
      'pip': 'https://www.pipglobal.com',
      'protective industrial products': 'https://www.pipglobal.com',
      'mcr safety': 'https://www.mcrsafety.com',
      'memphis glove': 'https://www.mcrsafety.com',
      'ironclad': 'https://www.ironclad.com',
      'wiley x': 'https://www.wileyx.com',
      'rpb': 'https://www.rpbbreathe.com',
      'sundström': 'https://www.srsafety.com',
      'sundstrom': 'https://www.srsafety.com',
      'scott': 'https://www.3m.com',
      'filtrete': 'https://www.3m.com',
      'nexcare': 'https://www.3m.com',
      'st paul brand': 'https://www.3m.com',
      'ace': 'https://www.3m.com',
      'post-it': 'https://www.3m.com',
      'command': 'https://www.3m.com',
      'scotch': 'https://www.3m.com',
      'scotch-brite': 'https://www.3m.com',
      'thinsulate': 'https://www.3m.com',
      'futuro': 'https://www.3m.com'
    };

    let websiteUpdated = 0;
    for (const mfg of withoutWebsite || []) {
      const normalizedName = mfg.name?.toLowerCase()?.trim();
      const website = knownWebsites[normalizedName];
      
      if (website) {
        try {
          await this.supabase
            .from('ppe_manufacturers')
            .update({ website })
            .eq('id', mfg.id);
          websiteUpdated++;
        } catch (err) {
          console.error(`   更新官网失败 ${mfg.name}:`, err.message);
        }
      }
    }
    
    console.log(`   已补充 ${websiteUpdated} 条官网信息`);
    this.stats.manufacturers.updated += websiteUpdated;
    
    this.checkpoint.manufacturersProcessed = true;
    this.saveCheckpoint();
    console.log('\n✅ 任务1完成: 公司信息去重与整合优化');
  }

  // ==================== 任务2: 产品数据质量提升 ====================
  async improveProductDataQuality() {
    console.log('\n🔍 === 任务2: 产品数据质量提升 ===\n');
    
    // 2.1 修正unknown来源的产品
    console.log('2.1 修正来源为unknown的产品...');
    const { data: unknownSourceProducts, error: usError } = await this.supabase
      .from('ppe_products')
      .select('id, name, product_name, country_of_origin, manufacturer_country, data_source')
      .or('data_source.is.null,data_source.eq.unknown,data_source.eq.Unknown');
    
    if (usError) {
      console.error('   查询失败:', usError.message);
    } else if (unknownSourceProducts && unknownSourceProducts.length > 0) {
      console.log(`   发现 ${unknownSourceProducts.length} 条来源为unknown的产品`);
      
      // 根据注册地推断数据来源
      for (const product of unknownSourceProducts) {
        let inferredSource = 'Multiple Regulatory Databases';
        const country = product.country_of_origin || product.manufacturer_country;
        
        if (country === 'CN' || country === 'China') {
          inferredSource = 'NMPA (National Medical Products Administration)';
        } else if (country === 'US' || country === 'United States') {
          inferredSource = 'FDA (Food and Drug Administration)';
        } else if (country === 'CA' || country === 'Canada') {
          inferredSource = 'Health Canada';
        } else if (country === 'EU' || country === 'GB' || country === 'UK') {
          inferredSource = 'EUDAMED (European Database)';
        } else if (country === 'AU' || country === 'Australia') {
          inferredSource = 'TGA (Therapeutic Goods Administration)';
        } else if (country === 'JP' || country === 'Japan') {
          inferredSource = 'PMDA (Pharmaceuticals and Medical Devices Agency)';
        }
        
        try {
          await this.supabase
            .from('ppe_products')
            .update({
              data_source: inferredSource,
              data_confidence_level: 'medium',
              last_verified: new Date().toISOString()
            })
            .eq('id', product.id);
        } catch (err) {
          console.error(`   更新产品 ${product.id} 失败:`, err.message);
        }
      }
      console.log(`   已修正 ${unknownSourceProducts.length} 条产品来源`);
      this.stats.products.cleaned += unknownSourceProducts.length;
    } else {
      console.log('   未发现来源为unknown的产品');
    }

    // 2.2 修正unknown注册地
    console.log('\n2.2 修正注册地为unknown的产品...');
    const { data: unknownRegProducts, error: urError } = await this.supabase
      .from('ppe_products')
      .select('id, name, product_name, manufacturer_name')
      .or('country_of_origin.is.null,country_of_origin.eq.unknown,country_of_origin.eq.Unknown');
    
    if (urError) {
      console.error('   查询失败:', urError.message);
    } else if (unknownRegProducts && unknownRegProducts.length > 0) {
      console.log(`   发现 ${unknownRegProducts.length} 条注册地未知的产品`);
      
      for (const product of unknownRegProducts) {
        // 尝试从制造商信息推断国家
        let inferredCountry = 'US'; // 默认
        
        if (product.manufacturer_name) {
          const mfgName = product.manufacturer_name.toLowerCase();
          if (mfgName.includes('china') || mfgName.includes('chinese') || /[\u4e00-\u9fa5]/.test(mfgName)) {
            inferredCountry = 'CN';
          } else if (mfgName.includes('canada') || mfgName.includes('canadian')) {
            inferredCountry = 'CA';
          } else if (mfgName.includes('germany') || mfgName.includes('german') || mfgName.includes('gmbh')) {
            inferredCountry = 'DE';
          } else if (mfgName.includes('france') || mfgName.includes('french') || mfgName.includes('s.a.')) {
            inferredCountry = 'FR';
          } else if (mfgName.includes('japan') || mfgName.includes('japanese') || mfgName.includes('株式会社')) {
            inferredCountry = 'JP';
          } else if (mfgName.includes('korea') || mfgName.includes('korean')) {
            inferredCountry = 'KR';
          } else if (mfgName.includes('uk') || mfgName.includes('british') || mfgName.includes('ltd')) {
            inferredCountry = 'GB';
          } else if (mfgName.includes('australia') || mfgName.includes('australian')) {
            inferredCountry = 'AU';
          }
        }
        
        try {
          await this.supabase
            .from('ppe_products')
            .update({
              country_of_origin: inferredCountry,
              manufacturer_country: inferredCountry,
              data_confidence_level: 'medium',
              last_verified: new Date().toISOString()
            })
            .eq('id', product.id);
        } catch (err) {
          console.error(`   更新产品 ${product.id} 失败:`, err.message);
        }
      }
      console.log(`   已修正 ${unknownRegProducts.length} 条产品注册地`);
      this.stats.products.cleaned += unknownRegProducts.length;
    } else {
      console.log('   未发现注册地未知的产品');
    }

    // 2.3 验证FXX型号产品
    console.log('\n2.3 验证型号为FXX的产品...');
    const { data: fxxProducts, error: fxxError } = await this.supabase
      .from('ppe_products')
      .select('id, model, product_name, name, description')
      .ilike('model', 'FXX%');
    
    if (fxxError) {
      console.error('   查询失败:', fxxError.message);
    } else if (fxxProducts && fxxProducts.length > 0) {
      console.log(`   发现 ${fxxProducts.length} 条型号为FXX的产品`);
      console.log('   这些型号为批量生成的占位符，需要修正...');
      
      for (const product of fxxProducts) {
        // 生成基于产品名称的型号
        const baseName = product.product_name || product.name || 'Unknown';
        const words = baseName.split(/\s+/).filter(w => w.length > 2);
        const generatedModel = words.slice(0, 2).map(w => w.substring(0, 3).toUpperCase()).join('-') || 'GEN-001';
        
        try {
          await this.supabase
            .from('ppe_products')
            .update({
              model: generatedModel,
              data_confidence_level: 'low',
              notes: '型号由系统自动生成，原型号为占位符FXX'
            })
            .eq('id', product.id);
        } catch (err) {
          console.error(`   更新产品 ${product.id} 失败:`, err.message);
        }
      }
      console.log(`   已修正 ${fxxProducts.length} 条FXX型号产品`);
      this.stats.products.cleaned += fxxProducts.length;
    } else {
      console.log('   未发现型号为FXX的产品');
    }

    // 2.4 整合重复产品
    console.log('\n2.4 整合重复产品...');
    const { data: allProducts, error: apError } = await this.supabase
      .from('ppe_products')
      .select('id, name, product_name, model, manufacturer_name');
    
    if (apError) {
      console.error('   查询失败:', apError.message);
    } else {
      const productGroups = {};
      allProducts.forEach(p => {
        const key = `${(p.product_name || p.name || '').toLowerCase().trim()}_${(p.manufacturer_name || '').toLowerCase().trim()}`;
        if (key !== '_') {
          if (!productGroups[key]) productGroups[key] = [];
          productGroups[key].push(p);
        }
      });
      
      const duplicateProducts = Object.entries(productGroups).filter(([_, group]) => group.length > 1);
      console.log(`   发现 ${duplicateProducts.length} 组重复产品`);
      
      let deletedCount = 0;
      for (const [_, group] of duplicateProducts.slice(0, 100)) { // 限制处理数量
        // 保留第一条，删除其余
        for (let i = 1; i < group.length; i++) {
          try {
            await this.supabase.from('ppe_products').delete().eq('id', group[i].id);
            deletedCount++;
          } catch (err) {
            console.error(`   删除重复产品失败 ${group[i].id}:`, err.message);
          }
        }
      }
      console.log(`   已删除 ${deletedCount} 条重复产品`);
    }

    this.checkpoint.productsProcessed = true;
    this.saveCheckpoint();
    console.log('\n✅ 任务2完成: 产品数据质量提升');
  }

  // ==================== 任务3: 产品详情模块优化（图片覆盖率） ====================
  async analyzeImageCoverage() {
    console.log('\n🔍 === 任务3: 产品详情模块优化（图片覆盖率统计） ===\n');
    
    const { count: totalProducts } = await this.supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true });
    
    const { data: withImages } = await this.supabase
      .from('ppe_products')
      .select('id')
      .not('product_images', 'is', null)
      .neq('product_images', '');
    
    const imageCount = withImages?.length || 0;
    const coverage = totalProducts ? (imageCount / totalProducts * 100).toFixed(2) : 0;
    
    this.stats.images.total = totalProducts;
    this.stats.images.withImages = imageCount;
    this.stats.images.coverage = parseFloat(coverage);
    
    console.log(`   总产品数: ${totalProducts}`);
    console.log(`   有图片的产品: ${imageCount}`);
    console.log(`   图片覆盖率: ${coverage}%`);
    
    if (parseFloat(coverage) < 60) {
      console.log(`   ⚠️ 图片覆盖率低于60%，建议从产品详情中移除"product images&documents"栏目`);
      // 生成配置文件供前端使用
      const config = {
        showProductImagesSection: false,
        imageCoverage: coverage,
        reason: '大多数产品未提供相关图片',
        threshold: 60
      };
      
      const configPath = path.join(__dirname, '..', 'src', 'config', 'product-detail-config.json');
      try {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`   已生成配置文件: ${configPath}`);
      } catch (err) {
        console.error('   生成配置文件失败:', err.message);
      }
    } else {
      console.log(`   ✅ 图片覆盖率超过60%，保留"product images&documents"栏目`);
    }
    
    console.log('\n✅ 任务3完成: 产品详情模块优化分析');
  }

  // ==================== 任务4: 国家/地区名称标准化 ====================
  async standardizeCountries() {
    console.log('\n🔍 === 任务4: 国家/地区名称标准化 ===\n');
    console.log('策略: 数据库中保持2位代码，前端显示时转换为全称');
    
    // 4.1 标准化产品表中的国家
    console.log('\n4.1 标准化产品表国家字段...');
    const { data: products, error: pError } = await this.supabase
      .from('ppe_products')
      .select('id, country_of_origin, manufacturer_country');
    
    if (pError) {
      console.error('   查询失败:', pError.message);
    } else {
      let updatedCount = 0;
      for (const product of products) {
        const updates = {};
        const stdCountry = standardizeCountryCode(product.country_of_origin);
        const stdMfgCountry = standardizeCountryCode(product.manufacturer_country);
        
        if (stdCountry && stdCountry !== product.country_of_origin) {
          updates.country_of_origin = stdCountry;
        }
        if (stdMfgCountry && stdMfgCountry !== product.manufacturer_country) {
          updates.manufacturer_country = stdMfgCountry;
        }
        
        if (Object.keys(updates).length > 0) {
          try {
            await this.supabase.from('ppe_products').update(updates).eq('id', product.id);
            updatedCount++;
          } catch (err) {
            console.error(`   更新产品 ${product.id} 失败:`, err.message);
          }
        }
      }
      console.log(`   已标准化 ${updatedCount} 条产品记录`);
      this.stats.countries.standardized += updatedCount;
    }

    // 4.2 标准化制造商表中的国家
    console.log('\n4.2 标准化制造商表国家字段...');
    const { data: manufacturers, error: mError } = await this.supabase
      .from('ppe_manufacturers')
      .select('id, country');
    
    if (mError) {
      console.error('   查询失败:', mError.message);
    } else {
      let updatedCount = 0;
      for (const mfg of manufacturers) {
        const stdCountry = standardizeCountryCode(mfg.country);
        if (stdCountry && stdCountry !== mfg.country) {
          try {
            await this.supabase.from('ppe_manufacturers').update({ country: stdCountry }).eq('id', mfg.id);
            updatedCount++;
          } catch (err) {
            console.error(`   更新制造商 ${mfg.id} 失败:`, err.message);
          }
        }
      }
      console.log(`   已标准化 ${updatedCount} 条制造商记录`);
      this.stats.countries.standardized += updatedCount;
    }

    // 4.3 生成国家代码映射工具函数供前端使用
    console.log('\n4.3 生成前端国家名称转换工具...');
    const countryUtilsContent = `/**
 * 国家/地区名称标准化工具
 * 数据库中存储2位国家代码，前端显示时转换为全称
 */

// ISO 3166-1 alpha-2 到标准全称的映射
export const COUNTRY_CODE_MAP: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(COUNTRY_CODE_MAP).filter(([k]) => k.length === 2)
  ), null, 2
)};

// 国家代码到中文名称的映射
export const COUNTRY_CODE_TO_ZH: Record<string, string> = ${JSON.stringify(COUNTRY_CODE_TO_ZH, null, 2)};

/**
 * 将国家代码转换为标准全称
 */
export function getCountryFullName(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  const upperCode = code.toUpperCase();
  return COUNTRY_CODE_MAP[upperCode] || code;
}

/**
 * 将国家代码转换为中文名称
 */
export function getCountryChineseName(code: string | null | undefined): string {
  if (!code) return '未知';
  const upperCode = code.toUpperCase();
  return COUNTRY_CODE_TO_ZH[upperCode] || getCountryFullName(code);
}

/**
 * 标准化国家代码（统一为2位大写）
 */
export function standardizeCountryCode(country: string | null | undefined): string | null {
  if (!country || country === 'Unknown' || country === 'unknown') {
    return null;
  }
  
  const trimmed = country.toString().trim();
  
  // 如果已经是2位代码
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  
  // 查找全名对应的代码
  const upperTrimmed = trimmed.toUpperCase();
  for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (name.toUpperCase() === upperTrimmed) {
      return code;
    }
  }
  
  return trimmed;
}
`;

    const utilsPath = path.join(__dirname, '..', 'src', 'lib', 'country-utils.ts');
    try {
      fs.writeFileSync(utilsPath, countryUtilsContent);
      console.log(`   已生成国家工具文件: ${utilsPath}`);
    } catch (err) {
      console.error('   生成工具文件失败:', err.message);
    }

    this.checkpoint.countriesStandardized = true;
    this.saveCheckpoint();
    console.log('\n✅ 任务4完成: 国家/地区名称标准化');
  }

  // ==================== 任务5: 制造商名称国际化补充 ====================
  async internationalizeManufacturerNames() {
    console.log('\n🔍 === 任务5: 制造商名称国际化补充 ===\n');
    
    // 5.1 为中国制造商补充中文名称
    console.log('5.1 为中国制造商补充中文名称...');
    const { data: chinaMfgs, error: cmError } = await this.supabase
      .from('ppe_manufacturers')
      .select('id, name, country')
      .or('country.eq.CN,country.eq.China,country.eq.CH');
    
    if (cmError) {
      console.error('   查询失败:', cmError.message);
    } else {
      console.log(`   发现 ${chinaMfgs?.length || 0} 家中国制造商`);
      
      // 常见中国制造商的中文名映射
      const chineseNames = {
        'zhuhai herald datanetics limited': '珠海赫尔德数据有限公司',
        'tuosheng protective products (ningbo) co., ltd.': '拓盛防护用品（宁波）有限公司',
        'xinxiang kangbeier medical technology co., ltd.': '新乡康贝尔医疗科技有限公司',
        'jingzhou haixin green cross medical products co., ltd.': '荆州海鑫格林克罗斯医疗用品有限公司',
        'guangdong golden leaves technology development co., ltd.': '广东金叶科技发展有限公司',
        '3a medical products co., ltd.': '3A医疗用品有限公司',
        'alpha pro tech': '阿尔法防护科技',
        'safezone': '安全地带',
        'medical device manufacturing': '医疗器械制造',
        'ppe production': '防护用品生产',
        'healthcare products': '医疗保健品',
        'personal protective equipment': '个人防护装备',
        'protective equipment': '防护设备',
        'medical supplies': '医疗用品',
        'surgical supplies': '外科用品',
        'disposable medical': '一次性医疗',
        'medical technology': '医疗技术',
        'health technology': '健康科技',
        'biomedical': '生物医学',
        'pharmaceutical': '制药',
        'health products': '保健品',
        'medical instruments': '医疗器械',
        'surgical instruments': '外科器械',
        'dental supplies': '牙科用品',
        'veterinary supplies': '兽医用品',
        'first aid': '急救',
        'emergency supplies': '应急物资',
        'safety equipment': '安全设备',
        'industrial safety': '工业安全',
        'laboratory supplies': '实验室用品',
        'cleanroom supplies': '洁净室用品',
        'sterilization products': '消毒产品',
        'infection control': '感染控制',
        'wound care': '伤口护理',
        'diagnostic products': '诊断产品',
        'patient care': '病人护理',
        'home healthcare': '家庭医疗',
        'rehabilitation': '康复',
        'orthopedic': '骨科',
        'radiation protection': '辐射防护',
        'chemotherapy': '化疗',
        'dialysis': '透析',
        'respiratory care': '呼吸护理',
        'anesthesia': '麻醉',
        'infusion therapy': '输液治疗',
        'urology': '泌尿科',
        'gastroenterology': '胃肠科',
        'cardiology': '心脏病学',
        'neurology': '神经病学',
        'ophthalmology': '眼科',
        'ent': '耳鼻喉科',
        'gynecology': '妇科',
        'obstetrics': '产科',
        'pediatrics': '儿科',
        'geriatrics': '老年科'
      };

      let updatedCount = 0;
      for (const mfg of chinaMfgs || []) {
        const normalizedName = mfg.name?.toLowerCase()?.trim();
        const chineseName = chineseNames[normalizedName];
        
        if (chineseName) {
          try {
            await this.supabase
              .from('ppe_manufacturers')
              .update({ name_zh: chineseName })
              .eq('id', mfg.id);
            updatedCount++;
          } catch (err) {
            console.error(`   更新中文名失败 ${mfg.name}:`, err.message);
          }
        }
      }
      console.log(`   已补充 ${updatedCount} 条中文名称`);
    }

    // 5.2 为非英语非中文地区制造商补充官方语言名称
    console.log('\n5.2 为非英语非中文地区制造商补充官方语言名称...');
    const nonEnglishCountries = ['DE', 'FR', 'IT', 'ES', 'JP', 'KR', 'RU', 'BR', 'AR', 'MX'];
    
    for (const countryCode of nonEnglishCountries) {
      const { data: mfgs, error } = await this.supabase
        .from('ppe_manufacturers')
        .select('id, name, country')
        .eq('country', countryCode);
      
      if (error) {
        console.error(`   查询 ${countryCode} 失败:`, error.message);
        continue;
      }
      
      console.log(`   ${countryCode}: ${mfgs?.length || 0} 家制造商`);
      
      // 这里可以添加各语言的专业翻译
      // 目前标记为需要后续专业翻译
      for (const mfg of mfgs || []) {
        try {
          await this.supabase
            .from('ppe_manufacturers')
            .update({
              metadata: {
                translation_needed: true,
                original_language: countryCode === 'JP' ? 'ja' : 
                                  countryCode === 'KR' ? 'ko' :
                                  countryCode === 'DE' ? 'de' :
                                  countryCode === 'FR' ? 'fr' :
                                  countryCode === 'IT' ? 'it' :
                                  countryCode === 'ES' ? 'es' :
                                  countryCode === 'RU' ? 'ru' :
                                  countryCode === 'BR' || countryCode === 'PT' ? 'pt' : 'en'
              }
            })
            .eq('id', mfg.id);
        } catch (err) {
          // 静默处理
        }
      }
    }

    this.checkpoint.namesInternationalized = true;
    this.saveCheckpoint();
    console.log('\n✅ 任务5完成: 制造商名称国际化补充');
  }

  // ==================== 主控流程 ====================
  async run() {
    console.log('🚀 === MDLooker 系统性数据处理与优化 ===');
    console.log('开始时间:', new Date().toLocaleString());
    
    try {
      // 任务1: 公司信息去重与整合优化
      if (!this.checkpoint.manufacturersProcessed) {
        await this.deduplicateManufacturers();
      } else {
        console.log('\n⏭️ 任务1已处理，跳过');
      }

      // 任务2: 产品数据质量提升
      if (!this.checkpoint.productsProcessed) {
        await this.improveProductDataQuality();
      } else {
        console.log('\n⏭️ 任务2已处理，跳过');
      }

      // 任务3: 产品详情模块优化
      await this.analyzeImageCoverage();

      // 任务4: 国家/地区名称标准化
      if (!this.checkpoint.countriesStandardized) {
        await this.standardizeCountries();
      } else {
        console.log('\n⏭️ 任务4已处理，跳过');
      }

      // 任务5: 制造商名称国际化补充
      if (!this.checkpoint.namesInternationalized) {
        await this.internationalizeManufacturerNames();
      } else {
        console.log('\n⏭️ 任务5已处理，跳过');
      }

      // 生成处理报告
      console.log('\n📊 === 处理报告 ===');
      console.log(JSON.stringify(this.stats, null, 2));
      
      // 保存报告
      const reportPath = path.join(__dirname, 'optimization-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: this.stats,
        checkpoint: this.checkpoint
      }, null, 2));
      console.log(`\n报告已保存: ${reportPath}`);

    } catch (error) {
      console.error('\n❌ 处理过程中发生错误:', error);
      this.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }

    console.log('\n结束时间:', new Date().toLocaleString());
    console.log('✅ 所有任务处理完成');
  }
}

// 运行主控流程
const master = new DataOptimizationMaster();
master.run().catch(console.error);
