# Script to push all environment variables from .env.local to Vercel
# Usage: .\push-env-to-vercel.ps1

Write-Host "Reading .env.local file..." -ForegroundColor Cyan

if (-not (Test-Path .env.local)) {
    Write-Host "Error: .env.local file not found!" -ForegroundColor Red
    exit 1
}

$envVars = Get-Content .env.local | Where-Object { 
    $_ -match '^([^#][^=]+)=(.*)$' -and $_.Trim() -ne ''
}

Write-Host "Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

foreach ($line in $envVars) {
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        if ($value -match '^"(.*)"$') {
            $value = $matches[1]
        } elseif ($value -match "^'(.*)'$") {
            $value = $matches[1]
        }
        
        if ($key -and $value) {
            Write-Host "Adding: $key" -ForegroundColor Yellow
            
            # For each environment (production, preview, development)
            $environments = @("production", "preview", "development")
            
            foreach ($env in $environments) {
                Write-Host "  -> $env" -ForegroundColor Gray
                echo $value | vercel env add $key $env --force
            }
            
            Write-Host ""
        }
    }
}

Write-Host "Done! All environment variables have been pushed to Vercel." -ForegroundColor Green
Write-Host "Note: You may need to redeploy your project for changes to take effect." -ForegroundColor Yellow


