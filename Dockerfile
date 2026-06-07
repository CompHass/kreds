ARG NODE_VERSION=24.13.0-slim
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL=postgresql://kreds:kreds@localhost:5432/kreds
ARG AUTH_SECRET=build-time-placeholder-secret
ARG AUTH_ZITADEL_ID=build-time-placeholder-client-id
ARG AUTH_ZITADEL_SECRET=build-time-placeholder-client-secret
ARG AUTH_ZITADEL_ISSUER=https://auth.hasslab.pro
ARG ZITADEL_ISSUER=https://auth.hasslab.pro
ARG NEXT_PUBLIC_APP_URL=https://kreds.hasslab.pro
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV AUTH_ZITADEL_ID=${AUTH_ZITADEL_ID}
ENV AUTH_ZITADEL_SECRET=${AUTH_ZITADEL_SECRET}
ENV AUTH_ZITADEL_ISSUER=${AUTH_ZITADEL_ISSUER}
ENV ZITADEL_ISSUER=${ZITADEL_ISSUER}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN corepack enable pnpm && pnpm build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
