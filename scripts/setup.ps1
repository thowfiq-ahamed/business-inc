# Windows PowerShell Setup Script
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Business Incubator - Automated Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$tools = @("git", "docker", "node", "npm", "terraform")

foreach ($t in $tools) {
    $cmd = Get-Command $t -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Host "  [OK] $t is installed: $($cmd.Source)" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] $t is missing or not in PATH." -ForegroundColor Yellow
    }
}

# Create .env files if missing
if (-not (Test-Path "server\.env")) {
    Write-Host "Creating server\.env from template..."
    Copy-Item "server\.env.example" "server\.env"
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating root .env from template..."
    Copy-Item ".env.example" ".env"
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
npm --prefix server install

Write-Host "Running automated tests..." -ForegroundColor Cyan
npm test

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Setup complete! Ready for build and deployment." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
