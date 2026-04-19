#!/bin/bash
# Docker Desktop 国内快速安装脚本 (支持 Apple Silicon)
# 适用于 macOS Intel 和 Apple Silicon (M1/M2/M3)
# 创建日期：2026-04-18
# 更新日期：2026-04-18

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检测系统架构
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    DOCKER_ARCH="arm64"
    print_info "✅ 检测到 Apple Silicon (M1/M2/M3) 芯片"
else
    DOCKER_ARCH="amd64"
    print_info "✅ 检测到 Intel 芯片"
fi

# 检查系统
check_system() {
    print_info "检查系统环境..."
    
    # macOS 版本
    MACOS_VERSION=$(sw_vers -productVersion)
    print_info "macOS 版本：$MACOS_VERSION"
    
    # 磁盘空间
    DISK_SPACE=$(df -h / | awk 'NR==2 {print $4}')
    print_info "可用磁盘空间：$DISK_SPACE"
    
    # 检查是否已安装 Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_warning "Docker 已安装：$DOCKER_VERSION"
        read -p "是否继续安装？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
}

# 下载 Docker
download_docker() {
    print_info "开始下载 Docker Desktop ($DOCKER_ARCH)..."
    
    # 官方下载链接（根据架构）
    if [ "$DOCKER_ARCH" = "arm64" ]; then
        OFFICIAL_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    else
        OFFICIAL_URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    fi
    
    # 国内镜像
    ALIYUN_ARM64="https://mirrors.aliyun.com/docker-ce/mac/stable/Docker-aarch64.dmg"
    ALIYUN_AMD64="https://mirrors.aliyun.com/docker-ce/mac/stable/Docker-x86_64.dmg"
    
    DOWNLOAD_DIR="$HOME/Downloads"
    DMG_FILE="$DOWNLOAD_DIR/Docker.dmg"
    
    # 尝试下载
    print_info "使用官方源下载..."
    if curl -L --progress-bar -o "$DMG_FILE" "$OFFICIAL_URL" 2>/dev/null; then
        print_success "下载成功！"
    else
        print_warning "官方源下载失败，尝试阿里云镜像..."
        if [ "$DOCKER_ARCH" = "arm64" ]; then
            MIRROR_URL="$ALIYUN_ARM64"
        else
            MIRROR_URL="$ALIYUN_AMD64"
        fi
        
        if curl -L --progress-bar -o "$DMG_FILE" "$MIRROR_URL" 2>/dev/null; then
            print_success "阿里云镜像下载成功！"
        else
            print_error "所有镜像源下载失败"
            print_info "请手动下载：$OFFICIAL_URL"
            exit 1
        fi
    fi
    
    # 验证文件大小（应该在 500MB 左右）
    FILE_SIZE=$(ls -lh "$DMG_FILE" | awk '{print $5}')
    print_info "下载文件大小：$FILE_SIZE"
    
    # 检查文件大小是否合理（至少 100MB）
    FILE_SIZE_BYTES=$(stat -f%z "$DMG_FILE" 2>/dev/null)
    if [ "$FILE_SIZE_BYTES" -lt 104857600 ]; then
        print_error "文件过小，下载可能失败"
        exit 1
    fi
}

# 安装 Docker
install_docker() {
    print_info "开始安装 Docker Desktop..."
    
    # 检查是否已挂载
    if [ -d "/Volumes/Docker" ]; then
        print_info "卸载已挂载的卷..."
        hdiutil detach "/Volumes/Docker" || true
    fi
    
    # 挂载 DMG
    print_info "挂载 DMG 文件..."
    hdiutil attach "$DMG_FILE" -mountpoint "/Volumes/Docker" -quiet || {
        print_error "挂载 DMG 失败"
        exit 1
    }
    
    # 复制应用
    print_info "复制 Docker.app 到应用程序目录..."
    if [ -d "/Applications/Docker.app" ]; then
        print_warning "已存在 Docker.app，正在覆盖..."
        sudo rm -rf "/Applications/Docker.app"
    fi
    
    sudo cp -R "/Volumes/Docker/Docker.app" /Applications/
    
    # 卸载 DMG
    print_info "卸载 DMG..."
    hdiutil detach "/Volumes/Docker" -quiet || true
    
    print_success "Docker Desktop 安装完成！"
}

# 配置环境变量
configure_environment() {
    print_info "配置环境变量..."
    
    DOCKER_PATH="/Applications/Docker.app/Contents/Resources/bin"
    if ! echo "$PATH" | grep -q "$DOCKER_PATH"; then
        echo "" >> ~/.zshrc
        echo "# Docker Desktop" >> ~/.zshrc
        echo "export PATH=\"$DOCKER_PATH:\$PATH\"" >> ~/.zshrc
        source ~/.zshrc
        print_success "PATH 配置完成"
    fi
}

# 配置镜像加速器
configure_mirror() {
    print_info "配置 Docker 镜像加速器..."
    
    mkdir -p ~/.docker
    
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
    
    print_success "镜像加速器配置完成"
    print_info "配置文件：~/.docker/daemon.json"
    print_warning "请重启 Docker Desktop 使配置生效"
}

# 验证安装
verify_installation() {
    print_info "验证 Docker 安装..."
    
    print_info "启动 Docker Desktop..."
    open -a Docker
    
    print_info "等待 Docker 启动（最多 60 秒）..."
    for i in {1..30}; do
        if docker info &> /dev/null; then
            print_success "Docker 启动成功！"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        DOCKER_COMPOSE_VERSION=$(docker compose version 2>&1)
        
        print_success "Docker 版本：$DOCKER_VERSION"
        print_success "Docker Compose 版本：$DOCKER_COMPOSE_VERSION"
        
        # 检查架构
        if [ "$DOCKER_ARCH" = "arm64" ]; then
            print_success "✅ Apple Silicon 优化版本"
        fi
    else
        print_error "Docker 命令未找到"
        exit 1
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "  Docker Desktop 快速安装脚本"
    echo "  支持：Intel 和 Apple Silicon (M1/M2/M3)"
    echo "  架构：$DOCKER_ARCH"
    echo "========================================"
    echo
    
    check_system
    echo
    
    download_docker
    echo
    
    install_docker
    echo
    
    configure_environment
    echo
    
    configure_mirror
    echo
    
    verify_installation
    echo
    
    print_success "🎉 Docker Desktop 安装完成！"
    print_info "下一步："
    echo "  1. 重启 Docker Desktop"
    echo "  2. 运行：docker --version"
    echo "  3. 运行：docker compose version"
    echo "  4. 运行：docker run hello-world"
}

# 执行
main
