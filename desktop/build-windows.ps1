# ============================================================================
# Buldhana Police Bandobast — Windows Build Script
# ============================================================================
# Requirements (install once on your Windows build machine):
#   - Python 3.11 (64-bit)  https://www.python.org/downloads/
#   - Node.js 20 LTS        https://nodejs.org/
#   - Yarn                  npm i -g yarn
#   - Git                   https://git-scm.com/
#
# Run this script from an ADMIN PowerShell inside the repo:
#   cd C:\path\to\app\desktop
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\build-windows.ps1
#
# Output: desktop\dist\
#   - BuldhanaBandobast-Setup-1.0.0.exe  (installer)
#   - BuldhanaBandobast-Portable-1.0.0.exe
# ============================================================================

$ErrorActionPreference = "Stop"
$PSScriptRoot | Set-Location

$DesktopDir   = $PSScriptRoot
$Resources    = Join-Path $DesktopDir "resources"
$MongoDir     = Join-Path $Resources "mongodb"
$ServerDir    = Join-Path $Resources "server"
$PyBackendDir = Join-Path $DesktopDir "python-backend"
$FrontendDir  = Join-Path (Split-Path $DesktopDir -Parent) "frontend"
$RendererDir  = Join-Path $DesktopDir "renderer"

# Versions (bump as needed)
$MongoVersion = "7.0.14"      # Community Edition, Windows x86_64
$MongoUrl     = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-$MongoVersion.zip"

Write-Host "=== [1/5] Preparing folders ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Resources  | Out-Null
New-Item -ItemType Directory -Force -Path $MongoDir   | Out-Null
New-Item -ItemType Directory -Force -Path $ServerDir  | Out-Null

# ----------------------------------------------------------------------------
Write-Host "=== [2/5] Downloading portable MongoDB $MongoVersion ===" -ForegroundColor Cyan
# ----------------------------------------------------------------------------
$MongoZip = Join-Path $env:TEMP "mongodb-$MongoVersion.zip"
$MongoBin = Join-Path $MongoDir "bin\mongod.exe"

if (-not (Test-Path $MongoBin)) {
    if (-not (Test-Path $MongoZip)) {
        Write-Host "Downloading $MongoUrl ..."
        Invoke-WebRequest -Uri $MongoUrl -OutFile $MongoZip -UseBasicParsing
    }
    Write-Host "Extracting..."
    $tmp = Join-Path $env:TEMP "mongodb-extract-$MongoVersion"
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    Expand-Archive -Path $MongoZip -DestinationPath $tmp -Force
    $src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    # We only need mongod.exe (server). Skip the 200MB of shell/tools.
    Copy-Item -Recurse -Force (Join-Path $src.FullName "bin") $MongoDir
    # Trim to just mongod.exe + dependent DLLs (if any). mongod.exe is
    # statically linked on modern Windows builds, so keeping the whole bin/
    # is safe and still ~80 MB.
    Remove-Item -Recurse -Force $tmp
} else {
    Write-Host "MongoDB already present: $MongoBin"
}

# ----------------------------------------------------------------------------
Write-Host "=== [3/5] Building React frontend (renderer/) ===" -ForegroundColor Cyan
# ----------------------------------------------------------------------------
Push-Location $FrontendDir
$env:REACT_APP_BACKEND_URL = ""   # relative /api calls (same-origin with backend)
yarn install --frozen-lockfile
yarn build
Pop-Location

if (Test-Path $RendererDir) { Remove-Item -Recurse -Force $RendererDir }
Copy-Item -Recurse -Force (Join-Path $FrontendDir "build") $RendererDir

# ----------------------------------------------------------------------------
Write-Host "=== [4/5] Building backend with PyInstaller ===" -ForegroundColor Cyan
# ----------------------------------------------------------------------------
Push-Location $PyBackendDir
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
pyinstaller bandobast-server.spec --clean --noconfirm
deactivate
Pop-Location

$BuiltExe = Join-Path $PyBackendDir "dist\bandobast-server.exe"
if (-not (Test-Path $BuiltExe)) {
    throw "PyInstaller did not produce $BuiltExe"
}
Copy-Item -Force $BuiltExe (Join-Path $ServerDir "bandobast-server.exe")

# ----------------------------------------------------------------------------
Write-Host "=== [5/5] Packaging with electron-builder ===" -ForegroundColor Cyan
# ----------------------------------------------------------------------------
Push-Location $DesktopDir
yarn install
yarn dist
Pop-Location

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE" -ForegroundColor Green
Write-Host "  Output: $DesktopDir\dist\" -ForegroundColor Green
Get-ChildItem (Join-Path $DesktopDir "dist") -Filter "*.exe" | ForEach-Object {
    Write-Host "    - $($_.Name)   ($([math]::Round($_.Length/1MB,1)) MB)" -ForegroundColor Green
}
Write-Host "================================================================" -ForegroundColor Green
