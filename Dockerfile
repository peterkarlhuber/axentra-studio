# syntax=docker/dockerfile:1

# Base images are pinned by tag and digest (the tag documents the version, the digest makes the
# build reproducible); .github/dependabot.yml proposes updates for both.

# ---- Build -------------------------------------------------------------------------------
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runtime: static files on nginx, running as an unprivileged user ----------------------
# The -slim variant: the same nginx build, configuration and entrypoint scripts as -alpine, without
# the dynamic modules Studio does not load (njs, xslt, image-filter, geoip) and without curl, which
# removes their libraries (libxslt, libexpat, brotli, libcurl, ...) and their CVEs from the image.
# NGINX moved the image on Docker Hub from nginxinc/ to nginx/nginx-unprivileged with 1.30.6 (stable) and 1.31.7
# (mainline); the old name gets no new releases (github.com/nginx/docker-nginx-unprivileged, README "Image Registries").
FROM nginx/nginx-unprivileged:1.30.8-alpine-slim@sha256:04c98c78c1de60ddeada00d7d2207dcd146ecd07b61b9941c9a5799cfb258d28

LABEL org.opencontainers.image.title="Axentra Studio" \
      org.opencontainers.image.description="Admin UI for the Axentra SaaS backend" \
      org.opencontainers.image.licenses="LicenseRef-Proprietary" \
      org.opencontainers.image.source="https://github.com/peterkarlhuber/axentra-studio"

# AXENTRA_API_URL: optional upstream for a same-origin /v1 reverse proxy.
# AXENTRA_PUBLIC_API_URL: API origin for the browser when the API lives on another origin.
# AXENTRA_CSP_CONNECT_SRC: extra connect-src entries for the Content-Security-Policy
#   (space-separated https:// origins; any other value stops the start).
# AXENTRA_TLS_TERMINATED: "true" when browsers reach Studio over HTTPS (TLS terminated in front of the
#   container); adds Strict-Transport-Security.
ENV AXENTRA_API_URL="" \
    AXENTRA_PUBLIC_API_URL="" \
    AXENTRA_CSP_CONNECT_SRC="" \
    AXENTRA_TLS_TERMINATED="false"

USER root
# The base digest carries the Alpine fixes (musl 1.2.6-r3, zlib 1.3.2-r1, openssl 3.5.9-r1), so no apk step:
# every package comes from the pinned digest.
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
