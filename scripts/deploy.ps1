# Windows Deployment Script
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Business Incubator - Full Stack Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "1. Starting MongoDB database..." -ForegroundColor Yellow
docker compose up -d mongo

Write-Host "2. Building & Starting Application and Monitoring Stack..." -ForegroundColor Yellow
docker compose up -d --build app prometheus grafana

Write-Host "3. Verifying application health..." -ForegroundColor Yellow
$healthy = $false
for ($i=1; $i -le 20; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($healthy) {
    Write-Host "Application is healthy and running!" -ForegroundColor Green
} else {
    Write-Host "Application startup is pending; check logs with 'docker compose logs app'" -ForegroundColor Yellow
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Service Endpoints:" -ForegroundColor White
Write-Host "   Application: http://localhost:5000" -ForegroundColor Green
Write-Host "   Prometheus:  http://localhost:9090" -ForegroundColor Green
Write-Host "   Grafana:     http://localhost:3000 (admin/admin)" -ForegroundColor Green
Write-Host "   Metrics:     http://localhost:5000/metrics" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
