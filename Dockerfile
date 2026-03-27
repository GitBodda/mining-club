# syntax=docker/dockerfile:1

# ── Stage 1: Install ALL deps (needed for build) ────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# ── Stage 2: Build client (Vite) + server (esbuild) ────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .

# Build-time variables for the Vite client bundle (public Firebase config).
ARG VITE_FIREBASE_API_KEY=AIzaSyAcLEpB_6dwpdEmvhal69TZy6lI_dracaE
ARG VITE_FIREBASE_PROJECT_ID=blockmint
ARG VITE_FIREBASE_APP_ID=1:613078809637:web:8fc4eed77f2e03ff79d3cc
ARG VITE_FIREBASE_AUTH_DOMAIN=blockmint.firebaseapp.com
ARG VITE_FIREBASE_STORAGE_BUCKET=blockmint.firebasestorage.app

ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}

RUN npm run build

# ── Stage 3: Production runtime ─────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install production deps BEFORE setting NODE_ENV so postinstall scripts work
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

ENV NODE_ENV=production

# App artifacts from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/attached_assets ./attached_assets

# Cloud Run injects PORT (default 8080). The server reads process.env.PORT.
EXPOSE 8080

# Use node directly (not npm) so SIGTERM reaches the process for graceful shutdown.
CMD ["node", "dist/index.mjs"]
