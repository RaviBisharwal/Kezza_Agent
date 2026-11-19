#!/usr/bin/env bash
set -euo pipefail

backend_pid=""

cleanup() {
  if [[ -n "$backend_pid" ]]; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT

npm run start:backend &
backend_pid=$!

npm run start
