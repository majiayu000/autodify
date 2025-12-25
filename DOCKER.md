# Docker 部署指南

本文档介绍如何使用 Docker 部署 Autodify 项目。

## 目录结构

```
.
├── docker-compose.yml          # 默认配置（适用于快速启动）
├── docker-compose.dev.yml      # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── .dockerignore              # Docker 忽略文件
├── .env.example               # 环境变量示例
├── .env.prod.example          # 生产环境变量示例
├── packages/
│   ├── server/Dockerfile      # 后端服务 Dockerfile
│   └── web/Dockerfile         # 前端应用 Dockerfile
```

## 快速开始

### 1. 准备环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写必要的配置
# 至少需要配置一个 LLM API Key
vim .env
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 3. 访问服务

- Web 界面: http://localhost:3000
- API 服务: http://localhost:3001
- LiteLLM Proxy: http://localhost:4000
- API 文档: http://localhost:3001/docs

## 开发环境

开发环境只运行必要的基础服务（如 LiteLLM），应用代码在本地运行。

### 启动 LiteLLM

```bash
# 仅启动 LiteLLM
docker-compose -f docker-compose.dev.yml up litellm -d

# 或使用 npm 脚本
pnpm litellm:start
```

### 启动完整开发环境

```bash
# 启动 LiteLLM + PostgreSQL + Redis
docker-compose -f docker-compose.dev.yml up -d

# 本地运行应用
pnpm dev
```

### 停止服务

```bash
docker-compose -f docker-compose.dev.yml down

# 或使用 npm 脚本
pnpm litellm:stop
```

## 生产环境

生产环境配置包含完整的服务栈、资源限制和高可用配置。

### 1. 准备生产环境配置

```bash
# 复制生产环境变量模板
cp .env.prod.example .env.prod

# 编辑配置文件
vim .env.prod
```

### 2. 构建镜像

```bash
# 构建所有镜像
docker-compose -f docker-compose.prod.yml build

# 仅构建特定服务
docker-compose -f docker-compose.prod.yml build autodify-server
docker-compose -f docker-compose.prod.yml build autodify-web
```

### 3. 启动生产环境

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. 扩展服务

```bash
# 运行 3 个 server 实例实现负载均衡
docker-compose -f docker-compose.prod.yml up -d --scale autodify-server=3
```

### 5. 更新服务

```bash
# 重新构建并更新服务（零停机更新）
docker-compose -f docker-compose.prod.yml build autodify-server
docker-compose -f docker-compose.prod.yml up -d --no-deps autodify-server
```

## Docker 镜像优化特性

### Server Dockerfile

- **多阶段构建**: 4 个阶段（deps、builder、prod-deps、runtime）
- **Alpine 基础镜像**: 更小的镜像体积
- **pnpm workspace 支持**: 正确处理 monorepo 结构
- **层缓存优化**: 依赖和源代码分离，提高构建速度
- **非 root 用户**: 提高安全性
- **健康检查**: 自动监控服务状态

### Web Dockerfile

- **多阶段构建**: 3 个阶段（deps、builder、runtime）
- **Nginx 静态服务**: 生产级静态资源服务
- **Gzip 压缩**: 自动压缩静态资源
- **缓存优化**: 静态资源长期缓存配置
- **SPA 路由支持**: 处理前端路由
- **API 代理**: 内置 API 反向代理

## 健康检查

所有服务都配置了健康检查：

- **LiteLLM**: 每 30 秒检查 /health 端点
- **Server**: 每 30 秒检查 /health 端点
- **Web**: 每 30 秒检查 /health 端点

查看健康状态：

```bash
docker-compose ps
```

## 资源限制（生产环境）

生产环境配置了资源限制，防止服务过度消耗资源：

- **LiteLLM**: 最大 1 CPU, 1GB 内存
- **PostgreSQL**: 最大 1 CPU, 1GB 内存
- **Server**: 最大 1 CPU, 1GB 内存（每实例）
- **Web**: 最大 0.5 CPU, 256MB 内存

## 数据持久化

生产环境使用 Docker volumes 持久化数据：

- `litellm-prod-data`: LiteLLM 数据
- `postgres-prod-data`: PostgreSQL 数据库

备份数据：

```bash
# 备份 PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres litellm > backup.sql

# 恢复
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres litellm < backup.sql
```

## 网络配置

- **开发环境**: `autodify-dev-network`
- **生产环境**: `autodify-prod-network`
- 服务间通过容器名称通信
- 仅必要端口暴露到宿主机

## 故障排查

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f autodify-server

# 查看最近 100 行日志
docker-compose logs --tail=100 autodify-server
```

### 进入容器

```bash
# 进入 server 容器
docker-compose exec autodify-server sh

# 进入 web 容器
docker-compose exec autodify-web sh
```

### 重启服务

```bash
# 重启特定服务
docker-compose restart autodify-server

# 重启所有服务
docker-compose restart
```

### 清理资源

```bash
# 停止并删除容器
docker-compose down

# 同时删除 volumes（会丢失数据！）
docker-compose down -v

# 清理未使用的镜像
docker image prune -a

# 清理所有未使用资源
docker system prune -a --volumes
```

## 性能优化建议

### 构建优化

1. **使用构建缓存**:
   ```bash
   docker-compose build --parallel
   ```

2. **使用 BuildKit**:
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   ```

### 运行优化

1. **限制日志大小**:
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

2. **使用只读卷**:
   ```yaml
   volumes:
     - ./config.yaml:/app/config.yaml:ro
   ```

## 安全建议

1. 不要在生产环境使用默认密钥
2. 使用环境变量而非硬编码配置
3. 定期更新基础镜像
4. 使用非 root 用户运行服务
5. 启用健康检查和重启策略
6. 限制容器资源使用
7. 使用 Docker secrets 管理敏感信息（Swarm 模式）

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose -f docker-compose.prod.yml build

      - name: Push to registry
        run: |
          docker tag autodify-server:latest registry.example.com/autodify-server:latest
          docker push registry.example.com/autodify-server:latest
```

## 监控集成

生产环境可以集成 Prometheus、Grafana 等监控工具：

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Node.js Docker 最佳实践](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Nginx Docker 官方镜像](https://hub.docker.com/_/nginx)
