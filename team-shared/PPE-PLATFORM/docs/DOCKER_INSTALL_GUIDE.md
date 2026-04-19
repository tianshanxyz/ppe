# Docker Desktop 安装指南 - macOS

**系统版本**: macOS 26.2  
**安装日期**: 2026-04-18  
**安装负责人**: Maxiao

---

## 📋 安装方式选择

### 方式一：Homebrew 安装（推荐）⭐

**优点**:
- ✅ 自动化安装，无需手动操作
- ✅ 自动处理依赖
- ✅ 方便后续更新

**安装命令**:
```bash
brew install --cask docker
```

### 方式二：官网下载安装

**优点**:
- ✅ 官方最新版本
- ✅ 可视化安装界面

**下载地址**: https://www.docker.com/products/docker-desktop/

---

## 🚀 安装步骤

### 方式一：Homebrew 安装

#### Step 1: 确认 Homebrew 已安装

```bash
brew --version
```

**预期输出**:
```
Homebrew 5.0.12
```

#### Step 2: 安装 Docker Desktop

```bash
brew install --cask docker
```

**安装过程**:
```
==> Tapping homebrew/cask
Cloning into '/opt/homebrew/Library/Taps/homebrew/homebrew-cask'...
==> Downloading Docker Desktop
==> Installing Cask docker
==> Moving App 'Docker.app' to '/Applications/Docker.app'
🍺  docker was successfully installed!
```

**预计时间**: 5-10 分钟（取决于网络速度）

#### Step 3: 启动 Docker Desktop

```bash
open -a Docker
```

或者在「应用程序」中找到 Docker.app 并双击启动。

#### Step 4: 等待 Docker 启动完成

- Docker 图标会出现在菜单栏
- 首次启动需要 2-3 分钟
- 等待图标停止旋转

#### Step 5: 验证安装

```bash
docker --version
docker compose version
```

**预期输出**:
```
Docker version 24.0.x, build xxxxxxx
Docker Compose version v2.20.x
```

---

### 方式二：官网下载安装

#### Step 1: 下载 Docker Desktop

访问：https://www.docker.com/products/docker-desktop/

点击 "Download for Mac" 按钮。

#### Step 2: 安装 Docker

1. 打开下载的 `.dmg` 文件
2. 将 Docker.app 拖拽到「应用程序」文件夹
3. 双击 Docker.app 启动

#### Step 3: 首次启动配置

1. 点击 "Open" 确认启动
2. 同意服务条款
3. 等待 Docker 引擎初始化（2-3 分钟）
4. 看到 "Docker Desktop is now running" 提示

#### Step 4: 验证安装

打开终端，运行：
```bash
docker --version
docker compose version
```

---

## ⚙️ 配置镜像加速器（中国大陆）

由于 Docker Hub 在国内访问较慢，建议配置镜像加速器。

### 方式一：通过 Docker Desktop 界面配置

1. 点击菜单栏 Docker 图标
2. 选择 "Preferences" 或 "Settings"
3. 进入 "Docker Engine" 选项卡
4. 在 `daemon` 配置中添加：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.docker-cn.com"
  ]
}
```

5. 点击 "Apply & Restart"

### 方式二：通过配置文件

```bash
# 创建配置文件
mkdir -p ~/.docker
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.docker-cn.com"
  ]
}
EOF

# 重启 Docker Desktop
```

---

## ✅ 验证安装

### 1. 检查 Docker 版本

```bash
docker --version
```

**预期**: `Docker version 24.0.x, build xxxxxxx`

### 2. 检查 Docker Compose 版本

```bash
docker compose version
```

**预期**: `Docker Compose version v2.20.x`

### 3. 运行 Hello World

```bash
docker run hello-world
```

**预期输出**:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### 4. 检查 Docker 信息

```bash
docker info
```

**预期**: 显示 Docker 系统信息，包括：
- Containers: 0
- Images: 0
- Server Version: 24.0.x
- Storage Driver: overlay2

### 5. 检查 Docker 状态

```bash
# 检查 Docker 进程
ps aux | grep docker

# 检查 Docker 套接字
ls -l /var/run/docker.sock
```

---

## ⚠️ 常见问题

### Q1: 安装失败 "Permission denied"

**解决方案**:
```bash
# 修复 Homebrew 权限
sudo chown -R $(whoami) /opt/homebrew/Library/Taps/homebrew/homebrew-cask

# 重新安装
brew install --cask docker
```

### Q2: Docker Desktop 启动失败

**解决方案**:
```bash
# 重置 Docker
rm -rf ~/Library/Containers/com.docker.docker

# 重启 Docker Desktop
open -a Docker
```

### Q3: Docker 命令未找到

**解决方案**:
```bash
# 检查 PATH
echo $PATH

# 添加 Docker 到 PATH（如果需要）
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# 添加到 ~/.zshrc
echo 'export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Q4: 镜像拉取失败

**解决方案**:
```bash
# 配置镜像加速器（见上文）

# 或者手动指定镜像源
docker pull docker.m.daocloud.io/hello-world
```

### Q5: Docker Desktop 占用过多资源

**解决方案**:
1. 打开 Docker Desktop 设置
2. 进入 "Resources" 选项卡
3. 调整 CPU、Memory、Disk 限制
4. 点击 "Apply & Restart"

**推荐配置**（根据机器配置）:
- CPU: 2-4 核
- Memory: 2-4 GB
- Disk: 50-100 GB

---

## 🔧 优化建议

### 1. 配置镜像加速器（必须）

参考上文「配置镜像加速器」章节。

### 2. 限制资源使用

在 Docker Desktop 设置中：
- CPU: 不超过 4 核
- Memory: 不超过 4GB
- Disk: 根据需求设置

### 3. 启用 Kubernetes（可选）

如果需要运行 Kubernetes：
1. 打开 Docker Desktop 设置
2. 进入 "Kubernetes" 选项卡
3. 勾选 "Enable Kubernetes"
4. 点击 "Apply & Restart"

### 4. 配置数据卷路径

在 Docker Desktop 设置中：
1. 进入 "General" 选项卡
2. 添加允许挂载的路径
3. 点击 "Apply & Restart"

---

## 📊 安装检查清单

### 安装前检查
- [ ] macOS 版本 >= 11.0
- [ ] 至少 4GB 可用内存
- [ ] 至少 10GB 可用磁盘空间
- [ ] Homebrew 已安装（方式一）

### 安装后验证
- [ ] Docker Desktop 已启动
- [ ] `docker --version` 正常输出
- [ ] `docker compose version` 正常输出
- [ ] `docker run hello-world` 成功运行
- [ ] `docker info` 显示正常信息
- [ ] 镜像加速器已配置

### 环境准备
- [ ] Docker 版本 >= 24.0
- [ ] Docker Compose 版本 >= 2.20
- [ ] 镜像加速器已配置
- [ ] 资源限制已设置

---

## 📞 故障排查

### 日志查看

```bash
# Docker Desktop 日志
tail -f ~/Library/Containers/com.docker.docker/Data/log/vm/*.log

# Docker 引擎日志
docker logs
```

### 诊断工具

1. 点击菜单栏 Docker 图标
2. 选择 "Troubleshoot"
3. 点击 "Diagnose"
4. 等待诊断完成
5. 查看诊断报告

### 重置 Docker

```bash
# 完全重置
docker compose -f docker-compose.dev.yml down -v
rm -rf ~/Library/Containers/com.docker.docker
rm -rf ~/Library/Group\ Containers/group.com.docker

# 重新安装
brew uninstall --cask docker
brew install --cask docker
```

---

## 🔗 相关链接

- **Docker 官网**: https://www.docker.com/
- **Docker Desktop 下载**: https://www.docker.com/products/docker-desktop/
- **Docker 文档**: https://docs.docker.com/
- **Docker Hub**: https://hub.docker.com/
- **Homebrew**: https://brew.sh/

---

## 📝 安装记录

**安装日期**: 2026-04-18  
**安装方式**: Homebrew  
**系统版本**: macOS 26.2  
**安装状态**: ⏳ 进行中

**下一步**:
1. ✅ 选择安装方式
2. ⏳ 执行安装命令
3. ⏳ 启动 Docker Desktop
4. ⏳ 配置镜像加速器
5. ⏳ 验证安装成功

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-04-18  
**维护人**: Maxiao

---

*按照本指南完成 Docker Desktop 安装后，即可继续执行 OP-001 任务的下一步：启动基础服务容器！* 🚀
