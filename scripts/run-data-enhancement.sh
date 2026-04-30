#!/bin/bash

# 数据增强执行脚本
# 此脚本将：
# 1. 添加数据库字段
# 2. 丰富产品数据
# 3. 丰富制造商数据
# 4. 验证数据完整性

echo "============================================"
echo "MDLooker 数据增强脚本"
echo "============================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    exit 1
fi

echo "步骤 1/4: 检查数据库连接..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
supabase.from('ppe_products').select('count').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  } else {
    console.log('数据库连接成功 ✅');
    process.exit(0);
  }
});
"

if [ $? -ne 0 ]; then
    echo "数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo "步骤 2/4: 丰富产品数据..."
echo "这将添加注册信息、认证信息、销售地区等数据"
echo "预计处理 55,000+ 条产品记录..."
echo ""

node scripts/enrich-product-data.js

echo ""
echo "步骤 3/4: 丰富制造商数据..."
echo "这将添加企业档案、全球布局、认证资质等数据"
echo "预计处理 50,000+ 条制造商记录..."
echo ""

node scripts/enrich-manufacturer-data.js

echo ""
echo "步骤 4/4: 验证数据完整性..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

async function verify() {
  console.log('验证数据完整性...\n');
  
  // 检查产品数据
  const { count: pWithSource } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .not('data_source', 'is', null);
  
  const { count: pTotal } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  console.log('产品数据:');
  console.log('  - 总数:', pTotal);
  console.log('  - 已增强:', pWithSource);
  console.log('  - 覆盖率:', ((pWithSource / pTotal) * 100).toFixed(2) + '%');
  
  // 检查制造商数据
  const { count: mWithSource } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .not('data_source', 'is', null);
  
  const { count: mTotal } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n制造商数据:');
  console.log('  - 总数:', mTotal);
  console.log('  - 已增强:', mWithSource);
  console.log('  - 覆盖率:', ((mWithSource / mTotal) * 100).toFixed(2) + '%');
  
  console.log('\n✅ 数据增强完成！');
}

verify().catch(console.error);
"

echo ""
echo "============================================"
echo "数据增强完成！"
echo "============================================"
echo ""
echo "数据来源说明:"
echo "  - FDA 510(k) Database (美国政府官方)"
echo "  - EUDAMED (欧盟官方)"
echo "  - NMPA (中国国家药监局)"
echo "  - CE Certificate Database (欧盟认证)"
echo "  - ISO Certification Bodies (国际标准化组织)"
echo "  - Company Official Website (企业官网)"
echo ""
echo "数据可信度:"
echo "  - 政府官方数据: 高 (High)"
echo "  - 行业认证数据: 中高 (Medium-High)"
echo "  - 企业自报数据: 中 (Medium)"
echo ""
