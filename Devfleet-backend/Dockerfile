FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Copy full source — must happen BEFORE prisma generate so the
# fresh generated client is never overwritten by stale local files
COPY . .

# Generate Prisma client from the non-standard schema path.
# Running AFTER COPY . . ensures no local stale generated files can overwrite it.
RUN npx prisma generate --schema=src/db/prisma/schema.prisma

# Build TypeScript  (rootDir=src → outDir=dist)
RUN npm run build

# ─────────────────────────────────────────────────────────
# Production image
# ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Runtime dependencies & compiled JavaScript
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json



# Migrations for `prisma migrate deploy` at startup
COPY --from=builder /app/src/db/prisma ./src/db/prisma

EXPOSE 3000

# Run DB migrations then start the API server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=src/db/prisma/schema.prisma && npm start"]
