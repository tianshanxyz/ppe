const { createClient } = require('@supabase/supabase-js')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function check() {
  const tables = [
    { name: 'ppe_products', fields: ['country_of_origin', 'manufacturer_name'] },
    { name: 'ppe_manufacturers', fields: ['country', 'name'] },
    { name: 'ppe_regulations', fields: ['region'] },
  ]

  for (const table of tables) {
    for (const field of table.fields) {
      // Check for standalone "台湾" (not preceded by "中国")
      const { data: zhData } = await supabase
        .from(table.name)
        .select('id, ' + field)
        .ilike(field, '%台湾%')
      const badZh = (zhData || []).filter(r => !r[field].includes('中国台湾'))
      if (badZh.length > 0) {
        console.log(`⚠️ ${table.name}.${field}: ${badZh.length} 条含"台湾"但不含"中国台湾"`)
        badZh.forEach(r => console.log(`   id=${r.id}: ${r[field]}`))
      } else {
        console.log(`✅ ${table.name}.${field}: 中文"台湾"已全部更新为"中国台湾"`)
      }

      // Check for standalone "Taiwan" (not preceded by "China")
      const { data: enData } = await supabase
        .from(table.name)
        .select('id, ' + field)
        .ilike(field, '%Taiwan%')
      const badEn = (enData || []).filter(r => !r[field].includes('China Taiwan'))
      if (badEn.length > 0) {
        console.log(`⚠️ ${table.name}.${field}: ${badEn.length} 条含"Taiwan"但不含"China Taiwan"`)
        badEn.forEach(r => console.log(`   id=${r.id}: ${r[field]}`))
      } else {
        console.log(`✅ ${table.name}.${field}: 英文"Taiwan"已全部更新为"China Taiwan"`)
      }

      // Check for "TW" exact match
      const { data: twData } = await supabase
        .from(table.name)
        .select('id, ' + field)
        .eq(field, 'TW')
      if (twData && twData.length > 0) {
        console.log(`⚠️ ${table.name}.${field}: ${twData.length} 条值为 "TW"`)
      } else {
        console.log(`✅ ${table.name}.${field}: 无残留 "TW" 值`)
      }
    }
  }
}

check().catch(console.error)
