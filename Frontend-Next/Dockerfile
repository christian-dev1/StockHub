# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
# Rewrites are resolved at build time by Next.js: the backend address is a build argument.
ARG BACKEND_URL=http://backend:8080
ENV NEXT_TELEMETRY_DISABLED=1 \
    BACKEND_URL=${BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S stockhub && adduser -S stockhub -G stockhub
COPY --from=build --chown=stockhub:stockhub /app/.next/standalone ./
COPY --from=build --chown=stockhub:stockhub /app/.next/static ./.next/static
COPY --from=build --chown=stockhub:stockhub /app/public ./public
USER stockhub
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:3000/fr >/dev/null || exit 1
CMD ["node", "server.js"]
