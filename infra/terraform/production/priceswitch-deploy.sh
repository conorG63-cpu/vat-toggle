#!/bin/sh
set -eu

APP_DIR=/opt/priceswitch

cd "$APP_DIR"
git fetch --quiet origin main

current_commit=$(git rev-parse HEAD)
target_commit=$(git rev-parse origin/main)

if [ "$current_commit" = "$target_commit" ]; then
  exit 0
fi

# /opt/priceswitch is a deployment directory. The server-only .env file is
# ignored by Git and is deliberately not removed by this update.
git reset --hard "$target_commit"
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
