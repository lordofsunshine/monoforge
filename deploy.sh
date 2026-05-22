#!/bin/bash

# Скрипт для деплоя на сервер
# Рекомендуется настроить SSH-ключи, чтобы не вводить пароль при каждом запуске.

SERVER="root@84.21.173.170"
TARGET_DIR="/root/monoforge"

echo "=== 1. Копирование файлов на сервер ==="
# Используем rsync, чтобы копировать только измененные файлы, исключая локальные сборки и секреты (если они на сервере свои)
rsync -avz --progress --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude 'monoforge-github-source' ./ $SERVER:$TARGET_DIR

echo "=== 2. Сборка, тесты и деплой на сервере ==="
ssh $SERVER << 'EOF'
  cd /root/monoforge
  
  echo "Установка зависимостей..."
  npm install
  
  echo "Запуск тестов..."
  npm run test || { echo "Тесты не прошли! Деплой остановлен."; exit 1; }
  
  echo "Сборка проекта..."
  npm run build
  
  echo "Перезапуск приложения..."
  # Если вы используете pm2, раскомментируйте строку ниже и замените команду
  # pm2 restart monoforge || npm run start
EOF

echo "=== Деплой успешно завершен! ==="