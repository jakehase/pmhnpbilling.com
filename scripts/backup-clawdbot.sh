#!/bin/bash
# Nightly backup script for Clawdbot configs and memory
# Run via cron: 0 2 * * * /root/clawd/scripts/backup-clawdbot.sh

set -e

BACKUP_DIR="/root/clawd/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPO_URL="https://github.com/jakehase/clawdbot-backup.git"

echo "🦞 Starting Clawdbot backup: $TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Clawdbot config
cp ~/.clawdbot/clawdbot.json $BACKUP_DIR/clawdbot-config-$TIMESTAMP.json

# Backup MEMORY.md and memory folder
cp /root/clawd/MEMORY.md $BACKUP_DIR/MEMORY-$TIMESTAMP.md 2>/dev/null || true
cp -r /root/clawd/memory $BACKUP_DIR/memory-$TIMESTAMP 2>/dev/null || true

# Backup cron jobs
clawdbot cron list > $BACKUP_DIR/cron-jobs-$TIMESTAMP.txt 2>/dev/null || echo "Cron list failed" > $BACKUP_DIR/cron-jobs-$TIMESTAMP.txt

# Create latest symlinks
ln -sf $BACKUP_DIR/clawdbot-config-$TIMESTAMP.json $BACKUP_DIR/latest-config.json
ln -sf $BACKUP_DIR/MEMORY-$TIMESTAMP.md $BACKUP_DIR/latest-MEMORY.md

# Git commit and push
if [ -d "$BACKUP_DIR/.git" ]; then
    cd $BACKUP_DIR
    git add .
    git commit -m "Backup: $TIMESTAMP" || echo "Nothing to commit"
    git push origin main
    echo "✅ Backup pushed to GitHub"
else
    echo "⚠️  Git repo not initialized. Run: cd $BACKUP_DIR && git init && git remote add origin $REPO_URL"
fi

echo "🦞 Backup complete: $TIMESTAMP"
