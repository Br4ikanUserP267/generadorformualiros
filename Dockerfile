FROM node:20-alpine AS builder

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install all dependencies (including dev dependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

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
RUN npm ci --only=production && npm cache clean --force

# Copy prisma schema - needed before client copy
COPY prisma ./prisma

# Copy the pre-generated prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Ensure proper permissions for nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4597

CMD ["npm", "start"]
