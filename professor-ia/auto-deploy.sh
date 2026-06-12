#!/bin/bash
# Deploy automático do Professor IA.
#
# Roda na VPS via cron (a cada 5 min). Consulta o GitHub e, se a main
# avançou, faz pull e rebuilda o container — só quando algo dentro de
# professor-ia/ mudou. Pulls de outras partes do repo não reiniciam o app.
#
# Instalação (na VPS, como root):
#   chmod +x /opt/n8n-stack/meu-precificador/professor-ia/auto-deploy.sh
#   (crontab -l 2>/dev/null; echo '*/5 * * * * /opt/n8n-stack/meu-precificador/professor-ia/auto-deploy.sh') | crontab -
#
# Logs em /var/log/professor-ia-deploy.log
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
APP_DIR="$REPO_DIR/professor-ia"
LOG_FILE="/var/log/professor-ia-deploy.log"
LOCK_FILE="/tmp/professor-ia-deploy.lock"

log() { echo "[$(date '+%F %T')] $*" >> "$LOG_FILE"; }

# Evita duas execuções simultâneas (deploy demorado + cron de 5 min)
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

cd "$REPO_DIR"

# Nunca atropela trabalho local não commitado
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "AVISO: mudanças locais não commitadas — deploy pausado até resolver"
  exit 0
fi

git fetch origin main --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

[ "$LOCAL" = "$REMOTE" ] && exit 0

log "Atualizando $LOCAL -> $REMOTE"
git checkout main --quiet
git pull --ff-only origin main --quiet

if git diff --name-only "$LOCAL" "$REMOTE" | grep -q '^professor-ia/'; then
  cd "$APP_DIR"
  docker compose up -d --build >> "$LOG_FILE" 2>&1
  log "Container rebuildado e no ar"
else
  log "Pull feito; nada mudou em professor-ia/, container mantido"
fi
