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

Objetivo: **un contenedor** en VPS o similar con **volumen persistente** para SQLite y evidencias (`/app/data`).

```bash
docker compose up --build
```

`DATABASE_URL` en compose usa `file:/app/data/app.db`. Copia de seguridad del volumen: `docker compose cp web:/app/data/app.db ./respaldo.db`.

**Serverless** (p. ej. Vercel) no es adecuado para SQLite en disco ni para `better-sqlite3` sin adaptación; este repo está orientado a **proceso Node + volumen** o hosting con sistema de archivos persistente.

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
