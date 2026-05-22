# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the server package files first (better layer caching)
COPY server/package.json server/package-lock.json ./server/

RUN npm --prefix server ci --omit=dev

# ── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy application source
COPY server/ ./server/
COPY client/ ./client/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Runtime environment defaults (overridden by Render env vars)
ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/server.js"]
