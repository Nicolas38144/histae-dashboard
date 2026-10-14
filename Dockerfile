FROM node:24-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN if command -v corepack >/dev/null 2>&1; then corepack disable pnpm; fi \
    && npm install --global "$(node -p "require('./package.json').packageManager.split('+')[0]")" \
    && pnpm install --frozen-lockfile

COPY . ./
# Les fichiers .env locaux sont exclus du contexte Docker. Ces valeurs publiques
# sont intégrées par Vite au build, indépendamment de la configuration locale.
RUN VITE_ENV=production VITE_API_URL=/api pnpm run build

FROM caddy:2.11.7-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f AS production
ENV XDG_CONFIG_HOME=/tmp/caddy-config XDG_DATA_HOME=/tmp/caddy-data
USER 1000:1000
ENV HISTAE_API_UPSTREAM=http://api:8080
COPY Caddyfile caddy-common.caddy /etc/caddy/
COPY --from=build /app/dist /srv

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -T 2 -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
