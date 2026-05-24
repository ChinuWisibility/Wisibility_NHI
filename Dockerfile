# Stage 1: Build stage
FROM node:20-alpine AS build

# Install system dependencies for node-canvas and other native modules
# These are often required for libraries like jspdf, html2canvas, or during tests.
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve stage (Using Caddy for automatic HTTPS)
FROM caddy:2-alpine

# Copy the build output from the build stage to Caddy default directory
COPY --from=build /app/dist /usr/share/caddy

# Copy Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
