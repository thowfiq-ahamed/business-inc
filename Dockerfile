# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy server package files for dependency resolution
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/

# Install production dependencies
RUN npm ci --omit=dev && npm --prefix server ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add non-root system user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy application source code
COPY server/ ./server/
COPY client/ ./client/
COPY package.json ./

# Set permissions for non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Runtime environment defaults
ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

# Docker healthcheck targeting the Express health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/server.js"]
