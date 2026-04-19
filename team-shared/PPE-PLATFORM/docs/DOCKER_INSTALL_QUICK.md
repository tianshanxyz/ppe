# Docker Desktop 国内快速安装指南

**适用系统**: macOS  
**创建日期**: 2026-04-18  
**安装方式**: 国内镜像下载

---

## 🚀 快速安装（推荐）

### 方式一：使用自动化安装脚本 ⭐

**最简单的方式，一键安装！**

#### 步骤 1: 运行安装脚本

```bash
# 进入脚本目录
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM/scripts

# 运行安装脚本
./install-docker.sh
```

**脚本功能**:
- ✅ 自动检测系统环境
- ✅ 自动选择最快的镜像源
- ✅ 自动下载和安装 Docker
- ✅ 自动配置环境变量
- ✅ 自动配置镜像加速器
- ✅ 自动验证安装

#### 步骤 2: 等待安装完成

脚本会自动完成以下操作：
1. 下载 Docker Desktop（约 500MB）
2. 安装到应用程序目录
3. 配置环境变量
4. 配置镜像加速器

#### 步骤 3: 重启 Docker

```bash
# 重启 Docker Desktop
# 点击菜单栏 Docker 图标 -> Quit Docker Desktop
# 重新打开 Docker.app

# 或者在终端运行
open -a Docker
```

---

### 方式二：手动下载安装

**如果脚本安装失败，使用此方式**

#### 步骤 1: 下载 Docker Desktop

**使用国内镜像源下载**（选择一个即可）：

**镜像源 1 - DaoCloud**:
```bash
curl -L https://docker.m.daocloud.io/docker-ce/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg
```

**镜像源 2 - 1Panel**:
```bash
curl -L https://docker.1panel.live/docker-ce/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg
```

**镜像源 3 - 官方 CDN**:
```bash
curl -L https://download.docker.com/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg
```

**备用方案 - 浏览器下载**:
如果 curl 下载失败，请使用浏览器访问：
- https://docker.m.daocloud.io/docker-ce/mac/stable/Docker.dmg
- 或 https://desktop.docker.com/mac/main/amd64/Docker.dmg

#### 步骤 2: 安装 Docker

```bash
# 1. 打开下载的 DMG 文件
open ~/Downloads/Docker.dmg

# 2. 在弹出的窗口中：
#    - 将 Docker.app 拖拽到「应用程序」文件夹
#    - 或者手动复制：
cp -R /Volumes/Docker/Docker.app /Applications/
```

#### 步骤 3: 启动 Docker

```bash
# 启动 Docker Desktop
open -a Docker

# 首次启动需要等待 2-3 分钟
# 菜单栏会出现 Docker 图标
# 等待图标停止旋转表示启动完成
```

---

## ⚙️ 配置镜像加速器

由于 Docker Hub 在国内访问较慢，**必须配置镜像加速器**。

### 方式一：配置文件（推荐）

```bash
# 创建配置目录
mkdir -p ~/.docker

# 创建配置文件
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://dhub.kubesre.xyz"
  ]
}
EOF

# 重启 Docker Desktop
# 点击菜单栏 Docker 图标 -> Quit Docker Desktop
# 重新打开 Docker.app
```

### 方式二：通过 Docker Desktop 界面

1. 点击菜单栏 Docker 图标
2. 选择 "Preferences" 或 "Settings"
3. 进入 "Docker Engine" 选项卡
4. 在右侧编辑框中添加：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://dhub.kubesre.xyz"
  ]
}
```

5. 点击 "Apply & Restart"

---

## ✅ 验证安装

### 1. 检查 Docker 版本

```bash
docker --version
```

**预期输出**:
```
Docker version 24.0.x, build xxxxxxx
```

### 2. 检查 Docker Compose 版本

```bash
docker compose version
```

**预期输出**:
```
Docker Compose version v2.20.x
```

### 3. 检查 Docker 信息

```bash
docker info
```

**预期输出**:
```
Client:
 Version:    24.0.x
 Context:    desktop-linux
 Debug Mode: false

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 0
 Server Version: 24.0.x
 Storage Driver: overlay2
...
```

### 4. 运行 Hello World 测试

```bash
docker run hello-world
```

**预期输出**:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

## ⚠️ 常见问题

### Q1: 下载速度慢

**解决方案**:
```bash
# 尝试不同的镜像源
# 镜像源 1
curl -L https://docker.m.daocloud.io/docker-ce/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg

# 镜像源 2
curl -L https://docker.1panel.live/docker-ce/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg

# 镜像源 3
curl -L https://download.docker.com/mac/stable/Docker.dmg -o ~/Downloads/Docker.dmg
```

### Q2: 安装后 Docker 命令未找到

**解决方案**:
```bash
# 添加 Docker 到 PATH
echo 'export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 验证
docker --version
```

### Q3: Docker Desktop 启动失败

**解决方案**:
```bash
# 重置 Docker
rm -rf ~/Library/Containers/com.docker.docker

# 重启 Docker Desktop
open -a Docker
```

### Q4: 镜像拉取失败

**解决方案**:
```bash
# 检查镜像加速器配置
cat ~/.docker/daemon.json

# 确保配置了多个镜像源
# 重启 Docker Desktop
```

### Q5: 磁盘空间不足

**解决方案**:
```bash
# 检查磁盘空间
df -h

# 清理 Docker 缓存
docker system prune -a

# 在 Docker Desktop 设置中调整磁盘大小限制
```

---

## 📊 安装检查清单

### 安装前检查
- [ ] macOS 版本 >= 11.0
- [ ] 至少 4GB 可用内存
- [ ] 至少 10GB 可用磁盘空间
- [ ] 网络连接正常

### 安装后验证
- [ ] Docker Desktop 已启动
- [ ] `docker --version` 正常输出
- [ ] `docker compose version` 正常输出
- [ ] `docker run hello-world` 成功运行
- [ ] `docker info` 显示正常信息
- [ ] 镜像加速器已配置

---

## 🔧 优化建议

### 1. 限制资源使用

在 Docker Desktop 设置中：
1. 点击菜单栏 Docker 图标
2. 选择 "Preferences" 或 "Settings"
3. 进入 "Resources" 选项卡
4. 调整配置：

**推荐配置**:
- CPU: 2-4 核
- Memory: 2-4 GB
- Disk: 50-100 GB

### 2. 配置数据卷路径

在 Docker Desktop 设置中：
1. 进入 "General" 选项卡
2. 添加允许挂载的路径：
   - `/Users`
   - `/tmp`
   - `/Volumes`
3. 点击 "Apply & Restart"

### 3. 启用 Kubernetes（可选）

如果需要运行 Kubernetes：
1. 打开 Docker Desktop 设置
2. 进入 "Kubernetes" 选项卡
3. 勾选 "Enable Kubernetes"
4. 点击 "Apply & Restart"

---

## 📞 故障排查

### 查看 Docker 日志

```bash
# Docker Desktop 日志
tail -f ~/Library/Containers/com.docker.docker/Data/log/vm/*.log

# Docker 引擎日志
docker logs
```

### 使用诊断工具

1. 点击菜单栏 Docker 图标
2. 选择 "Troubleshoot"
3. 点击 "Diagnose"
4. 等待诊断完成
5. 查看诊断报告

### 完全重置 Docker

```bash
# 停止 Docker
osascript -e 'quit app "Docker"'

# 删除所有 Docker 数据
rm -rf ~/Library/Containers/com.docker.docker
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/.docker

# 重新安装
# 重复上述安装步骤
```

---

## 🔗 相关链接

- **Docker 官网**: https://www.docker.com/
- **Docker Desktop 下载**: https://www.docker.com/products/docker-desktop/
- **Docker 文档**: https://docs.docker.com/
- **Docker Hub**: https://hub.docker.com/
- **DaoCloud 镜像**: https://qiniu-download-public.daocloud.io/DaoCloud_Enterprise/daccelerator
- **1Panel 镜像**: https://1panel.cn/docs/

---

## 📝 安装记录

**安装日期**: 2026-04-18  
**安装方式**: 国内镜像下载  
**系统版本**: macOS 26.2  
**安装状态**: ⏳ 进行中

**下一步**:
1. ✅ 选择安装方式
2. ⏳ 执行下载和安装
3. ⏳ 配置镜像加速器
4. ⏳ 验证安装成功
5. ⏳ 启动基础服务容器

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-04-18  
**维护人**: Maxiao

---

*按照本指南完成 Docker Desktop 安装后，即可继续执行 OP-001 任务的下一步：启动基础服务容器！* 🚀
