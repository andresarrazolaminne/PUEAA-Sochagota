# Deploy PUEAA to FOW Lightsail host (preserves remote data/)
# Usage (from repo root, Git Bash or WSL): ./scripts/deploy-fow-host.sh
# Windows PowerShell equivalent documented in docs/deploy-fow-host.md

set -euo pipefail
HOST="${PUEAA_DEPLOY_HOST:-admin@34.201.34.121}"
KEY="${PUEAA_DEPLOY_KEY:-$HOME/Downloads/LightsailDefaultKey-us-east-1.pem}"
REMOTE_DIR="${PUEAA_REMOTE_DIR:-/home/admin/apps/PUEAA-Sochagota}"
BACKUP_DIR="${PUEAA_BACKUP_DIR:-/home/admin/apps/pueaa-data-safety}"

echo "==> Safety copy of remote data on host"
ssh -i "$KEY" "$HOST" "mkdir -p '$BACKUP_DIR' && cp -a '$REMOTE_DIR/data/app.db' '$BACKUP_DIR/app.db.\$(date +%Y%m%d_%H%M%S)' && tar -C '$REMOTE_DIR/data' -czf '$BACKUP_DIR/uploads.\$(date +%Y%m%d_%H%M%S).tar.gz' uploads"

echo "==> Sync code (exclude data, .env, node_modules, .next, .git)"
rsync -az --delete \
  --exclude data/ \
  --exclude .env \
  --exclude node_modules/ \
  --exclude .next/ \
  --exclude .git/ \
  -e "ssh -i $KEY" \
  ./ "$HOST:$REMOTE_DIR/"

echo "==> Install, migrate, build, restart PM2 on remote"
ssh -i "$KEY" "$HOST" "cd '$REMOTE_DIR' && npm ci && npx prisma migrate deploy && npx prisma generate && NODE_OPTIONS=--max-old-space-size=1536 npm run build -- --webpack && pm2 restart pueaa"

echo "==> Health check"
ssh -i "$KEY" "$HOST" "curl -sS -m 10 http://127.0.0.1:3000/pueaa/api/health || curl -sS -m 10 http://127.0.0.1:3000/api/health"
echo
echo "Deploy done."
