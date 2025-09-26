#!/bin/sh

# Запускаем бэкенд-сервер в фоновом режиме
# Путь соответствует тому, куда мы скопировали файл в Dockerfile
/usr/local/bin/games-backend &

# Запускаем Nginx на переднем плане
nginx -g 'daemon off;'