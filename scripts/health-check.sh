#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Service Health Verification Check"
echo "=========================================================="

check_endpoint() {
    local name="$1"
    local url="$2"
    echo -n "Checking $name ($url)... "
    if curl -s -f "$url" >/dev/null; then
        echo "[OK] Healthy"
    else
        echo "[FAILED] Unreachable or HTTP error"
    fi
}

check_endpoint "Business Incubator API" "http://localhost:5000/api/health"
check_endpoint "Prometheus Metrics" "http://localhost:5000/metrics"
check_endpoint "Prometheus UI" "http://localhost:9090/-/healthy"
check_endpoint "Grafana Dashboard UI" "http://localhost:3000/api/health"

echo "=========================================================="
