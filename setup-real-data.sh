#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Folder backend/frontend tidak ditemukan di: $ROOT_DIR"
  exit 1
fi

echo "[1/4] Clear config Laravel"
cd "$BACKEND_DIR"
php artisan config:clear

echo "[2/4] Reset database + seed (MySQL dari backend/.env)"
php artisan migrate:fresh --seed

echo "[3/4] Build frontend untuk backend"
cd "$FRONTEND_DIR"
npm run build:backend

echo "[4/4] Selesai"
echo "Backend URL: http://127.0.0.1:8000"
echo "Frontend dev URL (opsional): http://localhost:3000"
