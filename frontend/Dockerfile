# ============================================================
# ResumeRank Frontend — Multi-stage Dockerfile
# Stage 1: Build (Node 20 + npm)
# Stage 2: Standalone Next.js runtime
# ============================================================

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# next.config.ts already has output: "standalone"
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy standalone output + static assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
