FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
# Drop root — run as the image's built-in unprivileged `node` user. `dist` is
# copied root-owned and read-only, which is all the app needs.
USER node
# NOTE: the bot exits on fatal startup errors, so the runtime must restart it —
# set a restart policy (`restart: unless-stopped` in compose, or an equivalent
# Kubernetes restartPolicy). Phase 1.4 hardened the request paths so runtime
# errors no longer crash it; only startup fatals exit, for a clean restart.
CMD ["node", "dist/index.js"]
