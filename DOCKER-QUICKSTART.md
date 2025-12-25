# Docker 快速启动指南

## 最快速启动

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，至少配置一个 LLM API Key

# 2. 启动所有服务
docker-compose up -d

# 3. 访问服务
# Web:     http://localhost:3000
# API:     http://localhost:3001
# LiteLLM: http://localhost:4000
```

## 开发模式

### 方式一：使用脚本（推荐）

```bash
# 交互式启动
bash scripts/start.sh

# 或直接指定模式
bash scripts/start.sh --dev        # 仅 LiteLLM
bash scripts/start.sh --full       # 完整开发环境
```

### 方式二：使用 Docker Compose

```bash
# 仅启动 LiteLLM（应用在本地运行）
docker-compose -f docker-compose.dev.yml up litellm -d
pnpm dev

# 启动完整开发环境
docker-compose -f docker-compose.dev.yml up -d
```

### 方式三：使用 Makefile

```bash
make dev           # 启动 LiteLLM
make dev-full      # 启动完整开发环境
```

## 生产部署

### 方式一：使用脚本

```bash
bash scripts/start.sh --prod
```

### 方式二：使用 Makefile

```bash
# 构建并启动
make up

# 或分步执行
make build
make up-default
```

### 方式三：使用 Docker Compose

```bash
# 1. 准备生产环境配置
cp .env.prod.example .env.prod
vim .env.prod

# 2. 构建镜像
docker-compose -f docker-compose.prod.yml build

# 3. 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 常用命令

### 查看状态

```bash
# 查看服务状态
docker-compose ps

# 实时监控（推荐）
bash scripts/docker-monitor.sh -w

# 健康检查
bash scripts/docker-health-check.sh
```

### 查看日志

```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f autodify-server
docker-compose logs -f autodify-web

# 使用 Makefile
make logs
make logs-server
make logs-web
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart autodify-server

# 使用 Makefile
make restart
make restart-server
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（危险！）
docker-compose down -v

# 使用 Makefile
make down
make clean
```

### 清理资源

```bash
# 使用清理脚本（推荐）
bash scripts/docker-cleanup.sh           # 交互式清理
bash scripts/docker-cleanup.sh --all     # 清理所有
bash scripts/docker-cleanup.sh --force   # 强制清理

# 使用 Makefile
make clean              # 清理容器
make clean-all          # 清理所有资源
make clean-images       # 清理镜像
```

## 更新服务

### 零停机更新

```bash
# Server
make update-server

# Web
make update-web

# 或使用 Docker Compose
docker-compose build autodify-server
docker-compose up -d --no-deps autodify-server
```

### 扩展实例

```bash
# 运行 3 个 Server 实例
docker-compose up -d --scale autodify-server=3

# 使用 Makefile
make scale-server
```

## 故障排查

### 服务无法启动

```bash
# 1. 查看日志
docker-compose logs -f

# 2. 检查容器状态
docker ps -a

# 3. 查看详细信息
docker inspect autodify-server
```

### 健康检查失败

```bash
# 1. 运行健康检查脚本
bash scripts/docker-health-check.sh

# 2. 手动测试健康端点
curl http://localhost:3001/health
curl http://localhost:4000/health
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001
lsof -i :4000

# 修改端口（编辑 .env）
WEB_PORT=8080
SERVER_PORT=8081
LITELLM_PORT=8082
```

### 镜像构建失败

```bash
# 清理构建缓存
docker builder prune -a

# 使用 BuildKit 重新构建
DOCKER_BUILDKIT=1 docker-compose build --no-cache
```

## 数据备份

### 备份数据库

```bash
# 使用 Makefile
make backup-db

# 手动备份
docker-compose exec postgres pg_dump -U postgres litellm > backup.sql
```

### 恢复数据库

```bash
# 使用 Makefile
make restore-db FILE=backup.sql

# 手动恢复
docker-compose exec -T postgres psql -U postgres litellm < backup.sql
```

## 环境变量说明

### 必需配置

```bash
# LiteLLM 主密钥
LITELLM_MASTER_KEY=sk-your-secret-key

# 至少配置一个 LLM API Key
OPENAI_API_KEY=sk-...
# 或
ANTHROPIC_API_KEY=sk-ant-...
# 或
DEEPSEEK_API_KEY=sk-...
```

### 可选配置

```bash
# 端口配置
SERVER_PORT=3001
WEB_PORT=3000
LITELLM_PORT=4000

# LLM 配置
LLM_PROVIDER=openai
LLM_DEFAULT_MODEL=gpt-4o

# 速率限制
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# 日志级别
LOG_LEVEL=info
```

## 性能优化

### 启用 BuildKit

```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

### 并行构建

```bash
docker-compose build --parallel
```

### 使用构建缓存

```bash
# GitHub Actions 已配置 GitHub Cache
# 本地开发会自动使用 Docker 层缓存
```

## 监控和日志

### 实时监控

```bash
# 完整监控面板
bash scripts/docker-monitor.sh -w

# 查看资源使用
docker stats

# 查看磁盘使用
docker system df
```

### 日志管理

```bash
# 最近日志
docker-compose logs --tail=100

# 持续监控
docker-compose logs -f --tail=50

# 特定时间范围
docker-compose logs --since=1h
```

## 安全建议

1. **不要在生产环境使用默认密钥**
2. **定期更新基础镜像**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```
3. **限制资源使用**（生产环境已配置）
4. **使用非 root 用户**（已在 Dockerfile 中配置）
5. **定期备份数据**

## 进阶使用

### 自定义网络

```yaml
# docker-compose.override.yml
networks:
  custom-network:
    external: true
```

### 添加环境特定配置

```bash
# 使用 docker-compose.override.yml
cp docker-compose.yml docker-compose.override.yml
# 编辑 override 文件添加自定义配置
```

### CI/CD 集成

已配置 GitHub Actions：
- 自动构建 Docker 镜像
- 推送到 GitHub Container Registry
- 安全扫描（Trivy）
- 多平台支持（amd64, arm64）

## 常见问题

**Q: 如何查看实时日志？**
```bash
docker-compose logs -f
```

**Q: 如何进入容器调试？**
```bash
docker-compose exec autodify-server sh
```

**Q: 如何重置所有数据？**
```bash
docker-compose down -v
```

**Q: 如何更改默认端口？**
编辑 `.env` 文件，修改 `WEB_PORT`、`SERVER_PORT` 等变量。

**Q: 如何在生产环境使用 HTTPS？**
推荐使用 Nginx 或 Traefik 作为反向代理。

## 相关文档

- [完整 Docker 文档](./DOCKER.md)
- [API 文档](http://localhost:3001/docs)
- [LiteLLM 文档](https://docs.litellm.ai/)

## 获取帮助

```bash
# 查看可用命令
make help

# 查看脚本帮助
bash scripts/start.sh --help
bash scripts/docker-monitor.sh --help
bash scripts/docker-cleanup.sh --help
```
