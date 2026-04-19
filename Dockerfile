# Imagen única: Node 22 + dependencias nativas (better-sqlite3) para Prisma 7.
# Despliegue típico: VPS o host con Docker; volumen persistente en /app/data (BD SQLite + uploads).

FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Incluir en el build para `basePath` y URLs públicas (ej. /pueaa detrás de Nginx).
# En raíz: docker build --build-arg NEXT_PUBLIC_BASE_PATH= .
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

RUN npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/app.db

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["sh", "-c", "mkdir -p /app/data/uploads && npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]
