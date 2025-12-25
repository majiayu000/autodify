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
COPY packages/server/package.json ./packages/server/

# 安装所有依赖（包括 devDependencies 用于构建）
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
COPY packages/server ./packages/server

# 构建 core 包（server 依赖它）
RUN pnpm --filter @autodify/core build

# 构建 server
RUN pnpm --filter @autodify/server build

# ============================================
# Stage 3: Production Dependencies
# ============================================
FROM node:20-alpine AS prod-deps

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# 复制所有 package.json 文件
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# ============================================
# Stage 4: Runtime
# ============================================
FROM node:20-alpine AS runtime

# 添加非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 从 prod-deps 复制生产依赖
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/server/node_modules ./packages/server/node_modules

# 从 builder 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/core/package.json ./packages/core/
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/package.json ./packages/server/

# 复制 workspace 配置
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json ./

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3001

# 启动应用
CMD ["node", "packages/server/dist/index.js"]
