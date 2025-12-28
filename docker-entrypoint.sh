#!/bin/sh
set -e

echo "Starting NetConfig Manager..."
exec node dist/index.cjs
