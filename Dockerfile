FROM node:20-alpine AS builder

WORKDIR /app

# Set a dummy DATABASE_URL for build time (Prisma needs this to generate client)
ENV DATABASE_URL="postgresql://user:password@localhost:5432/dummy"

# Install all dependencies (including dev dependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and prisma schema
COPY . .

# Build the application
RUN npm run build

# Production stage - install only production dependencies
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4597

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy prisma schema and configuration
COPY --from=builder /app/prisma ./prisma
COPY --chown=1001:1001 --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=1001:1001 --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Ensure proper permissions
RUN chown -R nextjs:nodejs /app && chmod -R 755 /app

USER nextjs

EXPOSE 4597

CMD ["npm", "start"]
