param(
    [switch]$Quiet
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom

# Keep current shell in UTF-8 mode to reduce mojibake risk.
cmd /c chcp 65001 > $null

if (-not $Quiet) {
    Write-Host "[dev-shell] UTF-8 console configured (chcp 65001, no BOM I/O encoding)."
}

