param(
    [string]$HostName,
    [int]$Port,
    [string]$AdminUsername = "admin",
    [string]$AdminPassword = "admin123"
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
    param(
        [string]$Path,
        [string]$Key
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    return ($line -replace "^$Key=", "").Trim()
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"
$pythonExe = Join-Path $projectRoot "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Python venv not found at $pythonExe" -ForegroundColor Red
    exit 1
}

if (-not $HostName) {
    $HostName = Get-EnvValue -Path $envPath -Key "DB_HOST"
}
if (-not $Port) {
    $portText = Get-EnvValue -Path $envPath -Key "DB_PORT"
    if ($portText -and ($portText -as [int])) {
        $Port = [int]$portText
    } else {
        $Port = 6543
    }
}

if (-not $HostName) {
    Write-Host "No DB host found. Set DB_HOST in .env or pass -HostName." -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking TCP connectivity to ${HostName}:$Port" -ForegroundColor Cyan
$tcpResult = Test-NetConnection $HostName -Port $Port
if (-not $tcpResult.TcpTestSucceeded) {
    Write-Host "Supabase DB port is not reachable. Run scripts/check-supabase-connectivity.ps1 for diagnostics." -ForegroundColor Red
    exit 1
}

Write-Host "Connectivity OK. Running migrations..." -ForegroundColor Green
& $pythonExe "$projectRoot\manage.py" migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Creating/updating admin user..." -ForegroundColor Green
& $pythonExe "$projectRoot\manage.py" create_admin --username $AdminUsername --password $AdminPassword
if ($LASTEXITCODE -ne 0) {
    Write-Host "Admin creation failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Supabase bootstrap completed successfully." -ForegroundColor Green
