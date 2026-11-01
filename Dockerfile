# syntax=docker/dockerfile:1

# ---- Build -------------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runtime: static files on nginx, running as an unprivileged user ----------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="Axentra Studio" \
      org.opencontainers.image.description="Admin UI for the Axentra SaaS backend" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/peterkarlhuber/axentra-studio"

# AXENTRA_API_URL: optional upstream for a same-origin /v1 reverse proxy.
# AXENTRA_PUBLIC_API_URL: API origin for the browser when the API lives on another origin.
# AXENTRA_CSP_CONNECT_SRC: extra connect-src entries for the Content-Security-Policy.
ENV AXENTRA_API_URL="" \
    AXENTRA_PUBLIC_API_URL="" \
    AXENTRA_CSP_CONNECT_SRC=""

USER root
RUN rm -f /etc/nginx/conf.d/default.conf \
 && mkdir -p /etc/nginx/axentra /etc/nginx/axentra-templates \
 && chown -R nginx:nginx /etc/nginx/axentra
COPY docker/nginx.conf /etc/nginx/conf.d/axentra-studio.conf
COPY docker/websocket-map.conf /etc/nginx/conf.d/00-websocket-map.conf
COPY docker/api-proxy.conf.template /etc/nginx/axentra-templates/api-proxy.conf.template
COPY --chmod=755 docker/40-axentra-studio.sh /docker-entrypoint.d/40-axentra-studio.sh
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
