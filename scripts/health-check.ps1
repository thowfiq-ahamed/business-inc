# Windows PowerShell Health Check Script
$endpoints = @(
    @{ Name = "Business Incubator API"; Url = "http://localhost:5000/api/health" },
    @{ Name = "Prometheus Metrics";    Url = "http://localhost:5000/metrics" },
    @{ Name = "Prometheus UI";         Url = "http://localhost:9090/-/healthy" },
    @{ Name = "Grafana Dashboard UI";  Url = "http://localhost:3000/api/health" }
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Service Health Verification Check" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($ep in $endpoints) {
    Write-Host -NoNewline "Checking $($ep.Name) ($($ep.Url))... "
    try {
        $res = Invoke-WebRequest -Uri $ep.Url -TimeoutSec 3 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            Write-Host "[OK] Healthy (HTTP 200)" -ForegroundColor Green
        } else {
            Write-Host "[WARN] HTTP $($res.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[FAILED] Service not responding" -ForegroundColor Red
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
