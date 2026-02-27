FROM node:20-alpine AS base

# --- Dependencies stage (production only) ---
FROM base AS deps
WORKDIR /app
# Need python3/make/g++ for native modules like bcrypt
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Build stage ---
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

# --- Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy compiled JavaScript
COPY --from=build /app/dist ./dist
# Copy package.json (needed for "type": "module")
COPY package.json ./

# Railway injects PORT dynamically — don't hardcode it
EXPOSE ${PORT:-4000}

CMD ["node", "dist/index.js"]
