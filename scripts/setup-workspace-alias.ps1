param(
    [ValidatePattern("^[A-Za-z]$")]
    [string]$DriveLetter = "O"
)

$repoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$drive = "$($DriveLetter.ToUpper()):"

# Remove existing mapping if present, then re-map to current repo path.
cmd /c "subst $drive /d" > $null 2>&1
cmd /c "subst $drive `"$repoPath`""

if ($LASTEXITCODE -ne 0) {
    Write-Error "[workspace-alias] Failed to map $drive to $repoPath"
    exit $LASTEXITCODE
}

Write-Host "[workspace-alias] Mapped $drive -> $repoPath"

