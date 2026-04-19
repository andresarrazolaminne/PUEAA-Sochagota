# PUEAA Sochagota

Plataforma web (Next.js App Router, TypeScript) con **Prisma 7** y **SQLite** (`data/app.db`). Flujo: **`/`** landing pública → **`/login`** (solo cédula) → **`/tablero`** perfil, retos y herramientas (ruta protegida). Ledger de puntos en `PointLedger`.

## Desarrollo local

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

- Salud + BD: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Tras iniciar sesión: [http://localhost:3000/tablero](http://localhost:3000/tablero)

## Despliegue (Docker)

Objetivo: **un contenedor** en VPS o similar (p. ej. **AWS Lightsail**) con **volumen persistente** para SQLite y evidencias (`/app/data`).

```bash
docker compose up --build
```

`DATABASE_URL` en compose usa `file:/app/data/app.db`. Copia de seguridad del volumen: `docker compose cp web:/app/data/app.db ./respaldo.db`.

**Serverless** (p. ej. Vercel) no es adecuado para SQLite en disco ni para `better-sqlite3` sin adaptación; este repo está orientado a **proceso Node + volumen** o hosting con sistema de archivos persistente.

### Subruta pública (`/pueaa`, sin subdominio)

Si Nginx (u otro proxy) expone la app en `https://ejemplo.com/pueaa` en lugar de la raíz del dominio:

1. Define **`NEXT_PUBLIC_BASE_PATH=/pueaa`** (sin barra final) en `.env` y en el **build** de Docker (build-arg y variable de entorno del servicio deben coincidir).
2. Ejemplo de imagen con subruta:

   ```bash
   docker build --build-arg NEXT_PUBLIC_BASE_PATH=/pueaa -t pueaa .
   ```

3. En **`docker-compose.yml`**, rellena `build.args.NEXT_PUBLIC_BASE_PATH` y `environment.NEXT_PUBLIC_BASE_PATH` con el mismo valor (p. ej. `"/pueaa"`).

4. **Nginx** (SSL en el servidor con Certbot u otro): proxy al proceso Node (p. ej. `127.0.0.1:3000`) **conservando el prefijo** en la URL:

   ```nginx
   location /pueaa/ {
       proxy_pass http://127.0.0.1:3000/pueaa/;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

   Ajusta el puerto si el contenedor escucha en otro. Comprueba salud: `https://ejemplo.com/pueaa/api/health`.

5. En desarrollo local **sin** subruta, deja `NEXT_PUBLIC_BASE_PATH` vacío o no la definas.

### Copias de seguridad periódicas

Incluye en el backup **tanto la base SQLite como los archivos subidos** (evidencias, logos, etc.):

| Qué | Dónde (por defecto) |
|-----|---------------------|
| Base de datos | Ruta de `DATABASE_URL` (p. ej. `data/app.db` o `/app/data/app.db` en Docker) |
| Subidas | Directorio `UPLOAD_DIR` (por defecto `./data/uploads` relativo al proceso; en Docker suele ser `/app/data/uploads` si unificas todo bajo el volumen) |

**Ejemplo con Docker Compose** (desde el host, copia puntual):

```bash
docker compose cp web:/app/data/app.db "./backup-app-$(date +%F).db"
docker compose cp web:/app/data/uploads "./backup-uploads-$(date +%F)" 
```

Para automatizar, un `cron` en el servidor puede ejecutar un script similar a diario y rotar o subir a almacenamiento externo. Ajusta rutas si montas el volumen en otro sitio.

### QA antes de producción

Checklist de pruebas en staging (importaciones y puntajes): [docs/pre-production-qa.md](docs/pre-production-qa.md).

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run db:generate` | Regenera el cliente Prisma |
| `npm run db:migrate` | Migraciones (dev) |
| `npm run db:seed` | Datos demo (rangos, empleados, assets de entorno) |
| `npm run db:studio` | Prisma Studio |

## Empleados demo (seed)

- Usuario: cédula `1234567890`
- Admin: cédula `0000000000`
