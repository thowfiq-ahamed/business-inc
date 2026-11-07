param (
    [string]$ImageName = "business-inc:latest",
    [string]$ReportDir = "security/reports",
    [switch]$FailOnCritical = $false
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$reportTxt = Join-Path $ReportDir "trivy-scan-$timestamp.txt"
$reportJson = Join-Path $ReportDir "trivy-scan-$timestamp.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Trivy Security Scan on: $ImageName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$trivyCli = Get-Command "trivy" -ErrorAction SilentlyContinue

if ($trivyCli) {
    Write-Host "Running local Trivy CLI..."
    trivy image --severity HIGH,CRITICAL --format table --output $reportTxt $ImageName
    trivy image --severity HIGH,CRITICAL --format json --output $reportJson $ImageName
} else {
    Write-Host "Trivy CLI not locally installed, executing via aquasec/trivy container..."
    $absReports = Resolve-Path $ReportDir
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "${absReports}:/reports" aquasec/trivy:latest image --severity HIGH,CRITICAL --format table --output "/reports/trivy-scan-$timestamp.txt" $ImageName
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Trivy Scan Completed!" -ForegroundColor Green
Write-Host " Text Report: $reportTxt" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

if (Test-Path $reportTxt) {
    Get-Content $reportTxt | Select-Object -First 30
}
