Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo.png")

function Get-BandWidth($yStart, $yEnd) {
    $minX = $img.Width
    $maxX = 0
    for ($y = $yStart; $y -le $yEnd; $y++) {
        for ($x = 0; $x -lt $img.Width; $x++) {
            $p = $img.GetPixel($x, $y)
            if ($p.A -gt 20 -and ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240)) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
            }
        }
    }
    return [PSCustomObject]@{ MinX = $minX; MaxX = $maxX; Width = ($maxX - $minX) }
}

$b1 = Get-BandWidth 44 566
Write-Host "Band 1 (Icon): MinX=$($b1.MinX), MaxX=$($b1.MaxX), Width=$($b1.Width)"

$b2 = Get-BandWidth 584 776
Write-Host "Band 2 (CHARVIK): MinX=$($b2.MinX), MaxX=$($b2.MaxX), Width=$($b2.Width)"

$b3 = Get-BandWidth 808 858
Write-Host "Band 3 (Staffing): MinX=$($b3.MinX), MaxX=$($b3.MaxX), Width=$($b3.Width)"

$b4 = Get-BandWidth 890 920
Write-Host "Band 4 (Slogan): MinX=$($b4.MinX), MaxX=$($b4.MaxX), Width=$($b4.Width)"

$img.Dispose()
