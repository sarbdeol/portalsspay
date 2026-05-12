#!/usr/bin/env bash
# RD Panel CRM — one-shot deploy script for Ubuntu 22.04 / 24.04 LTS.
# Idempotent: safe to re-run after pulling new code.
#
# Run as root (or with sudo) from the project root:
#   sudo bash deploy.sh
#
# Assumes:
#   - Frontend at rdlink.online       (static Vite build served by nginx)
#   - Backend  at api.rdlink.online   (Django via gunicorn behind nginx)
#   - SQLite database
#
# After the first run, point DNS A records for both hostnames at this server's
# public IP, then run:  sudo certbot --nginx -d rdlink.online -d api.rdlink.online

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (try: sudo bash deploy.sh)" >&2
    exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/etc/sspay-crm.env"
FRONTEND_HOST="rdlink.online"
BACKEND_HOST="api.rdlink.online"
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
DJANGO_MEDIA_ROOT=/var/lib/sspay-crm/media
EOF
    chmod 600 "$ENV_FILE"
    chown root:www-data "$ENV_FILE"
    log "Created ${ENV_FILE} with a generated SECRET_KEY"
else
    log "${ENV_FILE} already exists — preserving SECRET_KEY but updating hosts"
    # Backfill DJANGO_MEDIA_ROOT for installs that pre-date KYC uploads
    if ! grep -q '^DJANGO_MEDIA_ROOT=' "$ENV_FILE"; then
        echo 'DJANGO_MEDIA_ROOT=/var/lib/sspay-crm/media' >> "$ENV_FILE"
    fi
    # Migrate old sspay.online hostnames to the new rdlink.online domain.
    # Safe / idempotent — running again after migration is a no-op.
    sed -i \
        -e 's|api\.sspay\.online|api.rdlink.online|g' \
        -e 's|portal\.sspay\.online|rdlink.online|g' \
        "$ENV_FILE"
fi

# ----------------------------------------------------------------------
log "Preparing media directory for user uploads"
# ----------------------------------------------------------------------
mkdir -p /var/lib/sspay-crm/media
chown -R www-data:www-data /var/lib/sspay-crm
chmod 755 /var/lib/sspay-crm /var/lib/sspay-crm/media

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
    warn "No superuser found. Seeding demo data (admin@rdlink.online / demo1234)."
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
# If certbot has already added a `listen 443 ssl` block to an existing
# site config, leave it alone — overwriting would wipe the HTTPS server
# block and force you to re-run certbot every deploy.
for site in "${FRONTEND_HOST}" "${BACKEND_HOST}"; do
    target="/etc/nginx/sites-available/${site}"
    if [[ -f "$target" ]] && grep -q "managed by Certbot\|listen 443 ssl" "$target"; then
        log "Keeping existing ${target} (certbot-managed)"
    else
        sed "s|__APP_DIR__|${APP_DIR}|g" \
            "$APP_DIR/deploy/nginx/${site}.conf" \
            > "$target"
    fi
    ln -sf "$target" "/etc/nginx/sites-enabled/${site}"
done

# Patch the API site to ensure a /media/ location block exists in EVERY
# server{} block — certbot may have duplicated the server block before we
# added media support, so the SSL variant could be missing the alias.
api_conf="/etc/nginx/sites-available/${BACKEND_HOST}"
if [[ -f "$api_conf" ]]; then
    NGINX_API_CONF="$api_conf" python3 - <<'PY'
import os
import re

path = os.environ["NGINX_API_CONF"]
with open(path) as f:
    text = f.read()

media_block = """    location /media/ {
        alias /var/lib/sspay-crm/media/;
        access_log off;
        add_header X-Content-Type-Options nosniff;
    }

"""

# Walk through each `server { ... }` block. If it doesn't contain `location /media/`,
# inject the block right before the first `location / {` (the proxy_pass catch-all).
def patch_block(match):
    block = match.group(0)
    if "location /media/" in block:
        return block
    return re.sub(
        r"(\n[ \t]*location / \{)",
        "\n" + media_block.rstrip("\n") + r"\1",
        block,
        count=1,
    )

new_text = re.sub(
    r"server\s*\{(?:[^{}]|\{[^{}]*\})*\}",
    patch_block,
    text,
)

if new_text != text:
    with open(path, "w") as f:
        f.write(new_text)
    print(f"Patched /media/ into {path}")
PY
fi

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

HAS_CERT=0
if [[ -d "/etc/letsencrypt/live/${FRONTEND_HOST}" ]]; then
    HAS_CERT=1
fi

cat <<EOF

────────────────────────────────────────────────────────────────────
  Backend service status:
    systemctl status sspay-api.service

  Logs:
    journalctl -u sspay-api.service -f
    /var/log/nginx/access.log  /var/log/nginx/error.log

  Re-deploy after code changes:
    sudo bash deploy.sh

  Seeded login (CHANGE THE PASSWORD):
    admin@rdlink.online / demo1234
EOF

if [[ "$HAS_CERT" == "1" ]]; then
    cat <<EOF

  TLS: existing Let's Encrypt cert for ${FRONTEND_HOST} detected — nothing to do.
────────────────────────────────────────────────────────────────────
EOF
else
    cat <<EOF

  Next steps (DNS + TLS — first install only):
    1. In your DNS provider for rdlink.online, add A records:
         ${FRONTEND_HOST}   A   ${PUBLIC_IP:-<this-server's-IP>}
         ${BACKEND_HOST}    A   ${PUBLIC_IP:-<this-server's-IP>}
    2. Wait for DNS to propagate (dig +short ${FRONTEND_HOST}).
    3. Issue TLS certificates:
         sudo certbot --nginx \\
              -d ${FRONTEND_HOST} -d ${BACKEND_HOST} \\
              --redirect --agree-tos -m admin@rdlink.online
────────────────────────────────────────────────────────────────────
EOF
fi
