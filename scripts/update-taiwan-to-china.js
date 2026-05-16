/**
 * 数据库更新脚本：将所有"台湾"改为"中国台湾"
 * 涉及表：ppe_products, ppe_manufacturers
 * 涉及字段：country_of_origin, manufacturer_name, country 等
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('错误：缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateField(tableName, fieldName) {
  console.log(`\n📋 处理表: ${tableName}, 字段: ${fieldName}`)

  // 1. 先处理中文 "台湾"
  const { data: zhData, error: zhError } = await supabase
    .from(tableName)
    .select('id, ' + fieldName)
    .ilike(fieldName, '%台湾%')

  if (zhError) {
    console.error(`  ❌ 中文查询失败:`, zhError.message)
  } else if (zhData && zhData.length > 0) {
    console.log(`  🔍 找到 ${zhData.length} 条包含 "台湾" 的记录`)
    for (const record of zhData) {
      const oldValue = record[fieldName]
      const newValue = oldValue.replace(/台湾/g, '中国台湾')
      if (newValue !== oldValue) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ [fieldName]: newValue })
          .eq('id', record.id)
        if (updateError) {
          console.error(`    ❌ 更新失败 id=${record.id}:`, updateError.message)
        } else {
          console.log(`    ✅ 已更新 id=${record.id}: "${oldValue}" → "${newValue}"`)
        }
      }
    }
  } else {
    console.log(`  ℹ️ 未找到包含 "台湾" 的记录`)
  }

  // 2. 处理英文 "Taiwan"（但排除已包含 "China Taiwan" 的）
  const { data: enData, error: enError } = await supabase
    .from(tableName)
    .select('id, ' + fieldName)
    .ilike(fieldName, '%Taiwan%')
    .not(fieldName, 'ilike', '%China Taiwan%')

  if (enError) {
    console.error(`  ❌ 英文查询失败:`, enError.message)
  } else if (enData && enData.length > 0) {
    console.log(`  🔍 找到 ${enData.length} 条包含 "Taiwan" 的记录`)
    for (const record of enData) {
      const oldValue = record[fieldName]
      // 使用正则确保只替换独立的 "Taiwan"，不替换 "China Taiwan"
      const newValue = oldValue.replace(/\bTaiwan\b/g, 'China Taiwan')
      if (newValue !== oldValue) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ [fieldName]: newValue })
          .eq('id', record.id)
        if (updateError) {
          console.error(`    ❌ 更新失败 id=${record.id}:`, updateError.message)
        } else {
          console.log(`    ✅ 已更新 id=${record.id}: "${oldValue}" → "${newValue}"`)
        }
      }
    }
  } else {
    console.log(`  ℹ️ 未找到包含 "Taiwan" 的记录`)
  }

  // 3. 处理精确匹配 "TW" 的 country 代码
  const { data: twData, error: twError } = await supabase
    .from(tableName)
    .select('id, ' + fieldName)
    .eq(fieldName, 'TW')

  if (twError) {
    console.error(`  ❌ TW查询失败:`, twError.message)
  } else if (twData && twData.length > 0) {
    console.log(`  🔍 找到 ${twData.length} 条值为 "TW" 的记录`)
    for (const record of twData) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [fieldName]: 'CN-TW' })
        .eq('id', record.id)
      if (updateError) {
        console.error(`    ❌ 更新失败 id=${record.id}:`, updateError.message)
      } else {
        console.log(`    ✅ 已更新 id=${record.id}: "TW" → "CN-TW"`)
      }
    }
  } else {
    console.log(`  ℹ️ 未找到值为 "TW" 的记录`)
  }
}

async function main() {
  console.log('🚀 开始更新数据库中的台湾相关数据...')
  console.log('=====================================')

  // 1. 更新 ppe_products 表的 country_of_origin 字段
  await updateField('ppe_products', 'country_of_origin')

  // 2. 更新 ppe_products 表的 manufacturer_name 字段
  await updateField('ppe_products', 'manufacturer_name')

  // 3. 更新 ppe_manufacturers 表的 country 字段
  await updateField('ppe_manufacturers', 'country')

  // 4. 更新 ppe_manufacturers 表的 name 字段
  await updateField('ppe_manufacturers', 'name')

  // 5. 更新 ppe_regulations 表的 region 字段
  await updateField('ppe_regulations', 'region')

  console.log('\n=====================================')
  console.log('✅ 数据库更新完成')
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
