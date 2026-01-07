# syntax=docker/dockerfile:1 2

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

FROM deps AS builder
WORKDIR /app
COPY . .

# Build-time variables for the Vite client bundle.
ARG VITE_FIREBASE_API_KEY=AIzaSyCjBfwZr4k6mGHLjrhdXmlcV0ODH_6CuP0
ARG VITE_FIREBASE_PROJECT_ID=blockmint-393d2
ARG VITE_FIREBASE_APP_ID=1:1181184514:web:3474e047892c119fa3ad1b
ARG VITE_FIREBASE_AUTH_DOMAIN=blockmint-393d2.firebaseapp.com
ARG VITE_FIREBASE_STORAGE_BUCKET=blockmint-393d2.firebasestorage.app

ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}

RUN npm run build


FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime deps only
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# App artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/attached_assets ./attached_assets

# Cloud Run sets $PORT (typically 8080). The server already binds to process.env.PORT.
EXPOSE 8080

CMD ["npm", "start"]
