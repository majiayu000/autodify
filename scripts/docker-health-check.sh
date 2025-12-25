#!/bin/bash

# ============================================
# Docker 服务健康检查脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查服务健康状态
check_service() {
    local service=$1
    local container_name=$2

    echo -n "检查 $service... "

    # 检查容器是否运行
    if ! docker ps | grep -q "$container_name"; then
        echo -e "${RED}✗ 容器未运行${NC}"
        return 1
    fi

    # 检查健康状态
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    if [ "$health_status" = "healthy" ]; then
        echo -e "${GREEN}✓ 健康${NC}"
        return 0
    elif [ "$health_status" = "starting" ]; then
        echo -e "${YELLOW}⏳ 启动中${NC}"
        return 0
    elif [ "$health_status" = "none" ]; then
        # 没有健康检查，只检查运行状态
        status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✓ 运行中（无健康检查）${NC}"
            return 0
        else
            echo -e "${RED}✗ 状态: $status${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ 状态: $health_status${NC}"
        return 1
    fi
}

# 主函数
main() {
    echo "================================"
    echo "Autodify 服务健康检查"
    echo "================================"
    echo ""

    local failed=0

    # 检查 LiteLLM
    check_service "LiteLLM" "autodify-litellm" || ((failed++))

    # 检查 Server
    check_service "Server" "autodify-server" || ((failed++))

    # 检查 Web
    check_service "Web" "autodify-web" || ((failed++))

    echo ""
    echo "================================"

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}所有服务运行正常！${NC}"
        echo ""
        echo "服务访问地址:"
        echo "  - Web:     http://localhost:3000"
        echo "  - API:     http://localhost:3001"
        echo "  - LiteLLM: http://localhost:4000"
        return 0
    else
        echo -e "${RED}发现 $failed 个服务异常${NC}"
        echo ""
        echo "查看日志: docker-compose logs -f"
        return 1
    fi
}

main "$@"
