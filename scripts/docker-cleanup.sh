#!/bin/bash

# ============================================
# Docker 清理脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示帮助
show_help() {
    echo "Docker 清理工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -c, --containers        只清理容器"
    echo "  -i, --images            只清理镜像"
    echo "  -v, --volumes           只清理数据卷"
    echo "  -a, --all               清理所有资源（默认）"
    echo "  -f, --force             强制清理，不提示确认"
    echo ""
    echo "示例:"
    echo "  $0 -c                   # 只清理停止的容器"
    echo "  $0 -i                   # 只清理未使用的镜像"
    echo "  $0 -a -f                # 强制清理所有资源"
}

# 确认提示
confirm() {
    local message=$1
    if [ "$FORCE" = true ]; then
        return 0
    fi

    echo -e "${YELLOW}$message${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# 清理容器
cleanup_containers() {
    echo -e "${BLUE}清理容器...${NC}"

    # 停止所有 autodify 相关容器
    echo "停止 Autodify 容器..."
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

    # 删除停止的容器
    stopped_containers=$(docker ps -a -q -f status=exited -f status=created 2>/dev/null || true)
    if [ -n "$stopped_containers" ]; then
        echo "删除停止的容器..."
        docker rm $stopped_containers
    fi

    echo -e "${GREEN}✓ 容器清理完成${NC}"
}

# 清理镜像
cleanup_images() {
    echo -e "${BLUE}清理镜像...${NC}"

    # 删除悬空镜像
    dangling_images=$(docker images -f "dangling=true" -q 2>/dev/null || true)
    if [ -n "$dangling_images" ]; then
        echo "删除悬空镜像..."
        docker rmi $dangling_images
    fi

    # 删除未使用的镜像
    if confirm "是否删除所有未使用的镜像？"; then
        docker image prune -a -f
    fi

    echo -e "${GREEN}✓ 镜像清理完成${NC}"
}

# 清理数据卷
cleanup_volumes() {
    echo -e "${BLUE}清理数据卷...${NC}"

    if confirm "警告：这将删除所有未使用的数据卷，包括数据库数据！"; then
        docker volume prune -f
        echo -e "${GREEN}✓ 数据卷清理完成${NC}"
    else
        echo "跳过数据卷清理"
    fi
}

# 清理网络
cleanup_networks() {
    echo -e "${BLUE}清理网络...${NC}"
    docker network prune -f
    echo -e "${GREEN}✓ 网络清理完成${NC}"
}

# 清理构建缓存
cleanup_build_cache() {
    echo -e "${BLUE}清理构建缓存...${NC}"

    if confirm "是否清理 Docker 构建缓存？"; then
        docker builder prune -f
        echo -e "${GREEN}✓ 构建缓存清理完成${NC}"
    else
        echo "跳过构建缓存清理"
    fi
}

# 显示磁盘使用情况
show_disk_usage() {
    echo ""
    echo "================================"
    echo "Docker 磁盘使用情况"
    echo "================================"
    docker system df
    echo ""
}

# 主函数
main() {
    local CLEAN_CONTAINERS=false
    local CLEAN_IMAGES=false
    local CLEAN_VOLUMES=false
    local CLEAN_ALL=false
    local FORCE=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--containers)
                CLEAN_CONTAINERS=true
                shift
                ;;
            -i|--images)
                CLEAN_IMAGES=true
                shift
                ;;
            -v|--volumes)
                CLEAN_VOLUMES=true
                shift
                ;;
            -a|--all)
                CLEAN_ALL=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 如果没有指定任何选项，默认清理所有
    if [ "$CLEAN_CONTAINERS" = false ] && [ "$CLEAN_IMAGES" = false ] && \
       [ "$CLEAN_VOLUMES" = false ] && [ "$CLEAN_ALL" = false ]; then
        CLEAN_ALL=true
    fi

    echo "================================"
    echo "Autodify Docker 清理工具"
    echo "================================"
    echo ""

    # 显示清理前的磁盘使用
    show_disk_usage

    # 执行清理
    if [ "$CLEAN_CONTAINERS" = true ] || [ "$CLEAN_ALL" = true ]; then
        cleanup_containers
    fi

    if [ "$CLEAN_IMAGES" = true ] || [ "$CLEAN_ALL" = true ]; then
        cleanup_images
    fi

    if [ "$CLEAN_VOLUMES" = true ] || [ "$CLEAN_ALL" = true ]; then
        cleanup_volumes
    fi

    if [ "$CLEAN_ALL" = true ]; then
        cleanup_networks
        cleanup_build_cache
    fi

    # 显示清理后的磁盘使用
    echo ""
    echo "清理完成！"
    show_disk_usage

    echo -e "${GREEN}所有清理操作已完成！${NC}"
}

main "$@"
