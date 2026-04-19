# Docker 故障排查指南

**问题**: Docker 守护进程响应 500 错误  
**日期**: 2026-04-18  
**系统**: macOS 26.2, Apple M1

---

## 🔧 解决方案

### 方案一：完全重启 Docker（推荐）

```bash
# 1. 完全退出 Docker
osascript -e 'quit app "Docker"'

# 2. 等待 10 秒
sleep 10

# 3. 清理 Docker 运行时文件
rm -rf ~/.docker/run

# 4. 重新启动 Docker
open -a Docker

# 5. 等待 Docker 完全启动（观察菜单栏图标）
# 图标停止旋转表示启动完成
```

### 方案二：重置 Docker 数据

```bash
# 1. 退出 Docker
osascript -e 'quit app "Docker"'

# 2. 等待
sleep 5

# 3. 备份并重置 Docker 数据
mv ~/Library/Containers/com.docker.docker ~/Library/Containers/com.docker.docker.backup

# 4. 重启 Docker
open -a Docker

# 5. 等待重启完成
```

### 方案三：修复 Docker Socket

```bash
# 1. 退出 Docker
osascript -e 'quit app "Docker"'

# 2. 清理 socket 文件
rm -f ~/.docker/run/docker.sock

# 3. 重启 Docker
open -a Docker
```

---

## ✅ 验证修复

```bash
# 等待 Docker 启动完成后运行

# 检查 Docker 版本
docker --version

# 检查 Docker 信息
docker info

# 列出容器
docker ps

# 运行测试
docker run hello-world
```

---

## 📝 重启后继续安装

Docker 恢复正常后，运行：

```bash
# 进入 PPE 平台目录
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM

# 启动基础服务
docker compose -f docker-compose.dev.yml up -d

# 查看容器状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f
```

---

## ⚠️ 如果问题持续

### 检查 Docker Desktop 日志

```bash
# 查看 Docker 日志
tail -f ~/Library/Containers/com.docker.docker/Data/log/vm/*.log
```

### 使用诊断工具

1. 点击菜单栏 Docker 图标
2. 选择 "Troubleshoot"
3. 点击 "Diagnose"
4. 等待诊断完成

### 完全重装 Docker

```bash
# 1. 退出 Docker
osascript -e 'quit app "Docker"'

# 2. 卸载 Docker
sudo rm -rf /Applications/Docker.app
sudo rm -rf ~/Library/Containers/com.docker.docker
sudo rm -rf ~/Library/Group\ Containers/group.com.docker

# 3. 重新下载并安装
# 访问：https://desktop.docker.com/mac/main/arm64/Docker.dmg
```

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-04-18  
**维护人**: Maxiao
