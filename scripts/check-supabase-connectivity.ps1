param(
    [string]$HostName,
    [int]$Port
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
    Write-Host "No DB host found. Provide -HostName or set DB_HOST in .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "Supabase connectivity diagnostics" -ForegroundColor Cyan
Write-Host "Host: $HostName" -ForegroundColor Cyan
Write-Host "Primary DB Port: $Port" -ForegroundColor Cyan

Write-Host "`n[1/4] DNS lookup" -ForegroundColor Green
try {
    Resolve-DnsName $HostName | Select-Object Name,Type,IPAddress | Format-Table -AutoSize
} catch {
    Write-Host "DNS lookup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[2/4] TCP tests" -ForegroundColor Green
$portsToTest = @($Port, 6543, 5432, 443) | Select-Object -Unique
foreach ($p in $portsToTest) {
    try {
        Test-NetConnection $HostName -Port $p |
            Select-Object ComputerName,RemotePort,TcpTestSucceeded |
            Format-Table -AutoSize
    } catch {
        Write-Host "TCP test failed for port ${p}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n[3/4] Public egress IP" -ForegroundColor Green
try {
    $ip = (Invoke-RestMethod -Uri "https://api.ipify.org").ToString()
    Write-Host "Public IP: $ip" -ForegroundColor Yellow
    Write-Host "If Supabase Network Restrictions are enabled, allowlist this IP." -ForegroundColor Yellow
} catch {
    Write-Host "Could not determine public IP: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[4/4] Suggested next action" -ForegroundColor Green
Write-Host "- If 443 is true but 6543/5432 are false: outbound DB ports are blocked or not allowed." -ForegroundColor White
Write-Host "- If all are false: DNS/routing/firewall issue on current network." -ForegroundColor White
Write-Host "- Retry on another network (e.g., mobile hotspot) to confirm." -ForegroundColor White
