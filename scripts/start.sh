#!/bin/bash

# ============================================
# Autodify 快速启动脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 显示 Logo
show_logo() {
    echo -e "${CYAN}"
    cat << "EOF"
    ___         __           ___  _  ____
   / _ | __ __ / /_ ___  ___/ (_)/ _/ _ \
  / __ |/ // // __// _ \/ _  / // _/ // /
 /_/ |_|\_,_/ \__/ \___/\_,_/_//_/ \_, /
                                   /___/
EOF
    echo -e "${NC}"
    echo -e "${BLUE}自动化 Dify 工作流生成工具${NC}"
    echo ""
}

# 检查依赖
check_dependencies() {
    echo "检查依赖..."

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未安装 Docker${NC}"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}错误: 未安装 Docker Compose${NC}"
        echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # 检查 Docker 是否运行
    if ! docker info &> /dev/null; then
        echo -e "${RED}错误: Docker 未运行${NC}"
        echo "请先启动 Docker"
        exit 1
    fi

    echo -e "${GREEN}✓ 依赖检查通过${NC}"
    echo ""
}

# 检查环境变量
check_env() {
    echo "检查环境配置..."

    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}未找到 .env 文件，从模板创建...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}请编辑 .env 文件，配置必要的 API 密钥${NC}"
        echo ""
        read -p "是否现在编辑? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-vim} .env
        else
            echo -e "${YELLOW}提醒: 使用前请配置 .env 文件中的 API 密钥${NC}"
        fi
    fi

    echo -e "${GREEN}✓ 环境配置检查完成${NC}"
    echo ""
}

# 选择启动模式
select_mode() {
    echo "请选择启动模式:"
    echo "  1) 开发模式 (仅 LiteLLM，本地运行应用)"
    echo "  2) 完整开发环境 (LiteLLM + PostgreSQL + Redis)"
    echo "  3) 生产环境 (完整 Docker 部署)"
    echo "  4) 默认模式 (快速启动)"
    echo ""
    read -p "选择 (1-4): " -n 1 -r MODE
    echo ""

    case $MODE in
        1)
            start_dev_mode
            ;;
        2)
            start_dev_full
            ;;
        3)
            start_prod_mode
            ;;
        4)
            start_default_mode
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
}

# 开发模式
start_dev_mode() {
    echo -e "${BLUE}启动开发模式...${NC}"
    docker-compose -f docker-compose.dev.yml up litellm -d

    echo ""
    echo -e "${GREEN}✓ LiteLLM 已启动${NC}"
    echo ""
    echo "后续步骤:"
    echo "  1. 在另一个终端运行: pnpm dev"
    echo "  2. 访问 Web: http://localhost:5173"
    echo "  3. API 文档: http://localhost:3001/docs"
    echo ""
}

# 完整开发环境
start_dev_full() {
    echo -e "${BLUE}启动完整开发环境...${NC}"
    docker-compose -f docker-compose.dev.yml up -d

    echo ""
    echo "等待服务启动..."
    sleep 5

    # 健康检查
    if [ -f "scripts/docker-health-check.sh" ]; then
        bash scripts/docker-health-check.sh
    fi

    echo ""
    echo -e "${GREEN}✓ 开发环境已启动${NC}"
    echo ""
    echo "服务访问:"
    echo "  - LiteLLM:    http://localhost:4000"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis:      localhost:6379"
    echo ""
    echo "后续步骤:"
    echo "  1. 在另一个终端运行: pnpm dev"
    echo ""
}

# 生产环境
start_prod_mode() {
    echo -e "${BLUE}启动生产环境...${NC}"

    # 检查生产环境配置
    if [ ! -f ".env.prod" ]; then
        echo -e "${YELLOW}未找到 .env.prod 文件${NC}"
        read -p "是否从模板创建? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .env.prod.example .env.prod
            echo -e "${YELLOW}请编辑 .env.prod 文件，配置生产环境密钥${NC}"
            ${EDITOR:-vim} .env.prod
        else
            exit 1
        fi
    fi

    # 构建镜像
    echo "构建 Docker 镜像..."
    DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml build

    # 启动服务
    echo "启动服务..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

    echo ""
    echo "等待服务启动..."
    sleep 10

    # 健康检查
    if [ -f "scripts/docker-health-check.sh" ]; then
        bash scripts/docker-health-check.sh
    fi

    echo ""
    echo -e "${GREEN}✓ 生产环境已启动${NC}"
    echo ""
    echo "服务访问:"
    echo "  - Web: http://localhost"
    echo "  - API: http://localhost/api"
    echo ""
}

# 默认模式
start_default_mode() {
    echo -e "${BLUE}启动默认模式...${NC}"
    docker-compose up -d

    echo ""
    echo "等待服务启动..."
    sleep 10

    # 健康检查
    if [ -f "scripts/docker-health-check.sh" ]; then
        bash scripts/docker-health-check.sh
    fi

    echo ""
    echo -e "${GREEN}✓ 服务已启动${NC}"
    echo ""
}

# 显示帮助
show_help() {
    echo "Autodify 快速启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -d, --dev           开发模式（仅 LiteLLM）"
    echo "  -f, --full          完整开发环境"
    echo "  -p, --prod          生产环境"
    echo "  -i, --interactive   交互式选择模式（默认）"
    echo ""
}

# 主函数
main() {
    show_logo

    # 解析参数
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev)
            check_dependencies
            check_env
            start_dev_mode
            ;;
        -f|--full)
            check_dependencies
            check_env
            start_dev_full
            ;;
        -p|--prod)
            check_dependencies
            check_env
            start_prod_mode
            ;;
        -i|--interactive|"")
            check_dependencies
            check_env
            select_mode
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac

    echo ""
    echo -e "${CYAN}有用的命令:${NC}"
    echo "  查看日志:   docker-compose logs -f"
    echo "  停止服务:   docker-compose down"
    echo "  监控状态:   bash scripts/docker-monitor.sh -w"
    echo "  健康检查:   bash scripts/docker-health-check.sh"
    echo ""
}

main "$@"
