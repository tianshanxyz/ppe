/**
 * 修复脚本：将 "China China Taiwan" 恢复为 "China Taiwan"
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('错误：缺少环境变量')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fixDoubleChina(tableName, fieldName) {
  console.log(`\n📋 修复表: ${tableName}, 字段: ${fieldName}`)

  const { data, error } = await supabase
    .from(tableName)
    .select('id, ' + fieldName)
    .ilike(fieldName, '%China China Taiwan%')

  if (error) {
    console.error(`  ❌ 查询失败:`, error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log(`  ℹ️ 未找到包含 "China China Taiwan" 的记录`)
    return
  }

  console.log(`  🔍 找到 ${data.length} 条需要修复的记录`)

  for (const record of data) {
    const oldValue = record[fieldName]
    const newValue = oldValue.replace(/China China Taiwan/g, 'China Taiwan')
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ [fieldName]: newValue })
      .eq('id', record.id)

    if (updateError) {
      console.error(`    ❌ 修复失败 id=${record.id}:`, updateError.message)
    } else {
      console.log(`    ✅ 已修复 id=${record.id}`)
    }
  }
}

async function main() {
  console.log('🚀 开始修复 "China China Taiwan" 重复问题...')
  console.log('=====================================')

  await fixDoubleChina('ppe_products', 'country_of_origin')
  await fixDoubleChina('ppe_products', 'manufacturer_name')
  await fixDoubleChina('ppe_manufacturers', 'country')
  await fixDoubleChina('ppe_manufacturers', 'name')

  console.log('\n=====================================')
  console.log('✅ 修复完成')
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
