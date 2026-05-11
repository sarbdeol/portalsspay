#!/usr/bin/env bash
# SSPay CRM — one-shot deploy script for Ubuntu 22.04 / 24.04 LTS.
# Idempotent: safe to re-run after pulling new code.
#
# Run as root (or with sudo) from the project root:
#   sudo bash deploy.sh
#
# Assumes:
#   - Frontend at portal.sspay.com  (static Vite build served by nginx)
#   - Backend  at api.sspay.com  (Django via gunicorn behind nginx)
#   - SQLite database
#
# After the first run, point DNS A records for both subdomains at this server's
# public IP, then run:  sudo certbot --nginx -d portal.sspay.com -d api.sspay.com

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (try: sudo bash deploy.sh)" >&2
    exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/etc/sspay-crm.env"
FRONTEND_HOST="portal.sspay.com"
BACKEND_HOST="api.sspay.com"
API_URL="https://${BACKEND_HOST}/api"

log()  { printf "\n\033[1;36m==>\033[0m %s\n" "$*"; }
warn() { printf "\n\033[1;33m[!]\033[0m %s\n" "$*"; }

# ----------------------------------------------------------------------
log "Installing system packages"
# ----------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
    python3 python3-venv python3-pip \
    nginx \
    curl ca-certificates gnupg \
    certbot python3-certbot-nginx \
    ufw

# Node.js 20 LTS via NodeSource
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2-3)" -lt 20 ]]; then
    log "Installing Node.js 20 LTS"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# ----------------------------------------------------------------------
log "Preparing /etc/sspay-crm.env"
# ----------------------------------------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
    cat > "$ENV_FILE" <<EOF
DJANGO_SECRET_KEY=${SECRET}
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=${BACKEND_HOST}
DJANGO_CORS_ORIGINS=https://${FRONTEND_HOST}
DJANGO_CSRF_TRUSTED_ORIGINS=https://${FRONTEND_HOST},https://${BACKEND_HOST}
EOF
    chmod 600 "$ENV_FILE"
    chown root:www-data "$ENV_FILE"
    log "Created ${ENV_FILE} with a generated SECRET_KEY"
else
    log "${ENV_FILE} already exists — leaving it alone"
fi

# ----------------------------------------------------------------------
log "Setting up backend (venv, deps, migrations, static)"
# ----------------------------------------------------------------------
cd "$APP_DIR/backend"
if [[ ! -d venv ]]; then
    python3 -m venv venv
fi
venv/bin/pip install --upgrade pip wheel
venv/bin/pip install -r requirements.txt

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a
venv/bin/python manage.py migrate --noinput
venv/bin/python manage.py collectstatic --noinput

# Seed demo admin only if no superuser exists
HAS_SUPERUSER=$(venv/bin/python manage.py shell -c \
    "from django.contrib.auth.models import User; print(int(User.objects.filter(is_superuser=True).exists()))")
if [[ "$HAS_SUPERUSER" != "1" ]]; then
    warn "No superuser found. Seeding demo data (admin@sspay.in / demo1234)."
    warn "Change this password immediately via /admin/ or the CRM UI."
    venv/bin/python manage.py seed_demo
fi

# ----------------------------------------------------------------------
log "Building frontend (VITE_API_URL=${API_URL})"
# ----------------------------------------------------------------------
cd "$APP_DIR"
npm ci --silent || npm install --silent
VITE_API_URL="${API_URL}" npm run build

# ----------------------------------------------------------------------
log "Setting filesystem ownership"
# ----------------------------------------------------------------------
chown -R www-data:www-data \
    "$APP_DIR/dist" \
    "$APP_DIR/backend/staticfiles" \
    "$APP_DIR/backend/db.sqlite3" \
    "$APP_DIR/backend"

# ----------------------------------------------------------------------
log "Installing systemd unit (sspay-api.service)"
# ----------------------------------------------------------------------
sed "s|__APP_DIR__|${APP_DIR}|g" \
    "$APP_DIR/deploy/systemd/sspay-api.service" \
    > /etc/systemd/system/sspay-api.service
systemctl daemon-reload
systemctl enable sspay-api.service
systemctl restart sspay-api.service

# ----------------------------------------------------------------------
log "Installing nginx site configs"
# ----------------------------------------------------------------------
for site in portal.sspay.com api.sspay.com; do
    sed "s|__APP_DIR__|${APP_DIR}|g" \
        "$APP_DIR/deploy/nginx/${site}.conf" \
        > "/etc/nginx/sites-available/${site}"
    ln -sf "/etc/nginx/sites-available/${site}" "/etc/nginx/sites-enabled/${site}"
done
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ----------------------------------------------------------------------
log "Configuring firewall"
# ----------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
    ufw allow OpenSSH       >/dev/null
    ufw allow 'Nginx Full'  >/dev/null
    ufw --force enable      >/dev/null || true
fi

# ----------------------------------------------------------------------
log "Done."
# ----------------------------------------------------------------------
PUBLIC_IP=$(curl -s -4 ifconfig.me || true)
cat <<EOF

────────────────────────────────────────────────────────────────────
  Backend service status:
    systemctl status sspay-api.service

  Logs:
    journalctl -u sspay-api.service -f
    /var/log/nginx/access.log  /var/log/nginx/error.log

  Next steps (DNS):
    1. In your DNS provider for sspay.com, add A records:
         ${FRONTEND_HOST}   A   ${PUBLIC_IP:-<this-server's-IP>}
         ${BACKEND_HOST}    A   ${PUBLIC_IP:-<this-server's-IP>}
    2. Wait for DNS to propagate (dig +short ${FRONTEND_HOST}).
    3. Issue TLS certificates:
         sudo certbot --nginx \\
              -d ${FRONTEND_HOST} -d ${BACKEND_HOST} \\
              --redirect --agree-tos -m admin@sspay.com

  Re-deploy after code changes:
    sudo bash deploy.sh

  Seeded login (CHANGE THE PASSWORD):
    admin@sspay.in / demo1234
────────────────────────────────────────────────────────────────────
EOF
