# ── Stage 1: build the React app ──────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Same-origin API calls in the container; nginx proxies /api to the API service.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1/"]

CMD ["nginx", "-g", "daemon off;"]
