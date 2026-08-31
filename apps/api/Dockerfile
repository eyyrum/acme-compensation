# Multi-stage: the runtime image carries no source, no dev dependencies,
# and no build toolchain.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @acme/shared build \
 && pnpm --filter api exec prisma generate \
 && pnpm --filter api build \
 && pnpm deploy --filter api --prod /app \
 # `pnpm deploy` re-materialises node_modules from the lockfile/store, which
 # does not carry over the Prisma Client generated above — it has to be
 # regenerated in place so /app/node_modules actually has it at runtime.
 && cp -r apps/api/prisma /app/prisma \
 && (cd /app && npx prisma generate) \
 && rm -rf /app/prisma

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Non-root: a compromised process should not own the filesystem.
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /repo/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /repo/apps/api/prisma ./prisma

USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migrations run at start rather than in a separate task: one service, one
# deploy step. Acceptable because migrations here are additive and the
# service runs a single task. A larger deployment would split this into a
# pre-deploy ECS task to avoid concurrent migration races.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
