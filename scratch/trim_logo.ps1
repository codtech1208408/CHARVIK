Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo-navbar.png")

# Find exact bounds
$minY = $src.Height; $maxY = 0; $minX = $src.Width; $maxX = 0
for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        if ($p.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# Add small 4px padding
$cropX = [math]::Max(0, $minX - 4)
$cropY = [math]::Max(0, $minY - 4)
$cropW = [math]::Min($src.Width - $cropX, ($maxX - $minX) + 8)
$cropH = [math]::Min($src.Height - $cropY, ($maxY - $minY) + 8)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$trimmed = $src.Clone($rect, $src.PixelFormat)
$src.Dispose()

$trimmed.Save("$PWD\client\public\logo-navbar.png", [System.Drawing.Imaging.ImageFormat]::Png)
$trimmed.Save("$PWD\client\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Trimmed to: $cropW x $cropH (Ratio: $([math]::Round($cropW / $cropH, 2)))"
$trimmed.Dispose()
