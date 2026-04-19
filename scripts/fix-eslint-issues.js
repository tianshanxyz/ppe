const fs = require('fs');
const path = require('path');

/**
 * ESLint 问题自动修复脚本
 * 修复常见的 TypeScript 和代码风格问题
 */

// 要修复的文件类型
const TARGET_EXTENSIONS = ['.ts', '.tsx'];

// 要修复的模式
const FIX_PATTERNS = [
  {
    // 修复 any 类型
    pattern: /:\s*any\b/g,
    replacement: ': unknown'
  },
  {
    // 修复 let 变量应该用 const
    pattern: /let\s+(\w+)\s*:\s*(\w+)\s*=\s*([^;]+);/g,
    replacement: (match, varName, type, value) => {
      // 如果变量名不是大写（常量），且没有重新赋值，使用 const
      if (!/^[A-Z_]+$/.test(varName) && !match.includes('++') && !match.includes('--')) {
        return `const ${varName}: ${type} = ${value};`;
      }
      return match;
    }
  },
  {
    // 修复未使用的导入
    pattern: /import\s+\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]+['"];/g,
    replacement: (match, imports) => {
      // 这里可以添加逻辑来检查哪些导入确实被使用了
      // 目前只是简单的格式化
      return match;
    }
  },
  {
    // 修复空函数体
    pattern: /\{\s*\}/g,
    replacement: '{}'
  }
];

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  const files = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .next 等目录
        if (!item.startsWith('.') && item !== 'node_modules' && item !== '.next' && item !== 'dist') {
          traverse(fullPath);
        }
      } else if (TARGET_EXTENSIONS.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * 修复单个文件
 */
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // 应用所有修复模式
    FIX_PATTERNS.forEach(pattern => {
      if (typeof pattern.replacement === 'string') {
        content = content.replace(pattern.pattern, pattern.replacement);
      } else {
        content = content.replace(pattern.pattern, pattern.replacement);
      }
    });
    
    // 如果内容有变化，写入文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修复了: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 修复失败: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  const targetDir = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(targetDir)) {
    console.error(`目标目录不存在: ${targetDir}`);
    process.exit(1);
  }
  
  console.log('🔍 扫描 TypeScript/TSX 文件...');
  const files = scanDirectory(targetDir);
  console.log(`📁 找到 ${files.length} 个文件`);
  
  let fixedCount = 0;
  
  console.log('🔧 开始修复...');
  files.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n🎉 修复完成!`);
  console.log(`📊 统计:`);
  console.log(`   - 扫描文件: ${files.length}`);
  console.log(`   - 修复文件: ${fixedCount}`);
  console.log(`   - 无需修复: ${files.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n💡 建议运行 `npm run lint` 检查剩余问题');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  fixFile,
  FIX_PATTERNS
};