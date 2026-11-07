#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Business Incubator - Automated Environment Setup"
echo "=========================================================="

echo "Checking required developer & DevOps tools..."

for tool in git docker node npm terraform; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "  [OK] $tool is installed: $($tool --version | head -n 1)"
    else
        echo "  [WARN] $tool is NOT installed or not in PATH."
    fi
done

if command -v ansible >/dev/null 2>&1; then
    echo "  [OK] ansible is installed: $(ansible --version | head -n 1)"
else
    echo "  [INFO] ansible can run via WSL2 Ubuntu environment."
fi

# Create .env files from templates
if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from template..."
    cp server/.env.example server/.env
fi

if [ ! -f ".env" ]; then
    echo "Creating root .env from template..."
    cp .env.example .env
fi

# Install dependencies
echo "Installing project dependencies..."
npm install
npm --prefix server install

echo "Running test suite to verify baseline functionality..."
npm test

echo "=========================================================="
echo " Setup complete! Next steps:"
echo "   make infra-init  -> Initialize Terraform"
echo "   make build       -> Build Docker images"
echo "   make deploy      -> Start containers"
echo "=========================================================="
