#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
STATIC="$ROOT/backend/static"

echo "Building frontend..."
cd "$FRONTEND"
npm install
npm run build

echo "Copying dist -> backend/static"
rm -rf "$STATIC"
cp -r dist "$STATIC"
echo "Done: $(find "$STATIC" -type f | wc -l) files in backend/static"
