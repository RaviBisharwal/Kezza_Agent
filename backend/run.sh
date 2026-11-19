#!/usr/bin/env bash
set -euo pipefail

backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$backend_dir"

env_file="${KEZZA_BACKEND_ENV:-$backend_dir/.env}"
if [[ ! -f "$env_file" ]]; then
  echo "Backend environment file not found: $env_file" >&2
  echo "Copy backend/.env.example to backend/.env and configure the database." >&2
  exit 1
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Backend dependencies are not installed. Create backend/.venv and install backend/requirements.txt." >&2
  exit 1
fi

exec .venv/bin/python serve.py
