/**
 * 产品家族聚合工具
 * 将同一产品的多国注册记录聚合成一个产品家族
 */

export interface ProductRegistration {
  id: string
  country: string
  authority: string
  registrationNumber: string
  status?: string
  dataSource: string
}

export interface ProductFamily {
  familyId: string
  name: string
  manufacturer: string
  category?: string
  registrations: ProductRegistration[]
  countries: string[]
  authorities: string[]
  productCount: number
}

/**
 * 简化产品名称用于匹配
 * 移除通用词汇，保留核心识别特征
 */
export function simplifyProductName(name: string): string {
  return name
    .toLowerCase()
    // 移除通用修饰词
    .replace(/\b(医用|医疗|一次性|使用|无菌|有菌|powder|free|powder-free|sterile|non-sterile)\b/g, '')
    .replace(/\b(examination|patient|medical|surgical|procedure|disposable)\b/g, '')
    // 移除型号规格
    .replace(/[#\d]+/g, '')
    .replace(/\([^)]*\)/g, '')
    // 标准化空格
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 判断两个产品是否属于同一产品家族
 */
function isSameFamily(product1: any, product2: any): boolean {
  // 必须同一制造商
  if (product1.company_name !== product2.company_name) return false
  
  // 简化名称匹配
  const name1 = simplifyProductName(product1.name || '')
  const name2 = simplifyProductName(product2.name || '')
  
  // 名称相似度检查（简化后相同，或包含关系）
  if (name1 === name2) return true
  if (name1.includes(name2) || name2.includes(name1)) return true
  
  // 产品代码匹配（如果存在）
  if (product1.product_code && product2.product_code) {
    if (product1.product_code === product2.product_code) return true
  }
  
  return false
}

/**
 * 将产品列表聚合成产品家族
 */
export function groupProductsByFamily(products: any[]): ProductFamily[] {
  const families: ProductFamily[] = []
  const processed = new Set<string>()
  
  for (const product of products) {
    if (processed.has(product.id)) continue
    
    // 查找所有属于同一家族的产品
    const familyProducts: any[] = [product]
    processed.add(product.id)
    
    for (const other of products) {
      if (processed.has(other.id)) continue
      
      if (isSameFamily(product, other)) {
        familyProducts.push(other)
        processed.add(other.id)
      }
    }
    
    // 创建产品家族
    const family: ProductFamily = {
      familyId: `family-${product.id}`,
      name: product.name,
      manufacturer: product.company_name || product.manufacturer_name || 'Unknown',
      category: product.category,
      registrations: familyProducts.map(p => ({
        id: p.id,
        country: p.country || p.country_of_origin || getCountryFromSource(p.data_source),
        authority: getAuthorityFromSource(p.data_source),
        registrationNumber: p.product_code || p.registration_number || 'N/A',
        status: p.status,
        dataSource: p.data_source
      })),
      countries: [...new Set(familyProducts.map(p => p.country || p.country_of_origin || getCountryFromSource(p.data_source)))],
      authorities: [...new Set(familyProducts.map(p => getAuthorityFromSource(p.data_source)))],
      productCount: familyProducts.length
    }
    
    families.push(family)
  }
  
  return families
}

/**
 * 从数据源推断国家
 */
function getCountryFromSource(dataSource: string): string {
  const source = (dataSource || '').toLowerCase()
  if (source.includes('fda') || source.includes('niosh')) return 'US'
  if (source.includes('nmpa')) return 'CN'
  if (source.includes('eudamed')) return 'EU'
  if (source.includes('health canada')) return 'CA'
  if (source.includes('pmda')) return 'JP'
  if (source.includes('tga')) return 'AU'
  if (source.includes('mhra')) return 'UK'
  return 'Unknown'
}

/**
 * 从数据源推断监管机构
 */
function getAuthorityFromSource(dataSource: string): string {
  const source = (dataSource || '').toLowerCase()
  if (source.includes('fda')) return 'FDA'
  if (source.includes('nmpa')) return 'NMPA'
  if (source.includes('eudamed')) return 'EUDAMED'
  if (source.includes('health canada')) return 'Health Canada'
  if (source.includes('pmda')) return 'PMDA'
  if (source.includes('tga')) return 'TGA'
  if (source.includes('mhra')) return 'MHRA'
  if (source.includes('niosh')) return 'NIOSH'
  return dataSource || 'Unknown'
}

/**
 * 获取国家国旗emoji
 */
export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'CN': '🇨🇳',
    'EU': '🇪🇺',
    'CA': '🇨🇦',
    'JP': '🇯🇵',
    'AU': '🇦🇺',
    'UK': '🇬🇧',
    'GB': '🇬🇧',
    'KR': '🇰🇷',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
    'CH': '🇨🇭',
    'AT': '🇦🇹',
    'SE': '🇸🇪',
    'NO': '🇳🇴',
    'DK': '🇩🇰',
    'FI': '🇫🇮',
    'PL': '🇵🇱',
    'CZ': '🇨🇿',
    'HU': '🇭🇺',
    'RO': '🇷🇴',
    'BG': '🇧🇬',
    'HR': '🇭🇷',
    'SI': '🇸🇮',
    'SK': '🇸🇰',
    'LT': '🇱🇹',
    'LV': '🇱🇻',
    'EE': '🇪🇪',
    'IE': '🇮🇪',
    'PT': '🇵🇹',
    'GR': '🇬🇷',
    'MT': '🇲🇹',
    'CY': '🇨🇾',
    'LU': '🇱🇺',
    'MY': '🇲🇾',
    'TR': '🇹🇷',
    'TH': '🇹🇭',
    'SG': '🇸🇬',
    'ID': '🇮🇩',
    'VN': '🇻🇳',
    'PH': '🇵🇭',
    'IN': '🇮🇳',
    'BR': '🇧🇷',
    'MX': '🇲🇽',
    'AR': '🇦🇷',
    'CL': '🇨🇱',
    'ZA': '🇿🇦',
    'EG': '🇪🇬',
    'IL': '🇮🇱',
    'AE': '🇦🇪',
    'SA': '🇸🇦',
    'QA': '🇶🇦',
    'KW': '🇰🇼',
    'BH': '🇧🇭',
    'OM': '🇴🇲',
    'JO': '🇯🇴',
    'LB': '🇱🇧',
    'IQ': '🇮🇶',
    'IR': '🇮🇷',
    'PK': '🇵🇰',
    'BD': '🇧🇩',
    'LK': '🇱🇰',
    'NP': '🇳🇵',
    'MM': '🇲🇲',
    'KH': '🇰🇭',
    'LA': '🇱🇦',
    'MN': '🇲🇳',
    'KP': '🇰🇵',
    'RU': '🇷🇺',
    'UA': '🇺🇦',
    'BY': '🇧🇾',
    'MD': '🇲🇩',
    'AM': '🇦🇲',
    'GE': '🇬🇪',
    'AZ': '🇦🇿',
    'KZ': '🇰🇿',
    'UZ': '🇺🇿',
    'KG': '🇰🇬',
    'TJ': '🇹🇯',
    'TM': '🇹🇲',
    'AF': '🇦🇫',
    'Unknown': '🌐'
  }
  return flags[countryCode] || '🌐'
}