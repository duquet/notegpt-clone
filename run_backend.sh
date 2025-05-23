#!/bin/bash

cd api || exit 1

# Remove old virtual environment and create a new one
rm -rf env
python3 -m venv env
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Remove old log and start backend
rm -f api.log
echo "Starting backend..."
python3 api.py 2>&1 | tee api.log

