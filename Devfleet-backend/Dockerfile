FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
# Copy the non-standard prisma schema location before npm install
# so that `prisma generate` (run as a postinstall hook) can find it.
COPY src/db/prisma ./src/db/prisma/
RUN npm install

# Generate Prisma client (schema lives at src/db/prisma/schema.prisma)
RUN npx prisma generate --schema=src/db/prisma/schema.prisma

# Copy the rest of the source code
COPY . .

# Build TypeScript
RUN npm run build

# ─────────────────────────────────────────────────────────
# Production image
# ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Copy migrations so `prisma migrate deploy` can run at startup
COPY --from=builder /app/src/db/prisma ./src/db/prisma

EXPOSE 3000

# Run DB migrations then start the API server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=src/db/prisma/schema.prisma && npm start"]
