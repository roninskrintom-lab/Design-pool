# syntax=docker/dockerfile:1.7
# ============================================================================
# aurastudio — multi-stage Dockerfile
#   build → app    : Node runtime with the bundled Express API server
#   build → web    : Nginx serving the built React SPA + reverse-proxy to app
#
# Base images are Debian-slim (glibc), NOT Alpine (musl). Reason: dev happens
# on glibc (Replit / Ubuntu), prod is Ubuntu 22.04 VPS, and pnpm lockfiles
# record platform-specific optional native deps (rollup, esbuild, sharp, ...)
# only for the dev platform. Alpine's musl libc requires *different* native
# binaries that aren't in the lockfile → cryptic "Cannot find module
# @rollup/rollup-linux-x64-musl" errors at build time. Debian-slim matches the
# dev libc and avoids the whole class of issues. Image size delta is ~30 MB,
# fully worth it.
# ============================================================================

# ----- shared base with pnpm via corepack -----
FROM node:24-bookworm-slim AS base
# npm_config_user_agent=pnpm satisfies the root package.json `preinstall`
# guard (`case "$npm_config_user_agent" in pnpm/*) ...`) which otherwise
# fails inside docker because corepack doesn't propagate user_agent into
# child scripts. Without this, `pnpm install` dies with "Use pnpm instead".
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    npm_config_user_agent=pnpm
RUN corepack enable \
 && corepack prepare pnpm@10.26.1 --activate
WORKDIR /repo

# ----- install + build the whole monorepo once, reused by both runtime images -----
FROM base AS builder
# Copy the full workspace. .dockerignore prunes node_modules / dist / etc.
COPY . .
# pnpm-store cache mount keeps repeat builds fast.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Vite needs PORT + BASE_PATH at build-time per the project's vite.config.ts;
# they're build-time-only — runtime PORT for the API comes from env at runtime.
ENV NODE_ENV=production \
    PORT=8080 \
    BASE_PATH=/

RUN pnpm --filter @workspace/api-server run build \
 && pnpm --filter @workspace/main-site  run build

# ============================================================================
# Target: app — production API server
# ============================================================================
FROM node:24-bookworm-slim AS app
RUN corepack enable \
 && apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*
ENV npm_config_user_agent=pnpm
WORKDIR /tmp/repo
# `pnpm deploy` produces a self-contained directory with only the prod deps
# for @workspace/api-server, with workspace symlinks resolved to real copies.
COPY --from=builder /repo /tmp/repo
# --legacy: pnpm v10 changed the default `deploy` behavior to require
# `inject-workspace-packages=true` in the workspace, otherwise it bails with
# ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE. The api-server is bundled by esbuild
# (workspace deps inlined into dist/index.mjs), so injected-workspace is
# unnecessary — `--legacy` restores the pre-v10 behavior which just resolves
# symlinks and copies prod deps. Equivalent: set `force-legacy-deploy=true`
# in .npmrc.
RUN pnpm --filter @workspace/api-server deploy --prod --legacy /app \
 && rm -rf /tmp/repo /root/.local/share/pnpm/store

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    LOG_LEVEL=info
EXPOSE 8080

# tini reaps zombies and forwards SIGTERM so graceful shutdown works.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/index.mjs"]

# ============================================================================
# Target: web — Nginx serving the SPA and proxying /api → app
# ============================================================================
FROM nginx:1.27 AS web
# Pre-bake the built static site into the image. The nginx config itself is
# mounted at runtime from ./nginx/default.conf so it stays easy to tweak.
COPY --from=builder /repo/artifacts/main-site/dist/public /usr/share/nginx/html
EXPOSE 80 443
