#!/bin/bash

# Configuration
# Raspberry Pi Configuration
REMOTE_USER="shigehiro"
REMOTE_HOST="192.168.100.23"
# Path on Raspberry Pi
REMOTE_DIR="/home/${REMOTE_USER}/gakumas-tools/gakumas-tools/local-scripts/"
# Parent dir for local-run
REMOTE_ROOT_DIR="/home/${REMOTE_USER}/gakumas-tools/"

# Local Directory
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)/"
LOCAL_ROOT_DIR="$(cd "$(dirname "$0")/../../" && pwd)/"

# Files to sync (Scripts)
FILES=(
    "optimize-deck.mjs"
    "simulate-loadout-worker.mjs"
    "debug_candidates.mjs"
    "optimize-memories-parallel.mjs"
    "optimize-worker.mjs"
    "analyze-memories.mjs"
    "esm-loader.mjs"
    "boot.mjs"
    "worker-boot.mjs"
    "optimize-synthesis.mjs"
)

echo "Raspberry Pi ($REMOTE_HOST) へファイルを送信します..."

# 1. Sync Scripts
for file in "${FILES[@]}"; do
    SRC="${LOCAL_DIR}${file}"
    DEST="${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
    
    echo "Pushing: $file"
    rsync -avz "$SRC" "$DEST"
done

# 2. Sync Library (lib/ folder) - Recursive
echo "Pushing lib/ folder..."
rsync -avz "${LOCAL_DIR}lib" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

# 3. Sync local-run (in root)
echo "Pushing local-run..."
# LOCAL_ROOT_DIR is .../gakumas-tools/gakumas-tools/ (project root)
# sync-to-pi.sh is in .../gakumas-tools/gakumas-tools/local-scripts/
# LOCAL_ROOT_DIR defined as ../../ from script dir is actually .../gakumas-tools/ (workspace root) ?
# Let's check definition: LOCAL_ROOT_DIR="$(cd "$(dirname "$0")/../../" && pwd)/"
# If local-scripts is in gakumas-tools/gakumas-tools/local-scripts, then ../../ is gakumas-tools/
# But local-run is in gakumas-tools/gakumas-tools/local-run (project root)
# So it should be ../ from script dir.

# Let's redefine LOCAL_PROJECT_ROOT to be safe
LOCAL_PROJECT_ROOT="$(cd "$(dirname "$0")/../" && pwd)/"
rsync -avz "${LOCAL_PROJECT_ROOT}local-run" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ROOT_DIR}"

echo "同期完了!"
