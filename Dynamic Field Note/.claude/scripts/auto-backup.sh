#!/bin/bash

# Claude Code - 自動バックアップスクリプト
# 編集前にファイルをバックアップ

BACKUP_DIR=".claude/backups"
FILE="$1"

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

# ファイルが存在する場合のみバックアップ
if [ -f "$FILE" ]; then
    BASENAME=$(basename "$FILE")
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/${BASENAME}.backup-${TIMESTAMP}"

    cp "$FILE" "$BACKUP_PATH"
    echo "✅ Backup created: $BACKUP_PATH"

    # 7日以上古いバックアップを削除
    find "$BACKUP_DIR" -type f -mtime +7 -delete
    echo "🧹 Old backups cleaned (>7 days)"
else
    echo "⚠️  File not found: $FILE"
fi
