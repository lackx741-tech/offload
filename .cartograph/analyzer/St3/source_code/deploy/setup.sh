#!/bin/bash
# ═══════════════════════════════════════════════════════════
# StealthV26 WaaS — Production VPS Deployment Script
# ═══════════════════════════════════════════════════════════
#
# Run on a fresh Ubuntu 22.04+ VPS (min 2 vCPU / 4 GB RAM):
#   chmod +x deploy/setup.sh && sudo ./deploy/setup.sh yourdomain.com admin@yourdomain.com
#
# What it does:
#   1. System updates + swap (if < 4 GB RAM)
#   2. Firewall (ufw) — ports 22, 80, 443 only
#   3. fail2ban for SSH + Nginx brute-force protection
#   4. Docker + Docker Compose
#   5. Nginx reverse proxy with rate limiting
#   6. SSL certificate (Let's Encrypt via Certbot)
#   7. Environment validation
#   8. Build and launch all services via docker-compose.prod.yml
#
# Prerequisites:
#   - DNS A record for DOMAIN → this server's IP
#   - .env.local filled from .env.production.template

set -euo pipefail

DOMAIN="${1:?Usage: ./deploy/setup.sh yourdomain.com admin@yourdomain.com}"
EMAIL="${2:-admin@$DOMAIN}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] WARN:${NC} $*"; }
fail() { echo -e "${RED}[$(date +%H:%M:%S)] FATAL:${NC} $*"; exit 1; }

# ── Pre-flight checks ────────────────────────────────────
[[ $EUID -eq 0 ]] || fail "Must run as root (sudo)"
[[ -f "$PROJECT_DIR/.env.local" ]] || fail ".env.local not found. Copy .env.production.template first."

# Validate critical env vars
source <(grep -v '^#' "$PROJECT_DIR/.env.local" | grep -v '^$' | sed 's/^/export /')
[[ -n "${AUTH_SECRET:-}" ]] || fail "AUTH_SECRET is not set in .env.local"
[[ -n "${NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS:-}" ]] || warn "NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS not set — relay won't work"
[[ -n "${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:-}" ]] || warn "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set — Web3Modal won't work"

log "═══ StealthV26 Production Deployment for $DOMAIN ═══"

# ── Step 1: System updates + swap ────────────────────────
log "[1/8] System updates..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y

# Create 2GB swap if total memory < 4GB
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [[ $TOTAL_MEM_KB -lt 4000000 ]] && [[ ! -f /swapfile ]]; then
    log "Creating 2GB swap (low memory detected)..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Step 2: Firewall ─────────────────────────────────────
log "[2/8] Configuring firewall (ufw)..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# ── Step 3: fail2ban ─────────────────────────────────────
log "[3/8] Installing fail2ban..."
apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
port     = http,https
filter   = nginx-limit-req
logpath  = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# ── Step 4: Docker ───────────────────────────────────────
log "[4/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# ── Step 5: Nginx ────────────────────────────────────────
log "[5/8] Configuring Nginx..."
apt-get install -y nginx

# Inject rate-limiting zones into the http block (idempotent)
if ! grep -q "zone=api:" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api:10m rate=30r\/s;\n    limit_req_zone $binary_remote_addr zone=script:10m rate=10r\/s;' /etc/nginx/nginx.conf
fi

# Create certbot webroot
mkdir -p /var/www/certbot

# Deploy site config
cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/stealthv26
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/stealthv26
ln -sf /etc/nginx/sites-available/stealthv26 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Start Nginx on port 80 first (needed for Certbot HTTP challenge).
# Temporarily comment out the SSL server block for initial cert fetch.
nginx -t && systemctl enable nginx && systemctl restart nginx

# ── Step 6: SSL Certificate ──────────────────────────────
log "[6/8] Getting SSL certificate..."
apt-get install -y certbot python3-certbot-nginx

certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect

# Auto-renew (certbot installs a systemd timer by default; verify)
systemctl enable certbot.timer 2>/dev/null || true

nginx -t && systemctl reload nginx

# ── Step 7: Set domain in .env.local ─────────────────────
log "[7/8] Finalizing environment..."
cd "$PROJECT_DIR"

# Patch domain URLs in .env.local
sed -i "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN|" .env.local
sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" .env.local

# Ensure the keys exist if they weren't in the file
grep -q "NEXT_PUBLIC_BASE_URL" .env.local || echo "NEXT_PUBLIC_BASE_URL=https://$DOMAIN" >> .env.local
grep -q "NEXT_PUBLIC_APP_URL" .env.local  || echo "NEXT_PUBLIC_APP_URL=https://$DOMAIN" >> .env.local

# ── Step 8: Build and launch ─────────────────────────────
log "[8/8] Building and starting services..."
cd "$PROJECT_DIR"

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Wait for app to be healthy
log "Waiting for app health check..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
        log "App is healthy!"
        break
    fi
    if [[ $i -eq 30 ]]; then
        warn "App did not become healthy in 60s. Check: docker compose -f docker-compose.prod.yml logs app"
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} Deployment Complete${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "  Admin panel:  https://$DOMAIN"
echo "  Health check: https://$DOMAIN/api/health"
echo "  Script URL:   https://$DOMAIN/api/script?configId=<id>"
echo "  API base:     https://$DOMAIN/api"
echo ""
echo "  Services:     docker compose -f docker-compose.prod.yml ps"
echo "  Logs:         docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:      docker compose -f docker-compose.prod.yml restart"
echo "  Stop:         docker compose -f docker-compose.prod.yml down"
echo ""
echo "  Firewall:     ufw status"
echo "  fail2ban:     fail2ban-client status"
echo "  SSL renew:    certbot renew --dry-run"
echo ""
