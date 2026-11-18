#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Dang cap nhat du lieu tu data/*.csv..."
python3 tools/build.py
echo "Dang mo http://localhost:3000 ..."
(sleep 1 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null)) &
python3 -m http.server 3000
