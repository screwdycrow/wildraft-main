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

# Default port for local runs; Railway overrides PORT at runtime. The nginx
# image's entrypoint runs envsubst on files in /etc/nginx/templates/*.template
# (substituting only real env vars like ${PORT}, leaving $uri etc. intact) and
# writes the result to /etc/nginx/conf.d/.
ENV PORT=80

# Copy nginx config as a template so ${PORT} is substituted at container start
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Start nginx (entrypoint processes templates first)
CMD ["nginx", "-g", "daemon off;"]
