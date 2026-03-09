#!/bin/bash

# Configuration
# Raspberry Pi Configuration
REMOTE_USER="shigehiro"
REMOTE_HOST="192.168.100.23"
# Assumed Root on Remote
REMOTE_PROJECT_ROOT="/home/${REMOTE_USER}/gakumas-tools"

# Local Directory setup
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

echo "Raspberry Pi ($REMOTE_HOST) から同期を開始します..."
echo "ユーザー: $REMOTE_USER"

# 1. Sync local-scripts
# Using -avz to sync recursively and preserve attributes, exclude node_modules
echo "--- Syncing local-scripts ---"
rsync -avz --exclude 'node_modules' "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PROJECT_ROOT}/gakumas-tools/local-scripts/" "${SCRIPT_DIR}/"

# 2. Sync packages/gakumas-data (Crucial for data files used by optimize-deck.mjs)
echo "--- Syncing packages/gakumas-data ---"
# Ensure local directory exists
mkdir -p "${REPO_ROOT}/packages/gakumas-data"
rsync -avz --exclude 'node_modules' "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PROJECT_ROOT}/packages/gakumas-data/" "${REPO_ROOT}/packages/gakumas-data/"

# 3. Sync local-run (Root script)
echo "--- Syncing local-run ---"
rsync -avz "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PROJECT_ROOT}/local-run" "${REPO_ROOT}/"
chmod +x "${REPO_ROOT}/local-run"

echo "同期完了!"
