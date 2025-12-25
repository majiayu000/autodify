# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 复制所有 package.json 文件（用于依赖解析）
COPY packages/core/package.json ./packages/core/
COPY packages/web/package.json ./packages/web/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# 从 deps 阶段复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 复制源代码
COPY packages/core ./packages/core
COPY packages/web ./packages/web

# 构建 core 包（web 依赖它）
RUN pnpm --filter @autodify/core build

# 构建 web 应用
# 使用构建参数允许在构建时传入环境变量
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @autodify/web build

# ============================================
# Stage 3: Production - Nginx
# ============================================
FROM nginx:alpine AS runtime

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制构建产物到 nginx
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# 创建 nginx 配置
RUN echo 'server { \n\
    listen 80; \n\
    server_name _; \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    \n\
    # 启用 gzip 压缩 \n\
    gzip on; \n\
    gzip_vary on; \n\
    gzip_min_length 1024; \n\
    gzip_types text/plain text/css text/xml text/javascript \n\
               application/javascript application/xml+rss application/json \n\
               application/x-font-ttf font/opentype image/svg+xml image/x-icon; \n\
    \n\
    # 静态资源缓存配置 \n\
    location ~* \\.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ { \n\
        expires 1y; \n\
        add_header Cache-Control "public, immutable"; \n\
    } \n\
    \n\
    # API 代理（如果需要） \n\
    location /api { \n\
        proxy_pass http://autodify-server:3001; \n\
        proxy_http_version 1.1; \n\
        proxy_set_header Upgrade $http_upgrade; \n\
        proxy_set_header Connection "upgrade"; \n\
        proxy_set_header Host $host; \n\
        proxy_set_header X-Real-IP $remote_addr; \n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \n\
        proxy_set_header X-Forwarded-Proto $scheme; \n\
        proxy_cache_bypass $http_upgrade; \n\
    } \n\
    \n\
    # SPA 路由支持 \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
        add_header Cache-Control "no-cache"; \n\
    } \n\
    \n\
    # 健康检查端点 \n\
    location /health { \n\
        access_log off; \n\
        return 200 "healthy\\n"; \n\
        add_header Content-Type text/plain; \n\
    } \n\
} \n' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
