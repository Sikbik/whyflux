#!/usr/bin/env bash
# Build and publish Why Flux to whyflux.stache.beer.
#   deploy/deploy.sh            refresh the network snapshot, build, upload, reload nginx
#   deploy/deploy.sh --no-snap  skip the snapshot refresh
# Needs: ssh access as root to the `stache.beer` host alias (see ~/.ssh/config).
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=stache.beer
WEBROOT=/var/www/whyflux/html
SITE=/etc/nginx/sites-enabled/whyflux.stache.beer

if [[ "${1:-}" != "--no-snap" ]]; then
  npm run snapshot
fi
npm run build

# Upload into a fresh directory, then swap it in, so visitors never see a half-written site.
ssh "$HOST" "mkdir -p $WEBROOT.next && rm -rf $WEBROOT.next/*"
rsync -az --delete dist/ "$HOST:$WEBROOT.next/"
ssh "$HOST" "rm -rf $WEBROOT.prev && { [ -d $WEBROOT ] && mv $WEBROOT $WEBROOT.prev || true; } && mv $WEBROOT.next $WEBROOT"

# Keep the server's nginx config in step with the repo.
scp -q deploy/whyflux.stache.beer.conf "$HOST:$SITE"
ssh "$HOST" "nginx -t && systemctl reload nginx"

echo "Deployed: https://whyflux.stache.beer"
