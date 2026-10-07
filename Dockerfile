FROM node:24-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . ./
# Les fichiers .env locaux sont exclus du contexte Docker. Ces valeurs publiques
# sont intégrées par Vite au build, indépendamment de la configuration locale.
RUN VITE_ENV=production VITE_API_URL=/api pnpm run build

FROM nginx:1.28-alpine AS production

# Autorités de certification pour vérifier une API distante appelée en HTTPS.
RUN apk add --no-cache ca-certificates

# L'entrypoint officiel génère default.conf au démarrage. Le filtre préserve
# les variables Nginx ($uri, $host, etc.) lors de la substitution.
ENV HISTAE_API_UPSTREAM=http://api:8080 \
    NGINX_ENVSUBST_FILTER=^HISTAE_API_UPSTREAM$

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
