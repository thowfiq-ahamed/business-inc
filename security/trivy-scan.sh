#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${1:-business-inc:latest}"
REPORT_DIR="${2:-security/reports}"
FAIL_ON_CRITICAL="${3:-false}"

mkdir -p "${REPORT_DIR}"
REPORT_TXT="${REPORT_DIR}/trivy-scan-$(date +%Y%m%d%H%M%S).txt"
REPORT_JSON="${REPORT_DIR}/trivy-scan-$(date +%Y%m%d%H%M%S).json"

echo "=========================================================="
echo " Starting Trivy Security Scan on: ${IMAGE_NAME}"
echo "=========================================================="

EXIT_CODE=0
if [ "${FAIL_ON_CRITICAL}" = "true" ]; then
    EXIT_CODE=1
fi

if command -v trivy >/dev/null 2>&1; then
    echo "Running local Trivy CLI..."
    trivy image \
        --severity HIGH,CRITICAL \
        --format table \
        --output "${REPORT_TXT}" \
        "${IMAGE_NAME}" || true

    trivy image \
        --severity HIGH,CRITICAL \
        --format json \
        --output "${REPORT_JSON}" \
        "${IMAGE_NAME}" || true
else
    echo "Trivy binary not found in PATH; running via official Docker container..."
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$(pwd)/${REPORT_DIR}:/reports" \
        aquasec/trivy:latest image \
        --severity HIGH,CRITICAL \
        --format table \
        --output "/reports/$(basename "${REPORT_TXT}")" \
        "${IMAGE_NAME}" || true
fi

echo "=========================================================="
echo " Trivy Scan Completed!"
echo " Text Report: ${REPORT_TXT}"
echo " JSON Report: ${REPORT_JSON}"
echo "=========================================================="
if [ -f "${REPORT_TXT}" ]; then
    head -n 40 "${REPORT_TXT}"
fi
