#!/bin/bash

# ============================================
# Docker 服务监控脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 清屏
clear

# 显示头部
show_header() {
    echo "================================"
    echo -e "${CYAN}Autodify Docker 监控面板${NC}"
    echo "================================"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# 显示服务状态
show_services() {
    echo -e "${BLUE}服务状态:${NC}"
    echo "--------------------------------"

    # 获取所有 autodify 相关容器
    containers=$(docker ps --filter "name=autodify" --format "{{.Names}}" 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        echo -e "${YELLOW}没有运行中的服务${NC}"
        return
    fi

    # 表头
    printf "%-25s %-15s %-15s %-10s\n" "容器名称" "状态" "健康状态" "运行时间"
    echo "--------------------------------------------------------------------------------"

    # 遍历容器
    while IFS= read -r container; do
        if [ -n "$container" ]; then
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "N/A")
            uptime=$(docker inspect --format='{{.State.StartedAt}}' "$container" 2>/dev/null | xargs -I {} date -jf "%Y-%m-%dT%H:%M:%S" {} "+%H:%M:%S" 2>/dev/null || echo "N/A")

            # 状态颜色
            if [ "$status" = "running" ]; then
                status_color="${GREEN}$status${NC}"
            else
                status_color="${RED}$status${NC}"
            fi

            # 健康状态颜色
            case "$health" in
                "healthy")
                    health_color="${GREEN}$health${NC}"
                    ;;
                "unhealthy")
                    health_color="${RED}$health${NC}"
                    ;;
                "starting")
                    health_color="${YELLOW}$health${NC}"
                    ;;
                *)
                    health_color="$health"
                    ;;
            esac

            printf "%-25s ${status_color} %-15s ${health_color} %-10s %s\n" \
                "$container" "" "$health" "" "$uptime"
        fi
    done <<< "$containers"

    echo ""
}

# 显示资源使用情况
show_resources() {
    echo -e "${BLUE}资源使用:${NC}"
    echo "--------------------------------"

    containers=$(docker ps --filter "name=autodify" --format "{{.Names}}" 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        return
    fi

    # 表头
    printf "%-25s %-12s %-12s %-15s %-15s\n" "容器名称" "CPU %" "内存使用" "内存限制" "网络 I/O"
    echo "--------------------------------------------------------------------------------"

    # 获取资源统计
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
        $(docker ps --filter "name=autodify" -q) 2>/dev/null | tail -n +2 | while read line; do
        echo "$line"
    done

    echo ""
}

# 显示端口映射
show_ports() {
    echo -e "${BLUE}端口映射:${NC}"
    echo "--------------------------------"

    containers=$(docker ps --filter "name=autodify" --format "{{.Names}}" 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        return
    fi

    while IFS= read -r container; do
        if [ -n "$container" ]; then
            ports=$(docker port "$container" 2>/dev/null | sed 's/^/  /')
            if [ -n "$ports" ]; then
                echo "$container:"
                echo "$ports"
            fi
        fi
    done <<< "$containers"

    echo ""
}

# 显示最近日志
show_recent_logs() {
    echo -e "${BLUE}最近日志 (最后 5 行):${NC}"
    echo "--------------------------------"

    containers=$(docker ps --filter "name=autodify" --format "{{.Names}}" 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        return
    fi

    while IFS= read -r container; do
        if [ -n "$container" ]; then
            echo -e "${CYAN}[$container]${NC}"
            docker logs --tail 5 "$container" 2>&1 | sed 's/^/  /'
            echo ""
        fi
    done <<< "$containers"
}

# 显示磁盘使用
show_disk_usage() {
    echo -e "${BLUE}Docker 磁盘使用:${NC}"
    echo "--------------------------------"
    docker system df
    echo ""
}

# 实时监控模式
watch_mode() {
    while true; do
        clear
        show_header
        show_services
        show_resources
        show_ports

        echo ""
        echo -e "${YELLOW}按 Ctrl+C 退出监控${NC}"
        sleep 5
    done
}

# 显示帮助
show_help() {
    echo "Docker 监控工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -w, --watch         实时监控模式（每 5 秒刷新）"
    echo "  -l, --logs          显示最近日志"
    echo "  -d, --disk          显示磁盘使用情况"
    echo ""
    echo "示例:"
    echo "  $0                  # 显示一次性状态报告"
    echo "  $0 -w               # 实时监控"
    echo "  $0 -l               # 显示日志"
}

# 主函数
main() {
    local WATCH_MODE=false
    local SHOW_LOGS=false
    local SHOW_DISK=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -w|--watch)
                WATCH_MODE=true
                shift
                ;;
            -l|--logs)
                SHOW_LOGS=true
                shift
                ;;
            -d|--disk)
                SHOW_DISK=true
                shift
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 检查 Docker 是否运行
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}错误: Docker 未运行${NC}"
        exit 1
    fi

    # 执行相应操作
    if [ "$WATCH_MODE" = true ]; then
        watch_mode
    else
        show_header
        show_services
        show_resources
        show_ports

        if [ "$SHOW_LOGS" = true ]; then
            show_recent_logs
        fi

        if [ "$SHOW_DISK" = true ]; then
            show_disk_usage
        fi
    fi
}

main "$@"
