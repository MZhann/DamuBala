FROM node:20-alpine AS base

# --- Dependencies stage (production only) ---
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Build stage ---
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
# Force cache invalidation on src changes
COPY src ./src
RUN npm run build

# --- Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE ${PORT:-4000}

CMD ["node", "dist/index.js"]
