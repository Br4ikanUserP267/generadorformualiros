FROM node:20-alpine AS builder

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install all dependencies (including dev dependencies for build)
# Use `npm install` here so the builder can succeed if package-lock.json
# is out of sync with package.json (we changed deps in the repo).
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and prisma schema
COPY . .

# Generate prisma client for Linux (doesn't touch the real DB)
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage - install only production dependencies
FROM node:20-alpine

# Install OpenSSL required by Prisma at runtime
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4597

# Copy package.json files first
COPY package.json package-lock.json* ./

# Install production dependencies
# Use npm install in production stage as well to avoid lockfile mismatch
RUN npm install --only=production --no-audit --no-fund && npm cache clean --force

# Copy prisma schema - needed before client copy
COPY prisma ./prisma

# Copy the pre-generated prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application from builder (standalone mode)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ensure uploads path exists with proper permissions
RUN mkdir -p /app/public/uploads/matrices && \
	chmod -R 755 /app/public/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Ensure proper permissions for nextjs user (though we run as root to avoid bind-mount permission issues)
RUN chown -R nextjs:nodejs /app

# Temporarily disabled running as non-root to allow write access to the host bind-mounted volume
# USER nextjs

EXPOSE 4597

CMD ["node", "server.js"]
