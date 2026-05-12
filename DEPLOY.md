# RD Panel CRM — Deployment

One-shot script to host on an Ubuntu 22.04 / 24.04 LTS server with:

- Frontend: `https://rdlink.online` (static Vite build, served by nginx)
- Backend: `https://api.rdlink.online` (Django via gunicorn + nginx reverse proxy)
- Database: SQLite (`/opt/rd-panel/backend/db.sqlite3` or wherever you cloned)
- Media (KYC uploads): `/var/lib/sspay-crm/media/` (outside the repo so `git pull` never touches it)

## 1. Get the code onto the server

```bash
sudo apt-get update && sudo apt-get install -y git
git clone <your-repo-url> /opt/rd-panel
cd /opt/rd-panel
```

(Or `scp -r` the project folder up to the server.)

## 2. Run the script

```bash
sudo bash deploy.sh
```

This is idempotent — re-run it any time you pull new code. The script will:

1. Install nginx, certbot, Node.js 20, Python 3 venv tooling, ufw.
2. Create `/etc/sspay-crm.env` (chmod 600) with a generated `DJANGO_SECRET_KEY`. If the file already exists, it preserves the secret but **migrates old `sspay.online` hostnames to `rdlink.online`** in-place.
3. Build a Python venv at `backend/venv`, install `requirements.txt`, run `migrate` and `collectstatic`.
4. Build the React frontend with `VITE_API_URL=https://api.rdlink.online/api` so the bundle hits the right host.
5. Install `sspay-api.service` (gunicorn on `127.0.0.1:8005`) and enable it.
6. Install both nginx site configs and patch a `/media/` location into every server block (idempotent — runs every deploy).
7. Open ports 22/80/443 via ufw.
8. Seed a demo admin (`admin@rdlink.online / demo1234`) only if no superuser exists. **Change this password immediately.**

## 3. Point DNS

In your DNS provider for `rdlink.online`, create two A records pointing to the server's public IP:

```
rdlink.online       A   <server-ip>
api.rdlink.online   A   <server-ip>
```

Verify with `dig +short rdlink.online` and `dig +short api.rdlink.online`.

## 4. Issue TLS certificates

Once DNS resolves to the server:

```bash
sudo certbot --nginx \
    -d rdlink.online -d api.rdlink.online \
    --redirect --agree-tos -m admin@rdlink.online
```

Certbot edits the nginx configs in-place to add the `listen 443 ssl` blocks and an HTTP→HTTPS redirect. Auto-renewal is enabled by the certbot package (`systemctl list-timers | grep certbot`). The next `deploy.sh` run will keep the certbot edits intact (it detects them and skips overwriting).

## 5. Verify

```
https://rdlink.online             → React app loads
https://api.rdlink.online/api/    → DRF API root JSON (401 if not authenticated)
https://api.rdlink.online/admin/  → Django admin login
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

## Migrating an existing sspay.online install to rdlink.online

If you were previously running this on `sspay.online`, here's the one-time migration.

```bash
# 1. Add DNS A records for rdlink.online and api.rdlink.online (point to the server IP)
dig +short rdlink.online       # must resolve to the server IP before proceeding
dig +short api.rdlink.online

# 2. Pull the new code
cd /opt/rd-panel   # or wherever your repo lives
git pull

# 3. Re-deploy. This installs the new nginx configs and migrates env hosts.
sudo bash deploy.sh

# 4. (Optional) Disable the old nginx site configs so they don't keep responding
sudo rm -f /etc/nginx/sites-enabled/portal.sspay.online \
           /etc/nginx/sites-enabled/api.sspay.online
sudo systemctl reload nginx

# 5. Issue a fresh TLS certificate for the new domain
sudo certbot --nginx \
    -d rdlink.online -d api.rdlink.online \
    --redirect --agree-tos -m admin@rdlink.online --non-interactive

# 6. (Optional) Revoke / remove the old certificates
sudo certbot delete --cert-name portal.sspay.online 2>/dev/null || true
sudo certbot delete --cert-name api.sspay.online 2>/dev/null || true

# 7. Verify
curl -I https://rdlink.online
curl -I https://api.rdlink.online/api/
```

DNS for `sspay.online` will keep working until you remove those A records — feel free to point them at the same server for a transition period if you have outstanding links to migrate.

## Backup

SQLite + media live outside the repo. Snapshot both:

```bash
sudo cp /opt/rd-panel/backend/db.sqlite3 /var/backups/rdpanel-$(date +%F).sqlite3
sudo tar czf /var/backups/rdpanel-media-$(date +%F).tgz -C /var/lib sspay-crm/media
```

For production volume, switch to Postgres later — Django's ORM makes it a settings change.
