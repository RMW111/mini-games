#!/bin/sh

/usr/local/bin/backend &

nginx -g 'daemon off;'