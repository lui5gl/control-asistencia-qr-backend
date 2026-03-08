FROM node:24.13.1-alpine AS base

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# ── Development stage ────────────────────────────────────────────────────────
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Production stage ─────────────────────────────────────────────────────────
FROM base AS production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]