#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Business Incubator - Full Stack Deployment"
echo "=========================================================="

echo "1. Checking/Starting Infrastructure..."
docker compose up -d mongo

echo "2. Building and Starting Application & Monitoring..."
docker compose up -d --build app prometheus grafana

echo "3. Waiting for services to become healthy..."
for i in {1..20}; do
    if curl -s -f http://localhost:5000/api/health >/dev/null; then
        echo "Application is UP and responding on http://localhost:5000"
        break
    fi
    echo "Waiting for app to start ($i/20)..."
    sleep 3
done

echo "=========================================================="
echo " Deployment Summary:"
echo "   Application: http://localhost:5000"
echo "   Prometheus:  http://localhost:9090"
echo "   Grafana:     http://localhost:3000 (admin / admin)"
echo "   Metrics:     http://localhost:5000/metrics"
echo "=========================================================="
