FROM node:22-alpine AS deps

# Install build tools for native modules (like bcrypt)
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
COPY package*.json ./
RUN npm install --omit=dev

FROM node:22-alpine AS build

# Install build tools for Prisma and TypeScript compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app
COPY package*.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm install
# Generate Prisma client before compiling TypeScript
RUN npx prisma generate
COPY src ./src
RUN npm run build

FROM node:22-alpine
# Install runtime libraries for canvas (if needed by libraries like jspdf/node-canvas)
RUN apk add --no-cache \
    cairo \
    pango \
    libjpeg-turbo \
    giflib

WORKDIR /app
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/src          ./src
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts

EXPOSE 4000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
