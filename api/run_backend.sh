#!/bin/bash

PORT=5001

# Check if port is in use
if lsof -i tcp:$PORT >/dev/null; then
  echo "❌ Port $PORT is already in use. Backend might already be running."
  exit 1
fi

# Go to script directory
cd "$(dirname "$0")" || exit 1

# Create venv if missing
if [ ! -d "env" ]; then
  echo "🔧 Creating virtual environment..."
  python3 -m venv env
fi

# Activate and install
source env/bin/activate
pip install -r requirements.txt

# Clean log and start backend
rm -f api.log
echo "🚀 Starting backend..."
python3 api.py 2>&1 | tee api.log

