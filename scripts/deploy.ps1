# Deploy aogl.cn to GitHub Pages (push to origin main).
# Requires: Git for Windows, network access to github.com (VPN if needed in CN).
#
# Run in **Windows PowerShell outside Cursor** (IDE may lock .git/index).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Message "your commit message"

param(
  [string]$Message = "fix(seo): hub-links noindex, slim sitemap, align canonical JSON-LD"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\nodejs;" + $env:Path

# Clear stale lock from IDE / interrupted git
Stop-Process -Name git -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue

Write-Host "==> Testing GitHub connectivity..."
& $git ls-remote https://github.com/aokoliang-hash/aogl.cn.git HEAD 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "ERROR: Cannot reach github.com (HTTPS blocked, reset, or timeout)." -ForegroundColor Red
  Write-Host "  1. Enable VPN / system proxy" -ForegroundColor Yellow
  Write-Host "  2. Re-run this script in external PowerShell (not Cursor terminal)" -ForegroundColor Yellow
  Write-Host "  3. Or use GitHub Desktop: commit + Push origin" -ForegroundColor Yellow
  exit 1
}

if (-not (& $git remote 2>$null)) {
  & $git remote add origin https://github.com/aokoliang-hash/aogl.cn.git
}

$branch = (& $git rev-parse --abbrev-ref HEAD 2>$null)
if (-not $branch -or $branch -eq "HEAD") { $branch = "main" }

Write-Host "==> Branch: $branch"

# Ensure we are on top of remote when possible
& $git fetch origin $branch 2>$null
if ($LASTEXITCODE -eq 0) {
  $hasCommits = & $git rev-parse HEAD 2>$null
  if ($hasCommits) {
    & $git pull --rebase origin $branch 2>$null
  }
}

$status = & $git status --porcelain
if ($status) {
  Write-Host "==> Committing local changes..."
  & $git add -A
  & $git commit -m $Message
} else {
  Write-Host "==> Working tree clean, nothing to commit."
}

Write-Host "==> Pushing to origin $branch ..."
& $git push -u origin $branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done. GitHub Pages will rebuild in 1-3 minutes." -ForegroundColor Green
Write-Host "Live: https://aogl.cn/"
Write-Host "Verify: curl -s https://aogl.cn/sitemap.xml | findstr hub-links  (should be empty)"
Write-Host "Then in GSC: validate canonical fix + resubmit sitemap."
