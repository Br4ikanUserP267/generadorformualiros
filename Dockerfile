FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev dependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

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

# Copy prisma schema and client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 4597

CMD ["npm", "start"]
