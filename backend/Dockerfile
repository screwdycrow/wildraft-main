# Build stage
# NOTE: This Dockerfile is built with the REPO ROOT as the build context
# (Railway builds the whole repo and points at backend/Dockerfile), so all
# source COPY paths are prefixed with backend/.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (only what tsc needs — avoids the large nested
# backend/wildraft-prisma-backend folder that broke `COPY backend/ .`)
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY backend/package*.json ./
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
# Inlined (no external script) so it doesn't depend on build-context file resolution.
# If the DB isn't ready yet, migrate fails, the container restarts, and Railway retries
# until Postgres is up.
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && node dist/index.js"]
