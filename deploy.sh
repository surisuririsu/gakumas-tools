#!/bin/bash

TARGET="shigehiro@192.168.100.4"
TARGET_DIR="/mnt/NVMe/gakumas-tools/"

echo "Deploying to TrueNAS ($TARGET)..."

# pnpm に移行したため、.yarn の代わりに node_modules などを除外します
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='gakumas-tools/.next' \
  --exclude='.pnpm-store' \
  ./ $TARGET:$TARGET_DIR

echo "Restarting services on TrueNAS..."
# TrueNAS に SSH 接続し、Docker コンテナの再ビルド・再起動を行う
# (前回 TrueNAS 側で構築した docker-compose のパスに合わせています)
ssh $TARGET "cd $TARGET_DIR && docker compose build && docker compose up -d"

echo "Deployment complete!"
