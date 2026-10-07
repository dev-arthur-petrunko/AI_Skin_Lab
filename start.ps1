# AI Skin Lab — launch script (Windows PowerShell)
# 1) Syncs the source price.xlsx into ./data (mounted into Docker)
# 2) Starts backend + frontend via docker-compose
# 3) Optionally starts a Cloudflare Tunnel (requires `cloudflared` in PATH)
#
# Usage:
#   .\start.ps1                 # docker only
#   .\start.ps1 -Tunnel my-tun  # docker + cloudflared tunnel run my-tun

param(
    [string]$Tunnel = ""
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "== AI Skin Lab: syncing Excel ==" -ForegroundColor Cyan
if (Test-Path ".\price.xlsx") {
    New-Item -ItemType Directory -Force -Path ".\data" | Out-Null
    Copy-Item ".\price.xlsx" ".\data\price.xlsx" -Force
    Write-Host "price.xlsx -> data\price.xlsx"
} elseif (-not (Test-Path ".\data\price.xlsx")) {
    Write-Warning "price.xlsx not found in project root or ./data — backend will start with an empty catalog."
}

Write-Host "== docker compose up -d ==" -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "docker compose failed" }

Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000/api/health" -ForegroundColor Green

if ($Tunnel -ne "") {
    Write-Host "== cloudflared tunnel run $Tunnel ==" -ForegroundColor Cyan
    cloudflared tunnel run $Tunnel
} else {
    Write-Host ""
    Write-Host "To expose to the internet run one of:" -ForegroundColor Yellow
    Write-Host "  cloudflared tunnel run <tunnel-name>"
    Write-Host "  ngrok http 3000"
}
