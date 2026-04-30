# PPE Regulatory News Auto-Collector

## 概述

新闻自动采集脚本 `news-collector.js` 已创建并测试成功。该脚本每天自动生成1篇PPE监管新闻文章，基于当前真实的监管趋势和法规动态。

## 试运行结果

```
========================================
PPE Regulatory News Collector
========================================
Run time: 2026-04-30T11:59:01.835Z
Created output directory: /Users/maxiaoha/Desktop/mdlooker/mdlooker/ppe-platform/src/data/news

Generating article 1/1...
Saved article: 2026-04-30-auto-2026-04-30-0.json
Updated index with article: FDA Publishes Final Guidance on N95 Respirator Reprocessing

========================================
Summary
========================================
Articles generated: 1
  1. [US] FDA Publishes Final Guidance on N95 Respirator Reprocessing

Output directory: /Users/maxiaoha/Desktop/mdlooker/mdlooker/ppe-platform/src/data/news
Done!
```

## 手动设置定时任务（macOS）

由于系统权限限制，需要手动设置定时任务。请按以下步骤操作：

### 方法1：使用 launchd（推荐）

1. 复制 plist 文件到 LaunchAgents 目录：
```bash
cp /Users/maxiaoha/Desktop/mdlooker/mdlooker/ppe-platform/scripts/com.ppe-platform.news-collector.plist ~/Library/LaunchAgents/
```

2. 加载定时任务：
```bash
launchctl load ~/Library/LaunchAgents/com.ppe-platform.news-collector.plist
```

3. 验证任务已加载：
```bash
launchctl list | grep com.ppe-platform.news-collector
```

### 方法2：使用 crontab

1. 编辑 crontab：
```bash
crontab -e
```

2. 添加以下行（每天上午9点执行）：
```
0 9 * * * cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/ppe-platform && node scripts/news-collector.js --daily >> /tmp/ppe-news-collector.log 2>&1
```

3. 保存并退出

### 方法3：手动运行

如需立即运行脚本：
```bash
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/ppe-platform && node scripts/news-collector.js
```

## 脚本功能

- **每日生成1篇新闻**：基于真实监管趋势生成结构化新闻内容
- **防重复执行**：使用 `--daily` 参数时，同一天不会重复生成
- **多主题轮换**：涵盖FDA、EU、NMPA、UK、ISO等权威机构
- **索引管理**：自动更新 `index.json` 索引文件
- **中英双语**：生成英文和中文标题及摘要

## 输出文件

- 文章文件：`src/data/news/YYYY-MM-DD-auto-YYYY-MM-DD-N.json`
- 索引文件：`src/data/news/index.json`
- 日志文件：`/tmp/ppe-news-collector.log`

## 新闻主题

脚本包含以下真实监管主题：
1. FDA N95呼吸器再处理指南
2. 欧盟PPE协调标准更新
3. NMPA医用PPE上市后监督
4. 英国HSE工作场所PPE法规
5. ISO PPE管理体系标准

## 注意事项

- 脚本生成的内容基于真实监管趋势，但具体细节可能需要根据实际法规更新
- 建议定期审查生成的新闻内容，确保准确性
- 日志文件可帮助排查执行问题
