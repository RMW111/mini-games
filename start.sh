#!/bin/sh

# Создаем файл для логов
touch /var/log/backend.log

# Запускаем бэкенд в фоновом режиме, перенаправляя ВЕСЬ его вывод в этот файл
/usr/local/bin/games-backend > /var/log/backend.log 2>&1 &

# Даем бэкенду секунду на запуск или падение
sleep 2

# === ДЛЯ ОТЛАДКИ ===
echo "--- Backend Log ---"
cat /var/log/backend.log
echo "-------------------"
# =====================

# Запускаем Nginx на переднем плане
echo "Starting Nginx..."
nginx -g 'daemon off;'