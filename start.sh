#!/bin/sh

/usr/local/bin/games-backend &
nginx -g 'daemon off;' &

wait -n
exit $?