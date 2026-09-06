# Deploy PUEAA en FOW Docker (`192.168.2.150`)

Stack: Docker Compose + Nginx Proxy Manager + Cloudflare Tunnel.
URL pública: `https://pueaa.tod.com.co` (puerto host **3102** → contenedor 3000).

## Requisitos en el host

- Usuario SSH `fow` con Docker
- Carpeta típica: `/home/fow/PUEAA-Sochagota`
- Volumen bind: `./data` → `/app/data` (SQLite + uploads)

## Deploy desde Windows

```powershell
$env:PUEAA_FOW_PASSWORD = "<secret>"
# opcional: $env:PUEAA_BACKUP_PROD = "E:\Proyectos\_backups\...\prod"
python scripts/deploy-fow-docker.py
```

El script:

1. Empaqueta código (sin `data/`, `.env`, `node_modules`)
2. Sube y restaura `app.db` + `uploads` si hay backup
3. `docker compose up --build -d`
4. Smoke: `http://127.0.0.1:3102/api/health/`

## Variables útiles

| Variable | Default |
|----------|---------|
| `PUEAA_FOW_HOST` | `192.168.2.150` |
| `PUEAA_FOW_USER` | `fow` |
| `PUEAA_FOW_PASSWORD` | (obligatoria) |
| `PUEAA_FOW_REMOTE` | `/home/fow/PUEAA-Sochagota` |

## Backup de datos

En el host:

```bash
cp -a /home/fow/PUEAA-Sochagota/data/app.db /home/fow/PUEAA-Sochagota/data-safety/app.db.$(date +%Y%m%d_%H%M%S)
```

Health: `https://pueaa.tod.com.co/api/health/` → `{"ok":true,"db":"sqlite"}`.

> Nota: el script `deploy-fow-host.sh` apunta al host Lightsail antiguo (PM2) y no debe usarse para este entorno Docker.
