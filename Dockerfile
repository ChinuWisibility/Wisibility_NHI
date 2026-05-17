# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

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

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
