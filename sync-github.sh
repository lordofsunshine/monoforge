#!/bin/bash

# Скрипт для безопасного копирования файлов в папку для GitHub.
# Исключает все конфигурации, логи, временные файлы и переменные окружения.

SOURCE_DIR="."
TARGET_DIR="./monoforge-github-source"

echo "=== Синхронизация кода для публичного GitHub-репозитория ==="
rsync -av --progress --delete "$SOURCE_DIR/" "$TARGET_DIR/" \
    --exclude="node_modules/" \
    --exclude=".next/" \
    --exclude=".git/" \
    --exclude=".env" \
    --exclude=".env.*" \
    --exclude="*.zip" \
    --exclude="monoforge-github-source/"

echo "=== Папка успешно обновлена! Проверьте, что в ней нет секретов перед коммитом. ==="