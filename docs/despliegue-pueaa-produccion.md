# PUEAA en producción (orden de contexto)

Resumen de lo que debe cumplirse para que la app bajo **`https://dominio/pueaa`** funcione sin sorpresas (subidas, home, TLS).

## 1. Una sola copia del repo en el servidor

- **Un** directorio de despliegue (ej. `/home/admin/apps/PUEAA-Sochagota`).
- **No** anidar otro clone con su propio `package-lock.json` dentro: Next infiere mal la raíz del monorepo y pueden fallar `serverActions.bodySizeLimit` y el build.

## 2. Variables de entorno

- En **`.env`** (producción), sin comentar:

  - `NEXT_PUBLIC_BASE_PATH=/pueaa` — debe coincidir con `basePath` en `next.config.ts` y con `normalizedPublicBasePath` en código.
  - `DATABASE_URL`, `UPLOAD_DIR`, etc. según `.env.example`.

- Tras cambiar `NEXT_PUBLIC_BASE_PATH`: **`rm -rf .next && npm run build`** y reiniciar PM2 (el prefijo público se materializa en el build).

## 3. `next.config.ts` (este repo)

- `experimental.serverActions.bodySizeLimit` — subir límite respecto al default ~1 MB (evidencias / FormData).
- **`trailingSlash: true`** — con `basePath` y proxy, evita bucles **`308`** entre **`/pueaa`** y **`/pueaa/`** (`ERR_TOO_MANY_REDIRECTS` en el navegador).

## 4. Build y PM2

- Script `start`: `node ./node_modules/next/dist/bin/next start` (evita `next: not found` con PM2).
- **PM2** `cwd` = raíz del repo (donde está `.next` y `package.json`).
- Orden típico: `git pull` → `npm install` → `npx prisma migrate deploy` → `npm run build -- --webpack` → `pm2 restart …`
- Si **`next build` da `Bus error`** en VPS de ~2 GB: usar **más RAM**, **swap**, o **build en CI** y desplegar artefacto Linux x64.

## 5. Nginx (subruta `/pueaa`)

- `location ^~ /pueaa/` → `proxy_pass http://127.0.0.1:3000/pueaa/;` y cabeceras habituales.
- **`location = /pueaa`**: usar **`proxy_pass`** al upstream (misma URI base), **no** `return 301 /pueaa/;` si delante hay reglas (p. ej. Cloudflare) que quitan la barra final — evita bucles con el punto anterior.
- `client_max_body_size` coherente con subidas (y con `bodySizeLimit` de Next).

## 6. TLS (Let’s Encrypt)

- El `server` de `tod.com.co` / `www` debe usar un certificado cuyo **SAN** incluya **ambos** nombres si sirves `www`.
- Evitar servir **`tod.com.co-0001`** si solo lista el apex y el tráfico es por **`www`** (errores TLS en pruebas directas al origen).

## 7. Cloudflare (si aplica)

- Revisar reglas de **slash / normalización de URL** que no contradigan la canónica que impone Next (`trailingSlash: true` → rutas con `/` final bajo `/pueaa/`).

## 8. Pruebas rápidas en el servidor

```bash
curl -k -sI -L --max-redirs 3 -H "Host: www.tod.com.co" https://127.0.0.1/pueaa/ | head -n 25
pm2 logs pueaa --lines 40
```
