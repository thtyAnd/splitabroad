#!/usr/bin/env bash
#
# One-shot bootstrap for a fresh Ubuntu 22.04/24.04 box (Kamatera, Hetzner, any VPS).
# Run it ON THE SERVER as root:
#
#   ssh root@<server-ip>
#   bash server-setup.sh
#
# It installs Node, creates /opt/splitabroad, registers a systemd service that
# restarts on boot and on crash, and puts Caddy in front for HTTPS.
#
# The app files themselves are pushed separately — see deploy/push-to-server.sh.

set -euo pipefail

APP_DIR=/opt/splitabroad
SERVICE=splitabroad
PORT=4242

echo "==> packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates rsync ufw >/dev/null

echo "==> node 22"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
node -v

echo "==> caddy (automatic HTTPS)"
if ! command -v caddy >/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https >/dev/null
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -qq
  apt-get install -y -qq caddy >/dev/null
fi

echo "==> app dir"
mkdir -p "$APP_DIR"/{dist,server}
id -u splitabroad >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin splitabroad
chown -R splitabroad:splitabroad "$APP_DIR"

echo "==> systemd unit"
cat >/etc/systemd/system/${SERVICE}.service <<UNIT
[Unit]
Description=splitabroad demo server
After=network.target

[Service]
Type=simple
User=splitabroad
WorkingDirectory=${APP_DIR}
Environment=PORT=${PORT}
Environment=WEB_ROOT=${APP_DIR}/dist
# Add a Stripe *test* key here later if you wire up real Terminal tokens:
# Environment=STRIPE_SECRET_KEY=sk_test_...
ExecStart=/usr/bin/node ${APP_DIR}/server/index.mjs
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable ${SERVICE} >/dev/null

echo "==> caddy site"
# Pick the hostname: a real domain if DEMO_DOMAIN is set, otherwise sslip.io,
# which resolves <ip>.sslip.io to the IP itself and still gets a real Let's
# Encrypt certificate — so the demo link is https:// with no domain purchase.
IP=$(curl -fsS4 https://ifconfig.me || hostname -I | awk '{print $1}')
HOST=${DEMO_DOMAIN:-${IP}.sslip.io}

cat >/etc/caddy/Caddyfile <<CADDY
${HOST} {
    encode gzip
    reverse_proxy 127.0.0.1:${PORT}
}

# Plain IP over http, as a fallback if DNS/TLS misbehaves in a venue.
:80 {
    encode gzip
    reverse_proxy 127.0.0.1:${PORT}
}
CADDY

systemctl restart caddy

echo "==> firewall"
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
yes | ufw enable >/dev/null 2>&1 || true

cat <<DONE

────────────────────────────────────────────────────────
Server ready.

  app URL   https://${HOST}
  pay URL   https://${HOST}/pay
  health    https://${HOST}/health

Nothing is served yet — push the build from your Mac:

  ./deploy/push-to-server.sh root@${IP}

────────────────────────────────────────────────────────
DONE
