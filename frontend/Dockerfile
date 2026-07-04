# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Vite bakes env vars into the bundle at build time. Railway passes service
# variables as build args, so VITE_API_URL must be declared here to reach
# `vite build`. Set it on the frontend service to the backend's public URL
# plus /api, e.g. https://your-backend.up.railway.app/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Railway hosts expose many CPU cores, so nginx's default "worker_processes
# auto" spawns dozens of workers. Each worker's io_setup() allocates a kernel
# AIO context, and that many exhausts the host's fs.aio-max-nr limit:
#   [emerg] io_setup() failed (11: Resource temporarily unavailable)
# Every worker then dies at startup and nginx can't serve -> connection
# refused. Cap the worker count to keep AIO contexts well under the limit.
RUN sed -i -E 's/^\s*worker_processes.*/worker_processes 2;/' /etc/nginx/nginx.conf

# Copy nginx configuration (listen 80 hardcoded — see nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
