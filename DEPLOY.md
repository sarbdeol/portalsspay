# SSPay CRM — Deployment

One-shot script to host on an Ubuntu 22.04 / 24.04 LTS server with:

- Frontend: `https://portal.sspay.online` (static Vite build, served by nginx)
- Backend: `https://api.sspay.online` (Django via gunicorn + nginx reverse proxy)
- Database: SQLite (`backend/db.sqlite3`)

## 1. Get the code onto the server

```bash
sudo apt-get update && sudo apt-get install -y git
git clone <your-repo-url> /opt/sspay-crm
cd /opt/sspay-crm
```

(Or `scp -r` the project folder up to `/opt/sspay-crm`.)

## 2. Run the script

```bash
sudo bash deploy.sh
```

This is idempotent — re-run it any time you pull new code.

What it does:

1. Installs nginx, certbot, Node.js 20, Python 3 venv tooling, ufw.
2. Creates `/etc/sspay-crm.env` (chmod 600) with a generated `DJANGO_SECRET_KEY`. Existing file is preserved.
3. Builds a Python venv at `backend/venv`, installs `requirements.txt`, runs `migrate` and `collectstatic`.
4. Builds the React frontend with `VITE_API_URL=https://api.sspay.online/api` so the bundle hits the right host.
5. Installs `sspay-api.service` (gunicorn on `127.0.0.1:8001`) and enables it.
6. Installs both nginx site configs and reloads nginx.
7. Opens ports 22/80/443 via ufw.
8. Seeds a demo admin (`admin@sspay.in / demo1234`) only if no superuser exists. **Change this password immediately.**

## 3. Point DNS

In your DNS provider for `sspay.online`, create two A records pointing to the server's public IP:

```
portal.sspay.online   A   <server-ip>
api.sspay.online   A   <server-ip>
```

Verify with `dig +short portal.sspay.online` and `dig +short api.sspay.online`.

## 4. Issue TLS certificates

Once DNS resolves to the server:

```bash
sudo certbot --nginx \
    -d portal.sspay.online -d api.sspay.online \
    --redirect --agree-tos -m admin@sspay.online
```

Certbot edits the nginx configs in-place to add the `listen 443 ssl` blocks and an HTTP→HTTPS redirect. Auto-renewal is enabled by the certbot package (`systemctl list-timers | grep certbot`).

## 5. Verify

```
https://portal.sspay.online          → React app loads
https://api.sspay.online/api/     → DRF API root JSON (401 if not authenticated)
https://api.sspay.online/admin/   → Django admin login
```

## Operations

| Task                          | Command                                       |
| ----------------------------- | --------------------------------------------- |
| Backend logs                  | `sudo journalctl -u sspay-api -f`             |
| Restart backend               | `sudo systemctl restart sspay-api`            |
| Reload nginx                  | `sudo systemctl reload nginx`                 |
| Backend shell                 | `sudo -u www-data backend/venv/bin/python backend/manage.py shell` |
| Create superuser              | `sudo -u www-data backend/venv/bin/python backend/manage.py createsuperuser` |
| Edit env (then restart)       | `sudo nano /etc/sspay-crm.env && sudo systemctl restart sspay-api` |
| Re-deploy after a `git pull`  | `sudo bash deploy.sh`                         |

## Backup

SQLite is one file:

```bash
sudo cp backend/db.sqlite3 /var/backups/sspay-$(date +%F).sqlite3
```

For real production volume, switch to Postgres later — Django's ORM means it's just a settings change.
