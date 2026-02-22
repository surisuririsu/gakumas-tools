#!/bin/bash

# ==========================================
# Gakumas-Tools Database Backup Script
# Adapted for current environment
# ==========================================

# 1. Raspberry Pi Connection Info
PI_USER="shigehiro"
PI_HOST="192.168.100.23"

# 2. MongoDB Info
# Assumes MongoDB is running in a Docker container named "mongo" on the Pi
CONTAINER_NAME="mongodb"
DB_NAME="gakumas-tools"

# 3. Backup Destination
# Save to ./backups directory to keep root clean
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${DATE}.archive"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# 4. Retention (Days)
RETENTION_DAYS=30

# ==========================================
# Execution
# ==========================================

echo "[INFO] Connection: ${PI_USER}@${PI_HOST}"
echo "[INFO] Starting backup: ${FILENAME}"
echo "[INFO] Destination: $(pwd)/${BACKUP_DIR}"

# Execute mongodump inside Docker on Pi and stream to local file
ssh "${PI_USER}@${PI_HOST}" "docker exec ${CONTAINER_NAME} mongodump --db ${DB_NAME} --archive" > "${FILEPATH}"

# Check Result
if [ $? -eq 0 ] && [ -s "${FILEPATH}" ]; then
    echo "[SUCCESS] Backup completed successfully."
    ls -lh "${FILEPATH}"
    
    # Cleanup old backups
    echo "[INFO] Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "$BACKUP_DIR" -maxdepth 1 -name "backup_${DB_NAME}_*.archive" -type f -mtime +$RETENTION_DAYS -delete
    echo "[INFO] Cleanup complete."
else
    echo "[ERROR] Backup failed. File is empty or connection failed."
    if [ -f "${FILEPATH}" ]; then
        rm "${FILEPATH}"
    fi
    exit 1
fi
