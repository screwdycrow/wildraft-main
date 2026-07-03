# Build stage
# NOTE: The Railway service has Root Directory = backend, so the build context
# is the CONTENTS of backend/ at the top level (src/, package.json, prisma/ are
# NOT nested under a backend/ subdirectory). COPY paths are relative to that.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (only what tsc needs — avoids the large nested
# wildraft-prisma-backend folder)
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start command - run migrations then start the app.
# If the DB isn't ready yet, migrate fails, the container restarts, and Railway
# retries until Postgres is up.
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && node dist/index.js"]
