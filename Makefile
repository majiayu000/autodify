# Autodify Docker 管理 Makefile

.PHONY: help build build-prod up up-dev up-prod down down-dev down-prod logs logs-server logs-web restart clean

# 默认目标
help:
	@echo "Autodify Docker 管理命令"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev          - 启动开发环境（仅 LiteLLM）"
	@echo "  make dev-full     - 启动完整开发环境"
	@echo "  make dev-down     - 停止开发环境"
	@echo ""
	@echo "生产环境:"
	@echo "  make build        - 构建生产镜像"
	@echo "  make up           - 启动生产环境"
	@echo "  make down         - 停止生产环境"
	@echo "  make restart      - 重启生产环境"
	@echo ""
	@echo "日志查看:"
	@echo "  make logs         - 查看所有服务日志"
	@echo "  make logs-server  - 查看 server 日志"
	@echo "  make logs-web     - 查看 web 日志"
	@echo ""
	@echo "维护:"
	@echo "  make clean        - 清理容器和镜像"
	@echo "  make clean-all    - 清理所有资源（包括数据卷）"
	@echo "  make ps           - 查看服务状态"

# ============================================
# 开发环境
# ============================================

# 启动开发环境（仅 LiteLLM）
dev:
	docker-compose -f docker-compose.dev.yml up litellm -d
	@echo "✓ LiteLLM 已启动在 http://localhost:4000"

# 启动完整开发环境
dev-full:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✓ 开发环境已启动"
	@echo "  - LiteLLM: http://localhost:4000"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"

# 停止开发环境
dev-down:
	docker-compose -f docker-compose.dev.yml down

# ============================================
# 生产环境
# ============================================

# 构建生产镜像
build:
	@echo "构建生产镜像..."
	DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml build --parallel
	@echo "✓ 镜像构建完成"

# 仅构建 server
build-server:
	DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml build autodify-server

# 仅构建 web
build-web:
	DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml build autodify-web

# 启动生产环境
up: build
	@echo "启动生产环境..."
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "✓ 生产环境已启动"
	@echo "  - Web: http://localhost"
	@echo "  - API: http://localhost/api"

# 启动默认环境
up-default:
	docker-compose up -d
	@echo "✓ 服务已启动"
	@echo "  - Web: http://localhost:3000"
	@echo "  - API: http://localhost:3001"
	@echo "  - LiteLLM: http://localhost:4000"

# 停止生产环境
down:
	docker-compose -f docker-compose.prod.yml down

# 停止默认环境
down-default:
	docker-compose down

# 重启服务
restart:
	docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
restart-server:
	docker-compose -f docker-compose.prod.yml restart autodify-server

restart-web:
	docker-compose -f docker-compose.prod.yml restart autodify-web

# ============================================
# 日志管理
# ============================================

# 查看所有日志
logs:
	docker-compose -f docker-compose.prod.yml logs -f

# 查看 server 日志
logs-server:
	docker-compose -f docker-compose.prod.yml logs -f autodify-server

# 查看 web 日志
logs-web:
	docker-compose -f docker-compose.prod.yml logs -f autodify-web

# 查看 LiteLLM 日志
logs-litellm:
	docker-compose -f docker-compose.prod.yml logs -f litellm

# ============================================
# 维护和清理
# ============================================

# 查看服务状态
ps:
	@echo "生产环境:"
	@docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "开发环境:"
	@docker-compose -f docker-compose.dev.yml ps

# 清理停止的容器
clean:
	docker-compose -f docker-compose.prod.yml down
	docker-compose -f docker-compose.dev.yml down
	docker-compose down
	@echo "✓ 容器已清理"

# 清理所有资源（包括数据卷）
clean-all:
	docker-compose -f docker-compose.prod.yml down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v
	docker system prune -f
	@echo "✓ 所有资源已清理"

# 清理未使用的镜像
clean-images:
	docker image prune -a -f
	@echo "✓ 未使用的镜像已清理"

# ============================================
# 数据库管理
# ============================================

# 备份 PostgreSQL 数据库
backup-db:
	@echo "备份数据库..."
	docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres litellm > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✓ 数据库备份完成"

# 恢复数据库（使用: make restore-db FILE=backup.sql）
restore-db:
	@if [ -z "$(FILE)" ]; then \
		echo "错误: 请指定备份文件 make restore-db FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres litellm < $(FILE)
	@echo "✓ 数据库恢复完成"

# ============================================
# 扩展和更新
# ============================================

# 扩展 server 实例
scale-server:
	docker-compose -f docker-compose.prod.yml up -d --scale autodify-server=3
	@echo "✓ Server 已扩展到 3 个实例"

# 零停机更新 server
update-server: build-server
	docker-compose -f docker-compose.prod.yml up -d --no-deps autodify-server
	@echo "✓ Server 已更新"

# 零停机更新 web
update-web: build-web
	docker-compose -f docker-compose.prod.yml up -d --no-deps autodify-web
	@echo "✓ Web 已更新"

# ============================================
# 健康检查
# ============================================

# 检查所有服务健康状态
health:
	@echo "检查服务健康状态..."
	@docker ps --filter "name=autodify" --format "table {{.Names}}\t{{.Status}}"

# ============================================
# 开发辅助
# ============================================

# 进入 server 容器
shell-server:
	docker-compose exec autodify-server sh

# 进入 web 容器
shell-web:
	docker-compose exec autodify-web sh

# 进入 postgres 容器
shell-db:
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres litellm
