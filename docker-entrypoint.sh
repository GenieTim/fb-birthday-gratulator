#!/bin/sh
set -e

# If first arg is a known CLI command, forward to bin/run.js
if [ "$1" = 'congratulate' ] || [ "$1" = 'gratulate' ] || [ "$1" = 'config' ] || [ "$1" = 'version' ] || [ "$1" = 'help' ]; then
  exec node bin/run.js "$@"
fi

# If first arg is a flag (starts with -), pass to daemon
if [ "${1#-}" != "$1" ]; then
  exec node bin/daemon.js "$@"
fi

# If no arguments given, default to running daemon
if [ $# -eq 0 ]; then
  exec node bin/daemon.js
fi

exec "$@"
