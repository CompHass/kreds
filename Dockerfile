ARG NODE_VERSION=24.13.0-slim
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN corepack enable pnpm && \
    DATABASE_URL=postgresql://kreds:kreds@localhost:5432/kreds \
    AUTH_SECRET=build-time-placeholder-secret \
    AUTH_ZITADEL_ID=build-time-placeholder-client-id \
    AUTH_ZITADEL_SECRET=build-time-placeholder-client-secret \
    AUTH_ZITADEL_ISSUER=https://auth.hasslab.pro \
    ZITADEL_ISSUER=https://auth.hasslab.pro \
    CHILD_SESSION_SECRET=build-time-placeholder-child-session-secret \
    PIN_ENCRYPTION_KEY=build-time-placeholder-pin-encryption-key-32b \
    NEXT_PUBLIC_APP_URL=https://kreds.hasslab.pro \
    pnpm build && \
    mkdir -p public

FROM node:${NODE_VERSION} AS migration
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm
CMD ["pnpm", "db:push"]

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN apt-get update && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/* /usr/local/lib/node_modules/npm /opt/yarn-* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
