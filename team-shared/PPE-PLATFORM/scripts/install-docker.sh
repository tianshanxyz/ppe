#!/bin/bash
# Docker Desktop 国内镜像快速安装脚本
# 适用于 macOS 系统
# 创建日期：2026-04-18

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统
check_system() {
    print_info "检查系统环境..."
    
    # 检查 macOS 版本
    MACOS_VERSION=$(sw_vers -productVersion)
    print_info "macOS 版本：$MACOS_VERSION"
    
    # 检查架构
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        print_info "检测到 Apple Silicon (M1/M2) 芯片"
        DOCKER_ARCH="aarch64"
    else
        print_info "检测到 Intel 芯片"
        DOCKER_ARCH="x86_64"
    fi
    
    # 检查磁盘空间
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
    print_info "开始下载 Docker Desktop..."
    
    # 国内镜像源列表
    MIRROR_URL="https://download.docker.com/mac/stable/Docker.dmg"
    ALIYUN_MIRROR="https://mirrors.aliyun.com/docker-ce/mac/stable/Docker.dmg"
    TENCENT_MIRROR="https://mirrors.cloud.tencent.com/docker-ce/mac/stable/Docker.dmg"
    
    # 下载目录
    DOWNLOAD_DIR="$HOME/Downloads"
    DMG_FILE="$DOWNLOAD_DIR/Docker.dmg"
    
    # 尝试下载
    print_info "使用官方源下载..."
    if curl -L --progress-bar -o "$DMG_FILE" "$MIRROR_URL" 2>/dev/null; then
        print_success "下载成功！"
    else
        print_warning "官方源下载失败，尝试阿里云镜像..."
        if curl -L --progress-bar -o "$DMG_FILE" "$ALIYUN_MIRROR" 2>/dev/null; then
            print_success "阿里云镜像下载成功！"
        else
            print_warning "阿里云镜像下载失败，尝试腾讯云镜像..."
            if curl -L --progress-bar -o "$DMG_FILE" "$TENCENT_MIRROR" 2>/dev/null; then
                print_success "腾讯云镜像下载成功！"
            else
                print_error "所有镜像源下载失败"
                print_info "请手动下载：https://desktop.docker.com/mac/main/amd64/Docker.dmg"
                exit 1
            fi
        fi
    fi
    
    # 验证文件大小
    FILE_SIZE=$(ls -lh "$DMG_FILE" | awk '{print $5}')
    print_info "下载文件大小：$FILE_SIZE"
}

# 安装 Docker
install_docker() {
    print_info "开始安装 Docker Desktop..."
    
    # 挂载 DMG
    print_info "挂载 DMG 文件..."
    MOUNT_POINT=$(hdiutil attach "$DMG_FILE" -mountpoint "/Volumes/Docker" | grep "/Volumes/Docker" | awk '{print $3}')
    
    if [ -z "$MOUNT_POINT" ]; then
        MOUNT_POINT="/Volumes/Docker"
    fi
    
    print_info "挂载点：$MOUNT_POINT"
    
    # 复制应用到应用程序目录
    print_info "复制 Docker.app 到应用程序目录..."
    if [ -d "/Applications/Docker.app" ]; then
        print_warning "已存在 Docker.app，正在覆盖..."
        sudo rm -rf "/Applications/Docker.app"
    fi
    
    sudo cp -R "$MOUNT_POINT/Docker.app" /Applications/
    
    # 卸载 DMG
    print_info "卸载 DMG..."
    hdiutil detach "$MOUNT_POINT" || true
    
    # 清理下载文件
    read -p "是否保留安装包？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "清理安装包..."
        rm -f "$DMG_FILE"
    fi
    
    print_success "Docker Desktop 安装完成！"
}

# 配置环境变量
configure_environment() {
    print_info "配置环境变量..."
    
    # 添加 Docker 到 PATH
    DOCKER_PATH="/Applications/Docker.app/Contents/Resources/bin"
    if ! echo "$PATH" | grep -q "$DOCKER_PATH"; then
        print_info "添加 Docker 到 PATH..."
        echo "" >> ~/.zshrc
        echo "# Docker Desktop" >> ~/.zshrc
        echo "export PATH=\"$DOCKER_PATH:\$PATH\"" >> ~/.zshrc
        source ~/.zshrc
        print_success "PATH 配置完成"
    else
        print_info "Docker 已在 PATH 中"
    fi
}

# 验证安装
verify_installation() {
    print_info "验证 Docker 安装..."
    
    # 启动 Docker
    print_info "启动 Docker Desktop..."
    open -a Docker
    
    print_info "等待 Docker 启动（约 30-60 秒）..."
    for i in {1..30}; do
        if docker info &> /dev/null; then
            print_success "Docker 启动成功！"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo
    
    # 检查 Docker 版本
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        DOCKER_COMPOSE_VERSION=$(docker compose version 2>&1)
        
        print_success "Docker 版本：$DOCKER_VERSION"
        print_success "Docker Compose 版本：$DOCKER_COMPOSE_VERSION"
    else
        print_error "Docker 命令未找到，请手动启动 Docker Desktop"
        exit 1
    fi
    
    # 运行 Hello World
    print_info "运行 Hello World 测试..."
    if docker run hello-world 2>/dev/null; then
        print_success "Docker 安装验证通过！"
    else
        print_warning "Hello World 测试失败，请检查 Docker Desktop 是否正常运行"
    fi
}

# 配置镜像加速器
configure_mirror() {
    print_info "配置 Docker 镜像加速器..."
    
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
    
    print_success "镜像加速器配置完成"
    print_info "配置文件：~/.docker/daemon.json"
    print_warning "请重启 Docker Desktop 使配置生效"
}

# 主函数
main() {
    echo "========================================"
    echo "  Docker Desktop 快速安装脚本"
    echo "  适用于 macOS (国内镜像)"
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
    
    print_info "安装完成！请手动重启 Docker Desktop 使镜像配置生效"
    print_info "重启后运行以下命令验证："
    echo "  docker --version"
    echo "  docker compose version"
    echo "  docker info"
    echo
    
    print_success "🎉 Docker Desktop 安装完成！"
}

# 执行主函数
main
