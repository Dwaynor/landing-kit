# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts blocks arbitrary postinstall hooks (supply-chain protection).
# Sharp requires its platform binary: rebuild it explicitly after the blocked install.
RUN npm ci --ignore-scripts && npm rebuild sharp

# Stage 2: Build the Astro site
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime (minimal image)
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy only what's needed to run
COPY --from=build /app/dist ./dist
# The node adapter standalone imports from node_modules at runtime
COPY --from=build /app/node_modules ./node_modules

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
USER appuser

# Environment
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

EXPOSE 4321

# Astro Node standalone entry point
CMD ["node", "./dist/server/entry.mjs"]
