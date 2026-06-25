param(
    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "WARN: Khong tim thay $Path. Backend se dung environment variables hoac user-secrets." -ForegroundColor Yellow
        return
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }

        $index = $line.IndexOf("=")
        if ($index -lt 1) { return }

        $key = $line.Substring(0, $index).Trim()
        $value = $line.Substring($index + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

function Start-DevProcess {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $safeTitle = $Title.Replace("'", "''")
    $safePath = $WorkingDirectory.Replace("'", "''")
    $inner = "`$Host.UI.RawUI.WindowTitle = '$safeTitle'; Set-Location -LiteralPath '$safePath'; $Command"

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $inner
    )
}

$backendEnv = Join-Path $root "secureai_backend\.env"
Import-DotEnv $backendEnv

if (-not $SkipChecks) {
    if (-not (Test-Path -LiteralPath (Join-Path $root "secureai_ai\models\secureai_bilstm_attention.pt"))) {
        Write-Host "WARN: Khong thay model .pt trong secureai_ai/models. /predict se tra 503." -ForegroundColor Yellow
    }

    if (-not (Test-Path -LiteralPath (Join-Path $root "secureai_frontend\node_modules"))) {
        Write-Host "WARN: Chua co node_modules. Chay: cd secureai_frontend; npm install" -ForegroundColor Yellow
    }
}

Start-DevProcess "SecureAI AI"       (Join-Path $root "secureai_ai") "python -m src.main"
Start-DevProcess "SecureAI Backend"  (Join-Path $root "secureai_backend\secureai_backend") "dotnet run"
Start-DevProcess "SecureAI Frontend" (Join-Path $root "secureai_frontend") "npm run dev"

Write-Host "Da mo 3 cua so dev server." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend Swagger: https://localhost:7124/swagger"
Write-Host "AI docs: http://localhost:8000/docs"
