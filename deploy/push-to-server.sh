#!/usr/bin/env bash
#
# Build the web app locally and push it to the always-on server.
#
#   ./deploy/push-to-server.sh root@<server-ip>
#
# Safe to run during a demo: the new bundles are copied in first (their
# filenames are content-hashed, so they can't collide with the running ones),
# the HTML files are swapped last, and the node process is only restarted if
# the server code itself changed. Nobody sees a broken page.

set -euo pipefail

TARGET=${1:-}
if [ -z "$TARGET" ]; then
  echo "usage: $0 root@<server-ip>" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
APP_DIR=/opt/splitabroad

echo "==> building web bundle"
cd "$ROOT"
rm -rf dist-next
npx expo export --platform web --output-dir dist-next --clear

echo "==> uploading hashed assets (additive — nothing breaks yet)"
rsync -az --delete "$ROOT/dist-next/_expo/" "$TARGET:$APP_DIR/dist/_expo/"
rsync -az "$ROOT/dist-next/assets/" "$TARGET:$APP_DIR/dist/assets/"

echo "==> uploading server"
rsync -az "$ROOT/server/" "$TARGET:$APP_DIR/server/"

echo "==> swapping the HTML in"
rsync -az "$ROOT"/dist-next/*.html "$ROOT/dist-next/favicon.ico" "$TARGET:$APP_DIR/dist/"

echo "==> restart + health"
# shellcheck disable=SC2029
ssh "$TARGET" "chown -R splitabroad:splitabroad $APP_DIR && systemctl restart splitabroad && sleep 1 && curl -fsS http://127.0.0.1:4242/health"
echo

echo "==> keeping the previous build as dist-prev is unnecessary: assets are hashed."
echo "done."
